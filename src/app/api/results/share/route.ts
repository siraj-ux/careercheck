import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { eq, and, gt, isNull } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { getCurrentUser } from '@/server/auth/session';
import { parentShareLinks } from '@/server/db/schema/system';
import { results } from '@/server/db/schema/tests';
import { users } from '@/server/db/schema/users';
import { getReportDataForUser } from '@/server/scoring/service';

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * POST /api/results/share
 * Generates a 7-day expiring read-only link for parents
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's result record
    const resultRecord = db
      .select({ id: results.id })
      .from(results)
      .where(eq(results.userId, user.id))
      .get();

    if (!resultRecord) {
      return NextResponse.json(
        { error: 'No assessment result found to share.' },
        { status: 404 }
      );
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashToken(rawToken);

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

    db.insert(parentShareLinks)
      .values({
        id: crypto.randomUUID(),
        resultId: resultRecord.id,
        userId: user.id,
        tokenHash,
        expiresAt,
        revokedAt: null,
        createdAt: now.toISOString(),
      })
      .run();

    const origin = req.nextUrl.origin;
    const shareUrl = `${origin}/report/share/${rawToken}`;

    return NextResponse.json({
      success: true,
      token: rawToken,
      shareUrl,
      expiresAt,
    });
  } catch (error) {
    console.error('Error creating share link:', error);
    return NextResponse.json({ error: 'Failed to create share link' }, { status: 500 });
  }
}

/**
 * GET /api/results/share?token=...
 * Public read-only report retrieval for parent view
 */
export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get('token');
    if (!token) {
      return NextResponse.json({ error: 'Token parameter is required' }, { status: 400 });
    }

    const tokenHash = hashToken(token);
    const nowIso = new Date().toISOString();

    const link = db
      .select()
      .from(parentShareLinks)
      .where(
        and(
          eq(parentShareLinks.tokenHash, tokenHash),
          gt(parentShareLinks.expiresAt, nowIso),
          isNull(parentShareLinks.revokedAt)
        )
      )
      .get();

    if (!link) {
      return NextResponse.json(
        {
          error: 'This report link has expired or was revoked. Please ask the student for a fresh link.',
          isExpired: true,
        },
        { status: 404 }
      );
    }

    const student = db.select({ name: users.name, plan: users.plan, level: users.level }).from(users).where(eq(users.id, link.userId)).get();

    const report = await getReportDataForUser(link.userId);
    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      studentName: student?.name || 'Student',
      isReadOnly: true,
      expiresAt: link.expiresAt,
      report,
    });
  } catch (error) {
    console.error('Error accessing shared report:', error);
    return NextResponse.json({ error: 'Failed to access shared report' }, { status: 500 });
  }
}
