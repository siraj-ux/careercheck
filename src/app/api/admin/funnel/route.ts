import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/server/auth/session';
import { AdminService } from '@/server/admin/service';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access only' }, { status: 403 });
    }

    const funnel = await AdminService.getFunnelMetrics();
    return NextResponse.json({ success: true, ...funnel });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch funnel';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
