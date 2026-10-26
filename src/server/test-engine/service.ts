import crypto from 'crypto';
import { eq, and, inArray } from 'drizzle-orm';
import { db } from '@/server/db/client';
import {
  questions,
  testSessions,
  testSectionProgress,
  responses,
} from '@/server/db/schema/tests';
import { sanitizeQuestionForClient, ClientQuestion } from './sanitize';

import {
  SECTION_ORDER_UG,
  SECTION_ORDER_PG,
  SectionType,
  SECTION_META,
} from '@/lib/constants/sections';

export {
  SECTION_ORDER_UG,
  SECTION_ORDER_PG,
  type SectionType,
  SECTION_META,
};

/**
 * Deterministic PRNG to order questions per session.
 * Guarantees that within a session, the randomised order is 100% reproducible across resumes.
 */
function seededShuffle<T>(array: T[], seed: string): T[] {
  const result = [...array];
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
  }
  for (let i = result.length - 1; i > 0; i--) {
    h = (Math.imul(1664525, h) + 1013904223) | 0;
    const j = Math.abs(h) % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Finds or initializes an active test session for the user.
 */
export async function getOrCreateTestSession(userId: string, level: 'UG' | 'PG' = 'UG') {
  const [sessionFound] = await db
    .select()
    .from(testSessions)
    .where(and(eq(testSessions.userId, userId), inArray(testSessions.status, ['not_started', 'in_progress'])))
    .limit(1);

  let session = sessionFound;

  if (!session) {
    const now = new Date().toISOString();
    const newId = crypto.randomUUID();

    await db.insert(testSessions).values({
      id: newId,
      userId,
      level,
      status: 'in_progress',
      currentSection: 'interests',
      currentQuestionIndex: 0,
      startedAt: now,
      updatedAt: now,
    });

    const [created] = await db.select().from(testSessions).where(eq(testSessions.id, newId)).limit(1);
    session = created!;
  }

  return session;
}

/**
 * Returns the section list appropriate for the session's level.
 */
export function getSectionsForLevel(level: 'UG' | 'PG'): readonly SectionType[] {
  return level === 'PG' ? SECTION_ORDER_PG : SECTION_ORDER_UG;
}

/**
 * Gets or starts progress for a specific section, enforcing server-side timer if timed.
 */
export async function getOrStartSectionProgress(sessionId: string, section: SectionType) {
  const [foundProgress] = await db
    .select()
    .from(testSectionProgress)
    .where(and(eq(testSectionProgress.sessionId, sessionId), eq(testSectionProgress.section, section)))
    .limit(1);

  let progress = foundProgress;
  const now = new Date();
  const meta = SECTION_META[section];

  if (!progress) {
    const startedAt = now.toISOString();
    const deadline = meta.isTimed
      ? new Date(now.getTime() + meta.durationMin * 60 * 1000).toISOString()
      : null;

    const progressId = crypto.randomUUID();
    await db.insert(testSectionProgress).values({
      id: progressId,
      sessionId,
      section,
      startedAt,
      deadline,
      submittedAt: null,
    });

    const [created] = await db
      .select()
      .from(testSectionProgress)
      .where(eq(testSectionProgress.id, progressId))
      .limit(1);
    progress = created!;
  }

  // Check if expired
  let isExpired = false;
  let remainingSeconds: number | null = null;

  if (progress.deadline) {
    const deadlineMs = new Date(progress.deadline).getTime();
    const diff = Math.floor((deadlineMs - now.getTime()) / 1000);
    remainingSeconds = Math.max(0, diff);

    if (diff <= 0 && !progress.submittedAt) {
      isExpired = true;
      // Auto-submit expired section
      await db.update(testSectionProgress)
        .set({
          submittedAt: progress.deadline,
          timeTakenSeconds: meta.durationMin * 60,
        })
        .where(eq(testSectionProgress.id, progress.id));

      progress = {
        ...progress,
        submittedAt: progress.deadline,
        timeTakenSeconds: meta.durationMin * 60,
      };
    }
  }

  return {
    progress,
    isExpired,
    remainingSeconds,
    isSubmitted: !!progress.submittedAt,
  };
}

/**
 * Loads all questions for a given section, applies deterministic session shuffle,
 * and sanitizes them (ensuring correctKey is stripped).
 */
export async function getSanitizedQuestionsForSection(
  sessionId: string,
  section: SectionType,
  level: 'UG' | 'PG'
): Promise<ClientQuestion[]> {
  const rawQuestions = await db
    .select()
    .from(questions)
    .where(and(eq(questions.section, section), eq(questions.status, 'live')));

  // Filter level (UG, PG, or both)
  const filtered = rawQuestions.filter((q) => q.level === 'both' || q.level === level);

  // Deterministically shuffle questions using sessionId + section
  const shuffled = seededShuffle(filtered, `${sessionId}-${section}`);

  return shuffled.map(sanitizeQuestionForClient);
}

/**
 * Loads the complete resume state for a test session.
 */
export async function getTestSessionState(sessionId: string, userId: string) {
  const [session] = await db
    .select()
    .from(testSessions)
    .where(and(eq(testSessions.id, sessionId), eq(testSessions.userId, userId)))
    .limit(1);

  if (!session) return null;

  const sections = getSectionsForLevel(session.level as 'UG' | 'PG');
  const currentSection = session.currentSection as SectionType;
  const currentSectionIndex = sections.indexOf(currentSection);

  // Check section progress and server timer
  const { progress, isExpired, remainingSeconds, isSubmitted } = await getOrStartSectionProgress(
    sessionId,
    currentSection
  );

  // Fetch answered responses for this session & section
  const answered = await db
    .select({
      questionId: responses.questionId,
      answer: responses.answer,
    })
    .from(responses)
    .where(eq(responses.sessionId, sessionId));

  const answeredMap = new Map(answered.map((a) => [a.questionId, a.answer]));

  // Get sanitized questions
  const clientQuestions = await getSanitizedQuestionsForSection(
    sessionId,
    currentSection,
    session.level as 'UG' | 'PG'
  );

  // Determine current question index (first unanswered or current index)
  let activeQuestionIndex = 0;
  for (let i = 0; i < clientQuestions.length; i++) {
    if (!answeredMap.has(clientQuestions[i].id)) {
      activeQuestionIndex = i;
      break;
    }
    if (i === clientQuestions.length - 1) {
      activeQuestionIndex = clientQuestions.length; // all answered in this section
    }
  }

  const isSectionComplete = activeQuestionIndex >= clientQuestions.length || isSubmitted || isExpired;

  return {
    session: {
      id: session.id,
      level: session.level,
      status: session.status,
      currentSection,
      currentSectionIndex,
      totalSections: sections.length,
      startedAt: session.startedAt,
    },
    sectionsMeta: sections.map((s, idx) => ({
      section: s,
      index: idx,
      ...SECTION_META[s],
    })),
    currentSectionMeta: SECTION_META[currentSection],
    questions: clientQuestions,
    answeredMap: Object.fromEntries(answeredMap),
    activeQuestionIndex,
    isSectionComplete,
    isExpired,
    remainingSeconds,
    deadline: progress.deadline,
    isTimed: SECTION_META[currentSection].isTimed,
  };
}

/**
 * Records a single answer in a tight, fast transaction.
 */
export async function recordAnswer(params: {
  sessionId: string;
  userId: string;
  questionId: string;
  answer: string;
  timeTakenSeconds?: number;
}) {
  const { sessionId, userId, questionId, answer, timeTakenSeconds } = params;

  // Validate session ownership
  const [session] = await db
    .select()
    .from(testSessions)
    .where(and(eq(testSessions.id, sessionId), eq(testSessions.userId, userId)))
    .limit(1);

  if (!session) {
    throw new Error('Test session not found or unauthorized');
  }

  const currentSection = session.currentSection as SectionType;

  // Enforce server timer constraint for timed sections
  const { isExpired, isSubmitted } = await getOrStartSectionProgress(sessionId, currentSection);
  if (isExpired || isSubmitted) {
    return {
      success: false,
      expired: true,
      message: 'This section has expired or has already been submitted.',
    };
  }

  const now = new Date().toISOString();

  // Execute in short transaction
  await db.transaction(async (tx) => {
    // Check if response already exists
    const [existing] = await tx
      .select({ id: responses.id })
      .from(responses)
      .where(and(eq(responses.sessionId, sessionId), eq(responses.questionId, questionId)))
      .limit(1);

    if (existing) {
      await tx.update(responses)
        .set({
          answer,
          timeTakenSeconds: timeTakenSeconds ?? 0,
        })
        .where(eq(responses.id, existing.id));
    } else {
      await tx.insert(responses)
        .values({
          id: crypto.randomUUID(),
          sessionId,
          questionId,
          answer,
          timeTakenSeconds: timeTakenSeconds ?? 0,
          createdAt: now,
        });
    }

    await tx.update(testSessions)
      .set({
        updatedAt: now,
      })
      .where(eq(testSessions.id, sessionId));
  });

  return { success: true, savedAt: now };
}

/**
 * Batched synchronization for the offline queue.
 * Commits multiple cached responses atomically.
 */
export async function syncOfflineAnswers(params: {
  sessionId: string;
  userId: string;
  answers: { questionId: string; answer: string; timeTakenSeconds?: number }[];
}) {
  const { sessionId, userId, answers } = params;

  const [session] = await db
    .select()
    .from(testSessions)
    .where(and(eq(testSessions.id, sessionId), eq(testSessions.userId, userId)))
    .limit(1);

  if (!session) {
    throw new Error('Session not found or unauthorized');
  }

  const now = new Date().toISOString();

  await db.transaction(async (tx) => {
    for (const item of answers) {
      const [existing] = await tx
        .select({ id: responses.id })
        .from(responses)
        .where(and(eq(responses.sessionId, sessionId), eq(responses.questionId, item.questionId)))
        .limit(1);

      if (existing) {
        await tx.update(responses)
          .set({
            answer: item.answer,
            timeTakenSeconds: item.timeTakenSeconds ?? 0,
          })
          .where(eq(responses.id, existing.id));
      } else {
        await tx.insert(responses)
          .values({
            id: crypto.randomUUID(),
            sessionId,
            questionId: item.questionId,
            answer: item.answer,
            timeTakenSeconds: item.timeTakenSeconds ?? 0,
            createdAt: now,
          });
      }
    }

    await tx.update(testSessions)
      .set({ updatedAt: now })
      .where(eq(testSessions.id, sessionId));
  });

  return { success: true, count: answers.length };
}

/**
 * Submits the current section and advances the session to the next section or section break.
 */
export async function submitSection(sessionId: string, userId: string, section: SectionType) {
  const [session] = await db
    .select()
    .from(testSessions)
    .where(and(eq(testSessions.id, sessionId), eq(testSessions.userId, userId)))
    .limit(1);

  if (!session) {
    throw new Error('Session not found');
  }

  const sections = getSectionsForLevel(session.level as 'UG' | 'PG');
  const currentIdx = sections.indexOf(section);
  const now = new Date().toISOString();

  // Mark section progress as submitted
  await db.update(testSectionProgress)
    .set({
      submittedAt: now,
    })
    .where(and(eq(testSectionProgress.sessionId, sessionId), eq(testSectionProgress.section, section)));

  const nextIdx = currentIdx + 1;
  const isLastSection = nextIdx >= sections.length;

  if (isLastSection) {
    // Complete the entire test session
    await db.update(testSessions)
      .set({
        status: 'completed',
        completedAt: now,
        updatedAt: now,
      })
      .where(eq(testSessions.id, sessionId));

    // Dynamically calculate and persist assessment results
    try {
      const { calculateAndStoreSessionResults } = await import('@/server/scoring/service');
      await calculateAndStoreSessionResults(sessionId, userId);
    } catch (err) {
      console.error('Failed to calculate results on test completion:', err);
    }

    return {
      completed: true,
      isLastSection: true,
      nextSection: null,
    };
  }

  const nextSection = sections[nextIdx];

  await db.update(testSessions)
    .set({
      currentSection: nextSection,
      currentQuestionIndex: 0,
      updatedAt: now,
    })
    .where(eq(testSessions.id, sessionId));

  return {
    completed: false,
    isLastSection: false,
    nextSection,
    nextSectionMeta: SECTION_META[nextSection],
  };
}
