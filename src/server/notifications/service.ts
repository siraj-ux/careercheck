import crypto from 'crypto';
import { eq, desc, and, isNull } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { notifications } from '@/server/db/schema/system';

export interface NotificationPayload {
  type: string;
  title: string;
  body: string;
  payloadJson?: Record<string, unknown>;
}

export interface EmailMessage {
  to: string;
  subject: string;
  textBody: string;
  htmlBody?: string;
}

export interface EmailProvider {
  sendEmail(message: EmailMessage): Promise<boolean>;
}

/**
 * Mock Email Provider: logs formatted email in dev/test, zero external dependencies.
 * Production can plug in Resend, Sendgrid, or SMTP implementation of EmailProvider.
 */
export class ConsoleEmailProvider implements EmailProvider {
  async sendEmail(message: EmailMessage): Promise<boolean> {
    if (process.env.NODE_ENV !== 'test') {
      console.log(`\n📧 [EMAIL DISPATCH] To: ${message.to} | Subject: ${message.subject}\nBody: ${message.textBody}\n`);
    }
    return true;
  }
}

let activeEmailProvider: EmailProvider = new ConsoleEmailProvider();

export function setEmailProvider(provider: EmailProvider) {
  activeEmailProvider = provider;
}

export class NotificationService {
  /**
   * Dispatches an in-app notification and optional email trigger.
   */
  static async send(
    userId: string,
    notification: NotificationPayload,
    recipientEmail?: string
  ): Promise<string> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    let emailedAt: string | null = null;
    if (recipientEmail) {
      const emailSent = await activeEmailProvider.sendEmail({
        to: recipientEmail,
        subject: `[CareerChecks] ${notification.title}`,
        textBody: notification.body,
      });
      if (emailSent) {
        emailedAt = now;
      }
    }

    await db.insert(notifications)
      .values({
        id,
        userId,
        type: notification.type,
        title: notification.title,
        body: notification.body,
        payloadJson: notification.payloadJson ? JSON.stringify(notification.payloadJson) : null,
        readAt: null,
        emailedAt,
        createdAt: now,
      });

    return id;
  }

  /**
   * Fetches notifications for a user, sorted newest first.
   */
  static async getUserNotifications(userId: string, limit = 20) {
    return db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(limit);
  }

  /**
   * Marks a notification or all notifications as read.
   */
  static async markAsRead(userId: string, notificationId?: string) {
    const now = new Date().toISOString();
    if (notificationId) {
      await db.update(notifications)
        .set({ readAt: now })
        .where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)));
    } else {
      await db.update(notifications)
        .set({ readAt: now })
        .where(eq(notifications.userId, userId));
    }
  }

  /**
   * Gets unread notification count.
   */
  static async getUnreadCount(userId: string): Promise<number> {
    const list = await db
      .select({ id: notifications.id })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));
    return list.length;
  }
}
