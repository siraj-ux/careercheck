import crypto from 'crypto';
import { eq, and, desc, asc } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { users, studentProfiles } from '@/server/db/schema/users';
import { consultants, sessions, notes } from '@/server/db/schema/consultants';
import { careerMatches } from '@/server/db/schema/careers';
import { results } from '@/server/db/schema/tests';
import { roadmaps, roadmapMilestones } from '@/server/db/schema/roadmaps';
import { auditLogs } from '@/server/db/schema/system';
import { NotificationService } from '@/server/notifications/service';

export class ConsultantForbiddenError extends Error {
  status = 403;
  constructor(message = 'Consultants can only access students assigned to them.') {
    super(message);
    this.name = 'ConsultantForbiddenError';
  }
}

/**
 * Ensures that the consultant is assigned to the student or has an active session.
 * Throws ConsultantForbiddenError if unauthorized.
 * Records an audit log entry on access.
 */
export async function assertConsultantAccessToStudent(
  consultantUserId: string,
  studentId: string,
  action = 'view_student_360'
) {
  const [consultant] = await db
    .select()
    .from(consultants)
    .where(eq(consultants.userId, consultantUserId))
    .limit(1);

  if (!consultant) {
    throw new ConsultantForbiddenError('Consultant profile not found for user.');
  }

  const [profile] = await db
    .select()
    .from(studentProfiles)
    .where(eq(studentProfiles.userId, studentId))
    .limit(1);

  const isAssigned = profile?.assignedConsultantId === consultant.id;

  // Also check if an explicit session exists
  const [hasSession] = await db
    .select({ id: sessions.id })
    .from(sessions)
    .where(and(eq(sessions.studentId, studentId), eq(sessions.consultantId, consultant.id)))
    .limit(1);

  if (!isAssigned && !hasSession) {
    throw new ConsultantForbiddenError('Access denied: Student is not assigned to this consultant.');
  }

  // Record audit log
  const now = new Date().toISOString();
  await db.insert(auditLogs)
    .values({
      id: crypto.randomUUID(),
      actorId: consultantUserId,
      action,
      targetUserId: studentId,
      detailsJson: JSON.stringify({ consultantId: consultant.id }),
      createdAt: now,
    });

  return { consultant, profile };
}

export class ConsultantService {
  /**
   * Fetches consultant record by User ID.
   */
  static async getConsultantByUserId(userId: string) {
    const [c] = await db.select().from(consultants).where(eq(consultants.userId, userId)).limit(1);
    return c || null;
  }

  /**
   * Generates Today-first Consultant Dashboard metrics and data lists.
   */
  static async getDashboard(consultantUserId: string) {
    const consultant = await this.getConsultantByUserId(consultantUserId);
    if (!consultant) {
      throw new ConsultantForbiddenError('Consultant profile not found.');
    }

    const now = new Date();
    const todayStartIso = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const todayEndIso = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).toISOString();

    // 1. Fetch Today's Sessions
    const scheduledSessions = await db
      .select({
        sessionId: sessions.id,
        scheduledAt: sessions.scheduledAt,
        durationMinutes: sessions.durationMinutes,
        status: sessions.status,
        joinLink: sessions.joinLink,
        studentId: sessions.studentId,
        studentName: users.name,
        studentLevel: users.level,
        studentPhone: users.phone,
      })
      .from(sessions)
      .innerJoin(users, eq(sessions.studentId, users.id))
      .where(
        and(
          eq(sessions.consultantId, consultant.id),
          eq(sessions.status, 'scheduled')
        )
      )
      .orderBy(asc(sessions.scheduledAt));

    const todaySessions = scheduledSessions.filter(
      (s) => s.scheduledAt >= todayStartIso && s.scheduledAt <= todayEndIso
    );

    // 2. Fetch all assigned students
    const assignedStudents = await db
      .select({
        studentId: users.id,
        name: users.name,
        phone: users.phone,
        level: users.level,
        plan: users.plan,
        profileId: studentProfiles.id,
        stream: studentProfiles.stream,
        marksPercent: studentProfiles.marksPercent,
        pgDegree: studentProfiles.pgDegree,
        createdAt: studentProfiles.createdAt,
      })
      .from(studentProfiles)
      .innerJoin(users, eq(studentProfiles.userId, users.id))
      .where(eq(studentProfiles.assignedConsultantId, consultant.id))
      .orderBy(desc(users.createdAt));

    // 3. For each assigned student, get result, roadmap status, and session status
    const studentTableData = [];
    let pendingReviewsCount = 0;
    const pendingReviewsQueue = [];

    for (const student of assignedStudents) {
      const [result] = await db
        .select({
          id: results.id,
          riasecCode: results.riasecCode,
          createdAt: results.createdAt,
        })
        .from(results)
        .where(eq(results.userId, student.studentId))
        .limit(1);

      const [publishedRoadmap] = await db
        .select({
          id: roadmaps.id,
          isPublished: roadmaps.isPublished,
          publishedAt: roadmaps.publishedAt,
        })
        .from(roadmaps)
        .where(and(eq(roadmaps.studentId, student.studentId), eq(roadmaps.consultantId, consultant.id)))
        .limit(1);

      const [nextSession] = await db
        .select({
          id: sessions.id,
          scheduledAt: sessions.scheduledAt,
          status: sessions.status,
        })
        .from(sessions)
        .where(and(eq(sessions.studentId, student.studentId), eq(sessions.consultantId, consultant.id)))
        .orderBy(desc(sessions.scheduledAt))
        .limit(1);

      const isRoadmapPublished = publishedRoadmap?.isPublished === 1;
      const isTestCompleted = Boolean(result);

      let status: 'New' | 'Booked' | 'Live' | 'Completed' = 'New';
      if (nextSession) {
        status = nextSession.status === 'completed' ? 'Completed' : 'Booked';
      }

      let nextAction: 'Schedule' | 'Review results' | 'Publish roadmap' = 'Schedule';
      if (isTestCompleted && !isRoadmapPublished) {
        nextAction = 'Publish roadmap';
        pendingReviewsCount++;
        pendingReviewsQueue.push({
          studentId: student.studentId,
          name: student.name || 'Student',
          level: student.level,
          riasecCode: result?.riasecCode,
          testDate: result?.createdAt,
        });
      } else if (isTestCompleted && isRoadmapPublished) {
        nextAction = 'Review results';
      }

      studentTableData.push({
        studentId: student.studentId,
        name: student.name || 'Student',
        phone: student.phone,
        level: student.level || 'UG',
        topCluster: result?.riasecCode || 'Pending Test',
        status,
        isTestCompleted,
        isRoadmapPublished,
        nextSessionDate: nextSession?.scheduledAt || null,
        nextAction,
      });
    }

    return {
      stats: {
        todaySessionsCount: todaySessions.length,
        activeStudentsCount: assignedStudents.length,
        reviewsDueCount: pendingReviewsCount,
        rating: consultant.rating,
      },
      todaySessions,
      pendingReviewsQueue,
      studentTable: studentTableData,
      consultant: {
        id: consultant.id,
        title: consultant.title,
        rating: consultant.rating,
        studentCount: consultant.studentCount,
      },
    };
  }

  /**
   * Fetches full Student 360 Diagnostic data for the three-pane view.
   */
  static async getStudent360(consultantUserId: string, studentId: string) {
    const { consultant, profile } = await assertConsultantAccessToStudent(
      consultantUserId,
      studentId,
      'view_student_360'
    );

    const [studentUser] = await db.select().from(users).where(eq(users.id, studentId)).limit(1);

    // 1. Assessment Results
    const [result] = await db.select().from(results).where(eq(results.userId, studentId)).limit(1);

    // 2. Career Matches (engine recommendations with consultant decision states)
    const matches = await db
      .select()
      .from(careerMatches)
      .where(eq(careerMatches.userId, studentId))
      .orderBy(desc(careerMatches.fitPercent));

    // 3. Notes (Both Private and Shared for this consultant)
    const consultantNotes = await db
      .select()
      .from(notes)
      .where(and(eq(notes.studentId, studentId), eq(notes.consultantId, consultant.id)))
      .orderBy(desc(notes.createdAt));

    // 4. Roadmaps (Primary and Backup)
    const studentRoadmaps = await db
      .select()
      .from(roadmaps)
      .where(and(eq(roadmaps.studentId, studentId), eq(roadmaps.consultantId, consultant.id)));

    const primaryRoadmap = studentRoadmaps.find((r) => r.planType === 'primary') || null;
    const backupRoadmap = studentRoadmaps.find((r) => r.planType === 'backup') || null;

    let primaryMilestones: (typeof roadmapMilestones.$inferSelect)[] = [];
    let backupMilestones: (typeof roadmapMilestones.$inferSelect)[] = [];

    if (primaryRoadmap) {
      primaryMilestones = await db
        .select()
        .from(roadmapMilestones)
        .where(eq(roadmapMilestones.roadmapId, primaryRoadmap.id))
        .orderBy(asc(roadmapMilestones.orderIndex));
    }

    if (backupRoadmap) {
      backupMilestones = await db
        .select()
        .from(roadmapMilestones)
        .where(eq(roadmapMilestones.roadmapId, backupRoadmap.id))
        .orderBy(asc(roadmapMilestones.orderIndex));
    }

    // 5. Next Session
    const [nextSession] = await db
      .select()
      .from(sessions)
      .where(and(eq(sessions.studentId, studentId), eq(sessions.consultantId, consultant.id)))
      .orderBy(desc(sessions.scheduledAt))
      .limit(1);

    return {
      student: studentUser
        ? {
            id: studentUser.id,
            name: studentUser.name || 'Student',
            phone: studentUser.phone,
            dob: studentUser.dob,
            level: studentUser.level,
            plan: studentUser.plan,
          }
        : {
            id: studentId,
            name: 'Student',
            phone: '',
            dob: null,
            level: 'UG' as const,
            plan: 'free' as const,
          },
      profile: profile
        ? {
            id: profile.id,
            board: profile.board,
            stream: profile.stream,
            marksPercent: profile.marksPercent,
            pgDegree: profile.pgDegree,
            pgSpecialisation: profile.pgSpecialisation,
            pgGradYear: profile.pgGradYear,
            pgCgpaOrPercent: profile.pgCgpaOrPercent,
            interests: profile.interestsJson ? JSON.parse(profile.interestsJson) : [],
            preferredCities: profile.preferredCitiesJson ? JSON.parse(profile.preferredCitiesJson) : [],
            relocate: Boolean(profile.relocate),
            budgetBand: profile.budgetBand,
            budgetAmount: profile.budgetAmount,
            loanOpenness: Boolean(profile.loanOpenness),
            knowledgeLevel: profile.knowledgeLevel,
          }
        : null,
      result: result
        ? {
            id: result.id,
            riasecCode: result.riasecCode,
            radarScores: JSON.parse(result.radarScoresJson),
            aptitudeScores: JSON.parse(result.aptitudeScoresJson),
            personalitySpectrums: JSON.parse(result.personalitySpectrumsJson),
            topValues: JSON.parse(result.topValuesJson),
            completedAt: result.createdAt,
          }
        : null,
      careerMatches: matches.map((m) => ({
        id: m.id,
        cluster: m.cluster,
        title: m.title,
        fitPercent: m.fitPercent,
        reasons: JSON.parse(m.reasonsJson),
        consultantStatus: m.consultantStatus,
        consultantNotes: m.consultantNotes,
      })),
      notes: consultantNotes,
      roadmap: {
        primary: {
          roadmapId: primaryRoadmap?.id || null,
          isPublished: primaryRoadmap?.isPublished === 1,
          publishedAt: primaryRoadmap?.publishedAt || null,
          milestones: primaryMilestones,
        },
        backup: {
          roadmapId: backupRoadmap?.id || null,
          isPublished: backupRoadmap?.isPublished === 1,
          publishedAt: backupRoadmap?.publishedAt || null,
          milestones: backupMilestones,
        },
      },
      session: nextSession || null,
    };
  }

  /**
   * Updates consultant action on a career match recommendation: Accept / Edit / Override.
   */
  static async updateCareerMatch(
    consultantUserId: string,
    studentId: string,
    matchId: string,
    data: {
      consultantStatus: 'accepted' | 'edited' | 'overridden';
      consultantNotes?: string;
      fitPercent?: number;
      title?: string;
      cluster?: string;
    }
  ) {
    await assertConsultantAccessToStudent(consultantUserId, studentId, 'update_career_match');

    const now = new Date().toISOString();
    const updatePayload: Record<string, unknown> = {
      consultantStatus: data.consultantStatus,
      updatedAt: now,
    };
    if (data.consultantNotes !== undefined) updatePayload.consultantNotes = data.consultantNotes;
    if (data.fitPercent !== undefined) updatePayload.fitPercent = data.fitPercent;
    if (data.title !== undefined) updatePayload.title = data.title;
    if (data.cluster !== undefined) updatePayload.cluster = data.cluster;

    await db.update(careerMatches)
      .set(updatePayload)
      .where(and(eq(careerMatches.id, matchId), eq(careerMatches.userId, studentId)));

    return { success: true };
  }

  /**
   * Saves or updates a consultant note (Private or Shared).
   */
  static async saveNote(
    consultantUserId: string,
    studentId: string,
    data: {
      noteId?: string;
      visibility: 'private' | 'shared';
      body: string;
    }
  ) {
    const { consultant } = await assertConsultantAccessToStudent(
      consultantUserId,
      studentId,
      'save_note'
    );

    const now = new Date().toISOString();

    if (data.noteId) {
      await db.update(notes)
        .set({
          visibility: data.visibility,
          body: data.body,
          updatedAt: now,
        })
        .where(
          and(
            eq(notes.id, data.noteId),
            eq(notes.studentId, studentId),
            eq(notes.consultantId, consultant.id)
          )
        );
      return { success: true, noteId: data.noteId };
    } else {
      const id = crypto.randomUUID();
      await db.insert(notes)
        .values({
          id,
          studentId,
          consultantId: consultant.id,
          visibility: data.visibility,
          body: data.body,
          createdAt: now,
          updatedAt: now,
        });
      return { success: true, noteId: id };
    }
  }

  /**
   * Builds and optionally publishes a roadmap (Primary or Backup).
   */
  static async saveAndPublishRoadmap(
    consultantUserId: string,
    studentId: string,
    data: {
      planType: 'primary' | 'backup';
      publish: boolean;
      milestones: {
        id?: string;
        type: 'exam' | 'apply' | 'prep' | 'documents' | 'decide';
        title: string;
        description?: string;
        deadline: string;
        status?: 'pending' | 'in_progress' | 'completed';
      }[];
    }
  ) {
    const { consultant } = await assertConsultantAccessToStudent(
      consultantUserId,
      studentId,
      data.publish ? 'publish_roadmap' : 'save_roadmap_draft'
    );

    const now = new Date().toISOString();

    // 1. Find or create roadmap record
    const [existingRoadmap] = await db
      .select()
      .from(roadmaps)
      .where(
        and(
          eq(roadmaps.studentId, studentId),
          eq(roadmaps.consultantId, consultant.id),
          eq(roadmaps.planType, data.planType)
        )
      )
      .limit(1);

    let roadmap = existingRoadmap;

    if (!roadmap) {
      const newRoadmapId = crypto.randomUUID();
      await db.insert(roadmaps)
        .values({
          id: newRoadmapId,
          studentId,
          consultantId: consultant.id,
          planType: data.planType,
          isPublished: data.publish ? 1 : 0,
          publishedAt: data.publish ? now : null,
          createdAt: now,
          updatedAt: now,
        });
      const [createdRoadmap] = await db.select().from(roadmaps).where(eq(roadmaps.id, newRoadmapId)).limit(1);
      roadmap = createdRoadmap!;
    } else {
      await db.update(roadmaps)
        .set({
          isPublished: data.publish ? 1 : roadmap.isPublished,
          publishedAt: data.publish ? now : roadmap.publishedAt,
          updatedAt: now,
        })
        .where(eq(roadmaps.id, roadmap.id));
    }

    // 2. Overwrite milestones with new ordered items
    await db.delete(roadmapMilestones).where(eq(roadmapMilestones.roadmapId, roadmap.id));

    for (let i = 0; i < data.milestones.length; i++) {
      const m = data.milestones[i];
      await db.insert(roadmapMilestones)
        .values({
          id: m.id || crypto.randomUUID(),
          roadmapId: roadmap.id,
          orderIndex: i + 1,
          type: m.type,
          title: m.title,
          description: m.description || null,
          deadline: m.deadline,
          status: m.status || 'pending',
          createdAt: now,
          updatedAt: now,
        });
    }

    // 3. Trigger Notification on Publish
    if (data.publish) {
      await NotificationService.send(studentId, {
        type: 'roadmap_published',
        title: 'Your Strategy Roadmap Is Published! 🎯',
        body: `Your mentor has prepared and published your ${data.planType} career roadmap with ${data.milestones.length} milestones.`,
        payloadJson: { roadmapId: roadmap.id, planType: data.planType },
      });
    }

    return { success: true, roadmapId: roadmap.id, isPublished: data.publish };
  }
}
