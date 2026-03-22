import { NextRequest } from 'next/server';
import { employeeRepo } from '@/lib/repositories/employee';
import { prisma } from '@/lib/prisma';
import { Position, PayType } from '@prisma/client';

async function getDefaultHourlyRate(): Promise<number | null> {
  const setting = await prisma.systemSetting.findUnique({ where: { key: 'default_hourly_rate' } });
  return setting ? Number(setting.value) : null;
}

export async function GET(request: NextRequest) {
  const p = request.nextUrl.searchParams;
  const workplaceId = p.get('workplace_id');
  const active = p.get('active');
  const rows = await employeeRepo.findAll({
    workplaceId: workplaceId ? Number(workplaceId) : undefined,
    active: active === 'true' ? true : active === 'false' ? false : undefined,
  });
  return Response.json(rows);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  for (const f of ['workplace_id', 'name', 'position', 'pay_type']) {
    if (!body[f]) return Response.json({ error: `${f} is required` }, { status: 400 });
  }
  const hourlyRate = body.hourly_rate ? Number(body.hourly_rate) : await getDefaultHourlyRate();
  const row = await employeeRepo.create({
    workplaceId: Number(body.workplace_id),
    name: body.name.trim(),
    phone: body.phone || null,
    position: body.position as Position,
    payType: body.pay_type as PayType,
    hourlyRate,
    requiredHours: body.required_hours ? Number(body.required_hours) : null,
    monthlySalary: body.monthly_salary ? Number(body.monthly_salary) : null,
    bankName: body.bank_name || null,
    accountNumber: body.account_number || null,
    hireDate: body.hire_date || null,
  });
  return Response.json(row, { status: 201 });
}
