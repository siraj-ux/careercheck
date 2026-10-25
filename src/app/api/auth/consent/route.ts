import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUser, recordDobAndConsent, isUserUnder18 } from '@/server/auth/session';

const consentSchema = z.object({
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'DOB must be in YYYY-MM-DD format'),
  parentPhone: z.string().optional(),
  consentGiven: z.boolean().optional(),
});

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized. Please log in.' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = consentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid parameters', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { dob, parentPhone, consentGiven } = parsed.data;
    const isMinor = isUserUnder18(dob);

    if (isMinor) {
      if (!consentGiven) {
        return NextResponse.json(
          { success: false, error: 'Parent or guardian consent checkbox is required for students under 18.' },
          { status: 400 }
        );
      }
      if (!parentPhone || parentPhone.trim().length < 8) {
        return NextResponse.json(
          { success: false, error: 'A valid parent or guardian phone number is required for students under 18.' },
          { status: 400 }
        );
      }
    }

    const result = await recordDobAndConsent({
      userId: user.id,
      dob,
      parentPhone,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Consent recording error:', error);
    return NextResponse.json({ success: false, error: 'Failed to record date of birth and consent' }, { status: 500 });
  }
}
