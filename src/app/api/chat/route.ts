import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUser } from '@/server/auth/session';
import { ChatService } from '@/server/chat/service';

const postMessageSchema = z.object({
  studentId: z.string().min(1, 'studentId required'),
  consultantId: z.string().min(1, 'consultantId required'),
  body: z.string().min(1, 'Message body cannot be empty').max(2000, 'Message too long'),
});

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const consultantId = searchParams.get('consultantId');

    if (!studentId || !consultantId) {
      return NextResponse.json({ error: 'studentId and consultantId required' }, { status: 400 });
    }

    const thread = await ChatService.getThread(user.id, studentId, consultantId);
    return NextResponse.json({ success: true, ...thread });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to retrieve messages';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const json = await request.json();
    const { studentId, consultantId, body } = postMessageSchema.parse(json);

    const message = await ChatService.sendMessage(user.id, studentId, consultantId, body);
    return NextResponse.json({ success: true, message });
  } catch (err: unknown) {
    const status = err instanceof z.ZodError ? 400 : 400;
    const message = err instanceof Error ? err.message : 'Failed to send message';
    return NextResponse.json({ error: message }, { status });
  }
}
