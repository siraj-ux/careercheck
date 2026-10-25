import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/server/auth/session';
import { getReportDataForUser } from '@/server/scoring/service';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const sessionId = searchParams.get('sessionId');

    const report = await getReportDataForUser(user.id, sessionId);
    if (!report) {
      return NextResponse.json(
        { error: 'No assessment results found. Please complete the test first.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        plan: user.plan,
        level: user.level,
      },
      report,
    });
  } catch (error) {
    console.error('Error fetching results report:', error);
    return NextResponse.json({ error: 'Failed to retrieve assessment report' }, { status: 500 });
  }
}
