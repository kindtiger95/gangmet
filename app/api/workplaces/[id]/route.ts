import { NextRequest } from 'next/server';
import { workplaceRepo } from '@/lib/repositories/workplace';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const existing = await workplaceRepo.findById(Number(id));
  if (!existing) return Response.json({ error: 'not found' }, { status: 404 });
  const row = await workplaceRepo.update(Number(id), {
    name: body.name?.trim(),
    isActive: body.is_active !== undefined ? Boolean(body.is_active) : undefined,
  });
  return Response.json(row);
}
