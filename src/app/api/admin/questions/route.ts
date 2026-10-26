import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUser } from '@/server/auth/session';
import { AdminService } from '@/server/admin/service';

const toggleQuestionSchema = z.object({
  questionId: z.string().min(1, 'questionId required'),
  status: z.enum(['live', 'draft']),
});

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access only' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const section = searchParams.get('section') || undefined;
    const status = (searchParams.get('status') as 'live' | 'draft') || undefined;

    const data = await AdminService.getQuestionBank(section, status);
    return NextResponse.json({ success: true, ...data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch questions';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access only' }, { status: 403 });
    }

    const json = await request.json();
    const { questionId, status } = toggleQuestionSchema.parse(json);

    const result = await AdminService.toggleQuestionStatus(user.id, questionId, status);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const status = err instanceof z.ZodError ? 400 : 500;
    const message = err instanceof Error ? err.message : 'Failed to update question';
    return NextResponse.json({ error: message }, { status });
  }
}
