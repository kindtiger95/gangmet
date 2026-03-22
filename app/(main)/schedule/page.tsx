'use client';

import { useEffect, useState } from 'react';
import { useAppContext } from '@/store/app-context';
import { Schedule, Employee, Payroll } from '@/lib/types';
import CalendarGrid from '@/components/schedule/CalendarGrid';
import SnapshotModal from '@/components/schedule/SnapshotModal';
import ConfirmMonthModal from '@/components/schedule/ConfirmMonthModal';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';

export default function SchedulePage() {
  const { selectedWorkplaceId, currentYear, currentMonth, isAdminMode } = useAppContext();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [showSnapshot, setShowSnapshot] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => { if (selectedWorkplaceId) loadData(); }, [selectedWorkplaceId, currentYear, currentMonth]);
  useEffect(() => { if (!isAdminMode && selectedWorkplaceId) loadData(); }, [isAdminMode]);

  async function loadData() {
    const [sched, emps, pr] = await Promise.all([
      fetch(`/api/schedules?workplace_id=${selectedWorkplaceId}&year=${currentYear}&month=${currentMonth}`).then((r) => r.json()),
      fetch(`/api/employees?workplace_id=${selectedWorkplaceId}&active=true`).then((r) => r.json()),
      fetch(`/api/payrolls?workplace_id=${selectedWorkplaceId}&year=${currentYear}&month=${currentMonth}`).then((r) => r.json()),
    ]);
    setSchedules(sched);
    setEmployees(emps);
    setPayrolls(pr);
  }

  const isConfirmed = payrolls.some((p) => p.status === 'CONFIRMED');

  if (!selectedWorkplaceId) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: 'var(--color-text-subtle)', fontSize: 14 }}>
        상단에서 사업장을 선택해주세요.
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)', margin: 0, flex: 1, letterSpacing: '-0.02em' }}>
          {currentYear}년 {currentMonth}월 스케쥴
        </h2>
        {isConfirmed && <Badge label="확정됨" color="green" />}
        <Button variant="secondary" size="sm" onClick={() => setShowSnapshot(true)}>
          📊 정산하기
        </Button>
        <Button variant={isConfirmed ? 'ghost' : 'primary'} size="sm" disabled={isConfirmed} onClick={() => setShowConfirm(true)}>
          {isConfirmed ? '✓ 확정됨' : '확정하기'}
        </Button>
      </div>

      <CalendarGrid year={currentYear} month={currentMonth} schedules={schedules} employees={employees} workplaceId={selectedWorkplaceId} onScheduleDeleted={loadData} onScheduleAdded={loadData} />

      <SnapshotModal open={showSnapshot} onClose={() => setShowSnapshot(false)} year={currentYear} month={currentMonth} workplaceId={selectedWorkplaceId} onDone={loadData} />
      <ConfirmMonthModal open={showConfirm} onClose={() => setShowConfirm(false)} year={currentYear} month={currentMonth} workplaceId={selectedWorkplaceId} onDone={loadData} />
    </div>
  );
}
