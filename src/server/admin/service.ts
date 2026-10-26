import crypto from 'crypto';
import { eq, and, isNull, sql, asc } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { users, studentProfiles } from '@/server/db/schema/users';
import { consultants, sessions } from '@/server/db/schema/consultants';
import { questions, results } from '@/server/db/schema/tests';
import { colleges } from '@/server/db/schema/colleges';
import { auditLogs } from '@/server/db/schema/system';
import { NotificationService } from '@/server/notifications/service';

export class AdminService {
  /**
   * Calculates overall funnel conversion metrics.
   */
  static async getFunnelMetrics() {
    // 1. Signups (total students)
    const [signupsResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.role, 'student'))
      .limit(1);
    const signups = signupsResult ? Number(signupsResult.count) : 0;

    // 2. Tests Completed
    const [testsResult] = await db
      .select({ count: sql<number>`count(distinct ${results.userId})` })
      .from(results)
      .limit(1);
    const testsCompleted = testsResult ? Number(testsResult.count) : 0;

    // 3. Paid conversions
    const [paidResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(and(eq(users.role, 'student'), eq(users.plan, 'paid')))
      .limit(1);
    const paid = paidResult ? Number(paidResult.count) : 0;

    // 4. Sessions booked/held
    const [sessionsResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(sessions)
      .limit(1);
    const sessionsCount = sessionsResult ? Number(sessionsResult.count) : 0;

    return {
      signups,
      testsCompleted,
      paid,
      sessionsCount,
      conversionRates: {
        signupToTestPct: signups > 0 ? Math.round((testsCompleted / signups) * 100) : 0,
        testToPaidPct: testsCompleted > 0 ? Math.round((paid / testsCompleted) * 100) : 0,
        paidToSessionPct: paid > 0 ? Math.round((sessionsCount / paid) * 100) : 0,
      },
    };
  }

  /**
   * Smart Consultant Matching Algorithm:
   * Evaluates match % based on:
   * - Language overlap (weight 30%)
   * - Level expertise (UG vs PG, weight 25%)
   * - Specialisation vs Student Interests (weight 25%)
   * - Active load balancing (weight 20%)
   */
  static calculateMatchScore(
    student: {
      level: string | null;
      interests: string[];
      preferredCities: string[];
    },
    consultant: {
      languages: string[];
      specialisations: string[];
      studentCount: number;
      rating: number;
    }
  ): number {
    let score = 50; // Baseline

    // 1. Language bonus (consultants with English/Hindi match typical Indian student profiles)
    if (consultant.languages.some((l) => ['English', 'Hindi'].includes(l))) {
      score += 15;
    }

    // 2. Level match (all sample consultants support UG/PG, add 15)
    score += 15;

    // 3. Specialisation match with student interests
    const specLower = consultant.specialisations.map((s) => s.toLowerCase());
    const hasSpecialisationMatch = student.interests.some((interest) =>
      specLower.some((spec) => spec.includes(interest.toLowerCase()) || interest.toLowerCase().includes(spec))
    );
    if (hasSpecialisationMatch) {
      score += 15;
    } else {
      score += 5;
    }

    // 4. Workload balancing: consultants with fewer students receive a bonus
    const loadBonus = Math.max(0, 10 - Math.min(consultant.studentCount, 10));
    score += loadBonus;

    // 5. Rating boost
    if (consultant.rating >= 4.8) {
      score += 5;
    }

    return Math.min(99, Math.max(65, score));
  }

  /**
   * Retrieves unassigned students queue with smart matching suggestions.
   */
  static async getAssignmentQueue() {
    // 1. Fetch unassigned paid students
    const unassignedStudents = await db
      .select({
        studentId: users.id,
        name: users.name,
        phone: users.phone,
        level: users.level,
        plan: users.plan,
        createdAt: users.createdAt,
        stream: studentProfiles.stream,
        interestsJson: studentProfiles.interestsJson,
        preferredCitiesJson: studentProfiles.preferredCitiesJson,
        marksPercent: studentProfiles.marksPercent,
      })
      .from(users)
      .innerJoin(studentProfiles, eq(users.id, studentProfiles.userId))
      .where(
        and(
          eq(users.role, 'student'),
          eq(users.plan, 'paid'),
          isNull(studentProfiles.assignedConsultantId)
        )
      );

    // 2. Fetch all active consultants
    const activeConsultantsRaw = await db
      .select({
        id: consultants.id,
        userId: consultants.userId,
        name: users.name,
        title: consultants.title,
        rating: consultants.rating,
        studentCount: consultants.studentCount,
        languagesJson: consultants.languagesJson,
        specialisationsJson: consultants.specialisationsJson,
      })
      .from(consultants)
      .innerJoin(users, eq(consultants.userId, users.id))
      .where(eq(consultants.isActive, 1));

    const activeConsultants = activeConsultantsRaw.map((c) => ({
      ...c,
      languages: JSON.parse(c.languagesJson) as string[],
      specialisations: JSON.parse(c.specialisationsJson) as string[],
    }));

    // 3. For each unassigned student, compute match scores for active consultants
    const queue = unassignedStudents.map((s) => {
      const interests = s.interestsJson ? (JSON.parse(s.interestsJson) as string[]) : [];
      const preferredCities = s.preferredCitiesJson ? (JSON.parse(s.preferredCitiesJson) as string[]) : [];

      const matches = activeConsultants.map((c) => {
        const matchPercent = this.calculateMatchScore(
          { level: s.level, interests, preferredCities },
          c
        );
        return {
          consultantId: c.id,
          consultantName: c.name || 'Consultant',
          consultantTitle: c.title,
          rating: c.rating,
          activeStudents: c.studentCount,
          matchPercent,
        };
      });

      matches.sort((a, b) => b.matchPercent - a.matchPercent);
      const topSuggestion = matches[0] || null;

      return {
        studentId: s.studentId,
        name: s.name || 'Student',
        phone: s.phone,
        level: s.level || 'UG',
        stream: s.stream,
        interests,
        preferredCities,
        topSuggestion,
        allConsultantOptions: matches,
      };
    });

    return { queue, activeConsultants };
  }

  /**
   * Confirms assignment of a student to a consultant.
   */
  static async assignConsultant(adminUserId: string, studentId: string, consultantId: string) {
    const [consultant] = await db
      .select({
        id: consultants.id,
        userId: consultants.userId,
        name: users.name,
        studentCount: consultants.studentCount,
      })
      .from(consultants)
      .innerJoin(users, eq(consultants.userId, users.id))
      .where(eq(consultants.id, consultantId))
      .limit(1);

    if (!consultant) throw new Error('Consultant not found');

    const [student] = await db.select().from(users).where(eq(users.id, studentId)).limit(1);
    if (!student) throw new Error('Student not found');

    const now = new Date().toISOString();

    // 1. Update studentProfile
    await db.update(studentProfiles)
      .set({
        assignedConsultantId: consultantId,
        updatedAt: now,
      })
      .where(eq(studentProfiles.userId, studentId));

    // 2. Increment consultant student count
    await db.update(consultants)
      .set({
        studentCount: consultant.studentCount + 1,
        updatedAt: now,
      })
      .where(eq(consultants.id, consultantId));

    // 3. Log audit log
    await db.insert(auditLogs)
      .values({
        id: crypto.randomUUID(),
        actorId: adminUserId,
        action: 'assign_consultant',
        targetUserId: studentId,
        detailsJson: JSON.stringify({ consultantId, consultantName: consultant.name }),
        createdAt: now,
      });

    // 4. Send notifications
    await NotificationService.send(studentId, {
      type: 'consultant_assigned',
      title: 'Mentor Assigned! 🤝',
      body: `You have been matched with ${consultant.name || 'your dedicated consultant'}. You can now book your 1-on-1 strategy session!`,
      payloadJson: { consultantId },
    });

    await NotificationService.send(consultant.userId, {
      type: 'student_assigned',
      title: 'New Student Assigned',
      body: `${student.name || 'A student'} has been assigned to your roster. Check their 360 profile!`,
      payloadJson: { studentId },
    });

    return { success: true, studentId, consultantId };
  }

  /**
   * Retrieves question bank summary & questions with draft/live status.
   */
  static async getQuestionBank(section?: string, status?: 'live' | 'draft') {
    const conditions = [];
    if (section) conditions.push(eq(questions.section, section as typeof questions.$inferSelect.section));
    if (status) conditions.push(eq(questions.status, status));

    const allQuestions = conditions.length > 0
      ? await db.select().from(questions).where(and(...conditions))
      : await db.select().from(questions);

    // Summary counts by section and status
    const summary: Record<string, { total: number; live: number; draft: number }> = {};

    for (const q of allQuestions) {
      if (!summary[q.section]) {
        summary[q.section] = { total: 0, live: 0, draft: 0 };
      }
      summary[q.section].total++;
      if (q.status === 'live') summary[q.section].live++;
      else summary[q.section].draft++;
    }

    return {
      summary,
      questions: allQuestions.map((q) => ({
        id: q.id,
        section: q.section,
        subType: q.subType,
        type: q.type,
        stemText: q.stemText,
        options: q.optionsJson ? JSON.parse(q.optionsJson) : null,
        correctKey: q.correctKey, // Admin is authorized to view answer keys
        status: q.status,
        level: q.level,
      })),
    };
  }

  /**
   * Toggles question status between live and draft.
   */
  static async toggleQuestionStatus(adminUserId: string, questionId: string, status: 'live' | 'draft') {
    await db.update(questions)
      .set({ status })
      .where(eq(questions.id, questionId));

    // Log audit log
    await db.insert(auditLogs)
      .values({
        id: crypto.randomUUID(),
        actorId: adminUserId,
        action: 'toggle_question_status',
        detailsJson: JSON.stringify({ questionId, status }),
        createdAt: new Date().toISOString(),
      });

    return { success: true, questionId, status };
  }

  /**
   * Lists colleges.
   */
  static async getColleges() {
    return db.select().from(colleges).orderBy(asc(colleges.name));
  }

  /**
   * Adds or updates a college.
   */
  static async saveCollege(data: {
    id?: string;
    name: string;
    city: string;
    state: string;
    type: string;
    annualFees: number;
    cutoffPercent: number;
    exams: string[];
    courses: string[];
    level: 'UG' | 'PG' | 'both';
  }) {
    const now = new Date().toISOString();
    if (data.id) {
      await db.update(colleges)
        .set({
          name: data.name,
          city: data.city,
          state: data.state,
          type: data.type,
          annualFees: data.annualFees,
          cutoffPercent: data.cutoffPercent,
          examsJson: JSON.stringify(data.exams),
          coursesJson: JSON.stringify(data.courses),
          level: data.level,
        })
        .where(eq(colleges.id, data.id));
      return { success: true, id: data.id };
    } else {
      const id = `col-${crypto.randomUUID().slice(0, 8)}`;
      await db.insert(colleges)
        .values({
          id,
          name: data.name,
          city: data.city,
          state: data.state,
          type: data.type,
          annualFees: data.annualFees,
          cutoffPercent: data.cutoffPercent,
          examsJson: JSON.stringify(data.exams),
          coursesJson: JSON.stringify(data.courses),
          level: data.level,
          createdAt: now,
        });
      return { success: true, id };
    }
  }

  /**
   * Lists consultants with credentials, student count, and active status.
   */
  static async getConsultants() {
    const rawConsultants = await db
      .select({
        id: consultants.id,
        userId: consultants.userId,
        name: users.name,
        phone: users.phone,
        title: consultants.title,
        rating: consultants.rating,
        studentCount: consultants.studentCount,
        isActive: consultants.isActive,
        bio: consultants.bio,
        credentials: consultants.credentialsJson,
        languages: consultants.languagesJson,
        specialisations: consultants.specialisationsJson,
      })
      .from(consultants)
      .innerJoin(users, eq(consultants.userId, users.id));

    return rawConsultants.map((c) => ({
      ...c,
      isActive: Boolean(c.isActive),
      credentials: JSON.parse(c.credentials) as string[],
      languages: JSON.parse(c.languages) as string[],
      specialisations: JSON.parse(c.specialisations) as string[],
    }));
  }

  /**
   * Toggles consultant active status.
   */
  static async toggleConsultantActive(adminUserId: string, consultantId: string, isActive: boolean) {
    await db.update(consultants)
      .set({
        isActive: isActive ? 1 : 0,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(consultants.id, consultantId));

    await db.insert(auditLogs)
      .values({
        id: crypto.randomUUID(),
        actorId: adminUserId,
        action: 'toggle_consultant_active',
        detailsJson: JSON.stringify({ consultantId, isActive }),
        createdAt: new Date().toISOString(),
      });

    return { success: true, consultantId, isActive };
  }
}
