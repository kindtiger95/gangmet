'use client';

import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';

interface Props { open: boolean; onClose: () => void; year: number; month: number; workplaceId: number; onDone: () => void; }

export default function SnapshotModal({ open, onClose, year, month, workplaceId, onDone }: Props) {
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    setLoading(true);
    try {
      const res = await fetch('/api/actions/snapshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workplace_id: workplaceId, year, month }),
      });
      if (res.ok) { onDone(); onClose(); }
      else { const err = await res.json(); alert(err.error || '정산 실패'); }
    } finally { setLoading(false); }
  }

  return (
    <Modal open={open} onClose={onClose} title="정산하기 (스냅샷 생성)">
      <p style={{ fontSize: 14, color: 'var(--color-text-muted)', marginBottom: 16, lineHeight: 1.6 }}>
        {year}년 {month}월의 현재 PENDING 스케쥴 전체를 SNAPSHOT으로 복제하고 정산내역을 생성합니다.
        이미 정산내역이 있으면 덮어씁니다.
      </p>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <Button variant="secondary" onClick={onClose}>취소</Button>
        <Button onClick={handleConfirm} disabled={loading}>{loading ? '처리 중…' : '정산하기'}</Button>
      </div>
    </Modal>
  );
}
