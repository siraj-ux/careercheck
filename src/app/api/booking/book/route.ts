import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUser } from '@/server/auth/session';
import { BookingService } from '@/server/booking/service';

const bookSchema = z.object({
  consultantId: z.string().min(1, 'consultantId required'),
  scheduledAt: z.string().min(1, 'scheduledAt ISO date required'),
});

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const json = await request.json();
    const { consultantId, scheduledAt } = bookSchema.parse(json);

    const result = await BookingService.bookSession(user.id, consultantId, scheduledAt);
    return NextResponse.json({ success: true, ...result });
  } catch (err: unknown) {
    const status = err instanceof z.ZodError ? 400 : 500;
    const message = err instanceof Error ? err.message : 'Failed to book session';
    return NextResponse.json({ error: message }, { status });
  }
}
