import { NextResponse } from 'next/server';
import { getCurrentUser, logoutUser } from '@/server/auth/session';
import { ComplianceService } from '@/server/compliance/service';

export async function DELETE() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await ComplianceService.deleteStudentAccount(user.id);
    await logoutUser();

    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to delete account';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
