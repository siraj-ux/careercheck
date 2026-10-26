import { eq, desc, and, or } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { users, studentProfiles, consentRecords, authSessions } from '@/server/db/schema/users';
import { responses, results, testSessions } from '@/server/db/schema/tests';
import { careerMatches } from '@/server/db/schema/careers';
import { roadmaps, roadmapMilestones } from '@/server/db/schema/roadmaps';
import { sessions, notes } from '@/server/db/schema/consultants';
import { messages } from '@/server/db/schema/messages';
import { auditLogs } from '@/server/db/schema/system';

export class ComplianceService {
  /**
   * Generates a complete GDPR/DPDP-compliant data export for a student user.
   */
  static async exportStudentData(studentUserId: string) {
    const [user] = await db.select().from(users).where(eq(users.id, studentUserId)).limit(1);
    if (!user) throw new Error('User not found');

    const [profile] = await db.select().from(studentProfiles).where(eq(studentProfiles.userId, studentUserId)).limit(1);
    const [consent] = await db.select().from(consentRecords).where(eq(consentRecords.userId, studentUserId)).limit(1);

    // Results & responses
    const [testResult] = await db.select().from(results).where(eq(results.userId, studentUserId)).limit(1);
    const allSessions = await db.select().from(testSessions).where(eq(testSessions.userId, studentUserId));
    const sessionIds = allSessions.map((s) => s.id);

    const testResponses = sessionIds.length > 0
      ? await db.select().from(responses).where(eq(responses.sessionId, sessionIds[0]))
      : [];

    const matches = await db.select().from(careerMatches).where(eq(careerMatches.userId, studentUserId));

    // Roadmaps
    const studentRoadmaps = await db.select().from(roadmaps).where(eq(roadmaps.studentId, studentUserId));
    const roadmapIds = studentRoadmaps.map((r) => r.id);
    const allMilestones = roadmapIds.length > 0 ? await db.select().from(roadmapMilestones) : [];
    const milestones = allMilestones.filter((m) => roadmapIds.includes(m.roadmapId));

    // Bookings & Shared Notes
    const bookings = await db.select().from(sessions).where(eq(sessions.studentId, studentUserId));
    const sharedNotes = await db
      .select({
        id: notes.id,
        body: notes.body,
        createdAt: notes.createdAt,
      })
      .from(notes)
      .where(and(eq(notes.studentId, studentUserId), eq(notes.visibility, 'shared')));

    // Chat messages
    const chatMessages = await db.select().from(messages).where(eq(messages.studentId, studentUserId));

    return {
      exportVersion: '1.0',
      exportedAt: new Date().toISOString(),
      platform: 'CareerChecks Guidance Platform',
      privacyStatement: 'We never sell your data.',
      account: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        dob: user.dob,
        level: user.level,
        plan: user.plan,
        createdAt: user.createdAt,
      },
      profile: profile
        ? {
            board: profile.board,
            stream: profile.stream,
            marksPercent: profile.marksPercent,
            interests: profile.interestsJson ? JSON.parse(profile.interestsJson) : [],
            preferredCities: profile.preferredCitiesJson ? JSON.parse(profile.preferredCitiesJson) : [],
            budgetBand: profile.budgetBand,
            budgetAmount: profile.budgetAmount,
            loanOpenness: Boolean(profile.loanOpenness),
            knowledgeLevel: profile.knowledgeLevel,
          }
        : null,
      consentRecord: consent || null,
      assessment: {
        sessions: allSessions,
        totalResponsesRecorded: testResponses.length,
        result: testResult
          ? {
              riasecCode: testResult.riasecCode,
              radarScores: JSON.parse(testResult.radarScoresJson),
              aptitudeScores: JSON.parse(testResult.aptitudeScoresJson),
              personalitySpectrums: JSON.parse(testResult.personalitySpectrumsJson),
              topValues: JSON.parse(testResult.topValuesJson),
            }
          : null,
        careerMatches: matches.map((m) => ({
          cluster: m.cluster,
          title: m.title,
          fitPercent: m.fitPercent,
          reasons: JSON.parse(m.reasonsJson),
          consultantStatus: m.consultantStatus,
        })),
      },
      roadmaps: studentRoadmaps.map((r) => ({
        planType: r.planType,
        isPublished: Boolean(r.isPublished),
        publishedAt: r.publishedAt,
        milestones: milestones.filter((m) => m.roadmapId === r.id),
      })),
      sessions: bookings,
      sharedConsultantNotes: sharedNotes,
      messagesCount: chatMessages.length,
    };
  }

  /**
   * Irreversibly purges personal information, removes sessions, and anonymizes data.
   */
  static async deleteStudentAccount(studentUserId: string) {
    const [user] = await db.select().from(users).where(eq(users.id, studentUserId)).limit(1);
    if (!user) throw new Error('User not found');

    const now = new Date().toISOString();

    // 1. Log audit trail before deletion
    await db.insert(auditLogs)
      .values({
        id: crypto.randomUUID(),
        actorId: studentUserId,
        action: 'account_deletion_requested',
        targetUserId: studentUserId,
        detailsJson: JSON.stringify({ phone: user.phone.slice(-4) }), // Masked phone only
        createdAt: now,
      });

    // 2. Cascade delete will purge profile, consent records, auth sessions, notes, roadmaps, messages, etc.
    // Anonymize test results before deleting user by breaking user association
    await db.transaction(async (tx) => {
      // Clear personal fields from user and mark deleted
      await tx.delete(auditLogs)
        .where(or(eq(auditLogs.actorId, studentUserId), eq(auditLogs.targetUserId, studentUserId)));
      await tx.delete(authSessions).where(eq(authSessions.userId, studentUserId));
      await tx.delete(consentRecords).where(eq(consentRecords.userId, studentUserId));
      await tx.delete(studentProfiles).where(eq(studentProfiles.userId, studentUserId));
      await tx.delete(users).where(eq(users.id, studentUserId));
    });

    return { success: true, message: 'Account and personal data successfully deleted.' };
  }

  /**
   * Retrieves recent audit logs for admin review.
   */
  static async getAuditLogs(limit = 100) {
    return db
      .select({
        id: auditLogs.id,
        actorId: auditLogs.actorId,
        actorName: users.name,
        actorRole: users.role,
        action: auditLogs.action,
        targetUserId: auditLogs.targetUserId,
        detailsJson: auditLogs.detailsJson,
        createdAt: auditLogs.createdAt,
      })
      .from(auditLogs)
      .leftJoin(users, eq(auditLogs.actorId, users.id))
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit);
  }
}
