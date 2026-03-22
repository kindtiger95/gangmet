'use client';

import { Employee, Workplace } from '@/lib/types';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import styles from './AdminPanel.module.css';

const posLabel: Record<string, string> = { OWNER: '오너', MANAGER: '매니저', STAFF: '직원' };

interface Props { employees: Employee[]; workplaces: Workplace[]; onToggleActive: (emp: Employee) => void; }

export default function EmployeeList({ employees, workplaces, onToggleActive }: Props) {
  const wpMap = new Map(workplaces.map((wp) => [wp.id, wp.name]));
  if (employees.length === 0) return <p className={styles.emptyList}>직원이 없습니다.</p>;

  return (
    <div className={styles.list}>
      {employees.map((emp) => (
        <div key={emp.id} className={styles.listItem}>
          <div className={styles.listMain}>
            <div className={styles.listName}>
              {emp.name}
              <Badge label={posLabel[emp.position]} color="blue" />
              <Badge label={emp.payType === 'HOURLY' ? '시급' : '월급'} color="gray" />
              {!emp.isActive && <Badge label="퇴직" color="red" />}
            </div>
            <div className={styles.listSub}>{wpMap.get(emp.workplaceId) ?? '-'}{emp.phone ? ` · ${emp.phone}` : ''}</div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => onToggleActive(emp)}>
            {emp.isActive ? '퇴직' : '재고용'}
          </Button>
        </div>
      ))}
    </div>
  );
}
