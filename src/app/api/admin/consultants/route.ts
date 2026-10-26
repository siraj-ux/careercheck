import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUser } from '@/server/auth/session';
import { AdminService } from '@/server/admin/service';

const toggleConsultantSchema = z.object({
  consultantId: z.string().min(1, 'consultantId required'),
  isActive: z.boolean(),
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

    const consultants = await AdminService.getConsultants();
    return NextResponse.json({ success: true, consultants });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch consultants';
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
    const { consultantId, isActive } = toggleConsultantSchema.parse(json);

    const result = await AdminService.toggleConsultantActive(user.id, consultantId, isActive);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const status = err instanceof z.ZodError ? 400 : 500;
    const message = err instanceof Error ? err.message : 'Failed to update consultant';
    return NextResponse.json({ error: message }, { status });
  }
}
