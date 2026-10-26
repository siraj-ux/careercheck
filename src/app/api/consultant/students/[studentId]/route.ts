import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUser } from '@/server/auth/session';
import { ConsultantService } from '@/server/consultants/service';

const saveNoteSchema = z.object({
  noteId: z.string().optional(),
  visibility: z.enum(['private', 'shared']),
  body: z.string().min(1, 'Note content cannot be empty'),
});

const updateMatchSchema = z.object({
  matchId: z.string(),
  consultantStatus: z.enum(['accepted', 'edited', 'overridden']),
  consultantNotes: z.string().optional(),
  fitPercent: z.number().min(0).max(100).optional(),
  title: z.string().optional(),
  cluster: z.string().optional(),
});

function getErrStatusAndMsg(err: unknown, defaultMsg: string) {
  const status =
    typeof err === 'object' && err !== null && 'status' in err && typeof (err as { status: unknown }).status === 'number'
      ? (err as { status: number }).status
      : err instanceof z.ZodError
        ? 400
        : 500;
  const message = err instanceof Error ? err.message : defaultMsg;
  return { status, message };
}

export async function GET(
  _request: Request,
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
    const student360 = await ConsultantService.getStudent360(user.id, studentId);

    return NextResponse.json({ success: true, ...student360 });
  } catch (err: unknown) {
    const { status, message } = getErrStatusAndMsg(err, 'Internal server error');
    return NextResponse.json({ error: message }, { status });
  }
}

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
    const parsed = saveNoteSchema.parse(json);

    const result = await ConsultantService.saveNote(user.id, studentId, parsed);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const { status, message } = getErrStatusAndMsg(err, 'Invalid note payload');
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(
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
    const parsed = updateMatchSchema.parse(json);

    const result = await ConsultantService.updateCareerMatch(
      user.id,
      studentId,
      parsed.matchId,
      parsed
    );
    return NextResponse.json(result);
  } catch (err: unknown) {
    const { status, message } = getErrStatusAndMsg(err, 'Invalid match payload');
    return NextResponse.json({ error: message }, { status });
  }
}
