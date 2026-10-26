import crypto from 'crypto';
import { eq, and, desc } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { users, studentProfiles } from '@/server/db/schema/users';
import {
  testSessions,
  responses,
  questions,
  results,
} from '@/server/db/schema/tests';
import { careerMatches } from '@/server/db/schema/careers';
import { colleges } from '@/server/db/schema/colleges';
import { calculateRiasecScores, RiasecInputItem } from './riasec';
import { calculateAptitudeScores, AptitudeInputItem } from './aptitude';
import { calculatePersonalityScores, PersonalityInputItem } from './personality';
import { calculateValuesScores, ValuesInputItem } from './values';
import { matchCareers, MatchedCareerResult } from './careerMatching';
import { matchColleges, CollegeMatchingResult } from './collegeMatching';
import { SpectrumKey, RiasecLetter, AptitudeSubType } from '@/config/scoring';

/**
 * Calculates and persists full assessment results into the database
 */
export async function calculateAndStoreSessionResults(sessionId: string, userId: string) {
  // 1. Verify session exists and belongs to user
  const [session] = await db
    .select()
    .from(testSessions)
    .where(and(eq(testSessions.id, sessionId), eq(testSessions.userId, userId)))
    .limit(1);

  if (!session) {
    throw new Error('Test session not found or unauthorized');
  }

  // 2. Fetch all student responses for this session with question metadata
  const userResponses = await db
    .select({
      responseId: responses.id,
      questionId: responses.questionId,
      answer: responses.answer,
      section: questions.section,
      subType: questions.subType,
      type: questions.type,
      correctKey: questions.correctKey,
      riasecLetter: questions.riasecLetter,
      spectrum: questions.spectrum,
      valueKey: questions.valueKey,
      reverseScored: questions.reverseScored,
    })
    .from(responses)
    .innerJoin(questions, eq(responses.questionId, questions.id))
    .where(eq(responses.sessionId, sessionId));

  // 3. Prepare items for each scoring engine
  const riasecItems: RiasecInputItem[] = [];
  const aptitudeItems: AptitudeInputItem[] = [];
  const personalityItems: PersonalityInputItem[] = [];
  const valuesItems: ValuesInputItem[] = [];

  for (const r of userResponses) {
    if (r.section === 'interests' && r.riasecLetter) {
      riasecItems.push({
        riasecLetter: r.riasecLetter as RiasecLetter,
        answer: r.answer,
      });
    } else if (r.section === 'aptitude' && r.subType && r.correctKey) {
      aptitudeItems.push({
        subType: r.subType as AptitudeSubType,
        userAnswer: r.answer,
        correctKey: r.correctKey,
      });
    } else if (r.section === 'personality' && r.spectrum) {
      personalityItems.push({
        spectrum: r.spectrum as SpectrumKey,
        answer: r.answer,
        reverseScored: r.reverseScored === 1,
      });
    } else if (r.section === 'values' && r.valueKey) {
      valuesItems.push({
        valueKey: r.valueKey,
        answer: r.answer,
      });
    }
  }

  // 4. Compute scores using pure engines
  const riasec = calculateRiasecScores(riasecItems);
  const aptitude = calculateAptitudeScores(aptitudeItems);
  const personality = calculatePersonalityScores(personalityItems);
  const values = calculateValuesScores(valuesItems);

  // 5. Compute career matches
  const careerList = matchCareers({
    riasecScores: riasec.scores,
    riasecTopLetters: riasec.topLetters,
    aptitudeScores: aptitude,
    personalityScores: personality,
    topValues: values.topValues,
    level: session.level as 'UG' | 'PG',
  });

  const now = new Date().toISOString();
  let resultId: string;

  // 6. Save in atomic transaction
  await db.transaction(async (tx) => {
    // Check if result record already exists
    const [existing] = await tx
      .select({ id: results.id })
      .from(results)
      .where(eq(results.sessionId, sessionId))
      .limit(1);

    if (existing) {
      resultId = existing.id;
      await tx.update(results)
        .set({
          riasecCode: riasec.code,
          radarScoresJson: JSON.stringify(riasec.scores),
          aptitudeScoresJson: JSON.stringify(aptitude),
          personalitySpectrumsJson: JSON.stringify(personality),
          topValuesJson: JSON.stringify(values.topValues),
        })
        .where(eq(results.id, resultId));

      // Clear existing career matches for regeneration
      await tx.delete(careerMatches).where(eq(careerMatches.resultId, resultId));
    } else {
      resultId = crypto.randomUUID();
      await tx.insert(results)
        .values({
          id: resultId,
          sessionId,
          userId,
          riasecCode: riasec.code,
          radarScoresJson: JSON.stringify(riasec.scores),
          aptitudeScoresJson: JSON.stringify(aptitude),
          personalitySpectrumsJson: JSON.stringify(personality),
          topValuesJson: JSON.stringify(values.topValues),
          createdAt: now,
        });
    }

    // Insert career matches
    for (const match of careerList) {
      await tx.insert(careerMatches)
        .values({
          id: crypto.randomUUID(),
          resultId,
          userId,
          cluster: match.cluster,
          title: match.title,
          fitPercent: match.fitPercent,
          reasonsJson: JSON.stringify(match.reasons),
          consultantStatus: 'pending',
          consultantNotes: null,
          createdAt: now,
          updatedAt: now,
        });
    }
  });

  return {
    resultId: resultId!,
    riasec,
    aptitude,
    personality,
    values,
    careers: careerList,
  };
}

export interface ReportPayload {
  plan: 'free' | 'paid';
  isLocked: boolean;
  sessionId: string;
  resultId: string;
  createdAt: string;
  riasecCode: string;
  headlineInsight: string;
  radarScores: Record<RiasecLetter, number>;
  aptitudeScores: {
    logical: number;
    verbal: number;
    spatial: number;
    overall: number;
  };
  // Server-gated: null for free users!
  personalitySpectrums: Record<SpectrumKey, number> | null;
  topValues: string[] | null;
  careers: MatchedCareerResult[] | null;
  colleges: CollegeMatchingResult | null;
}

/**
 * Retrieves report data with strict server-side gating.
 * Free users NEVER receive locked sections (careers, personality, colleges) over the wire.
 */
export async function getReportDataForUser(
  userId: string,
  sessionId?: string | null
): Promise<ReportPayload | null> {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) return null;

  // Find result: either specified session or user's most recent result
  let [resultRecord] = sessionId
    ? await db.select().from(results).where(and(eq(results.sessionId, sessionId), eq(results.userId, userId))).limit(1)
    : await db.select().from(results).where(eq(results.userId, userId)).orderBy(desc(results.createdAt)).limit(1);

  // If no result yet, but session exists, try calculating
  if (!resultRecord) {
    const [targetSession] = sessionId
      ? await db.select().from(testSessions).where(and(eq(testSessions.id, sessionId), eq(testSessions.userId, userId))).limit(1)
      : await db.select().from(testSessions).where(eq(testSessions.userId, userId)).orderBy(desc(testSessions.updatedAt)).limit(1);

    if (targetSession) {
      await calculateAndStoreSessionResults(targetSession.id, userId);
      const [calculated] = await db.select().from(results).where(eq(results.sessionId, targetSession.id)).limit(1);
      resultRecord = calculated;
    }
  }

  if (!resultRecord) return null;

  const radarScores = JSON.parse(resultRecord.radarScoresJson);
  const aptitudeScores = JSON.parse(resultRecord.aptitudeScoresJson);
  const riasec = calculateRiasecScores(
    Object.entries(radarScores).map(([letter, score]) => ({
      riasecLetter: letter as RiasecLetter,
      answer: Math.round(((score as number) / 100) * 4 + 1),
    }))
  );

  const isPaid = user.plan === 'paid';

  // If user is FREE: Return ONLY free sections.
  if (!isPaid) {
    return {
      plan: 'free',
      isLocked: true,
      sessionId: resultRecord.sessionId,
      resultId: resultRecord.id,
      createdAt: resultRecord.createdAt,
      riasecCode: resultRecord.riasecCode,
      headlineInsight: riasec.headlineInsight,
      radarScores,
      aptitudeScores: {
        logical: aptitudeScores.logical,
        verbal: aptitudeScores.verbal,
        spatial: aptitudeScores.spatial,
        overall: aptitudeScores.overall,
      },
      personalitySpectrums: null, // Gated
      topValues: null, // Gated
      careers: null, // Gated
      colleges: null, // Gated
    };
  }

  // If user is PAID: Return full report including personality, careers, and colleges
  const storedMatches = await db
    .select()
    .from(careerMatches)
    .where(eq(careerMatches.resultId, resultRecord.id))
    .orderBy(desc(careerMatches.fitPercent));

  const formattedCareers: MatchedCareerResult[] = storedMatches.map((cm) => ({
    careerId: cm.id,
    cluster: cm.cluster,
    title: cm.title,
    description: '',
    fitPercent: cm.fitPercent,
    reasons: JSON.parse(cm.reasonsJson),
    matchComponents: {
      interestMatch: cm.fitPercent,
      aptitudeMatch: cm.fitPercent,
      personalityValuesMatch: cm.fitPercent,
    },
  }));

  // Match colleges based on student profile
  const [profile] = await db.select().from(studentProfiles).where(eq(studentProfiles.userId, userId)).limit(1);
  const allColleges = await db.select().from(colleges);

  let preferredCities: string[] = [];
  try {
    if (profile?.preferredCitiesJson) {
      preferredCities = JSON.parse(profile.preferredCitiesJson);
    }
  } catch {
    preferredCities = [];
  }

  const collegeMatches = matchColleges(allColleges, {
    marksPercent: profile?.marksPercent ?? 80,
    budgetAmount: profile?.budgetAmount ?? 500000,
    loanOpenness: profile?.loanOpenness === 1,
    preferredCities,
    relocate: profile?.relocate === 1,
    level: user.level ?? 'UG',
  });

  return {
    plan: 'paid',
    isLocked: false,
    sessionId: resultRecord.sessionId,
    resultId: resultRecord.id,
    createdAt: resultRecord.createdAt,
    riasecCode: resultRecord.riasecCode,
    headlineInsight: riasec.headlineInsight,
    radarScores,
    aptitudeScores: {
      logical: aptitudeScores.logical,
      verbal: aptitudeScores.verbal,
      spatial: aptitudeScores.spatial,
      overall: aptitudeScores.overall,
    },
    personalitySpectrums: JSON.parse(resultRecord.personalitySpectrumsJson),
    topValues: JSON.parse(resultRecord.topValuesJson),
    careers: formattedCareers,
    colleges: collegeMatches,
  };
}
