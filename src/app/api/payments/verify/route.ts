import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { eq } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { getCurrentUser } from '@/server/auth/session';
import { payments } from '@/server/db/schema/payments';
import { users } from '@/server/db/schema/users';
import { notifications } from '@/server/db/schema/system';

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

    if (!razorpay_order_id || !razorpay_payment_id) {
      return NextResponse.json({ error: 'Missing required payment verification parameters' }, { status: 400 });
    }

    const rzpSecret = process.env.RAZORPAY_KEY_SECRET;

    // Verify cryptographic signature if secret is configured
    if (rzpSecret) {
      const payload = `${razorpay_order_id}|${razorpay_payment_id}`;
      const expectedSignature = crypto
        .createHmac('sha256', rzpSecret)
        .update(payload)
        .digest('hex');

      if (expectedSignature !== razorpay_signature) {
        // Record payment failure idempotently
        db.update(payments)
          .set({
            status: 'failed',
            updatedAt: new Date().toISOString(),
          })
          .where(eq(payments.razorpayOrderId, razorpay_order_id))
          .run();

        return NextResponse.json(
          {
            error: "Payment verification failed. You haven't been charged.",
            failed: true,
          },
          { status: 400 }
        );
      }
    }

    const now = new Date().toISOString();

    // Idempotent database update in short transaction
    let alreadyCaptured = false;

    db.transaction((tx) => {
      const paymentRecord = tx
        .select()
        .from(payments)
        .where(eq(payments.razorpayOrderId, razorpay_order_id))
        .get();

      if (paymentRecord && paymentRecord.status === 'captured') {
        alreadyCaptured = true;
        return;
      }

      if (paymentRecord) {
        tx.update(payments)
          .set({
            status: 'captured',
            razorpayPaymentId: razorpay_payment_id,
            razorpaySignature: razorpay_signature || 'mock_verified_signature',
            updatedAt: now,
          })
          .where(eq(payments.id, paymentRecord.id))
          .run();
      } else {
        // Fallback insert if order was generated externally
        tx.insert(payments)
          .values({
            id: crypto.randomUUID(),
            userId: user.id,
            amount: 149900,
            currency: 'INR',
            status: 'captured',
            planUnlocked: 'career_plan',
            razorpayOrderId: razorpay_order_id,
            razorpayPaymentId: razorpay_payment_id,
            razorpaySignature: razorpay_signature || 'mock_verified_signature',
            createdAt: now,
            updatedAt: now,
          })
          .run();
      }

      // Upgrade student plan to paid
      tx.update(users)
        .set({
          plan: 'paid',
          updatedAt: now,
        })
        .where(eq(users.id, user.id))
        .run();

      // Trigger activation notification
      tx.insert(notifications)
        .values({
          id: crypto.randomUUID(),
          userId: user.id,
          type: 'payment_success',
          title: 'Career Plan Activated!',
          body: 'Your payment was successful. Full report, consultant consultation, and personalized roadmap are now unlocked.',
          payloadJson: JSON.stringify({ orderId: razorpay_order_id, paymentId: razorpay_payment_id }),
          createdAt: now,
        })
        .run();
    });

    return NextResponse.json({
      success: true,
      plan: 'paid',
      alreadyProcessed: alreadyCaptured,
      message: 'Payment confirmed. Welcome to Career Plan!',
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    return NextResponse.json({ error: 'Internal error verifying payment' }, { status: 500 });
  }
}
