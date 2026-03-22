import { NextRequest } from 'next/server';
import { settlementRepo } from '@/lib/repositories/settlement';

export async function GET(request: NextRequest) {
  const p = request.nextUrl.searchParams;
  const rows = await settlementRepo.findByPeriod({
    workplaceId: p.get('workplace_id') ? Number(p.get('workplace_id')) : undefined,
    year: p.get('year') ? Number(p.get('year')) : undefined,
    month: p.get('month') ? Number(p.get('month')) : undefined,
  });
  return Response.json(rows);
}
