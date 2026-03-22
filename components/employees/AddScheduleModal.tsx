'use client';

import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { Employee } from '@/lib/types';
import { calcDayType } from '@/lib/schedule-utils';

interface Props { open: boolean; onClose: () => void; employee: Employee; workplaceId: number; onSaved: () => void; }

const today = new Date().toISOString().split('T')[0];

export default function AddScheduleModal({ open, onClose, employee, workplaceId, onSaved }: Props) {
  const [form, setForm] = useState({ type: 'WORK', date: today, fromTime: '09:00', toTime: '18:00', dayType: calcDayType(today), note: '' });
  const [saving, setSaving] = useState(false);

  function set(field: string, value: string) {
    setForm((f) => {
      const u = { ...f, [field]: value };
      if (field === 'date') u.dayType = calcDayType(value);
      return u;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_id: employee.id, workplace_id: workplaceId,
          type: form.type, day_type: form.dayType, note: form.note || null,
          from_datetime: `${form.date} ${form.fromTime}`,
          to_datetime: `${form.date} ${form.toTime}`,
        }),
      });
      if (res.ok) { onSaved(); onClose(); }
      else { const err = await res.json(); alert(err.error || '저장 실패'); }
    } finally { setSaving(false); }
  }

  const row = (label: string, children: React.ReactNode) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label>{label}</label>
      {children}
    </div>
  );

  return (
    <Modal open={open} onClose={onClose} title={`스케쥴 추가 — ${employee.name}`}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {row('유형', <select value={form.type} onChange={(e) => set('type', e.target.value)}>
            <option value="WORK">근무</option>
            <option value="BREAK">휴게</option>
          </select>)}
          {row('날짜 유형', <select value={form.dayType} onChange={(e) => set('dayType', e.target.value)}>
            <option value="WEEKDAY">평일</option>
            <option value="WEEKEND">주말</option>
            <option value="HOLIDAY">공휴일</option>
          </select>)}
        </div>
        {row('날짜', <input type="date" value={form.date} onChange={(e) => set('date', e.target.value)} required />)}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {row('시작 시간', <input type="time" value={form.fromTime} onChange={(e) => set('fromTime', e.target.value)} required />)}
          {row('종료 시간', <input type="time" value={form.toTime} onChange={(e) => set('toTime', e.target.value)} required />)}
        </div>
        {row('메모', <input value={form.note} onChange={(e) => set('note', e.target.value)} placeholder="선택사항" />)}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 4 }}>
          <Button type="button" variant="secondary" onClick={onClose}>취소</Button>
          <Button type="submit" disabled={saving}>{saving ? '저장 중…' : '추가하기'}</Button>
        </div>
      </form>
    </Modal>
  );
}
