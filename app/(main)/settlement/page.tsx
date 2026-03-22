'use client';

import { useEffect, useState } from 'react';
import { useAppContext } from '@/store/app-context';
import { Employee, Payroll, SettlementReport } from '@/lib/types';
import PayrollTable from '@/components/settlement/PayrollTable';

type SubTab = 'payrolls' | 'settlement';

export default function SettlementPage() {
  const { selectedWorkplaceId, currentYear, currentMonth } = useAppContext();
  const [subTab, setSubTab] = useState<SubTab>('payrolls');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [settlements, setSettlements] = useState<SettlementReport[]>([]);

  useEffect(() => { if (selectedWorkplaceId) loadData(); }, [selectedWorkplaceId, currentYear, currentMonth]);

  async function loadData() {
    const [emps, pr, sr] = await Promise.all([
      fetch(`/api/employees?workplace_id=${selectedWorkplaceId}`).then((r) => r.json()),
      fetch(`/api/payrolls?workplace_id=${selectedWorkplaceId}&year=${currentYear}&month=${currentMonth}`).then((r) => r.json()),
      fetch(`/api/settlement-reports?workplace_id=${selectedWorkplaceId}&year=${currentYear}&month=${currentMonth}`).then((r) => r.json()),
    ]);
    setEmployees(emps);
    setPayrolls(pr);
    setSettlements(sr);
  }

  if (!selectedWorkplaceId) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: 'var(--color-text-subtle)', fontSize: 14 }}>상단에서 사업장을 선택해주세요.</div>;
  }

  const rows = subTab === 'payrolls' ? payrolls : settlements;
  const totalPay = rows.reduce((sum, r) => sum + r.totalPay, 0);

  const tabStyle = (key: SubTab) => ({
    padding: '0 14px',
    height: 36,
    display: 'flex' as const,
    alignItems: 'center' as const,
    fontSize: 13,
    fontWeight: subTab === key ? 600 : 400,
    color: subTab === key ? 'var(--color-primary)' : 'var(--color-text-muted)',
    borderBottom: `2px solid ${subTab === key ? 'var(--color-primary)' : 'transparent'}`,
    cursor: 'pointer' as const,
    background: 'none',
    border: 'none',
    borderBottomStyle: 'solid' as const,
    borderBottomWidth: 2,
    borderBottomColor: subTab === key ? 'var(--color-primary)' : 'transparent',
    transition: 'color 0.15s, border-color 0.15s',
    fontFamily: 'inherit',
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)', margin: 0, flex: 1, letterSpacing: '-0.02em' }}>
          {currentYear}년 {currentMonth}월 정산
        </h2>
        {totalPay > 0 && (
          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-primary-text)', fontVariantNumeric: 'tabular-nums' }}>
            합계: {Math.round(totalPay).toLocaleString('ko-KR')}원
          </span>
        )}
      </div>

      <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', padding: '0 4px' }}>
          <button style={tabStyle('payrolls')} onClick={() => setSubTab('payrolls')}>급여내역</button>
          <button style={tabStyle('settlement')} onClick={() => setSubTab('settlement')}>정산내역</button>
        </div>
        <PayrollTable rows={rows} employees={employees} showStatus={subTab === 'payrolls'} />
      </div>
    </div>
  );
}
