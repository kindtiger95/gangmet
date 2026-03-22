import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST() {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'dev only' }, { status: 403 });
  }

  await prisma.$transaction([
    prisma.payroll.deleteMany(),
    prisma.settlementReport.deleteMany(),
    prisma.schedule.deleteMany(),
    prisma.employee.deleteMany(),
    prisma.workplace.deleteMany(),
  ]);

  return NextResponse.json({ ok: true });
}
