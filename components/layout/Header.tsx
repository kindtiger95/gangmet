'use client';

import { useEffect, useState } from 'react';
import { useAppContext } from '@/store/app-context';
import { Workplace } from '@/lib/types';
import AdminPanel from '@/components/admin/AdminPanel';
import styles from './Header.module.css';

export default function Header() {
  const { selectedWorkplaceId, setSelectedWorkplaceId, currentYear, currentMonth, navigateMonth, isAdminMode, toggleAdminMode } = useAppContext();
  const [workplaces, setWorkplaces] = useState<Workplace[]>([]);

  async function loadWorkplaces() {
    const data: Workplace[] = await fetch('/api/workplaces?active=true').then((r) => r.json());
    setWorkplaces(data);
    if (!selectedWorkplaceId && data.length > 0) setSelectedWorkplaceId(data[0].id);
  }

  useEffect(() => { loadWorkplaces(); }, []);
  useEffect(() => { if (!isAdminMode) loadWorkplaces(); }, [isAdminMode]);

  return (
    <>
      <header className={styles.header}>
        <div className={styles.logo}>
          <div className={styles.logoIcon}>강</div>
          <span className={styles.logoText}>강멧</span>
        </div>

        <div className={styles.divider} />

        <select
          className={styles.workplaceSelect}
          value={selectedWorkplaceId ?? ''}
          onChange={(e) => setSelectedWorkplaceId(e.target.value ? Number(e.target.value) : null)}
        >
          <option value="">사업장 선택</option>
          {workplaces.map((wp) => <option key={wp.id} value={wp.id}>{wp.name}</option>)}
        </select>

        <div className={styles.spacer} />

        <div className={styles.monthNav}>
          <button className={styles.monthNavBtn} onClick={() => navigateMonth(-1)}>‹</button>
          <span className={styles.monthLabel}>{currentYear}년 {currentMonth}월</span>
          <button className={styles.monthNavBtn} onClick={() => navigateMonth(1)}>›</button>
        </div>

        <button
          className={`${styles.adminBtn} ${isAdminMode ? styles.adminBtnActive : ''}`}
          onClick={toggleAdminMode}
        >
          ⚙ 관리자
        </button>
      </header>

      {isAdminMode && <AdminPanel onClose={toggleAdminMode} />}
    </>
  );
}
