'use client';

import { useEffect, useState } from 'react';
import { useAppContext } from '@/store/app-context';
import { Employee, Schedule } from '@/lib/types';
import EmployeeSelector from '@/components/employees/EmployeeSelector';
import ScheduleTable from '@/components/employees/ScheduleTable';
import SalarySummary from '@/components/employees/SalarySummary';
import AddScheduleModal from '@/components/employees/AddScheduleModal';
import Button from '@/components/ui/Button';

export default function EmployeesPage() {
  const { selectedWorkplaceId, currentYear, currentMonth, isAdminMode } = useAppContext();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmpId, setSelectedEmpId] = useState<number | null>(null);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [defaultRate, setDefaultRate] = useState(10030);
  const [showAdd, setShowAdd] = useState(false);

  async function loadEmployees() {
    if (!selectedWorkplaceId) return;
    const [emps, settings] = await Promise.all([
      fetch(`/api/employees?workplace_id=${selectedWorkplaceId}&active=true`).then((r) => r.json()),
      fetch('/api/settings').then((r) => r.json()),
    ]);
    setEmployees(emps);
    setDefaultRate(Number(settings.default_hourly_rate ?? 10030));
  }

  useEffect(() => { loadEmployees(); }, [selectedWorkplaceId]);
  useEffect(() => { if (!isAdminMode) loadEmployees(); }, [isAdminMode]);

  useEffect(() => {
    if (!selectedEmpId) { setSchedules([]); return; }
    loadSchedules();
  }, [selectedEmpId, currentYear, currentMonth]);

  async function loadSchedules() {
    const data = await fetch(`/api/schedules?employee_id=${selectedEmpId}&year=${currentYear}&month=${currentMonth}`).then((r) => r.json());
    setSchedules(data);
  }

  async function deleteSchedule(id: number) {
    const res = await fetch(`/api/schedules/${id}`, { method: 'DELETE' });
    if (res.ok) loadSchedules();
    else if (res.status === 403) alert('확정/스냅샷 스케쥴은 삭제할 수 없습니다.');
  }

  const selectedEmployee = employees.find((e) => e.id === selectedEmpId) ?? null;

  if (!selectedWorkplaceId) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: 'var(--color-text-subtle)', fontSize: 14 }}>상단에서 사업장을 선택해주세요.</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <EmployeeSelector employees={employees} selectedId={selectedEmpId} onChange={setSelectedEmpId} />
        {selectedEmployee && <Button size="sm" onClick={() => setShowAdd(true)}>+ 스케쥴 추가</Button>}
      </div>

      {selectedEmployee ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 16, alignItems: 'start' }}>
          <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)' }}>{currentYear}년 {currentMonth}월 스케쥴</span>
              <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{schedules.length}건</span>
            </div>
            <ScheduleTable schedules={schedules} onDelete={deleteSchedule} />
          </div>
          <SalarySummary
            employee={selectedEmployee}
            schedules={schedules.filter((s) => s.status !== 'SNAPSHOT')}
            year={currentYear}
            month={currentMonth}
            defaultHourlyRate={defaultRate}
          />
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: 'var(--color-text-subtle)', fontSize: 13 }}>
          직원을 선택해주세요.
        </div>
      )}

      {selectedEmployee && (
        <AddScheduleModal open={showAdd} onClose={() => setShowAdd(false)} employee={selectedEmployee} workplaceId={selectedWorkplaceId} onSaved={loadSchedules} />
      )}
    </div>
  );
}
