'use client';

import { Employee } from '@/lib/types';

const posLabel: Record<string, string> = { OWNER: '오너', MANAGER: '매니저', STAFF: '직원' };

interface Props { employees: Employee[]; selectedId: number | null; onChange: (id: number | null) => void; }

export default function EmployeeSelector({ employees, selectedId, onChange }: Props) {
  return (
    <select
      style={{ width: 'auto', minWidth: 160 }}
      value={selectedId ?? ''}
      onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
    >
      <option value="">직원 선택</option>
      {employees.map((emp) => (
        <option key={emp.id} value={emp.id}>{emp.name} ({posLabel[emp.position]})</option>
      ))}
    </select>
  );
}
