'use client';

import { useEffect, useState } from 'react';
import { Employee, Workplace } from '@/lib/types';
import Button from '@/components/ui/Button';
import EmployeeList from './EmployeeList';
import AddEmployeeModal from './AddEmployeeModal';
import styles from './AdminPanel.module.css';

interface Props { onClose: () => void; }

export default function AdminPanel({ onClose }: Props) {
  const [workplaces, setWorkplaces] = useState<Workplace[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [showAddEmp, setShowAddEmp] = useState(false);
  const [newWpName, setNewWpName] = useState('');
  const [defaultRate, setDefaultRate] = useState('');
  const [savingRate, setSavingRate] = useState(false);
  const isDev = process.env.NODE_ENV === 'development';

  async function truncateAll() {
    await fetch('/api/dev/truncate', { method: 'POST' });
    loadAll();
  }

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    const [wps, emps, settings] = await Promise.all([
      fetch('/api/workplaces').then((r) => r.json()),
      fetch('/api/employees').then((r) => r.json()),
      fetch('/api/settings').then((r) => r.json()),
    ]);
    setWorkplaces(wps);
    setEmployees(emps);
    setDefaultRate(settings.default_hourly_rate ?? '10030');
  }

  async function addWorkplace() {
    if (!newWpName.trim()) return;
    await fetch('/api/workplaces', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newWpName.trim() }) });
    setNewWpName('');
    loadAll();
  }

  async function toggleWorkplace(wp: Workplace) {
    await fetch(`/api/workplaces/${wp.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_active: !wp.isActive }) });
    loadAll();
  }

  async function toggleEmployee(emp: Employee) {
    await fetch(`/api/employees/${emp.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_active: emp.isActive ? 0 : 1 }) });
    loadAll();
  }

  async function saveDefaultRate() {
    setSavingRate(true);
    await fetch('/api/settings', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ default_hourly_rate: Number(defaultRate) }) });
    setSavingRate(false);
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.backdrop} onClick={onClose} />
      <div className={styles.panel}>
        <div className={styles.panelHeader}>
          <h2 className={styles.panelTitle}>관리자 설정</h2>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div className={styles.body}>
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>기본 시급</h3>
            <div className={styles.inputRow}>
              <input type="number" value={defaultRate} onChange={(e) => setDefaultRate(e.target.value)} placeholder="10030" />
              <Button size="sm" onClick={saveDefaultRate} disabled={savingRate}>{savingRate ? '저장 중…' : '저장'}</Button>
            </div>
          </section>

          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>사업장</h3>
            <div className={styles.inputRow} style={{ marginBottom: 10 }}>
              <input placeholder="사업장 이름" value={newWpName} onChange={(e) => setNewWpName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addWorkplace()} />
              <Button size="sm" onClick={addWorkplace}>추가</Button>
            </div>
            <div className={styles.card}>
              {workplaces.length === 0
                ? <p className={styles.emptyList}>사업장이 없습니다.</p>
                : workplaces.map((wp) => (
                    <div key={wp.id} className={styles.cardItem}>
                      <span className={wp.isActive ? styles.cardItemName : styles.cardItemInactive}>{wp.name}</span>
                      <Button variant="ghost" size="sm" onClick={() => toggleWorkplace(wp)}>{wp.isActive ? '비활성' : '활성화'}</Button>
                    </div>
                  ))}
            </div>
          </section>

          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>직원</h3>
              <Button size="sm" onClick={() => setShowAddEmp(true)}>+ 추가</Button>
            </div>
            <EmployeeList employees={employees} workplaces={workplaces} onToggleActive={toggleEmployee} />
          </section>

          {isDev && (
            <section className={styles.section}>
              <h3 className={styles.sectionTitle} style={{ color: 'var(--color-danger)' }}>[DEV] 위험 구역</h3>
              <Button variant="danger" size="sm" onClick={truncateAll}>전체 데이터 초기화</Button>
            </section>
          )}
        </div>
      </div>

      <AddEmployeeModal open={showAddEmp} onClose={() => setShowAddEmp(false)} workplaces={workplaces.filter((wp) => wp.isActive)} onSaved={loadAll} />
    </div>
  );
}
