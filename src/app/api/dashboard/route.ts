import { NextResponse } from 'next/server';
import { eq, and, desc, asc } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { getCurrentUser } from '@/server/auth/session';
import { users } from '@/server/db/schema/users';
import { roadmaps, roadmapMilestones } from '@/server/db/schema/roadmaps';
import { sessions, consultants } from '@/server/db/schema/consultants';
import { messages } from '@/server/db/schema/messages';
import { savedColleges, colleges } from '@/server/db/schema/colleges';
import { results } from '@/server/db/schema/tests';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();

    // 1. Fetch user's assessment result existence
    const userResult = db
      .select({ id: results.id, riasecCode: results.riasecCode, createdAt: results.createdAt })
      .from(results)
      .where(eq(results.userId, user.id))
      .get();

    // 2. Fetch upcoming session
    const upcomingSession = db
      .select({
        sessionId: sessions.id,
        scheduledAt: sessions.scheduledAt,
        durationMinutes: sessions.durationMinutes,
        status: sessions.status,
        joinLink: sessions.joinLink,
        consultantName: users.name,
        consultantTitle: consultants.title,
        consultantRating: consultants.rating,
      })
      .from(sessions)
      .innerJoin(consultants, eq(sessions.consultantId, consultants.id))
      .innerJoin(users, eq(consultants.userId, users.id))
      .where(and(eq(sessions.studentId, user.id), eq(sessions.status, 'scheduled')))
      .orderBy(asc(sessions.scheduledAt))
      .get();

    let sessionState = null;
    if (upcomingSession) {
      const scheduledTime = new Date(upcomingSession.scheduledAt).getTime();
      const diffMinutes = Math.floor((scheduledTime - now.getTime()) / (1000 * 60));
      // Join active from 10 minutes before start until end of session
      const canJoin = diffMinutes <= 10 && diffMinutes >= -upcomingSession.durationMinutes;

      sessionState = {
        ...upcomingSession,
        diffMinutes,
        canJoin,
      };
    }

    // 3. Fetch published roadmaps (Primary and Backup)
    const publishedRoadmaps = db
      .select()
      .from(roadmaps)
      .where(and(eq(roadmaps.studentId, user.id), eq(roadmaps.isPublished, 1)))
      .all();

    const primaryRoadmapRecord = publishedRoadmaps.find((r) => r.planType === 'primary');
    const backupRoadmapRecord = publishedRoadmaps.find((r) => r.planType === 'backup');

    let primaryMilestones: (typeof roadmapMilestones.$inferSelect)[] = [];
    let backupMilestones: (typeof roadmapMilestones.$inferSelect)[] = [];

    if (primaryRoadmapRecord) {
      primaryMilestones = db
        .select()
        .from(roadmapMilestones)
        .where(eq(roadmapMilestones.roadmapId, primaryRoadmapRecord.id))
        .orderBy(asc(roadmapMilestones.orderIndex))
        .all();
    }

    if (backupRoadmapRecord) {
      backupMilestones = db
        .select()
        .from(roadmapMilestones)
        .where(eq(roadmapMilestones.roadmapId, backupRoadmapRecord.id))
        .orderBy(asc(roadmapMilestones.orderIndex))
        .all();
    }

    // Determine Next Step Hero
    // Find earliest pending/in_progress milestone from primary roadmap
    let nextStepHero = null;
    if (primaryMilestones.length > 0) {
      const pendingMilestone = primaryMilestones.find((m) => m.status !== 'completed');
      if (pendingMilestone) {
        const deadlineDate = new Date(pendingMilestone.deadline);
        const daysLeft = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        nextStepHero = {
          title: pendingMilestone.title,
          description: pendingMilestone.description,
          type: pendingMilestone.type,
          deadline: pendingMilestone.deadline,
          daysLeft: Math.max(0, daysLeft),
          status: pendingMilestone.status,
        };
      }
    }

    // 4. Fetch recent chat message with consultant
    const latestMessage = db
      .select({
        id: messages.id,
        body: messages.body,
        createdAt: messages.createdAt,
        senderId: messages.senderId,
      })
      .from(messages)
      .where(eq(messages.studentId, user.id))
      .orderBy(desc(messages.createdAt))
      .get();

    // 5. Fetch saved colleges count and preview
    const saved = db
      .select({
        savedId: savedColleges.id,
        collegeId: colleges.id,
        name: colleges.name,
        city: colleges.city,
        type: colleges.type,
        cutoffPercent: colleges.cutoffPercent,
      })
      .from(savedColleges)
      .innerJoin(colleges, eq(savedColleges.collegeId, colleges.id))
      .where(eq(savedColleges.studentId, user.id))
      .all();

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name || 'Student',
        plan: user.plan,
        level: user.level,
      },
      hasCompletedTest: Boolean(userResult),
      testResultSummary: userResult
        ? { id: userResult.id, riasecCode: userResult.riasecCode, completedAt: userResult.createdAt }
        : null,
      nextStepHero,
      session: sessionState,
      roadmap: {
        hasRoadmap: publishedRoadmaps.length > 0,
        primary: primaryMilestones,
        backup: backupMilestones,
      },
      latestMessage: latestMessage || null,
      savedColleges: {
        count: saved.length,
        items: saved.slice(0, 3),
      },
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json({ error: 'Failed to retrieve dashboard data' }, { status: 500 });
  }
}
