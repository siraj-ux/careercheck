import { describe, it, expect, beforeAll } from 'vitest';
import crypto from 'crypto';
import { eq, and } from 'drizzle-orm';
import { db } from '../src/server/db/client';
import { users, studentProfiles } from '../src/server/db/schema/users';
import {
  testSectionProgress,
  responses,
} from '../src/server/db/schema/tests';
import {
  getOrCreateTestSession,
  getTestSessionState,
  recordAnswer,
  syncOfflineAnswers,
  submitSection,
  getOrStartSectionProgress,
  getSanitizedQuestionsForSection,
} from '../src/server/test-engine/service';
import { seedDatabase } from '../src/server/db/seed';

describe('Test Engine Core Functionality', () => {
  let testUserId: string;

  beforeAll(async () => {
    // Ensure database is seeded with sample questions
    await seedDatabase();

    // Create a dedicated test user
    testUserId = crypto.randomUUID();
    const now = new Date().toISOString();
    await db.insert(users)
      .values({
        id: testUserId,
        phone: `+9199999${crypto.randomInt(10000, 99999)}`,
        role: 'student',
        plan: 'free',
        level: 'UG',
        createdAt: now,
        updatedAt: now,
      });

    await db.insert(studentProfiles)
      .values({
        id: crypto.randomUUID(),
        userId: testUserId,
        createdAt: now,
        updatedAt: now,
      });
  }, 60000);

  it('1. Autosave: Records single answer in short transaction and updates session state', async () => {
    const session = await getOrCreateTestSession(testUserId, 'UG');
    expect(session).toBeDefined();

    // Fetch first question for interests
    const questionList = await getSanitizedQuestionsForSection(session.id, 'interests', 'UG');
    expect(questionList.length).toBeGreaterThan(0);
    const targetQ = questionList[0];

    // Record answer
    const result = await recordAnswer({
      sessionId: session.id,
      userId: testUserId,
      questionId: targetQ.id,
      answer: '4',
      timeTakenSeconds: 5,
    });

    expect(result.success).toBe(true);

    // Verify response in DB
    const [saved] = await db
      .select()
      .from(responses)
      .where(and(eq(responses.sessionId, session.id), eq(responses.questionId, targetQ.id)))
      .limit(1);

    expect(saved).toBeDefined();
    expect(saved?.answer).toBe('4');
    expect(saved?.timeTakenSeconds).toBe(5);

    // Verify idempotency: updating existing answer works cleanly
    const updated = await recordAnswer({
      sessionId: session.id,
      userId: testUserId,
      questionId: targetQ.id,
      answer: '5',
      timeTakenSeconds: 8,
    });
    expect(updated.success).toBe(true);

    const [reSaved] = await db
      .select()
      .from(responses)
      .where(and(eq(responses.sessionId, session.id), eq(responses.questionId, targetQ.id)))
      .limit(1);
    expect(reSaved?.answer).toBe('5');
  });

  it('2. Resume: Accurately restores from mid-test at the first unanswered question', async () => {
    const session = await getOrCreateTestSession(testUserId, 'UG');
    const questionList = await getSanitizedQuestionsForSection(session.id, 'interests', 'UG');

    // Answer questions 0 and 1
    await recordAnswer({
      sessionId: session.id,
      userId: testUserId,
      questionId: questionList[0].id,
      answer: '3',
    });
    await recordAnswer({
      sessionId: session.id,
      userId: testUserId,
      questionId: questionList[1].id,
      answer: '4',
    });

    // Resume session
    const resumeState = await getTestSessionState(session.id, testUserId);
    expect(resumeState).not.toBeNull();
    // The active index must be 2 (first unanswered question)
    expect(resumeState?.activeQuestionIndex).toBe(2);
    expect(resumeState?.answeredMap[questionList[0].id]).toBe('3');
    expect(resumeState?.answeredMap[questionList[1].id]).toBe('4');
  });

  it('3. Timed Section: Server-side timer expiry auto-submits and rejects late answers', async () => {
    const session = await getOrCreateTestSession(testUserId, 'UG');

    // Progress to aptitude section
    await submitSection(session.id, testUserId, 'interests');

    // Start aptitude section progress
    const { progress } = await getOrStartSectionProgress(session.id, 'aptitude');
    expect(progress.deadline).not.toBeNull();

    // Artificially expire the section by setting deadline in the past
    const pastTime = new Date(Date.now() - 60000).toISOString(); // 1 minute ago
    await db.update(testSectionProgress)
      .set({ deadline: pastTime, submittedAt: null })
      .where(eq(testSectionProgress.id, progress.id));

    // Check progress again
    const expiredCheck = await getOrStartSectionProgress(session.id, 'aptitude');
    expect(expiredCheck.isExpired).toBe(true);
    expect(expiredCheck.isSubmitted).toBe(true);

    // Attempting to record an answer after expiry must be rejected
    const aptitudeQuestions = await getSanitizedQuestionsForSection(session.id, 'aptitude', 'UG');
    const lateAnswerResult = await recordAnswer({
      sessionId: session.id,
      userId: testUserId,
      questionId: aptitudeQuestions[0].id,
      answer: 'A',
    });

    expect(lateAnswerResult.success).toBe(false);
    expect(lateAnswerResult.expired).toBe(true);
  });

  it('4. Offline Batch Sync: Commits cached offline answers in a single atomic transaction', async () => {
    const session = await getOrCreateTestSession(testUserId, 'UG');
    const aptitudeQuestions = await getSanitizedQuestionsForSection(session.id, 'aptitude', 'UG');

    // Prepare simulated offline queue
    const batch = [
      { questionId: aptitudeQuestions[1].id, answer: 'B' as const, timeTakenSeconds: 12 },
      { questionId: aptitudeQuestions[2].id, answer: 'C' as const, timeTakenSeconds: 15 },
    ];

    const syncResult = await syncOfflineAnswers({
      sessionId: session.id,
      userId: testUserId,
      answers: batch,
    });

    expect(syncResult.success).toBe(true);
    expect(syncResult.count).toBe(2);

    // Verify both are present in database
    const [ans1] = await db
      .select()
      .from(responses)
      .where(and(eq(responses.sessionId, session.id), eq(responses.questionId, aptitudeQuestions[1].id)))
      .limit(1);
    const [ans2] = await db
      .select()
      .from(responses)
      .where(and(eq(responses.sessionId, session.id), eq(responses.questionId, aptitudeQuestions[2].id)))
      .limit(1);

    expect(ans1?.answer).toBe('B');
    expect(ans2?.answer).toBe('C');
  });

  it('5. Security: Never leaks correct answer keys or internal scoring keys to the client', async () => {
    const session = await getOrCreateTestSession(testUserId, 'UG');
    const clientQuestions = await getSanitizedQuestionsForSection(session.id, 'aptitude', 'UG');

    expect(clientQuestions.length).toBeGreaterThan(0);

    for (const q of clientQuestions) {
      const qRecord = q as unknown as Record<string, unknown>;
      // Must not contain correctKey
      expect(qRecord.correctKey).toBeUndefined();
      expect(qRecord.correct_key).toBeUndefined();

      // Must not leak internal scoring fields to client
      expect(qRecord.riasecLetter).toBeUndefined();
      expect(qRecord.spectrum).toBeUndefined();
      expect(qRecord.valueKey).toBeUndefined();
      expect(qRecord.reverseScored).toBeUndefined();

      // Must have safe client attributes
      expect(q.id).toBeDefined();
      expect(q.stemText).toBeDefined();
      expect(q.type).toBe('mcq');
      expect(q.options?.length).toBe(4);
    }
  });
});
