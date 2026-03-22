import { prisma } from '@/lib/prisma';
import { Employee, Schedule } from '@prisma/client';
import { calcPayroll, calcPreviousSnapshotAdjustment } from '@/lib/payroll-calculator';
import { settingsRepo } from '@/lib/repositories/settings';
import { monthRange } from '@/lib/repositories/schedule';
import { prevMonth } from '@/lib/schedule-utils';

export async function confirmMonth(workplaceId: number, year: number, month: number) {
  const existing = await prisma.payroll.findFirst({
    where: { workplaceId, year, month, status: 'CONFIRMED' },
  });
  if (existing) throw new Error('payrolls already confirmed for this month');

  const defaultRate = await settingsRepo.getDefaultHourlyRate();
  const range = monthRange(year, month);
  const { year: prevYear, month: prevMonth_ } = prevMonth(year, month);
  const prevRange = monthRange(prevYear, prevMonth_);

  return prisma.$transaction(async (tx) => {
    // PENDING → CONFIRMED
    await tx.schedule.updateMany({
      where: { workplaceId, status: 'PENDING', fromDatetime: range },
      data: { status: 'CONFIRMED' },
    });

    const confirmed = await tx.schedule.findMany({
      where: { workplaceId, status: 'CONFIRMED', fromDatetime: range },
    });

    const byEmployee = groupByEmployee(confirmed);
    const payrolls = [];

    for (const [employeeId, schedules] of byEmployee) {
      const employee = await tx.employee.findUniqueOrThrow({ where: { id: employeeId } });
      const hourlyRate = employee.hourlyRate ?? defaultRate;

      const result = calcPayroll(employee, schedules, year, month, hourlyRate);
      const adjustment = await calcAdjustment(tx, employee, employeeId, prevRange, prevYear, prevMonth_, hourlyRate);

      const payroll = await tx.payroll.upsert({
        where: { employeeId_year_month: { employeeId, year, month } },
        update: {
          payTypeSnapshot: employee.payType,
          hourlyRateSnapshot: hourlyRate,
          requiredHoursSnapshot: employee.requiredHours,
          monthlySalarySnapshot: employee.monthlySalary,
          totalWorkHours: result.totalWorkHours,
          weeklyHolidayPay: result.weeklyHolidayPay,
          basePay: result.basePay,
          previousSnapshotAdjustment: adjustment,
          totalPay: result.totalPay + adjustment,
          status: 'CONFIRMED',
        },
        create: {
          employeeId,
          workplaceId,
          year,
          month,
          payTypeSnapshot: employee.payType,
          hourlyRateSnapshot: hourlyRate,
          requiredHoursSnapshot: employee.requiredHours,
          monthlySalarySnapshot: employee.monthlySalary,
          totalWorkHours: result.totalWorkHours,
          weeklyHolidayPay: result.weeklyHolidayPay,
          basePay: result.basePay,
          previousSnapshotAdjustment: adjustment,
          totalPay: result.totalPay + adjustment,
          status: 'CONFIRMED',
        },
      });
      payrolls.push(payroll);
    }

    return { confirmed: payrolls.length, payrolls };
  });
}

async function calcAdjustment(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  employee: Employee,
  employeeId: number,
  prevRange: { gte: string; lt: string },
  prevYear: number,
  prevMonth: number,
  hourlyRate: number,
): Promise<number> {
  const [snapshots, confirmed] = await Promise.all([
    tx.schedule.findMany({ where: { employeeId, status: 'SNAPSHOT', fromDatetime: prevRange } }),
    tx.schedule.findMany({ where: { employeeId, status: 'CONFIRMED', fromDatetime: prevRange } }),
  ]);
  if (!snapshots.length && !confirmed.length) return 0;
  return calcPreviousSnapshotAdjustment(employee, snapshots, confirmed, prevYear, prevMonth, hourlyRate);
}

function groupByEmployee(schedules: Schedule[]): Map<number, Schedule[]> {
  const map = new Map<number, Schedule[]>();
  for (const s of schedules) {
    if (!map.has(s.employeeId)) map.set(s.employeeId, []);
    map.get(s.employeeId)!.push(s);
  }
  return map;
}
