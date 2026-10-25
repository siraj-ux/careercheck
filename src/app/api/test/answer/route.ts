import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUser } from '@/server/auth/session';
import { recordAnswer } from '@/server/test-engine/service';

const answerSchema = z.object({
  sessionId: z.string().min(1),
  questionId: z.string().min(1),
  answer: z.enum(['1', '2', '3', '4', '5', 'A', 'B', 'C', 'D']),
  timeTakenSeconds: z.number().min(0).optional(),
});

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized. Please log in.' }, { status: 401 });
    }
    const body = await req.json();
    const parsed = answerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid answer parameters', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const result = await recordAnswer({
      sessionId: parsed.data.sessionId,
      userId: user.id,
      questionId: parsed.data.questionId,
      answer: parsed.data.answer,
      timeTakenSeconds: parsed.data.timeTakenSeconds,
    });

    if (result.expired) {
      return NextResponse.json(result, { status: 410 }); // 410 Gone / expired
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Answer autosave error:', error);
    return NextResponse.json({ success: false, error: 'Failed to record answer' }, { status: 500 });
  }
}
