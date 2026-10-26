import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/server/auth/session';
import { NotificationService } from '@/server/notifications/service';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const items = await NotificationService.getUserNotifications(user.id, 25);
    const unreadCount = await NotificationService.getUnreadCount(user.id);

    return NextResponse.json({
      success: true,
      notifications: items,
      unreadCount,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch notifications';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const json = await request.json().catch(() => ({}));
    await NotificationService.markAsRead(user.id, json?.notificationId);

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update notification';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
