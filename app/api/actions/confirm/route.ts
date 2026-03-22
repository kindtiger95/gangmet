import { NextRequest } from 'next/server';
import { confirmMonth } from '@/lib/services/confirm.service';

export async function POST(request: NextRequest) {
  const { workplace_id, year, month } = await request.json();
  if (!workplace_id || !year || !month)
    return Response.json({ error: 'workplace_id, year, month are required' }, { status: 400 });
  try {
    const result = await confirmMonth(Number(workplace_id), Number(year), Number(month));
    return Response.json(result, { status: 201 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'unknown error';
    return Response.json({ error: msg }, { status: 409 });
  }
}
