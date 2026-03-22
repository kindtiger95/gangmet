import { prisma } from '@/lib/prisma';
import { PayType } from '@prisma/client';

export interface CreatePayrollInput {
  employeeId: number;
  workplaceId: number;
  year: number;
  month: number;
  payTypeSnapshot: PayType;
  hourlyRateSnapshot: number;
  requiredHoursSnapshot?: number | null;
  monthlySalarySnapshot?: number | null;
  totalWorkHours: number;
  weeklyHolidayPay: number;
  basePay: number;
  previousSnapshotAdjustment: number;
  totalPay: number;
}

export const payrollRepo = {
  findByPeriod: (params: { workplaceId?: number; year?: number; month?: number }) =>
    prisma.payroll.findMany({
      where: {
        ...(params.workplaceId !== undefined ? { workplaceId: params.workplaceId } : {}),
        ...(params.year !== undefined ? { year: params.year } : {}),
        ...(params.month !== undefined ? { month: params.month } : {}),
      },
      orderBy: [{ year: 'desc' }, { month: 'desc' }, { employeeId: 'asc' }],
    }),

  findConfirmed: (workplaceId: number, year: number, month: number) =>
    prisma.payroll.findFirst({ where: { workplaceId, year, month, status: 'CONFIRMED' } }),

  upsertConfirmed: (data: CreatePayrollInput) =>
    prisma.payroll.upsert({
      where: { employeeId_year_month: { employeeId: data.employeeId, year: data.year, month: data.month } },
      update: { ...data, status: 'CONFIRMED' },
      create: { ...data, status: 'CONFIRMED' },
    }),
};
