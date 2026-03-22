import { Payroll, SettlementReport, Employee } from '@/lib/types';
import Badge from '@/components/ui/Badge';
import styles from './PayrollTable.module.css';

type Row = Payroll | SettlementReport;

const posLabel: Record<string, string> = { OWNER: '오너', MANAGER: '매니저', STAFF: '직원' };
const won = (n: number) => Math.round(n).toLocaleString('ko-KR');

function isPayroll(r: Row): r is Payroll { return 'status' in r; }

export default function PayrollRow({ row, employee, showStatus }: { row: Row; employee: Employee | undefined; showStatus?: boolean }) {
  const adj = row.previousSnapshotAdjustment;

  return (
    <tr>
      <td>{employee?.name ?? '-'}</td>
      <td>{employee ? posLabel[employee.position] : '-'}</td>
      <td>
        {row.payTypeSnapshot === 'HOURLY'
          ? `${row.hourlyRateSnapshot.toLocaleString('ko-KR')}원/h`
          : `월 ${(row.monthlySalarySnapshot ?? 0).toLocaleString('ko-KR')}원`}
      </td>
      <td className={`${styles.right} ${styles.num}`}>{row.totalWorkHours.toFixed(1)}h</td>
      <td className={`${styles.right} ${styles.num}`}>{won(row.weeklyHolidayPay)}</td>
      <td className={`${styles.right} ${styles.num} ${adj >= 0 ? styles.positive : styles.negative}`}>
        {adj >= 0 ? '+' : ''}{won(adj)}
      </td>
      <td className={`${styles.right} ${styles.num} ${styles.totalCell}`}>{won(row.totalPay)}원</td>
      {showStatus && isPayroll(row) && (
        <td>
          <Badge
            label={row.status === 'CONFIRMED' ? '확정' : 'DRAFT'}
            color={row.status === 'CONFIRMED' ? 'green' : 'gray'}
          />
        </td>
      )}
    </tr>
  );
}
