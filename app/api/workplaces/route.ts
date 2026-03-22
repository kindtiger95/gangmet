import { NextRequest } from 'next/server';
import { workplaceRepo } from '@/lib/repositories/workplace';

export async function GET(request: NextRequest) {
  const active = request.nextUrl.searchParams.get('active');
  const rows = await workplaceRepo.findAll(active === 'true' ? true : active === 'false' ? false : undefined);
  return Response.json(rows);
}

export async function POST(request: NextRequest) {
  const { name } = await request.json();
  if (!name?.trim()) return Response.json({ error: 'name is required' }, { status: 400 });
  const row = await workplaceRepo.create(name.trim());
  return Response.json(row, { status: 201 });
}
