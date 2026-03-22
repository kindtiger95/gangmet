'use client';

import { useMemo, useState } from 'react';
import { Schedule, Employee } from '@/lib/types';
import CalendarDay, { MiniTimeBar } from './CalendarDay';
import ScheduleChip from './ScheduleChip';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import ScheduleRegisterModal from './ScheduleRegisterModal';
import styles from './CalendarGrid.module.css';

interface Props {
  year: number;
  month: number;
  schedules: Schedule[];
  employees: Employee[];
  workplaceId: number;
  onScheduleDeleted: () => void;
  onScheduleAdded: () => void;
}

const DAY_NAMES = ['월', '화', '수', '목', '금', '토', '일'];

export default function CalendarGrid({ year, month, schedules, employees, workplaceId, onScheduleDeleted, onScheduleAdded }: Props) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showRegister, setShowRegister] = useState(false);
  const [editEmployee, setEditEmployee] = useState<Employee | null>(null);
  const [editSchedules, setEditSchedules] = useState<Schedule[]>([]);

  function openEdit(emp: Employee, schedules: Schedule[]) {
    setEditEmployee(emp);
    setEditSchedules(schedules);
    setShowRegister(true);
  }

  function closeRegister() {
    setShowRegister(false);
    setEditEmployee(null);
    setEditSchedules([]);
  }
  const empMap = new Map(employees.map((e) => [e.id, e]));

  const days = useMemo(() => {
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const cells: Date[] = [];
    // 월요일 시작: 0(일)→6, 1(월)→0, ..., 6(토)→5
    const startDow = (firstDay.getDay() + 6) % 7;
    for (let i = startDow - 1; i >= 0; i--) {
      const d = new Date(firstDay);
      d.setDate(d.getDate() - (i + 1));
      cells.push(d);
    }
    for (let d = 1; d <= lastDay.getDate(); d++) cells.push(new Date(year, month - 1, d));
    while (cells.length % 7 !== 0) {
      const last = cells[cells.length - 1];
      const d = new Date(last);
      d.setDate(d.getDate() + 1);
      cells.push(d);
    }
    return cells;
  }, [year, month]);

  function toDateKey(d: Date) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  const scheduleByDate = useMemo(() => {
    const map = new Map<string, Schedule[]>();
    for (const s of schedules) {
      const key = s.fromDatetime.split(' ')[0];
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    }
    return map;
  }, [schedules]);

  const selectedSchedules = selectedDate ? (scheduleByDate.get(selectedDate) ?? []) : [];

  // 직원별 그루핑
  const selectedByEmployee = useMemo(() => {
    const map = new Map<number, Schedule[]>();
    for (const s of selectedSchedules) {
      if (!map.has(s.employeeId)) map.set(s.employeeId, []);
      map.get(s.employeeId)!.push(s);
    }
    return Array.from(map.entries()).sort(([aId], [bId]) => {
      const aName = empMap.get(aId)?.name ?? '';
      const bName = empMap.get(bId)?.name ?? '';
      return aName.localeCompare(bName, 'ko');
    });
  }, [selectedSchedules]);

  async function deleteSchedule(id: number) {
    const res = await fetch(`/api/schedules/${id}`, { method: 'DELETE' });
    if (res.ok) { onScheduleDeleted(); if (selectedSchedules.length === 1) setSelectedDate(null); }
    else if (res.status === 403) alert('확정/스냅샷 스케쥴은 삭제할 수 없습니다.');
  }

  return (
    <>
      <div className={styles.calendar}>
        <div className={styles.dayHeaders}>
          {DAY_NAMES.map((n) => <div key={n} className={styles.dayHeader}>{n}</div>)}
        </div>
        <div className={styles.grid}>
          {days.map((d, i) => {
            const key = toDateKey(d);
            return (
              <CalendarDay
                key={i}
                date={d}
                schedules={scheduleByDate.get(key) ?? []}
                employees={employees}
                isCurrentMonth={d.getMonth() === month - 1}
                onClick={() => setSelectedDate(key)}
              />
            );
          })}
        </div>
      </div>

      <Modal open={!!selectedDate} onClose={() => setSelectedDate(null)} title={selectedDate ? `${selectedDate} 스케쥴` : ''}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
          <Button size="sm" onClick={() => setShowRegister(true)}>+ 스케쥴 등록</Button>
        </div>
        {selectedByEmployee.length === 0 ? (
          <p className={styles.empty}>스케쥴이 없습니다.</p>
        ) : (
          <div className={styles.detailList}>
            {selectedByEmployee.map(([empId, empSchedules]) => (
              <div key={empId} className={styles.detailItem}>
                <div className={styles.detailHeader}>
                  <span className={styles.detailEmpName}>{empMap.get(empId)?.name ?? ''}</span>
                  {empSchedules.some((s) => s.status === 'PENDING') && (
                    <Button size="sm" variant="secondary" onClick={() => openEdit(empMap.get(empId)!, empSchedules)}>수정</Button>
                  )}
                </div>
                <MiniTimeBar schedules={empSchedules} />
                <div className={styles.detailChips}>
                  {empSchedules.map((s) => (
                    <div key={s.id} className={styles.detailChipRow}>
                      <ScheduleChip schedule={s} />
                      {s.note && <span className={styles.detailNote}>({s.note})</span>}
                      {s.status === 'PENDING' && (
                        <Button variant="danger" size="sm" onClick={() => deleteSchedule(s.id)}>삭제</Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>

      {selectedDate && (
        <ScheduleRegisterModal
          open={showRegister}
          onClose={closeRegister}
          date={selectedDate}
          employees={employees.filter((e) => !selectedSchedules.some((s) => s.employeeId === e.id))}
          workplaceId={workplaceId}
          onSaved={() => { closeRegister(); onScheduleAdded(); }}
          editEmployee={editEmployee ?? undefined}
          initialSchedules={editSchedules.length > 0 ? editSchedules : undefined}
        />
      )}
    </>
  );
}
