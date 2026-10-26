import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/server/auth/session';
import { ComplianceService } from '@/server/compliance/service';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access only' }, { status: 403 });
    }

    const logs = await ComplianceService.getAuditLogs(100);
    return NextResponse.json({ success: true, logs });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch audit logs';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
