import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUser } from '@/server/auth/session';
import { syncOfflineAnswers } from '@/server/test-engine/service';

const syncSchema = z.object({
  sessionId: z.string().min(1),
  answers: z.array(
    z.object({
      questionId: z.string().min(1),
      answer: z.enum(['1', '2', '3', '4', '5', 'A', 'B', 'C', 'D']),
      timeTakenSeconds: z.number().min(0).optional(),
    })
  ).min(1),
});

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized. Please log in.' }, { status: 401 });
    }
    const body = await req.json();
    const parsed = syncSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid batch sync payload', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const result = await syncOfflineAnswers({
      sessionId: parsed.data.sessionId,
      userId: user.id,
      answers: parsed.data.answers,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Offline batch sync error:', error);
    return NextResponse.json({ success: false, error: 'Failed to synchronize offline answers' }, { status: 500 });
  }
}
