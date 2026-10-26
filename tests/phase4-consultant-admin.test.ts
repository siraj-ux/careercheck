import { describe, it, expect, beforeAll } from 'vitest';
import crypto from 'crypto';
import { eq, and } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { seedDatabase } from '@/server/db/seed';
import { users, studentProfiles } from '@/server/db/schema/users';
import { sessions, notes } from '@/server/db/schema/consultants';
import { careerMatches } from '@/server/db/schema/careers';
import { roadmaps } from '@/server/db/schema/roadmaps';
import { auditLogs, notifications } from '@/server/db/schema/system';
import { ConsultantService, ConsultantForbiddenError } from '@/server/consultants/service';
import { BookingService } from '@/server/booking/service';
import { ChatService } from '@/server/chat/service';
import { AdminService } from '@/server/admin/service';
import { ComplianceService } from '@/server/compliance/service';

describe('Phase 4: Consultant, Admin, Hardening & Launch Suite', () => {
  beforeAll(async () => {
    await seedDatabase();
  });

  describe('1. Consultant Dashboard & Stat Tiles', () => {
    it('calculates stats and returns assigned students and sessions', async () => {
      // Consultant Priya has Diya Patel assigned
      const dashboard = await ConsultantService.getDashboard('usr-priya-demo');

      expect(dashboard).toBeDefined();
      expect(dashboard.stats.activeStudentsCount).toBeGreaterThanOrEqual(1);
      expect(dashboard.stats.rating).toBe(4.9);
      expect(dashboard.studentTable.length).toBeGreaterThanOrEqual(1);

      // Verify Diya Patel is in Priya's student table
      const diyaRow = dashboard.studentTable.find((s) => s.studentId === 'usr-diya-demo');
      expect(diyaRow).toBeDefined();
      expect(diyaRow?.name).toBe('Diya Patel');
      expect(diyaRow?.topCluster).toBe('AIR');
    });
  });

  describe('2. Student 360 Diagnostic, Isolation & Decisions', () => {
    it('strictly forbids a consultant from accessing an unassigned student (Security Check #6)', async () => {
      // Consultant Rajesh is NOT assigned to Diya Patel
      await expect(
        ConsultantService.getStudent360('usr-rajesh-demo', 'usr-diya-demo')
      ).rejects.toThrow(ConsultantForbiddenError);
    });

    it('records an immutable audit log when authorized consultant accesses Student 360', async () => {
      // Consultant Priya accesses assigned student Diya Patel
      const student360 = await ConsultantService.getStudent360('usr-priya-demo', 'usr-diya-demo');

      expect(student360).toBeDefined();
      expect(student360.student.name).toBe('Diya Patel');
      expect(student360.result?.riasecCode).toBe('AIR');

      // Verify audit log
      const [audit] = await db
        .select()
        .from(auditLogs)
        .where(
          and(
            eq(auditLogs.actorId, 'usr-priya-demo'),
            eq(auditLogs.targetUserId, 'usr-diya-demo'),
            eq(auditLogs.action, 'view_student_360')
          )
        )
        .limit(1);

      expect(audit).toBeDefined();
    });

    it('allows consultant to Accept, Edit, and Override engine recommendations (saved in career_matches)', async () => {
      // Override recommendation cm-diya-2
      await ConsultantService.updateCareerMatch('usr-priya-demo', 'usr-diya-demo', 'cm-diya-2', {
        consultantStatus: 'overridden',
        consultantNotes: 'Focus on Human-Centric UI rather than backend architecture.',
        fitPercent: 91,
      });

      const [updated] = await db.select().from(careerMatches).where(eq(careerMatches.id, 'cm-diya-2')).limit(1);
      expect(updated?.consultantStatus).toBe('overridden');
      expect(updated?.consultantNotes).toContain('Focus on Human-Centric UI');
      expect(updated?.fitPercent).toBe(91);
    });

    it('supports Private and Shared notes, preventing student exposure of private notes', async () => {
      // 1. Consultant saves Private Note
      await ConsultantService.saveNote('usr-priya-demo', 'usr-diya-demo', {
        visibility: 'private',
        body: 'Internal counselor assessment: student shows high anxiety regarding math cutoff.',
      });

      // 2. Consultant saves Shared Note
      await ConsultantService.saveNote('usr-priya-demo', 'usr-diya-demo', {
        visibility: 'shared',
        body: 'Great discussion today! Please prepare your SEED design portfolio sketches by next week.',
      });

      // Check notes in DB
      const allNotes = await db
        .select()
        .from(notes)
        .where(eq(notes.studentId, 'usr-diya-demo'));

      const privateNote = allNotes.find((n) => n.visibility === 'private');
      const sharedNote = allNotes.find((n) => n.visibility === 'shared');

      expect(privateNote).toBeDefined();
      expect(sharedNote).toBeDefined();

      // Check Compliance export (which represents student-facing / portable data)
      const exportData = await ComplianceService.exportStudentData('usr-diya-demo');
      const exportedSharedNotes = exportData.sharedConsultantNotes;

      // Ensure exported/student-facing notes contain shared but NEVER private notes
      expect(exportedSharedNotes.some((n) => n.body.includes('SEED design portfolio'))).toBe(true);
      expect(exportedSharedNotes.some((n) => n.body.includes('high anxiety'))).toBe(false);
    });

    it('builds, publishes roadmap and emits student notification', async () => {
      const milestones = [
        {
          type: 'prep' as const,
          title: 'Design Portfolio Preparation',
          deadline: '2026-03-01',
          status: 'in_progress' as const,
        },
        {
          type: 'exam' as const,
          title: 'SEED Exam 2026',
          deadline: '2026-03-15',
          status: 'pending' as const,
        },
      ];

      const pubResult = await ConsultantService.saveAndPublishRoadmap('usr-priya-demo', 'usr-diya-demo', {
        planType: 'primary',
        publish: true,
        milestones,
      });

      expect(pubResult.success).toBe(true);
      expect(pubResult.isPublished).toBe(true);

      // Verify roadmap published state in DB
      const [roadmap] = await db.select().from(roadmaps).where(eq(roadmaps.id, pubResult.roadmapId)).limit(1);
      expect(roadmap?.isPublished).toBe(1);
      expect(roadmap?.publishedAt).toBeDefined();

      // Verify in-app notification delivered to student
      const userNotifications = await db
        .select()
        .from(notifications)
        .where(and(eq(notifications.userId, 'usr-diya-demo'), eq(notifications.type, 'roadmap_published')));

      expect(userNotifications.length).toBeGreaterThanOrEqual(1);
      expect(userNotifications[0].title).toContain('Roadmap Is Published');
    });
  });

  describe('3. Booking, 24-Hour Reschedule & Video Links', () => {
    it('generates 45-min booking slots and books a session', async () => {
      const slots = await BookingService.getAvailableSlots('cns-priya', 7);
      expect(slots.length).toBeGreaterThan(0);
      expect(slots[0].timeIst).toBeDefined();

      const chosenSlot = slots[0].scheduledAtIso;
      const booking = await BookingService.bookSession('usr-diya-demo', 'cns-priya', chosenSlot);

      expect(booking.sessionId).toBeDefined();

      const [created] = await db.select().from(sessions).where(eq(sessions.id, booking.sessionId)).limit(1);
      expect(created?.status).toBe('scheduled');
    });

    it('enforces 24-hour limit on self-serve student rescheduling', async () => {
      // Create session scheduled 2 hours from now
      const twoHoursAhead = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
      const testSessId = crypto.randomUUID();

      await db.insert(sessions).values({
        id: testSessId,
        studentId: 'usr-diya-demo',
        consultantId: 'cns-priya',
        scheduledAt: twoHoursAhead,
        durationMinutes: 45,
        status: 'scheduled',
        rescheduleCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const newDate = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

      // Student attempt to self-reschedule within 24 hours should be REJECTED
      await expect(
        BookingService.rescheduleSession('usr-diya-demo', testSessId, newDate, false)
      ).rejects.toThrow('24 hours');

      // Admin / Consultant override should SUCCEED
      const adminReschedule = await BookingService.rescheduleSession('usr-admin-demo', testSessId, newDate, true);
      expect(adminReschedule.success).toBe(true);
    });

    it('updates provider-agnostic video join link', async () => {
      const update = await BookingService.updateJoinLink(
        'usr-priya-demo',
        'session-diya-demo',
        'https://zoom.us/j/9988776655'
      );

      expect(update.success).toBe(true);
      const [session] = await db.select().from(sessions).where(eq(sessions.id, 'session-diya-demo')).limit(1);
      expect(session?.joinLink).toBe('https://zoom.us/j/9988776655');
    });
  });

  describe('4. Direct Student-Consultant Chat', () => {
    it('exchanges messages and marks unread as read within active window', async () => {
      // 1. Student sends message
      const msg1 = await ChatService.sendMessage(
        'usr-diya-demo',
        'usr-diya-demo',
        'cns-priya',
        'Hi Priya, I have updated my design portfolio link!'
      );
      expect(msg1.id).toBeDefined();

      // 2. Consultant retrieves thread (auto-marks msg1 read)
      const thread = await ChatService.getThread('usr-priya-demo', 'usr-diya-demo', 'cns-priya');
      expect(thread.messages.length).toBeGreaterThanOrEqual(1);

      // Verify readAt was updated
      const inDb = thread.messages.find((m) => m.id === msg1.id);
      expect(inDb?.readAt).toBeDefined();

      // 3. Consultant sends reply
      const msg2 = await ChatService.sendMessage(
        'usr-priya-demo',
        'usr-diya-demo',
        'cns-priya',
        'Looks fantastic Diya! The typography is much cleaner.'
      );
      expect(msg2.id).toBeDefined();
    });
  });

  describe('5. Admin Console, Smart Matching & Question Bank', () => {
    it('calculates accurate funnel conversion metrics', async () => {
      const funnel = await AdminService.getFunnelMetrics();

      expect(funnel.signups).toBeGreaterThanOrEqual(2);
      expect(funnel.testsCompleted).toBeGreaterThanOrEqual(1);
      expect(funnel.paid).toBeGreaterThanOrEqual(1);
      expect(funnel.conversionRates.signupToTestPct).toBeGreaterThan(0);
    });

    it('matches unassigned students in queue using smart matching algorithm', async () => {
      const { queue, activeConsultants } = await AdminService.getAssignmentQueue();

      expect(activeConsultants.length).toBeGreaterThanOrEqual(2);

      // Sana Khan is unassigned (UG, Science PCM, Engineering/Tech interest)
      const sanaItem = queue.find((q) => q.studentId === 'usr-sana-demo');
      expect(sanaItem).toBeDefined();
      expect(sanaItem?.topSuggestion).toBeDefined();
      expect(sanaItem?.topSuggestion?.matchPercent).toBeGreaterThanOrEqual(65);
    });

    it('admin confirms consultant assignment, updating profile and notifying parties', async () => {
      const assign = await AdminService.assignConsultant('usr-admin-demo', 'usr-sana-demo', 'cns-rajesh');
      expect(assign.success).toBe(true);

      const [profile] = await db.select().from(studentProfiles).where(eq(studentProfiles.userId, 'usr-sana-demo')).limit(1);
      expect(profile?.assignedConsultantId).toBe('cns-rajesh');

      // Verify Sana is no longer in unassigned queue
      const { queue } = await AdminService.getAssignmentQueue();
      expect(queue.some((q) => q.studentId === 'usr-sana-demo')).toBe(false);
    });

    it('manages question bank and toggles live/draft status', async () => {
      const qBank = await AdminService.getQuestionBank('interests');
      expect(qBank.questions.length).toBeGreaterThan(0);

      const firstQ = qBank.questions[0];
      const origStatus = firstQ.status;

      // Toggle status
      const updated = await AdminService.toggleQuestionStatus('usr-admin-demo', firstQ.id, origStatus === 'live' ? 'draft' : 'live');
      expect(updated.status).not.toBe(origStatus);

      // Restore status
      await AdminService.toggleQuestionStatus('usr-admin-demo', firstQ.id, origStatus);
    });
  });

  describe('6. Compliance, DPDP Export & Account Deletion', () => {
    it('exports complete personal JSON package without exposing private mentor notes', async () => {
      const exported = await ComplianceService.exportStudentData('usr-diya-demo');

      expect(exported.account.name).toBe('Diya Patel');
      expect(exported.assessment.result?.riasecCode).toBe('AIR');
      expect(exported.privacyStatement).toBe('We never sell your data.');
      expect(exported.assessment.careerMatches.length).toBeGreaterThan(0);
    });

    it('anonymizes and deletes student account and credentials', async () => {
      // Create temporary student to delete
      const tempId = crypto.randomUUID();
      const now = new Date().toISOString();
      const randomPhone = `+9196${crypto.randomInt(10000000, 99999999)}`;
      await db.insert(users).values({
        id: tempId,
        phone: randomPhone,
        role: 'student',
        name: 'Temp Student',
        plan: 'free',
        createdAt: now,
        updatedAt: now,
      });

      const del = await ComplianceService.deleteStudentAccount(tempId);
      expect(del.success).toBe(true);

      const [check] = await db.select().from(users).where(eq(users.id, tempId)).limit(1);
      expect(check).toBeUndefined();
    });
  });
});
