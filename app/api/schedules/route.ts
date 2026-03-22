import { NextRequest } from 'next/server';
import { scheduleRepo } from '@/lib/repositories/schedule';
import { prisma } from '@/lib/prisma';
import { calcDayType } from '@/lib/schedule-utils';
import { DayType, ScheduleType } from '@prisma/client';

export async function GET(request: NextRequest) {
  const p = request.nextUrl.searchParams;
  const year = p.get('year');
  const month = p.get('month');
  if (!year || !month) return Response.json({ error: 'year and month are required' }, { status: 400 });
  const rows = await scheduleRepo.findByMonth({
    workplaceId: p.get('workplace_id') ? Number(p.get('workplace_id')) : undefined,
    employeeId: p.get('employee_id') ? Number(p.get('employee_id')) : undefined,
    year: Number(year),
    month: Number(month),
  });
  return Response.json(rows);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  for (const f of ['employee_id', 'workplace_id', 'type', 'from_datetime', 'to_datetime']) {
    if (!body[f]) return Response.json({ error: `${f} is required` }, { status: 400 });
  }
  const overlap = await prisma.schedule.findFirst({
    where: {
      employeeId: Number(body.employee_id),
      fromDatetime: { lt: body.to_datetime },
      toDatetime: { gt: body.from_datetime },
      status: { not: 'SNAPSHOT' },
    },
  });
  if (overlap) {
    return Response.json({ error: '해당 시간에 이미 등록된 스케쥴이 있습니다.' }, { status: 409 });
  }

  const row = await scheduleRepo.create({
    employeeId: Number(body.employee_id),
    workplaceId: Number(body.workplace_id),
    type: body.type as ScheduleType,
    fromDatetime: body.from_datetime,
    toDatetime: body.to_datetime,
    dayType: (body.day_type ?? calcDayType(body.from_datetime.split(' ')[0])) as DayType,
    note: body.note ?? null,
  });
  return Response.json(row, { status: 201 });
}
