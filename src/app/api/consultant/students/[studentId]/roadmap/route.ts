import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUser } from '@/server/auth/session';
import { ConsultantService } from '@/server/consultants/service';

const saveRoadmapSchema = z.object({
  planType: z.enum(['primary', 'backup']).default('primary'),
  publish: z.boolean().default(false),
  milestones: z.array(
    z.object({
      id: z.string().optional(),
      type: z.enum(['exam', 'apply', 'prep', 'documents', 'decide']),
      title: z.string().min(1, 'Milestone title is required'),
      description: z.string().optional(),
      deadline: z.string().min(1, 'Target deadline is required'),
      status: z.enum(['pending', 'in_progress', 'completed']).default('pending'),
    })
  ),
});

export async function POST(
  request: Request,
  props: { params: Promise<{ studentId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'consultant' && user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Consultant access only' }, { status: 403 });
    }

    const { studentId } = await props.params;
    const json = await request.json();
    const parsed = saveRoadmapSchema.parse(json);

    const result = await ConsultantService.saveAndPublishRoadmap(user.id, studentId, parsed);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const status =
      typeof err === 'object' && err !== null && 'status' in err && typeof (err as { status: unknown }).status === 'number'
        ? (err as { status: number }).status
        : err instanceof z.ZodError
          ? 400
          : 500;
    const message = err instanceof Error ? err.message : 'Invalid roadmap payload';
    return NextResponse.json({ error: message }, { status });
  }
}
