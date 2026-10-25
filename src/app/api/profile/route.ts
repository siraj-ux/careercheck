import { NextResponse, connection } from 'next/server';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { users, studentProfiles } from '@/server/db/schema/users';
import { getCurrentUser } from '@/server/auth/session';

const profileUpdateSchema = z.object({
  name: z.string().optional(),
  level: z.enum(['UG', 'PG']).optional(),
  dob: z.string().optional(),
  board: z.enum(['CBSE', 'ICSE', 'State', 'Other']).optional(),
  stream: z.enum(['Science PCM', 'Science PCB', 'Commerce', 'Arts/Humanities', 'Other']).optional(),
  marksPercent: z.number().min(0).max(100).optional(),
  pgDegree: z.string().optional(),
  pgSpecialisation: z.string().optional(),
  pgGradYear: z.number().optional(),
  pgCgpaOrPercent: z.string().optional(),
  interests: z.array(z.string()).max(3).optional(),
  preferredCities: z.array(z.string()).max(5).optional(),
  relocate: z.boolean().optional(),
  budgetBand: z.string().optional(),
  budgetAmount: z.number().optional(),
  loanOpenness: z.boolean().optional(),
  knowledgeLevel: z.number().min(1).max(5).optional(),
});

export async function GET() {
  try {
    await connection();
  } catch {
    // In unit test runner without RequestAsyncStorage
  }
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized. Please log in.' }, { status: 401 });
    }
    const profile = db
      .select()
      .from(studentProfiles)
      .where(eq(studentProfiles.userId, user.id))
      .get();

    return NextResponse.json({
      success: true,
      user,
      profile: profile
        ? {
            ...profile,
            interests: profile.interestsJson ? JSON.parse(profile.interestsJson) : [],
            preferredCities: profile.preferredCitiesJson ? JSON.parse(profile.preferredCitiesJson) : [],
            relocate: Boolean(profile.relocate),
            loanOpenness: Boolean(profile.loanOpenness),
          }
        : null,
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch profile' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized. Please log in.' }, { status: 401 });
    }
    const body = await req.json();
    const parsed = profileUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const data = parsed.data;
    const now = new Date().toISOString();

    // Update users table fields
    if (data.name !== undefined || data.level !== undefined || data.dob !== undefined) {
      db.update(users)
        .set({
          ...(data.name !== undefined ? { name: data.name } : {}),
          ...(data.level !== undefined ? { level: data.level } : {}),
          ...(data.dob !== undefined ? { dob: data.dob } : {}),
          updatedAt: now,
        })
        .where(eq(users.id, user.id))
        .run();
    }

    // Update or insert studentProfiles table
    const profileUpdates: Partial<typeof studentProfiles.$inferInsert> = {
      updatedAt: now,
    };

    if (data.board !== undefined) profileUpdates.board = data.board;
    if (data.stream !== undefined) profileUpdates.stream = data.stream;
    if (data.marksPercent !== undefined) profileUpdates.marksPercent = data.marksPercent;
    if (data.pgDegree !== undefined) profileUpdates.pgDegree = data.pgDegree;
    if (data.pgSpecialisation !== undefined) profileUpdates.pgSpecialisation = data.pgSpecialisation;
    if (data.pgGradYear !== undefined) profileUpdates.pgGradYear = data.pgGradYear;
    if (data.pgCgpaOrPercent !== undefined) profileUpdates.pgCgpaOrPercent = data.pgCgpaOrPercent;
    if (data.interests !== undefined) profileUpdates.interestsJson = JSON.stringify(data.interests);
    if (data.preferredCities !== undefined) profileUpdates.preferredCitiesJson = JSON.stringify(data.preferredCities);
    if (data.relocate !== undefined) profileUpdates.relocate = data.relocate ? 1 : 0;
    if (data.budgetBand !== undefined) profileUpdates.budgetBand = data.budgetBand;
    if (data.budgetAmount !== undefined) profileUpdates.budgetAmount = data.budgetAmount;
    if (data.loanOpenness !== undefined) profileUpdates.loanOpenness = data.loanOpenness ? 1 : 0;
    if (data.knowledgeLevel !== undefined) profileUpdates.knowledgeLevel = data.knowledgeLevel;

    const existingProfile = db
      .select({ id: studentProfiles.id })
      .from(studentProfiles)
      .where(eq(studentProfiles.userId, user.id))
      .get();

    if (existingProfile) {
      db.update(studentProfiles)
        .set(profileUpdates)
        .where(eq(studentProfiles.id, existingProfile.id))
        .run();
    } else {
      db.insert(studentProfiles)
        .values({
          id: crypto.randomUUID(),
          userId: user.id,
          createdAt: now,
          updatedAt: now,
          ...profileUpdates,
        })
        .run();
    }

    return NextResponse.json({ success: true, savedAt: now });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update profile' }, { status: 500 });
  }
}
