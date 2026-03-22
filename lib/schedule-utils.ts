import { DayType } from '@prisma/client';

export function getWeekBounds(date: Date): { start: Date; end: Date } {
  const d = new Date(date);
  const day = d.getDay();
  const diffToMon = day === 0 ? -6 : 1 - day;
  const mon = new Date(d);
  mon.setDate(d.getDate() + diffToMon);
  mon.setHours(0, 0, 0, 0);
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  sun.setHours(23, 59, 59, 999);
  return { start: mon, end: sun };
}

export function getWeeksInMonth(year: number, month: number): Array<{ start: Date; end: Date }> {
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  const weeks: Array<{ start: Date; end: Date }> = [];
  const seen = new Set<string>();
  let current = new Date(firstDay);
  while (current <= lastDay) {
    const bounds = getWeekBounds(current);
    const key = bounds.start.toISOString();
    if (!seen.has(key)) {
      seen.add(key);
      weeks.push(bounds);
    }
    current.setDate(current.getDate() + 7);
  }
  return weeks;
}

export function calcDayType(dateStr: string): DayType {
  const d = new Date(dateStr + 'T00:00:00');
  const dow = d.getDay();
  return dow === 0 || dow === 6 ? 'WEEKEND' : 'WEEKDAY';
}

export function parseDateTime(dt: string): Date {
  const [datePart, timePart] = dt.split(' ');
  return new Date(`${datePart}T${timePart}:00`);
}

export function diffHours(from: string, to: string): number {
  return (parseDateTime(to).getTime() - parseDateTime(from).getTime()) / (1000 * 60 * 60);
}

export function lastDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

export function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function prevMonth(year: number, month: number): { year: number; month: number } {
  return month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 };
}
