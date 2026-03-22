import { Employee, Schedule } from '@/lib/types';
import { calcPayroll } from '@/lib/payroll-calculator';
import styles from './SalarySummary.module.css';

interface Props { employee: Employee; schedules: Schedule[]; year: number; month: number; defaultHourlyRate: number; }

const won = (n: number) => Math.round(n).toLocaleString('ko-KR') + '원';

export default function SalarySummary({ employee, schedules, year, month, defaultHourlyRate }: Props) {
  const hourlyRate = employee.hourlyRate ?? defaultHourlyRate;
  const result = calcPayroll(employee, schedules, year, month, hourlyRate);

  return (
    <div className={styles.card}>
      <h3 className={styles.title}>{year}년 {month}월 급여 미리보기</h3>
      <div className={styles.rows}>
        <div className={styles.row}>
          <span className={styles.rowLabel}>총 근무시간</span>
          <span className={styles.rowValue}>{result.totalWorkHours.toFixed(1)}h</span>
        </div>
        <div className={styles.row}>
          <span className={styles.rowLabel}>기본급</span>
          <span className={styles.rowValue}>{won(result.basePay)}</span>
        </div>
        <div className={styles.row}>
          <span className={styles.rowLabel}>주휴수당</span>
          <span className={styles.rowValue}>{won(result.weeklyHolidayPay)}</span>
        </div>
        <div className={`${styles.row} ${styles.total}`}>
          <span className={styles.rowLabel}>예상 합계</span>
          <span className={styles.totalValue}>{won(result.totalPay)}</span>
        </div>
      </div>
      <p className={styles.meta}>
        적용 시급: {won(hourlyRate)}
        {employee.payType === 'MONTHLY' && employee.monthlySalary && (
          <> · 월급: {won(employee.monthlySalary)} · 소정: {employee.requiredHours}h</>
        )}
      </p>
    </div>
  );
}
