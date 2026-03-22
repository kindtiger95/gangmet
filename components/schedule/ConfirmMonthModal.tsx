'use client';

import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';

interface Props { open: boolean; onClose: () => void; year: number; month: number; workplaceId: number; onDone: () => void; }

export default function ConfirmMonthModal({ open, onClose, year, month, workplaceId, onDone }: Props) {
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    setLoading(true);
    try {
      const res = await fetch('/api/actions/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workplace_id: workplaceId, year, month }),
      });
      if (res.ok) { onDone(); onClose(); }
      else { const err = await res.json(); alert(err.error || '확정 실패'); }
    } finally { setLoading(false); }
  }

  return (
    <Modal open={open} onClose={onClose} title="확정하기">
      <p style={{ fontSize: 14, color: 'var(--color-text-muted)', marginBottom: 8, lineHeight: 1.6 }}>
        {year}년 {month}월의 모든 PENDING 스케쥴을 CONFIRMED로 변경하고 급여내역을 생성합니다.
      </p>
      <p style={{ fontSize: 13, color: 'var(--color-danger)', marginBottom: 20, padding: '8px 12px', background: 'var(--color-danger-light)', borderRadius: 'var(--radius)', lineHeight: 1.5 }}>
        ⚠ 확정 후에는 해당 월의 스케쥴을 수정·삭제할 수 없습니다.
      </p>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <Button variant="secondary" onClick={onClose}>취소</Button>
        <Button variant="danger" onClick={handleConfirm} disabled={loading}>{loading ? '처리 중…' : '확정하기'}</Button>
      </div>
    </Modal>
  );
}
