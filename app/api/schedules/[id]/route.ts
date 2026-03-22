import { NextRequest } from 'next/server';
import { scheduleRepo } from '@/lib/repositories/schedule';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const existing = await scheduleRepo.findById(Number(id));
  if (!existing) return Response.json({ error: 'not found' }, { status: 404 });
  if (existing.status !== 'PENDING') return Response.json({ error: 'only PENDING schedules can be modified' }, { status: 403 });
  const body = await request.json();
  const row = await scheduleRepo.update(Number(id), {
    type: body.type,
    fromDatetime: body.from_datetime,
    toDatetime: body.to_datetime,
    dayType: body.day_type,
    note: body.note,
  });
  return Response.json(row);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const existing = await scheduleRepo.findById(Number(id));
  if (!existing) return Response.json({ error: 'not found' }, { status: 404 });
  if (existing.status !== 'PENDING') return Response.json({ error: 'only PENDING schedules can be deleted' }, { status: 403 });
  await scheduleRepo.delete(Number(id));
  return new Response(null, { status: 204 });
}
