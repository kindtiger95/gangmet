import styles from './Badge.module.css';

type Color = 'gray' | 'blue' | 'green' | 'yellow' | 'red' | 'purple';

export default function Badge({ label, color = 'gray' }: { label: string; color?: Color }) {
  return <span className={`${styles.badge} ${styles[color]}`}>{label}</span>;
}
