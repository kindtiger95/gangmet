import { NextRequest } from 'next/server';
import { settingsRepo } from '@/lib/repositories/settings';

export async function GET() {
  const rows = await settingsRepo.getAll();
  return Response.json(Object.fromEntries(rows.map((r) => [r.key, r.value])));
}

export async function PATCH(request: NextRequest) {
  const body = await request.json();
  if (body.default_hourly_rate !== undefined) {
    await settingsRepo.set('default_hourly_rate', String(body.default_hourly_rate));
  }
  const rows = await settingsRepo.getAll();
  return Response.json(Object.fromEntries(rows.map((r) => [r.key, r.value])));
}
