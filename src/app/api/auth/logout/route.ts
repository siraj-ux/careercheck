import { NextResponse } from 'next/server';
import { logoutUser } from '@/server/auth/session';

export async function POST() {
  try {
    await logoutUser();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ success: false, error: 'Failed to log out' }, { status: 500 });
  }
}
