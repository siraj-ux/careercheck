import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { eq } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { payments } from '@/server/db/schema/payments';
import { users } from '@/server/db/schema/users';
import { notifications } from '@/server/db/schema/system';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-razorpay-signature');
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    // Validate signature if webhook secret is configured
    if (webhookSecret && signature) {
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(rawBody)
        .digest('hex');

      if (expectedSignature !== signature) {
        return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 });
      }
    }

    const event = JSON.parse(rawBody);
    const eventType = event.event;
    const paymentEntity = event.payload?.payment?.entity;
    const orderId = paymentEntity?.order_id;
    const paymentId = paymentEntity?.id;

    if (!orderId) {
      return NextResponse.json({ received: true, ignored: true });
    }

    const now = new Date().toISOString();

    if (eventType === 'payment.captured' || eventType === 'order.paid') {
      db.transaction((tx) => {
        const existing = tx
          .select()
          .from(payments)
          .where(eq(payments.razorpayOrderId, orderId))
          .get();

        if (existing && existing.status === 'captured') {
          // Idempotent: repeated webhook never double-credits
          return;
        }

        if (existing) {
          tx.update(payments)
            .set({
              status: 'captured',
              razorpayPaymentId: paymentId || existing.razorpayPaymentId,
              updatedAt: now,
            })
            .where(eq(payments.id, existing.id))
            .run();

          // Unlock paid plan for user
          tx.update(users)
            .set({
              plan: 'paid',
              updatedAt: now,
            })
            .where(eq(users.id, existing.userId))
            .run();

          tx.insert(notifications)
            .values({
              id: crypto.randomUUID(),
              userId: existing.userId,
              type: 'payment_success',
              title: 'Career Plan Activated (Webhook)',
              body: 'Your payment was successfully confirmed via payment gateway webhook.',
              createdAt: now,
            })
            .run();
        }
      });
    } else if (eventType === 'payment.failed') {
      db.update(payments)
        .set({
          status: 'failed',
          updatedAt: now,
        })
        .where(eq(payments.razorpayOrderId, orderId))
        .run();
    }

    return NextResponse.json({ received: true, event: eventType });
  } catch (error) {
    console.error('Error processing Razorpay webhook:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
