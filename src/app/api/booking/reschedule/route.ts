import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUser } from '@/server/auth/session';
import { BookingService } from '@/server/booking/service';

const rescheduleSchema = z.object({
  sessionId: z.string().min(1, 'sessionId required'),
  newScheduledAt: z.string().min(1, 'newScheduledAt ISO date required'),
});

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const json = await request.json();
    const { sessionId, newScheduledAt } = rescheduleSchema.parse(json);

    const isAdminOrConsultant = user.role === 'admin' || user.role === 'consultant';
    const result = await BookingService.rescheduleSession(
      user.id,
      sessionId,
      newScheduledAt,
      isAdminOrConsultant
    );

    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to reschedule session';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
