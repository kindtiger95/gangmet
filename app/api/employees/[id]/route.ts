import { NextRequest } from 'next/server';
import { employeeRepo } from '@/lib/repositories/employee';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const row = await employeeRepo.findById(Number(id));
  if (!row) return Response.json({ error: 'not found' }, { status: 404 });
  return Response.json(row);
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const existing = await employeeRepo.findById(Number(id));
  if (!existing) return Response.json({ error: 'not found' }, { status: 404 });
  const row = await employeeRepo.update(Number(id), {
    name: body.name,
    phone: body.phone,
    position: body.position,
    payType: body.pay_type,
    hourlyRate: body.hourly_rate !== undefined ? (body.hourly_rate ? Number(body.hourly_rate) : null) : undefined,
    requiredHours: body.required_hours !== undefined ? (body.required_hours ? Number(body.required_hours) : null) : undefined,
    monthlySalary: body.monthly_salary !== undefined ? (body.monthly_salary ? Number(body.monthly_salary) : null) : undefined,
    bankName: body.bank_name,
    accountNumber: body.account_number,
    hireDate: body.hire_date,
    isActive: body.is_active !== undefined ? Boolean(body.is_active) : undefined,
  });
  return Response.json(row);
}
