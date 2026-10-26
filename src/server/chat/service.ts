import crypto from 'crypto';
import { eq, and, or, desc, asc } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { users } from '@/server/db/schema/users';
import { consultants, sessions } from '@/server/db/schema/consultants';
import { messages } from '@/server/db/schema/messages';
import { NotificationService } from '@/server/notifications/service';

export class ChatService {
  /**
   * Resolves consultant record from either consultant id, consultant user id, or session id.
   */
  static async resolveConsultant(identifier: string) {
    if (!identifier) return null;

    // 1. Direct match on consultants table (by id or userId)
    const [byConsultant] = await db
      .select()
      .from(consultants)
      .where(or(eq(consultants.id, identifier), eq(consultants.userId, identifier)))
      .limit(1);

    if (byConsultant) return byConsultant;

    // 2. Fallback check: if identifier was accidentally passed as a session ID
    const [bySession] = await db
      .select({ consultantId: sessions.consultantId })
      .from(sessions)
      .where(eq(sessions.id, identifier))
      .limit(1);

    if (bySession) {
      const [c] = await db
        .select()
        .from(consultants)
        .where(eq(consultants.id, bySession.consultantId))
        .limit(1);
      if (c) return c;
    }

    return null;
  }

  /**
   * Validates if chat window is active (booking until 30 days after session).
   */
  static async isChatActive(studentId: string, consultantId: string): Promise<boolean> {
    const consultant = await this.resolveConsultant(consultantId);
    const resolvedConsultantId = consultant ? consultant.id : consultantId;

    const [latestSession] = await db
      .select({ scheduledAt: sessions.scheduledAt, status: sessions.status })
      .from(sessions)
      .where(and(eq(sessions.studentId, studentId), eq(sessions.consultantId, resolvedConsultantId)))
      .orderBy(desc(sessions.scheduledAt))
      .limit(1);

    if (!latestSession) {
      // If student is assigned to consultant, allow chat even before first session booking
      return true;
    }

    const sessionTime = new Date(latestSession.scheduledAt).getTime();
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    const nowMs = Date.now();

    // Session plus 30 days
    return nowMs <= sessionTime + thirtyDaysMs;
  }

  /**
   * Retrieves chat message thread between student and consultant.
   * Automatically marks unread incoming messages as read.
   */
  static async getThread(currentUserId: string, studentId: string, consultantId: string) {
    const consultant = await this.resolveConsultant(consultantId);
    if (!consultant) throw new Error('Consultant not found');

    const isStudent = currentUserId === studentId;
    const isConsultant = currentUserId === consultant.userId;

    if (!isStudent && !isConsultant) {
      const [user] = await db.select({ role: users.role }).from(users).where(eq(users.id, currentUserId)).limit(1);
      if (user?.role !== 'admin') {
        throw new Error('Unauthorized to view this conversation.');
      }
    }

    const thread = await db
      .select({
        id: messages.id,
        senderId: messages.senderId,
        body: messages.body,
        readAt: messages.readAt,
        createdAt: messages.createdAt,
      })
      .from(messages)
      .where(and(eq(messages.studentId, studentId), eq(messages.consultantId, consultant.id)))
      .orderBy(asc(messages.createdAt));

    // Mark unread messages sent by the other party as read
    const nowIso = new Date().toISOString();
    for (const msg of thread) {
      if (!msg.readAt && msg.senderId !== currentUserId) {
        await db.update(messages)
          .set({ readAt: nowIso })
          .where(eq(messages.id, msg.id));
        msg.readAt = nowIso;
      }
    }

    const [studentUser] = await db.select({ name: users.name }).from(users).where(eq(users.id, studentId)).limit(1);
    const [consultantUser] = await db.select({ name: users.name }).from(users).where(eq(users.id, consultant.userId)).limit(1);

    const isActive = await this.isChatActive(studentId, consultant.id);

    return {
      messages: thread,
      isActive,
      studentName: studentUser?.name || 'Student',
      consultantName: consultantUser?.name || 'Consultant',
    };
  }

  /**
   * Sends a message between student and consultant.
   */
  static async sendMessage(
    senderUserId: string,
    studentId: string,
    consultantId: string,
    body: string
  ) {
    if (!body || !body.trim()) {
      throw new Error('Message body cannot be empty.');
    }

    const consultant = await this.resolveConsultant(consultantId);
    if (!consultant) throw new Error('Consultant not found');

    const isStudent = senderUserId === studentId;
    const isConsultant = senderUserId === consultant.userId;

    if (!isStudent && !isConsultant) {
      throw new Error('Unauthorized to send messages in this thread.');
    }

    const isChatActive = await this.isChatActive(studentId, consultant.id);
    if (!isChatActive) {
      throw new Error('Chat access has expired (limited to 30 days following consultation).');
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    await db.insert(messages)
      .values({
        id,
        studentId,
        consultantId: consultant.id,
        senderId: senderUserId,
        body: body.trim(),
        readAt: null,
        createdAt: now,
      });

    // Notify recipient
    const recipientUserId = isStudent ? consultant.userId : studentId;
    const [sender] = await db.select({ name: users.name }).from(users).where(eq(users.id, senderUserId)).limit(1);
    const senderName = sender?.name || (isStudent ? 'Your Student' : 'Your Mentor');

    await NotificationService.send(recipientUserId, {
      type: 'chat_message',
      title: `Message from ${senderName}`,
      body: body.length > 80 ? `${body.slice(0, 80)}...` : body,
      payloadJson: { messageId: id, studentId, consultantId: consultant.id },
    });

    return {
      id,
      senderId: senderUserId,
      body: body.trim(),
      readAt: null,
      createdAt: now,
    };
  }
}
