import { prisma } from '@/lib/prisma';
import { PayType } from '@prisma/client';

export interface CreateSettlementInput {
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

export const settlementRepo = {
  findByPeriod: (params: { workplaceId?: number; year?: number; month?: number }) =>
    prisma.settlementReport.findMany({
      where: {
        ...(params.workplaceId !== undefined ? { workplaceId: params.workplaceId } : {}),
        ...(params.year !== undefined ? { year: params.year } : {}),
        ...(params.month !== undefined ? { month: params.month } : {}),
      },
      orderBy: [{ year: 'desc' }, { month: 'desc' }, { employeeId: 'asc' }],
    }),

  upsert: (data: CreateSettlementInput) =>
    prisma.settlementReport.upsert({
      where: { employeeId_year_month: { employeeId: data.employeeId, year: data.year, month: data.month } },
      update: data,
      create: data,
    }),

  deleteByPeriod: (workplaceId: number, year: number, month: number) =>
    prisma.settlementReport.deleteMany({ where: { workplaceId, year, month } }),
};
