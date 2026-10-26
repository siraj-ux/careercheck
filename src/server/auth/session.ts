import { cookies } from 'next/headers';
import crypto from 'crypto';
import { eq, and, gt, isNull, count } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { users, authSessions, studentProfiles, consentRecords } from '@/server/db/schema/users';
import { otpCodes } from '@/server/db/schema/system';

const COOKIE_NAME = 'cc_session';
const SESSION_EXPIRY_DAYS = 30;
const MAX_OTP_SENDS_PER_WINDOW = 3;
const OTP_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_VERIFY_ATTEMPTS = 5;

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export interface SessionUser {
  id: string;
  phone: string;
  role: 'visitor' | 'student' | 'consultant' | 'admin';
  name: string | null;
  level: 'UG' | 'PG' | null;
  plan: 'free' | 'paid';
  dob: string | null;
}

/**
 * Creates an auth session for a user and sets the HTTP-only cookie.
 */
export async function createSession(userId: string, deviceInfo?: string): Promise<string> {
  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashToken(token);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000).toISOString();

  await db.insert(authSessions).values({
    id: crypto.randomUUID(),
    userId,
    tokenHash,
    expiresAt,
    deviceInfo: deviceInfo ?? 'web',
    createdAt: now.toISOString(),
  });

  try {
    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_EXPIRY_DAYS * 24 * 60 * 60,
    });
  } catch {
    // In background scripts or unit tests outside request scope, cookies() is not available
  }

  return token;
}

/**
 * Gets the currently authenticated user from the session cookie.
 * Strictly returns null if no valid authenticated session exists.
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;

    const tokenHash = hashToken(token);
    const nowIso = new Date().toISOString();

    const [session] = await db
      .select({
        user: users,
        expiresAt: authSessions.expiresAt,
      })
      .from(authSessions)
      .innerJoin(users, eq(authSessions.userId, users.id))
      .where(and(eq(authSessions.tokenHash, tokenHash), gt(authSessions.expiresAt, nowIso)))
      .limit(1);

    if (!session) return null;

    return {
      id: session.user.id,
      phone: session.user.phone,
      role: session.user.role as 'visitor' | 'student' | 'consultant' | 'admin',
      name: session.user.name,
      level: session.user.level as 'UG' | 'PG' | null,
      plan: session.user.plan as 'free' | 'paid',
      dob: session.user.dob,
    };
  } catch {
    return null;
  }
}

/**
 * Logs out the current user: clears session cookie and removes DB auth session.
 */
export async function logoutUser(): Promise<void> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (token) {
      const tokenHash = hashToken(token);
      await db.delete(authSessions).where(eq(authSessions.tokenHash, tokenHash));
    }
    cookieStore.delete(COOKIE_NAME);
  } catch {
    // Ignore cookie errors
  }
}

/**
 * Handles Phone + OTP send request with strict rate-limiting.
 */
export async function sendOtp(phone: string): Promise<{ success: boolean; error?: string; mockCode?: string }> {
  const now = new Date();
  const windowStart = new Date(now.getTime() - OTP_WINDOW_MS).toISOString();

  // Rate-limiting check: max 3 OTP requests per phone in 10 minutes
  const [recentRequests] = await db
    .select({ count: count() })
    .from(otpCodes)
    .where(and(eq(otpCodes.phone, phone), gt(otpCodes.createdAt, windowStart)));

  if (recentRequests && recentRequests.count >= MAX_OTP_SENDS_PER_WINDOW) {
    return {
      success: false,
      error: 'Too many OTP requests for this phone number. Please wait a few minutes before trying again.',
    };
  }

  const isMock = process.env.OTP_MOCK_ENABLED !== 'false' && process.env.NODE_ENV !== 'production';
  const code = isMock ? '123456' : `${crypto.randomInt(100000, 999999)}`;
  const codeHash = hashToken(code);
  const expiresAt = new Date(now.getTime() + 10 * 60 * 1000).toISOString(); // 10 minutes

  await db.insert(otpCodes).values({
    id: crypto.randomUUID(),
    phone,
    codeHash,
    expiresAt,
    attempts: 0,
    createdAt: now.toISOString(),
  });

  return {
    success: true,
    mockCode: isMock ? '123456' : undefined,
  };
}

/**
 * Verifies OTP code, handles rate-limited attempt limits, and logs in or creates student.
 */
export async function verifyOtpAndLogin(
  phone: string,
  code: string
): Promise<{
  success: boolean;
  error?: string;
  user?: SessionUser;
  isNewUser?: boolean;
  requiresConsent?: boolean;
}> {
  const nowIso = new Date().toISOString();
  const inputHash = hashToken(code);

  const matchingCodes = await db
    .select()
    .from(otpCodes)
    .where(and(eq(otpCodes.phone, phone), isNull(otpCodes.consumedAt), gt(otpCodes.expiresAt, nowIso)))
    .orderBy(otpCodes.createdAt);

  const otpRecord = matchingCodes.pop();

  const isMock = process.env.OTP_MOCK_ENABLED !== 'false' && process.env.NODE_ENV !== 'production';

  if (!otpRecord) {
    // In development mode with mock OTP enabled, allow standard mock code '123456' for local testing
    if (isMock && code === '123456') {
      // Proceed with development login without hard failure
    } else {
      return { success: false, error: 'OTP expired or not found. Please request a new code.' };
    }
  } else {
    // Attempt rate-limiting check: max 5 attempts per code
    if (otpRecord.attempts >= MAX_VERIFY_ATTEMPTS) {
      return {
        success: false,
        error: 'Maximum verification attempts exceeded. Please request a new OTP.',
      };
    }

    if (otpRecord.codeHash !== inputHash) {
      await db.update(otpCodes)
        .set({ attempts: otpRecord.attempts + 1 })
        .where(eq(otpCodes.id, otpRecord.id));
      const remaining = MAX_VERIFY_ATTEMPTS - (otpRecord.attempts + 1);
      return {
        success: false,
        error: `Incorrect 6-digit code. ${remaining > 0 ? `${remaining} attempts remaining.` : 'Code locked. Request a new OTP.'}`,
      };
    }

    // Mark consumed
    await db.update(otpCodes)
      .set({ consumedAt: nowIso })
      .where(eq(otpCodes.id, otpRecord.id));
  }

  // Find or create user
  const [existingFound] = await db.select().from(users).where(eq(users.phone, phone)).limit(1);
  let existingUser = existingFound;
  const isNewUser = !existingUser;

  if (!existingUser) {
    const userId = crypto.randomUUID();
    const now = new Date().toISOString();
    await db.transaction(async (tx) => {
      await tx.insert(users).values({
        id: userId,
        phone,
        role: 'student',
        plan: 'free',
        dob: null,
        createdAt: now,
        updatedAt: now,
      });

      await tx.insert(studentProfiles).values({
        id: crypto.randomUUID(),
        userId,
        createdAt: now,
        updatedAt: now,
      });
    });

    const [createdUser] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    existingUser = createdUser!;
  }

  await createSession(existingUser.id, 'mobile-web');

  const requiresConsent = !existingUser.dob;

  return {
    success: true,
    isNewUser,
    requiresConsent,
    user: {
      id: existingUser.id,
      phone: existingUser.phone,
      role: existingUser.role as SessionUser['role'],
      name: existingUser.name,
      level: existingUser.level as 'UG' | 'PG' | null,
      plan: existingUser.plan as 'free' | 'paid',
      dob: existingUser.dob,
    },
  };
}

/**
 * Calculates whether a user is under 18 from an ISO DOB string (YYYY-MM-DD).
 */
export function isUserUnder18(dobString: string): boolean {
  const birthDate = new Date(dobString);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age < 18;
}

/**
 * Records DOB and minor parent/guardian consent per Section 9.7.
 */
export async function recordDobAndConsent(params: {
  userId: string;
  dob: string;
  parentPhone?: string;
  policyVersion?: string;
}): Promise<{ success: boolean; isMinor: boolean }> {
  const { userId, dob, parentPhone, policyVersion = 'v1.0' } = params;
  const isMinor = isUserUnder18(dob);
  const now = new Date().toISOString();

  if (isMinor) {
    if (!parentPhone || parentPhone.trim().length < 8) {
      throw new Error('Parent/guardian phone number is mandatory for students under 18.');
    }

    await db.transaction(async (tx) => {
      await tx.insert(consentRecords).values({
        id: crypto.randomUUID(),
        userId,
        parentPhone: parentPhone.trim(),
        policyVersion,
        acceptedAt: now,
      });

      await tx.update(users)
        .set({ dob, updatedAt: now })
        .where(eq(users.id, userId));
    });
  } else {
    await db.update(users)
      .set({ dob, updatedAt: now })
      .where(eq(users.id, userId));
  }

  return { success: true, isMinor };
}
