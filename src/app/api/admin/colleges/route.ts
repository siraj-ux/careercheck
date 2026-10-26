import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUser } from '@/server/auth/session';
import { AdminService } from '@/server/admin/service';

const saveCollegeSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'College name required'),
  city: z.string().min(1, 'City required'),
  state: z.string().min(1, 'State required'),
  type: z.string().min(1, 'Type required'),
  annualFees: z.number().nonnegative(),
  cutoffPercent: z.number().min(0).max(100),
  exams: z.array(z.string()).default([]),
  courses: z.array(z.string()).default([]),
  level: z.enum(['UG', 'PG', 'both']).default('both'),
});

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access only' }, { status: 403 });
    }

    const colleges = await AdminService.getColleges();
    return NextResponse.json({ success: true, colleges });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch colleges';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access only' }, { status: 403 });
    }

    const json = await request.json();
    const data = saveCollegeSchema.parse(json);

    const result = await AdminService.saveCollege(data);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const status = err instanceof z.ZodError ? 400 : 500;
    const message = err instanceof Error ? err.message : 'Failed to save college';
    return NextResponse.json({ error: message }, { status });
  }
}
