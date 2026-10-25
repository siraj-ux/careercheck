import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUser } from '@/server/auth/session';
import { getOrCreateTestSession, getTestSessionState } from '@/server/test-engine/service';

const startSessionSchema = z.object({
  level: z.enum(['UG', 'PG']).default('UG'),
});

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized. Please log in.' }, { status: 401 });
    }
    const url = new URL(req.url);
    const sessionId = url.searchParams.get('sessionId');

    const session = sessionId
      ? await getTestSessionState(sessionId, user.id)
      : null;

    if (!session) {
      // Find latest in-progress session
      const activeSession = await getOrCreateTestSession(user.id, user.level || 'UG');
      const state = await getTestSessionState(activeSession.id, user.id);
      return NextResponse.json({ success: true, state });
    }

    return NextResponse.json({ success: true, state: session });
  } catch (error) {
    console.error('Test session GET error:', error);
    return NextResponse.json({ success: false, error: 'Failed to retrieve test session' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized. Please log in.' }, { status: 401 });
    }
    const body = await req.json().catch(() => ({}));
    const parsed = startSessionSchema.safeParse(body);
    const level = parsed.success ? parsed.data.level : (user.level || 'UG');

    const session = await getOrCreateTestSession(user.id, level);
    const state = await getTestSessionState(session.id, user.id);

    return NextResponse.json({ success: true, state });
  } catch (error) {
    console.error('Test session POST error:', error);
    return NextResponse.json({ success: false, error: 'Failed to start test session' }, { status: 500 });
  }
}
