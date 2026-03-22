'use client';

import { useMemo } from 'react';
import { Schedule, Employee } from '@/lib/types';
import styles from './CalendarDay.module.css';

interface Props {
  date: Date;
  schedules: Schedule[];
  employees: Employee[];
  isCurrentMonth: boolean;
  onClick: () => void;
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function formatSummary(schedules: Schedule[]): string {
  const fmt = (s: Schedule) =>
    `${s.fromDatetime.split(' ')[1]}~${s.toDatetime.split(' ')[1]}`;
  const sort = (list: Schedule[]) =>
    [...list].sort((a, b) => a.fromDatetime.localeCompare(b.fromDatetime));

  const work = sort(schedules.filter(s => s.type === 'WORK')).map(fmt);
  const brk  = sort(schedules.filter(s => s.type === 'BREAK')).map(fmt);

  const parts: string[] = [];
  if (work.length) parts.push(`근무 ${work.join(', ')}`);
  if (brk.length)  parts.push(`휴게 ${brk.join(', ')}`);
  return parts.join(' / ');
}

export function MiniTimeBar({ schedules }: { schedules: Schedule[] }) {
  return (
    <div className={styles.miniBar}>
      {schedules.map((s) => {
        const from = timeToMinutes(s.fromDatetime.split(' ')[1] ?? '00:00');
        const to = timeToMinutes(s.toDatetime.split(' ')[1] ?? '00:00');
        const left = (from / 1440) * 100;
        const width = Math.max(((to - from) / 1440) * 100, 1);
        return (
          <div
            key={s.id}
            className={`${styles.miniBarSeg} ${s.type === 'WORK' ? styles.miniBarWork : styles.miniBarBreak}`}
            style={{ left: `${left}%`, width: `${width}%` }}
          />
        );
      })}
    </div>
  );
}

export default function CalendarDay({ date, schedules, employees, isCurrentMonth, onClick }: Props) {
  const dow = date.getDay(); // 0=일, 6=토
  const isWeekend = dow === 0 || dow === 6;
  const today = new Date();
  const isToday =
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate();

  const empMap = new Map(employees.map((e) => [e.id, e]));

  const grouped = useMemo(() => {
    const map = new Map<number, Schedule[]>();
    for (const s of schedules) {
      if (!map.has(s.employeeId)) map.set(s.employeeId, []);
      map.get(s.employeeId)!.push(s);
    }
    return Array.from(map.entries()).map(([empId, ss]) => ({
      empId,
      name: empMap.get(empId)?.name ?? '',
      schedules: ss,
    }));
  }, [schedules]);

  const MAX = 3;

  return (
    <div
      onClick={onClick}
      className={`${styles.cell} ${!isCurrentMonth ? styles.cellOtherMonth : ''}`}
    >
      <div className={`${styles.dateNum} ${isToday ? styles.today : isWeekend ? styles.weekend : ''}`}>
        {date.getDate()}
      </div>
      <div className={styles.chips}>
        {grouped.slice(0, MAX).map(({ empId, name, schedules: ss }) => (
          <div key={empId} className={styles.empRow}>
            <span className={styles.empName}>{name}</span>
            <MiniTimeBar schedules={ss} />
            <span className={styles.empSummary}>{formatSummary(ss)}</span>
          </div>
        ))}
        {grouped.length > MAX && <span className={styles.more}>+{grouped.length - MAX}명 더</span>}
      </div>
    </div>
  );
}
