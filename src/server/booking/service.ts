import crypto from 'crypto';
import { eq, and, gte, lte } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { users } from '@/server/db/schema/users';
import { consultants, consultantAvailabilities, sessions } from '@/server/db/schema/consultants';
import { NotificationService } from '@/server/notifications/service';

export interface BookingSlot {
  scheduledAtIso: string; // UTC ISO string
  dateString: string; // YYYY-MM-DD
  timeIst: string; // "10:00 AM"
  weekday: number; // 0-6
}

export class BookingService {
  /**
   * Returns consultant weekly availability schedule.
   * If none defined in DB, provides default weekday hours (10:00 to 18:00 IST, Mon-Fri).
   */
  static async getConsultantAvailability(consultantId: string) {
    const records = await db
      .select()
      .from(consultantAvailabilities)
      .where(and(eq(consultantAvailabilities.consultantId, consultantId), eq(consultantAvailabilities.isActive, 1)));

    if (records.length > 0) return records;

    // Default availability: Mon-Fri 10:00 to 18:00 IST
    return [1, 2, 3, 4, 5].map((weekday) => ({
      id: `default-${weekday}`,
      consultantId,
      weekday,
      startTime: '10:00',
      endTime: '18:00',
      isActive: 1,
    }));
  }

  /**
   * Generates available 45-minute booking slots for the next N days.
   */
  static async getAvailableSlots(consultantId: string, daysAhead = 14): Promise<BookingSlot[]> {
    const availabilities = await this.getConsultantAvailability(consultantId);
    const availMap = new Map<number, { startTime: string; endTime: string }[]>();

    for (const a of availabilities) {
      if (!availMap.has(a.weekday)) availMap.set(a.weekday, []);
      availMap.get(a.weekday)!.push({ startTime: a.startTime, endTime: a.endTime });
    }

    const now = new Date();
    const startDate = new Date(now.getTime() + 2 * 60 * 60 * 1000); // Earliest slot 2 hours from now
    const endDate = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);

    // Fetch all existing booked sessions in window
    const bookedSessions = await db
      .select({ scheduledAt: sessions.scheduledAt })
      .from(sessions)
      .where(
        and(
          eq(sessions.consultantId, consultantId),
          eq(sessions.status, 'scheduled'),
          gte(sessions.scheduledAt, startDate.toISOString()),
          lte(sessions.scheduledAt, endDate.toISOString())
        )
      );

    const bookedSet = new Set(bookedSessions.map((s) => new Date(s.scheduledAt).toISOString()));

    const availableSlots: BookingSlot[] = [];

    // Loop through upcoming days
    const iterDate = new Date(now);
    for (let dayOffset = 0; dayOffset <= daysAhead; dayOffset++) {
      const currentDay = new Date(iterDate);
      currentDay.setDate(iterDate.getDate() + dayOffset);
      const weekday = currentDay.getDay();

      const dayRules = availMap.get(weekday);
      if (!dayRules) continue;

      for (const rule of dayRules) {
        const [startH, startM] = rule.startTime.split(':').map(Number);
        const [endH, endM] = rule.endTime.split(':').map(Number);

        let curMinutes = startH * 60 + startM;
        const endMinutes = endH * 60 + endM;

        while (curMinutes + 45 <= endMinutes) {
          const slotHour = Math.floor(curMinutes / 60);
          const slotMinute = curMinutes % 60;

          // Compute UTC timestamp corresponding to this IST slot (IST is UTC+5:30)
          const year = currentDay.getFullYear();
          const month = currentDay.getMonth();
          const date = currentDay.getDate();

          // Construct IST date
          const istDate = new Date(Date.UTC(year, month, date, slotHour - 5, slotMinute - 30));
          const slotIso = istDate.toISOString();

          if (istDate > startDate && !bookedSet.has(slotIso)) {
            const timeIst = istDate.toLocaleTimeString('en-IN', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true,
              timeZone: 'Asia/Kolkata',
            });
            const dateString = istDate.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

            availableSlots.push({
              scheduledAtIso: slotIso,
              dateString,
              timeIst,
              weekday,
            });
          }

          curMinutes += 60; // 45-min session + 15-min buffer = 1 hour interval
        }
      }
    }

    return availableSlots.slice(0, 30); // Return up to 30 slots
  }

  /**
   * Books a 45-minute consultation session.
   */
  static async bookSession(studentUserId: string, consultantId: string, scheduledAtIso: string) {
    const [student] = await db.select().from(users).where(eq(users.id, studentUserId)).limit(1);
    if (!student) throw new Error('Student user not found');

    const [consultant] = await db.select().from(consultants).where(eq(consultants.id, consultantId)).limit(1);
    if (!consultant) throw new Error('Consultant not found');

    // Check collision
    const [collision] = await db
      .select({ id: sessions.id })
      .from(sessions)
      .where(
        and(
          eq(sessions.consultantId, consultantId),
          eq(sessions.scheduledAt, scheduledAtIso),
          eq(sessions.status, 'scheduled')
        )
      )
      .limit(1);

    if (collision) {
      throw new Error('This time slot has just been booked. Please select another slot.');
    }

    const sessionId = crypto.randomUUID();
    const now = new Date().toISOString();

    await db.insert(sessions)
      .values({
        id: sessionId,
        studentId: studentUserId,
        consultantId,
        scheduledAt: scheduledAtIso,
        durationMinutes: 45,
        status: 'scheduled',
        joinLink: null,
        rescheduleCount: 0,
        createdAt: now,
        updatedAt: now,
      });

    const formattedIst = new Date(scheduledAtIso).toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    // Notify student
    await NotificationService.send(studentUserId, {
      type: 'session_booked',
      title: 'Session Confirmed! 🗓️',
      body: `Your 1-on-1 strategy consultation is booked for ${formattedIst} IST.`,
      payloadJson: { sessionId, scheduledAt: scheduledAtIso },
    });

    // Notify consultant
    await NotificationService.send(consultant.userId, {
      type: 'session_booked',
      title: 'New Student Session Scheduled',
      body: `${student.name || 'Student'} has booked a 45-min consultation for ${formattedIst} IST.`,
      payloadJson: { sessionId, studentId: studentUserId, scheduledAt: scheduledAtIso },
    });

    return { sessionId, scheduledAt: scheduledAtIso };
  }

  /**
   * Reschedules an existing session.
   * Section 9.6: "Student may reschedule once, up to 24 hours before the session.
   * Within 24 hours, rescheduling needs admin approval."
   */
  static async rescheduleSession(
    actorUserId: string,
    sessionId: string,
    newScheduledAtIso: string,
    isAdminOrConsultant = false
  ) {
    const [session] = await db.select().from(sessions).where(eq(sessions.id, sessionId)).limit(1);
    if (!session) throw new Error('Session not found.');

    if (!isAdminOrConsultant) {
      if (session.studentId !== actorUserId) {
        throw new Error('Unauthorized to reschedule this session.');
      }

      // 24-hour check
      const currentStart = new Date(session.scheduledAt).getTime();
      const nowMs = Date.now();
      const hoursRemaining = (currentStart - nowMs) / (1000 * 60 * 60);

      if (hoursRemaining < 24) {
        throw new Error(
          'Self-serve rescheduling is only allowed at least 24 hours prior to the session. Please contact support or an admin.'
        );
      }

      // Check reschedule limit (1 allowed)
      if (session.rescheduleCount >= 1) {
        throw new Error(
          'You have already rescheduled this session once. Subsequent changes require administrator approval.'
        );
      }
    }

    const now = new Date().toISOString();
    await db.update(sessions)
      .set({
        scheduledAt: newScheduledAtIso,
        rescheduleCount: session.rescheduleCount + 1,
        updatedAt: now,
      })
      .where(eq(sessions.id, sessionId));

    const formattedIst = new Date(newScheduledAtIso).toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    // Notify student
    await NotificationService.send(session.studentId, {
      type: 'session_rescheduled',
      title: 'Session Rescheduled 🗓️',
      body: `Your consultation has been moved to ${formattedIst} IST.`,
      payloadJson: { sessionId, scheduledAt: newScheduledAtIso },
    });

    return { success: true, sessionId, newScheduledAt: newScheduledAtIso };
  }

  /**
   * Updates provider-agnostic video call link (Google Meet / Zoom).
   */
  static async updateJoinLink(consultantUserId: string, sessionId: string, joinLink: string) {
    const [consultant] = await db.select().from(consultants).where(eq(consultants.userId, consultantUserId)).limit(1);
    const [session] = await db.select().from(sessions).where(eq(sessions.id, sessionId)).limit(1);

    if (!session) throw new Error('Session not found.');
    if (consultant && session.consultantId !== consultant.id) {
      throw new Error('Unauthorized to update meeting link for this session.');
    }

    const now = new Date().toISOString();
    await db.update(sessions)
      .set({
        joinLink: joinLink.trim(),
        updatedAt: now,
      })
      .where(eq(sessions.id, sessionId));

    return { success: true, joinLink: joinLink.trim() };
  }
}
