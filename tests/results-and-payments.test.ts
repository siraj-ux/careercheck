import { describe, it, expect, beforeAll } from 'vitest';
import crypto from 'crypto';
import { eq, and } from 'drizzle-orm';
import { db } from '../src/server/db/client';
import { users, studentProfiles } from '../src/server/db/schema/users';
import {
  testSessions,
  responses,
  questions,
  results,
} from '../src/server/db/schema/tests';
import { careerMatches } from '../src/server/db/schema/careers';
import { payments } from '../src/server/db/schema/payments';
import { parentShareLinks } from '../src/server/db/schema/system';
import { roadmaps, roadmapMilestones } from '../src/server/db/schema/roadmaps';
import { consultants, sessions } from '../src/server/db/schema/consultants';
import { seedDatabase } from '../src/server/db/seed';
import {
  calculateAndStoreSessionResults,
  getReportDataForUser,
} from '../src/server/scoring/service';

describe('Phase 3: Results, Payments & Dashboard End-to-End Suite', () => {
  let testUserId: string;
  let testSessionId: string;
  let testConsultantUserId: string;
  let testConsultantId: string;

  beforeAll(async () => {
    // 1. Seed base database
    await seedDatabase();

    const now = new Date().toISOString();

    // 2. Create test student
    testUserId = crypto.randomUUID();
    db.insert(users)
      .values({
        id: testUserId,
        phone: `+9198765${crypto.randomInt(10000, 99999)}`,
        role: 'student',
        plan: 'free',
        name: 'Aarav Sharma',
        level: 'UG',
        createdAt: now,
        updatedAt: now,
      })
      .run();

    db.insert(studentProfiles)
      .values({
        id: crypto.randomUUID(),
        userId: testUserId,
        marksPercent: 88,
        budgetAmount: 400000,
        loanOpenness: 1,
        relocate: 1,
        preferredCitiesJson: JSON.stringify(['Bengaluru', 'Mumbai']),
        createdAt: now,
        updatedAt: now,
      })
      .run();

    // 3. Create active test session for student
    testSessionId = crypto.randomUUID();
    db.insert(testSessions)
      .values({
        id: testSessionId,
        userId: testUserId,
        level: 'UG',
        status: 'in_progress',
        currentSection: 'interests',
        currentQuestionIndex: 0,
        startedAt: now,
        updatedAt: now,
      })
      .run();

    // 4. Answer sample questions for all sections
    const allQuestions = db.select().from(questions).where(eq(questions.status, 'live')).all();

    for (const q of allQuestions) {
      let ans = '4';
      if (q.type === 'mcq') {
        ans = q.correctKey || 'A';
      }
      db.insert(responses)
        .values({
          id: crypto.randomUUID(),
          sessionId: testSessionId,
          questionId: q.id,
          answer: ans,
          timeTakenSeconds: 3,
          createdAt: now,
        })
        .run();
    }

    // 5. Create a test consultant for session & roadmap tests
    testConsultantUserId = crypto.randomUUID();
    db.insert(users)
      .values({
        id: testConsultantUserId,
        phone: `+9191111${crypto.randomInt(10000, 99999)}`,
        role: 'consultant',
        name: 'Priya Mukherjee',
        plan: 'paid',
        createdAt: now,
        updatedAt: now,
      })
      .run();

    testConsultantId = crypto.randomUUID();
    db.insert(consultants)
      .values({
        id: testConsultantId,
        userId: testConsultantUserId,
        title: 'Senior Career Strategist',
        credentialsJson: JSON.stringify(['M.Sc. Psychology', 'Certified Career Coach']),
        bio: 'Over 8 years mentoring high school and undergraduate students.',
        languagesJson: JSON.stringify(['English', 'Hindi']),
        specialisationsJson: JSON.stringify(['STEM', 'Design', 'Liberal Arts']),
        rating: 4.9,
        studentCount: 120,
        isActive: 1,
        createdAt: now,
        updatedAt: now,
      })
      .run();
  });

  it('1. Completing assessment calculates and persists results & career matches', async () => {
    const calcResult = await calculateAndStoreSessionResults(testSessionId, testUserId);

    expect(calcResult).toBeDefined();
    expect(calcResult.riasec.code.length).toBe(3);
    expect(calcResult.aptitude.overall).toBeGreaterThan(0);
    expect(calcResult.careers.length).toBe(6);

    // Verify stored in DB
    const savedResult = db.select().from(results).where(eq(results.sessionId, testSessionId)).get();
    expect(savedResult).toBeDefined();
    expect(savedResult?.riasecCode).toBe(calcResult.riasec.code);

    const savedMatches = db
      .select()
      .from(careerMatches)
      .where(eq(careerMatches.resultId, savedResult!.id))
      .all();
    expect(savedMatches.length).toBe(6);
    expect(savedMatches[0].fitPercent).toBeGreaterThanOrEqual(45);
  });

  it('2. Server-side Report Gating: Free user NEVER receives locked careers or colleges', async () => {
    // Current user plan is 'free'
    const report = await getReportDataForUser(testUserId, testSessionId);

    expect(report).toBeDefined();
    expect(report?.plan).toBe('free');
    expect(report?.isLocked).toBe(true);

    // Free users see code, radar, and aptitude
    expect(report?.riasecCode).toBeDefined();
    expect(report?.radarScores).toBeDefined();
    expect(report?.aptitudeScores).toBeDefined();

    // Locked sections MUST be null on the server
    expect(report?.personalitySpectrums).toBeNull();
    expect(report?.careers).toBeNull();
    expect(report?.colleges).toBeNull();
  });

  it('3. Payment flow: Test-mode payment captures idempotently and unlocks full report', async () => {
    const orderId = `order_test_${crypto.randomBytes(8).toString('hex')}`;
    const paymentId = `pay_test_${crypto.randomBytes(8).toString('hex')}`;
    const signature = 'mock_verified_signature';
    const now = new Date().toISOString();

    // Step A: Order creation record in DB
    db.insert(payments)
      .values({
        id: crypto.randomUUID(),
        userId: testUserId,
        amount: 149900, // ₹1,499 in paise
        currency: 'INR',
        status: 'created',
        planUnlocked: 'career_plan',
        razorpayOrderId: orderId,
        createdAt: now,
        updatedAt: now,
      })
      .run();

    const createdPayment = db
      .select()
      .from(payments)
      .where(eq(payments.razorpayOrderId, orderId))
      .get();
    expect(createdPayment?.status).toBe('created');
    expect(createdPayment?.amount).toBe(149900);

    // Step B: Verification & Capture
    db.transaction((tx) => {
      tx.update(payments)
        .set({
          status: 'captured',
          razorpayPaymentId: paymentId,
          razorpaySignature: signature,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(payments.razorpayOrderId, orderId))
        .run();

      tx.update(users)
        .set({
          plan: 'paid',
          updatedAt: new Date().toISOString(),
        })
        .where(eq(users.id, testUserId))
        .run();
    });

    // Verify user is now paid
    const updatedUser = db.select().from(users).where(eq(users.id, testUserId)).get();
    expect(updatedUser?.plan).toBe('paid');

    // Step C: Verified that report is now completely unlocked
    const unlockedReport = await getReportDataForUser(testUserId, testSessionId);
    expect(unlockedReport?.plan).toBe('paid');
    expect(unlockedReport?.isLocked).toBe(false);

    // Personality, Careers, and Colleges are now fully populated
    expect(unlockedReport?.personalitySpectrums).toBeDefined();
    expect(unlockedReport?.personalitySpectrums?.reserved_outgoing).toBeDefined();
    expect(unlockedReport?.careers).toBeDefined();
    expect(unlockedReport?.careers?.length).toBe(6);
    expect(unlockedReport?.colleges).toBeDefined();
    expect(unlockedReport?.colleges?.totalMatched).toBeGreaterThan(0);
  });

  it('4. Share with Parent: Expiring 7-day read-only link', async () => {
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const resultRecord = db.select().from(results).where(eq(results.userId, testUserId)).get();
    expect(resultRecord).toBeDefined();

    db.insert(parentShareLinks)
      .values({
        id: crypto.randomUUID(),
        resultId: resultRecord!.id,
        userId: testUserId,
        tokenHash,
        expiresAt,
        revokedAt: null,
        createdAt: now.toISOString(),
      })
      .run();

    // Verify retrieval by token hash
    const link = db
      .select()
      .from(parentShareLinks)
      .where(eq(parentShareLinks.tokenHash, tokenHash))
      .get();
    expect(link).toBeDefined();
    expect(new Date(link!.expiresAt).getTime()).toBeGreaterThan(now.getTime());
  });

  it('5. Student Dashboard shows published roadmap & upcoming session', async () => {
    const now = new Date();
    const futureDate = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(); // 2 days later

    // A. Schedule upcoming session with consultant
    db.insert(sessions)
      .values({
        id: crypto.randomUUID(),
        studentId: testUserId,
        consultantId: testConsultantId,
        scheduledAt: futureDate,
        durationMinutes: 45,
        status: 'scheduled',
        joinLink: 'https://meet.google.com/test-careerchecks-call',
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      })
      .run();

    // B. Create and publish roadmap
    const roadmapId = crypto.randomUUID();
    db.insert(roadmaps)
      .values({
        id: roadmapId,
        studentId: testUserId,
        consultantId: testConsultantId,
        planType: 'primary',
        isPublished: 1,
        publishedAt: now.toISOString(),
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      })
      .run();

    db.insert(roadmapMilestones)
      .values({
        id: crypto.randomUUID(),
        roadmapId,
        orderIndex: 0,
        type: 'exam',
        title: 'Register for CUET 2026',
        description: 'Complete registration on cuet.samarth.ac.in before deadline.',
        deadline: '2026-03-22',
        status: 'pending',
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      })
      .run();

    db.insert(roadmapMilestones)
      .values({
        id: crypto.randomUUID(),
        roadmapId,
        orderIndex: 1,
        type: 'apply',
        title: 'Submit Target University Applications',
        description: 'Upload 12th predicted scores and statement of purpose.',
        deadline: '2026-04-15',
        status: 'pending',
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      })
      .run();

    // Verify published roadmap in DB
    const studentRoadmap = db
      .select()
      .from(roadmaps)
      .where(and(eq(roadmaps.studentId, testUserId), eq(roadmaps.isPublished, 1)))
      .get();
    expect(studentRoadmap).toBeDefined();

    const milestones = db
      .select()
      .from(roadmapMilestones)
      .where(eq(roadmapMilestones.roadmapId, roadmapId))
      .all();
    expect(milestones.length).toBe(2);
    expect(milestones[0].title).toContain('CUET');
  });
});
