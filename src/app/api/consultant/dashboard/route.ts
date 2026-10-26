import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/server/auth/session';
import { ConsultantService } from '@/server/consultants/service';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'consultant' && user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Consultant access only' }, { status: 403 });
    }

    const dashboard = await ConsultantService.getDashboard(user.id);
    return NextResponse.json({ success: true, ...dashboard });
  } catch (err: unknown) {
    console.error('Error fetching consultant dashboard:', err);
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
