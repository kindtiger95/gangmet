'use client';

import { Schedule } from '@/lib/types';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import styles from './ScheduleTable.module.css';

const statusBadge: Record<string, { label: string; color: 'gray' | 'green' | 'purple' }> = {
  PENDING:   { label: 'PENDING',  color: 'gray'   },
  CONFIRMED: { label: '확정',     color: 'green'  },
  SNAPSHOT:  { label: '스냅샷',   color: 'purple' },
};

interface Props { schedules: Schedule[]; onDelete: (id: number) => void; }

export default function ScheduleTable({ schedules, onDelete }: Props) {
  if (schedules.length === 0) return <p className={styles.empty}>스케쥴이 없습니다.</p>;

  return (
    <div className={styles.wrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>날짜</th>
            <th>유형</th>
            <th>시간</th>
            <th>상태</th>
            <th>메모</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {schedules.map((s) => {
            const b = statusBadge[s.status];
            const date = s.fromDatetime.split(' ')[0];
            const fromTime = s.fromDatetime.split(' ')[1];
            const toTime = s.toDatetime.split(' ')[1];
            return (
              <tr key={s.id}>
                <td>{date}</td>
                <td>{s.type === 'WORK' ? '근무' : '휴게'}</td>
                <td className={styles.time}>{fromTime} ~ {toTime}</td>
                <td><Badge label={b.label} color={b.color} /></td>
                <td className={styles.note}>{s.note ?? ''}</td>
                <td>
                  {s.status === 'PENDING' && (
                    <Button variant="danger" size="sm" onClick={() => onDelete(s.id)}>삭제</Button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
