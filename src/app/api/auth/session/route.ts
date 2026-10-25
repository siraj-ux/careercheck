import { NextResponse, connection } from 'next/server';
import { getCurrentUser } from '@/server/auth/session';

export async function GET() {
  try {
    await connection();
  } catch {
    // In unit test runner without RequestAsyncStorage
  }
  try {
    const user = await getCurrentUser();
    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error('Session retrieval error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
