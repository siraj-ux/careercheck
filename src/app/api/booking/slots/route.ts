import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/server/auth/session';
import { BookingService } from '@/server/booking/service';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const consultantId = searchParams.get('consultantId');

    if (!consultantId) {
      return NextResponse.json({ error: 'consultantId query parameter required' }, { status: 400 });
    }

    const slots = await BookingService.getAvailableSlots(consultantId);
    return NextResponse.json({ success: true, slots });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to retrieve slots';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
