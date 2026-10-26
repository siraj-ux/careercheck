import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUser } from '@/server/auth/session';
import { BookingService } from '@/server/booking/service';

const joinLinkSchema = z.object({
  sessionId: z.string().min(1, 'sessionId required'),
  joinLink: z.string().url('Must be a valid URL (Google Meet / Zoom)'),
});

export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'consultant' && user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Consultant or Admin only' }, { status: 403 });
    }

    const json = await request.json();
    const { sessionId, joinLink } = joinLinkSchema.parse(json);

    const result = await BookingService.updateJoinLink(user.id, sessionId, joinLink);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const status = err instanceof z.ZodError ? 400 : 500;
    const message = err instanceof Error ? err.message : 'Failed to update meeting link';
    return NextResponse.json({ error: message }, { status });
  }
}
