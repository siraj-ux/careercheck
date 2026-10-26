import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/server/auth/session';
import { ComplianceService } from '@/server/compliance/service';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await ComplianceService.exportStudentData(user.id);
    const jsonString = JSON.stringify(data, null, 2);

    return new Response(jsonString, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="careerchecks-export-${user.id}.json"`,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to export data';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
