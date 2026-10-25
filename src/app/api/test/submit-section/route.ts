import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUser } from '@/server/auth/session';
import { submitSection, SectionType } from '@/server/test-engine/service';

const submitSchema = z.object({
  sessionId: z.string().min(1),
  section: z.enum(['interests', 'aptitude', 'personality', 'values', 'domain']),
});

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized. Please log in.' }, { status: 401 });
    }
    const body = await req.json();
    const parsed = submitSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid submission parameters', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const result = await submitSection(parsed.data.sessionId, user.id, parsed.data.section as SectionType);

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error('Section submit error:', error);
    return NextResponse.json({ success: false, error: 'Failed to submit section' }, { status: 500 });
  }
}
