import { NextResponse } from 'next/server';
import { z } from 'zod';
import { sendOtp, verifyOtpAndLogin } from '@/server/auth/session';

const sendOtpSchema = z.object({
  phone: z.string().regex(/^\+?[1-9]\d{7,14}$/, 'Invalid phone number format'),
});

const verifyOtpSchema = z.object({
  phone: z.string().regex(/^\+?[1-9]\d{7,14}$/, 'Invalid phone number format'),
  code: z.string().length(6, 'OTP must be 6 digits'),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const action = body.action;

    if (action === 'send') {
      const parsed = sendOtpSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { success: false, error: 'Please enter a valid phone number with country code (e.g. +91 98765 43210)' },
          { status: 400 }
        );
      }
      const result = await sendOtp(parsed.data.phone);
      if (!result.success) {
        return NextResponse.json(result, { status: 429 }); // 429 Too Many Requests
      }
      return NextResponse.json(result);
    }

    if (action === 'verify') {
      const parsed = verifyOtpSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ success: false, error: 'Please enter a valid 6-digit code' }, { status: 400 });
      }
      const result = await verifyOtpAndLogin(parsed.data.phone, parsed.data.code);
      if (!result.success) {
        return NextResponse.json(result, { status: 400 });
      }
      return NextResponse.json(result);
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('OTP API error:', error);
    return NextResponse.json({ success: false, error: 'Failed to process OTP request' }, { status: 500 });
  }
}
