'use client';

import { useEffect, useState } from 'react';
import { Schedule, Employee } from '@/lib/types';
import styles from './ScheduleCompareView.module.css';

type DiffType = 'added' | 'removed' | 'changed' | 'unchanged';

interface DiffEntry {
  key: string;
  employeeId: number;
  date: string;
  snapshot: Schedule | null;
  confirmed: Schedule | null;
  diffType: DiffType;
}

interface Props {
  workplaceId: number;
  year: number;
  month: number;
  employees: Employee[];
}

const typeLabel: Record<string, string> = { WORK: '근무', BREAK: '휴식' };
const diffLabel: Record<DiffType, string> = { added: '추가', removed: '삭제', changed: '변경', unchanged: '동일' };
const diffColorVar: Record<DiffType, string> = {
  added: 'var(--color-success-text)',
  removed: 'var(--color-danger-text)',
  changed: 'var(--color-warning-text)',
  unchanged: 'var(--color-text-subtle)',
};
const diffBgVar: Record<DiffType, string> = {
  added: 'var(--color-success-light)',
  removed: 'var(--color-danger-light)',
  changed: 'var(--color-warning-light)',
  unchanged: 'transparent',
};

function formatTime(dt: string) {
  return dt.split(' ')[1] ?? dt;
}

function formatDate(dt: string) {
  return dt.split(' ')[0] ?? dt;
}

function timeRange(s: Schedule | null) {
  if (!s) return '-';
  return `${formatTime(s.fromDatetime)} ~ ${formatTime(s.toDatetime)}`;
}

function buildDiff(snapshots: Schedule[], confirmed: Schedule[]): DiffEntry[] {
  const snapMap = new Map<string, Schedule>();
  for (const s of snapshots) {
    snapMap.set(`${s.employeeId}:${s.fromDatetime}`, s);
  }
  const confMap = new Map<string, Schedule>();
  for (const c of confirmed) {
    confMap.set(`${c.employeeId}:${c.fromDatetime}`, c);
  }

  const entries: DiffEntry[] = [];
  const seen = new Set<string>();

  for (const [key, snap] of snapMap) {
    seen.add(key);
    const conf = confMap.get(key);
    let diffType: DiffType;
    if (!conf) {
      diffType = 'removed';
    } else if (snap.toDatetime !== conf.toDatetime || snap.type !== conf.type) {
      diffType = 'changed';
    } else {
      diffType = 'unchanged';
    }
    entries.push({ key, employeeId: snap.employeeId, date: formatDate(snap.fromDatetime), snapshot: snap, confirmed: conf ?? null, diffType });
  }

  for (const [key, conf] of confMap) {
    if (!seen.has(key)) {
      entries.push({ key, employeeId: conf.employeeId, date: formatDate(conf.fromDatetime), snapshot: null, confirmed: conf, diffType: 'added' });
    }
  }

  entries.sort((a, b) => {
    if (a.employeeId !== b.employeeId) return a.employeeId - b.employeeId;
    return a.date.localeCompare(b.date);
  });

  return entries;
}

export default function ScheduleCompareView({ workplaceId, year, month, employees }: Props) {
  const [entries, setEntries] = useState<DiffEntry[]>([]);
  const [showUnchanged, setShowUnchanged] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasSnapshot, setHasSnapshot] = useState(false);
  const [hasConfirmed, setHasConfirmed] = useState(false);

  useEffect(() => {
    setLoading(true);
    const base = `/api/schedules?workplace_id=${workplaceId}&year=${year}&month=${month}`;
    Promise.all([
      fetch(`${base}&status=SNAPSHOT`).then((r) => r.json()),
      fetch(`${base}&status=CONFIRMED`).then((r) => r.json()),
    ]).then(([snaps, confs]: [Schedule[], Schedule[]]) => {
      setHasSnapshot(snaps.length > 0);
      setHasConfirmed(confs.length > 0);
      setEntries(buildDiff(snaps, confs));
      setLoading(false);
    });
  }, [workplaceId, year, month]);

  const empMap = new Map(employees.map((e) => [e.id, e]));

  if (loading) {
    return <p className={styles.empty}>불러오는 중...</p>;
  }

  if (!hasSnapshot && !hasConfirmed) {
    return <p className={styles.empty}>스냅샷 또는 확정 스케쥴이 없습니다.</p>;
  }

  const visible = showUnchanged ? entries : entries.filter((e) => e.diffType !== 'unchanged');
  const addedCount = entries.filter((e) => e.diffType === 'added').length;
  const removedCount = entries.filter((e) => e.diffType === 'removed').length;
  const changedCount = entries.filter((e) => e.diffType === 'changed').length;
  const unchangedCount = entries.filter((e) => e.diffType === 'unchanged').length;

  // Group by employeeId
  const grouped = new Map<number, DiffEntry[]>();
  for (const e of visible) {
    if (!grouped.has(e.employeeId)) grouped.set(e.employeeId, []);
    grouped.get(e.employeeId)!.push(e);
  }

  return (
    <div className={styles.wrap}>
      {/* Summary bar */}
      <div className={styles.summary}>
        <span className={styles.summaryItem} style={{ color: 'var(--color-success-text)' }}>추가 {addedCount}건</span>
        <span className={styles.summaryItem} style={{ color: 'var(--color-danger-text)' }}>삭제 {removedCount}건</span>
        <span className={styles.summaryItem} style={{ color: 'var(--color-warning-text)' }}>변경 {changedCount}건</span>
        <span className={styles.summaryItem} style={{ color: 'var(--color-text-subtle)' }}>동일 {unchangedCount}건</span>
        <button
          className={styles.toggleBtn}
          onClick={() => setShowUnchanged((v) => !v)}
        >
          {showUnchanged ? '동일 항목 숨기기' : '동일 항목 보기'}
        </button>
      </div>

      {visible.length === 0 ? (
        <p className={styles.noChange}>
          {unchangedCount > 0 ? '변경된 스케쥴이 없습니다.' : '데이터가 없습니다.'}
        </p>
      ) : (
        Array.from(grouped.entries()).map(([empId, empEntries]) => {
          const emp = empMap.get(empId);
          return (
            <div key={empId} className={styles.empSection}>
              <div className={styles.empHeader}>{emp?.name ?? `직원 #${empId}`}</div>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>날짜</th>
                    <th>유형</th>
                    <th>스냅샷 시간</th>
                    <th>확정 시간</th>
                    <th>변경</th>
                  </tr>
                </thead>
                <tbody>
                  {empEntries.map((entry) => (
                    <tr
                      key={entry.key}
                      style={{ background: entry.diffType !== 'unchanged' ? diffBgVar[entry.diffType] : undefined }}
                    >
                      <td className={styles.date}>{entry.date}</td>
                      <td>
                        {entry.snapshot?.type ?? entry.confirmed?.type
                          ? typeLabel[entry.snapshot?.type ?? entry.confirmed?.type ?? ''] ?? '-'
                          : '-'}
                      </td>
                      <td className={styles.time}>{timeRange(entry.snapshot)}</td>
                      <td className={styles.time}>{timeRange(entry.confirmed)}</td>
                      <td>
                        <span
                          className={styles.diffBadge}
                          style={{
                            color: diffColorVar[entry.diffType],
                            background: entry.diffType !== 'unchanged' ? diffBgVar[entry.diffType] : 'var(--color-bg)',
                          }}
                        >
                          {diffLabel[entry.diffType]}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })
      )}
    </div>
  );
}
