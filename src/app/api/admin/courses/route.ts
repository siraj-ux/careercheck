import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUser } from '@/server/auth/session';
import { AdminService } from '@/server/admin/service';

const saveCourseSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Course name required'),
  category: z.string().min(1, 'Category required'),
  level: z.enum(['UG', 'PG', 'both']).optional().default('UG'),
});

const deleteCourseSchema = z.object({
  courseId: z.string().min(1, 'Course ID required'),
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

    const courses = await AdminService.getCourses();
    return NextResponse.json({ success: true, courses });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch courses';
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
    const data = saveCourseSchema.parse(json);

    const result = await AdminService.saveCourse(data);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const status = err instanceof z.ZodError ? 400 : 500;
    const message = err instanceof Error ? err.message : 'Failed to save course';
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PUT(request: Request) {
  return POST(request);
}

export async function DELETE(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access only' }, { status: 403 });
    }

    const json = await request.json();
    const { courseId } = deleteCourseSchema.parse(json);

    const result = await AdminService.deleteCourse(user.id, courseId);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const status = err instanceof z.ZodError ? 400 : 500;
    const message = err instanceof Error ? err.message : 'Failed to delete course';
    return NextResponse.json({ error: message }, { status });
  }
}

