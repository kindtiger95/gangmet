import { Payroll, SettlementReport, Employee } from '@/lib/types';
import PayrollRow from './PayrollRow';
import styles from './PayrollTable.module.css';

type Row = Payroll | SettlementReport;

interface Props { rows: Row[]; employees: Employee[]; showStatus?: boolean; }

export default function PayrollTable({ rows, employees, showStatus }: Props) {
  const empMap = new Map(employees.map((e) => [e.id, e]));
  if (rows.length === 0) return <p className={styles.empty}>데이터가 없습니다.</p>;

  return (
    <div className={styles.wrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>이름</th>
            <th>직급</th>
            <th>급여 기준</th>
            <th className={styles.right}>근무시간</th>
            <th className={styles.right}>주휴수당</th>
            <th className={styles.right}>전달조정</th>
            <th className={styles.right}>합계</th>
            {showStatus && <th>상태</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <PayrollRow key={row.id} row={row} employee={empMap.get(row.employeeId)} showStatus={showStatus} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
