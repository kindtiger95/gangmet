'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './TabNav.module.css';

const tabs = [
  { label: '스케쥴', href: '/schedule' },
  { label: '직원', href: '/employees' },
  { label: '정산', href: '/settlement' },
];

export default function TabNav() {
  const pathname = usePathname();
  return (
    <nav className={styles.nav}>
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={`${styles.tab} ${pathname.startsWith(tab.href) ? styles.tabActive : ''}`}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
