import { describe, it, expect, beforeAll } from 'vitest';
import crypto from 'crypto';
import { eq, count } from 'drizzle-orm';
import { db } from '../src/server/db/client';
import { users, studentProfiles, consentRecords } from '../src/server/db/schema/users';
import {
  sendOtp,
  verifyOtpAndLogin,
  isUserUnder18,
  recordDobAndConsent,
} from '../src/server/auth/session';
import { POST as testSessionRoute } from '../src/app/api/test/session/route';
import { POST as testAnswerRoute } from '../src/app/api/test/answer/route';
import { GET as profileRoute } from '../src/app/api/profile/route';
import { POST as consentRoute } from '../src/app/api/auth/consent/route';
import { seedDatabase } from '../src/server/db/seed';

describe('Authentication & Minor Consent Suite', () => {
  beforeAll(async () => {
    await seedDatabase();
  });

  describe('1. Unauthenticated Route Protection (HTTP 401)', () => {
    it('rejects unauthenticated requests to /api/test/session with 401', async () => {
      const req = new Request('http://localhost/api/test/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level: 'UG' }),
      });
      const res = await testSessionRoute(req);
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('Unauthorized');
    });

    it('rejects unauthenticated requests to /api/test/answer with 401', async () => {
      const req = new Request('http://localhost/api/test/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: 'fake-session',
          questionId: 'fake-q',
          answer: '3',
        }),
      });
      const res = await testAnswerRoute(req);
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.success).toBe(false);
    });

    it('rejects unauthenticated requests to /api/profile with 401', async () => {
      const res = await profileRoute();
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.success).toBe(false);
    });

    it('rejects unauthenticated requests to /api/auth/consent with 401', async () => {
      const req = new Request('http://localhost/api/auth/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dob: '2005-01-01' }),
      });
      const res = await consentRoute(req);
      expect(res.status).toBe(401);
    });
  });

  describe('2. Phone + OTP Sign-Up (New User)', () => {
    const newPhone = `+91981${crypto.randomInt(1000000, 9999999)}`;

    it('sends OTP code successfully', async () => {
      const sendRes = await sendOtp(newPhone);
      expect(sendRes.success).toBe(true);
      expect(sendRes.mockCode).toBe('123456');
    });

    it('verifying new number registers user and student profile', async () => {
      const verifyRes = await verifyOtpAndLogin(newPhone, '123456');
      expect(verifyRes.success).toBe(true);
      expect(verifyRes.isNewUser).toBe(true);
      expect(verifyRes.requiresConsent).toBe(true);
      expect(verifyRes.user).toBeDefined();
      expect(verifyRes.user?.phone).toBe(newPhone);

      // Verify DB records
      const userRecord = db.select().from(users).where(eq(users.phone, newPhone)).get();
      expect(userRecord).toBeDefined();
      expect(userRecord?.role).toBe('student');
      expect(userRecord?.plan).toBe('free');
      expect(userRecord?.dob).toBeNull();

      const profileRecord = db
        .select()
        .from(studentProfiles)
        .where(eq(studentProfiles.userId, userRecord!.id))
        .get();
      expect(profileRecord).toBeDefined();
    });
  });

  describe('3. Returning User Login', () => {
    const returningPhone = `+91982${crypto.randomInt(1000000, 9999999)}`;

    beforeAll(async () => {
      // First sign up
      await sendOtp(returningPhone);
      await verifyOtpAndLogin(returningPhone, '123456');
    });

    it('logs in returning user without creating duplicate accounts', async () => {
      // Send new OTP
      await sendOtp(returningPhone);
      const loginRes = await verifyOtpAndLogin(returningPhone, '123456');

      expect(loginRes.success).toBe(true);
      expect(loginRes.isNewUser).toBe(false);

      // Ensure exact 1 user record exists
      const userCount = db
        .select({ count: count() })
        .from(users)
        .where(eq(users.phone, returningPhone))
        .get();
      expect(userCount?.count).toBe(1);
    });
  });

  describe('4. Date of Birth & Minor Consent (Section 9.7)', () => {
    it('correctly calculates age under 18', () => {
      expect(isUserUnder18('2015-05-01')).toBe(true);
      expect(isUserUnder18('2000-01-01')).toBe(false);
    });

    it('records consent for minor under 18 with policy version v1.0', async () => {
      const minorUserId = crypto.randomUUID();
      const minorPhone = `+91983${crypto.randomInt(1000000, 9999999)}`;
      const parentPhone = '+919876543210';
      const now = new Date().toISOString();

      db.insert(users)
        .values({
          id: minorUserId,
          phone: minorPhone,
          role: 'student',
          plan: 'free',
          createdAt: now,
          updatedAt: now,
        })
        .run();

      const result = await recordDobAndConsent({
        userId: minorUserId,
        dob: '2010-06-15',
        parentPhone,
        policyVersion: 'v1.0',
      });

      expect(result.success).toBe(true);
      expect(result.isMinor).toBe(true);

      // Verify user DOB updated
      const updatedUser = db.select().from(users).where(eq(users.id, minorUserId)).get();
      expect(updatedUser?.dob).toBe('2010-06-15');

      // Verify consent record
      const consent = db
        .select()
        .from(consentRecords)
        .where(eq(consentRecords.userId, minorUserId))
        .get();
      expect(consent).toBeDefined();
      expect(consent?.parentPhone).toBe(parentPhone);
      expect(consent?.policyVersion).toBe('v1.0');
    });

    it('records DOB for adult (18+) without requiring parent phone', async () => {
      const adultUserId = crypto.randomUUID();
      const adultPhone = `+91984${crypto.randomInt(1000000, 9999999)}`;
      const now = new Date().toISOString();

      db.insert(users)
        .values({
          id: adultUserId,
          phone: adultPhone,
          role: 'student',
          plan: 'free',
          createdAt: now,
          updatedAt: now,
        })
        .run();

      const result = await recordDobAndConsent({
        userId: adultUserId,
        dob: '2002-03-20',
      });

      expect(result.success).toBe(true);
      expect(result.isMinor).toBe(false);

      const updatedUser = db.select().from(users).where(eq(users.id, adultUserId)).get();
      expect(updatedUser?.dob).toBe('2002-03-20');
    });
  });

  describe('5. Rate Limiting Protection', () => {
    it('limits OTP send requests to max 3 per 10-minute window', async () => {
      const rateLimitPhone = `+91985${crypto.randomInt(1000000, 9999999)}`;

      // 1st request
      const req1 = await sendOtp(rateLimitPhone);
      expect(req1.success).toBe(true);

      // 2nd request
      const req2 = await sendOtp(rateLimitPhone);
      expect(req2.success).toBe(true);

      // 3rd request
      const req3 = await sendOtp(rateLimitPhone);
      expect(req3.success).toBe(true);

      // 4th request must be rejected
      const req4 = await sendOtp(rateLimitPhone);
      expect(req4.success).toBe(false);
      expect(req4.error).toContain('Too many OTP requests');
    });

    it('locks OTP code after 5 failed verification attempts', async () => {
      const attemptPhone = `+91986${crypto.randomInt(1000000, 9999999)}`;
      await sendOtp(attemptPhone);

      // 5 wrong attempts
      for (let attempt = 1; attempt <= 4; attempt++) {
        const res = await verifyOtpAndLogin(attemptPhone, '000000');
        expect(res.success).toBe(false);
        expect(res.error).toContain('Incorrect 6-digit code');
      }

      // 5th attempt
      const attempt5 = await verifyOtpAndLogin(attemptPhone, '000000');
      expect(attempt5.success).toBe(false);
      expect(attempt5.error).toContain('Code locked');

      // 6th attempt: exceeds maximum
      const attempt6 = await verifyOtpAndLogin(attemptPhone, '000000');
      expect(attempt6.success).toBe(false);
      expect(attempt6.error).toContain('Maximum verification attempts exceeded');
    });
  });
});
