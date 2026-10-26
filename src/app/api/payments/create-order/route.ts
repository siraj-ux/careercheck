import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from '@/server/db/client';
import { getCurrentUser } from '@/server/auth/session';
import { payments } from '@/server/db/schema/payments';
import { PRICING_PLANS } from '@/config/pricing';

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const planConfig = PRICING_PLANS.career_plan;
    const amount = planConfig.pricePaise; // 149900 paise = ₹1,499
    const currency = planConfig.currency;

    const rzpKeyId = process.env.RAZORPAY_KEY_ID;
    const rzpSecret = process.env.RAZORPAY_KEY_SECRET;

    let orderId: string;

    if (rzpKeyId && rzpSecret) {
      // Live or test-mode call to Razorpay Orders API
      const auth = Buffer.from(`${rzpKeyId}:${rzpSecret}`).toString('base64');
      const rzpRes = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${auth}`,
        },
        body: JSON.stringify({
          amount,
          currency,
          receipt: `rcpt_${user.id.slice(0, 8)}_${Date.now()}`,
          notes: {
            userId: user.id,
            plan: 'career_plan',
          },
        }),
      });

      if (!rzpRes.ok) {
        const errText = await rzpRes.text();
        console.error('Razorpay order creation failed:', errText);
        return NextResponse.json({ error: 'Payment gateway initialization failed' }, { status: 502 });
      }

      const orderData = await rzpRes.json();
      orderId = orderData.id;
    } else {
      // Deterministic dev/test mode mock order
      orderId = `order_test_${crypto.randomBytes(8).toString('hex')}`;
    }

    const now = new Date().toISOString();

    // Record order in payments table
    await db.insert(payments)
      .values({
        id: crypto.randomUUID(),
        userId: user.id,
        amount,
        currency,
        status: 'created',
        planUnlocked: 'career_plan',
        razorpayOrderId: orderId,
        createdAt: now,
        updatedAt: now,
      });

    return NextResponse.json({
      success: true,
      orderId,
      amount,
      currency,
      keyId: rzpKeyId || 'rzp_test_mock_mode',
      planName: planConfig.name,
      user: {
        name: user.name,
        phone: user.phone,
      },
    });
  } catch (error) {
    console.error('Error in create-order route:', error);
    return NextResponse.json({ error: 'Failed to initiate checkout order' }, { status: 500 });
  }
}
