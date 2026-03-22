import { Schedule } from '@/lib/types';
import styles from './ScheduleChip.module.css';

interface Props {
  schedule: Schedule;
  employeeName?: string;
}

const statusClass: Record<string, string> = {
  PENDING: styles.pending,
  CONFIRMED: styles.confirmed,
  SNAPSHOT: styles.snapshot,
};

export default function ScheduleChip({ schedule, employeeName }: Props) {
  const time = `${schedule.fromDatetime.split(' ')[1]}~${schedule.toDatetime.split(' ')[1]}`;
  return (
    <span className={`${styles.chip} ${statusClass[schedule.status]} ${schedule.type === 'BREAK' ? styles.breakType : ''}`}>
      {employeeName && <span className={styles.name}>{employeeName}</span>}
      {schedule.type === 'BREAK' ? '휴게 ' : ''}{time}
    </span>
  );
}
