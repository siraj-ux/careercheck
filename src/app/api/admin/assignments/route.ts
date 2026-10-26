import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUser } from '@/server/auth/session';
import { AdminService } from '@/server/admin/service';

const assignSchema = z.object({
  studentId: z.string().min(1, 'studentId required'),
  consultantId: z.string().min(1, 'consultantId required'),
});

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access only' }, { status: 403 });
    }

    const data = await AdminService.getAssignmentQueue();
    return NextResponse.json({ success: true, ...data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch assignment queue';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access only' }, { status: 403 });
    }

    const json = await request.json();
    const { studentId, consultantId } = assignSchema.parse(json);

    const result = await AdminService.assignConsultant(user.id, studentId, consultantId);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const status = err instanceof z.ZodError ? 400 : 500;
    const message = err instanceof Error ? err.message : 'Failed to assign consultant';
    return NextResponse.json({ error: message }, { status });
  }
}
