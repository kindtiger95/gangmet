import { Employee, Schedule } from '@prisma/client';
import { getWeeksInMonth, diffHours, parseDateTime } from './schedule-utils';

export interface PayrollCalcResult {
  totalWorkHours: number;
  weeklyHolidayPay: number;
  basePay: number;
  totalPay: number;
}

function calcNetHours(schedules: Schedule[], fromDate?: Date, toDate?: Date): number {
  let work = 0;
  let rest = 0;
  for (const s of schedules) {
    let from = parseDateTime(s.fromDatetime);
    let to = parseDateTime(s.toDatetime);
    if (fromDate && from < fromDate) from = fromDate;
    if (toDate && to > toDate) to = toDate;
    if (from >= to) continue;
    const h = (to.getTime() - from.getTime()) / (1000 * 60 * 60);
    if (s.type === 'WORK') work += h;
    else rest += h;
  }
  return work - rest;
}

export function calcWeeklyHolidayPay(
  schedules: Schedule[],
  year: number,
  month: number,
  hourlyRate: number,
): number {
  const weeks = getWeeksInMonth(year, month);
  const monthStart = new Date(year, month - 1, 1);
  monthStart.setHours(0, 0, 0, 0);
  const monthEnd = new Date(year, month, 0);
  monthEnd.setHours(23, 59, 59, 999);

  let total = 0;
  for (const week of weeks) {
    const clipStart = week.start < monthStart ? monthStart : week.start;
    const clipEnd = week.end > monthEnd ? monthEnd : week.end;
    const net = calcNetHours(schedules, clipStart, clipEnd);
    if (net < 15) continue;
    total += net >= 40 ? 8 * hourlyRate : (net / 40) * 8 * hourlyRate;
  }
  return total;
}

export function calcPayroll(
  employee: Employee,
  schedules: Schedule[],
  year: number,
  month: number,
  hourlyRate: number,
): PayrollCalcResult {
  const workHours = schedules
    .filter((s) => s.type === 'WORK')
    .reduce((sum, s) => sum + diffHours(s.fromDatetime, s.toDatetime), 0);
  const breakHours = schedules
    .filter((s) => s.type === 'BREAK')
    .reduce((sum, s) => sum + diffHours(s.fromDatetime, s.toDatetime), 0);
  const netWorkHours = workHours - breakHours;

  const weeklyHolidayPay = calcWeeklyHolidayPay(schedules, year, month, hourlyRate);

  let basePay: number;
  if (employee.payType === 'HOURLY') {
    basePay = netWorkHours * hourlyRate;
  } else {
    const salary = employee.monthlySalary ?? 0;
    const required = employee.requiredHours ?? 0;
    const diff = netWorkHours - required;
    basePay = diff < 0 ? salary - Math.abs(diff) * hourlyRate : salary + diff * hourlyRate;
  }

  return {
    totalWorkHours: netWorkHours,
    weeklyHolidayPay,
    basePay,
    totalPay: basePay + weeklyHolidayPay,
  };
}

export function calcPreviousSnapshotAdjustment(
  employee: Employee,
  snapshotSchedules: Schedule[],
  confirmedSchedules: Schedule[],
  prevYear: number,
  prevMonth: number,
  hourlyRate: number,
): number {
  const lastDay = new Date(prevYear, prevMonth, 0).getDate();
  const rangeStart = new Date(prevYear, prevMonth - 1, 21);
  rangeStart.setHours(0, 0, 0, 0);
  const rangeEnd = new Date(prevYear, prevMonth - 1, lastDay);
  rangeEnd.setHours(23, 59, 59, 999);

  const inRange = (schedules: Schedule[]) =>
    schedules.filter((s) => {
      const d = parseDateTime(s.fromDatetime);
      return d >= rangeStart && d <= rangeEnd;
    });

  const snapshotResult = calcPayroll(employee, inRange(snapshotSchedules), prevYear, prevMonth, hourlyRate);
  const confirmedResult = calcPayroll(employee, inRange(confirmedSchedules), prevYear, prevMonth, hourlyRate);
  return confirmedResult.totalPay - snapshotResult.totalPay;
}
