import { prisma } from '@/lib/prisma';
import { Employee, Schedule } from '@prisma/client';
import { calcPayroll, calcPreviousSnapshotAdjustment } from '@/lib/payroll-calculator';
import { settingsRepo } from '@/lib/repositories/settings';
import { monthRange } from '@/lib/repositories/schedule';
import { prevMonth } from '@/lib/schedule-utils';

export async function createSnapshot(workplaceId: number, year: number, month: number) {
  const confirmed = await prisma.payroll.findFirst({
    where: { workplaceId, year, month, status: 'CONFIRMED' },
  });
  if (confirmed) throw new Error('payrolls already confirmed for this month');

  const defaultRate = await settingsRepo.getDefaultHourlyRate();
  const range = monthRange(year, month);
  const { year: prevYear, month: prevMonth_ } = prevMonth(year, month);
  const prevRange = monthRange(prevYear, prevMonth_);

  return prisma.$transaction(async (tx) => {
    const pending = await tx.schedule.findMany({
      where: { workplaceId, status: 'PENDING', fromDatetime: range },
    });
    if (pending.length === 0) return { created: 0, reports: [] };

    // Remove stale snapshot data
    await tx.schedule.deleteMany({ where: { workplaceId, status: 'SNAPSHOT', fromDatetime: range } });
    await tx.settlementReport.deleteMany({ where: { workplaceId, year, month } });

    // Clone as SNAPSHOT
    await tx.schedule.createMany({
      data: pending.map((s) => ({
        employeeId: s.employeeId,
        workplaceId: s.workplaceId,
        type: s.type,
        fromDatetime: s.fromDatetime,
        toDatetime: s.toDatetime,
        dayType: s.dayType,
        status: 'SNAPSHOT' as const,
        note: s.note,
      })),
    });

    // Group by employee
    const byEmployee = groupByEmployee(pending);
    const reports = [];

    for (const [employeeId, schedules] of byEmployee) {
      const employee = await tx.employee.findUniqueOrThrow({ where: { id: employeeId } });
      const hourlyRate = employee.hourlyRate ?? defaultRate;

      const result = calcPayroll(employee, schedules, year, month, hourlyRate);
      const adjustment = await calcAdjustment(tx, employee, employeeId, prevRange, prevYear, prevMonth_, hourlyRate);

      const report = await tx.settlementReport.create({
        data: {
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
        },
      });
      reports.push(report);
    }

    return { created: reports.length, reports };
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
