'use client';

import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { Workplace } from '@/lib/types';

interface Props { open: boolean; onClose: () => void; workplaces: Workplace[]; onSaved: () => void; }

const init = { workplace_id: '', name: '', phone: '', position: 'STAFF', pay_type: 'HOURLY', hourly_rate: '', required_hours: '', monthly_salary: '', bank_name: '', account_number: '', hire_date: '' };

export default function AddEmployeeModal({ open, onClose, workplaces, onSaved }: Props) {
  const [form, setForm] = useState(init);
  const [saving, setSaving] = useState(false);

  function set(k: string, v: string) { setForm((f) => ({ ...f, [k]: v })); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) { onSaved(); onClose(); setForm(init); }
      else { const err = await res.json(); alert(err.error || '저장 실패'); }
    } finally { setSaving(false); }
  }

  const row = (label: string, el: React.ReactNode) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}><label>{label}</label>{el}</div>
  );

  return (
    <Modal open={open} onClose={onClose} title="직원 추가">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {row('사업장 *', <select value={form.workplace_id} onChange={(e) => set('workplace_id', e.target.value)} required>
          <option value="">선택</option>
          {workplaces.map((wp) => <option key={wp.id} value={wp.id}>{wp.name}</option>)}
        </select>)}

        {row('이름 *', <input value={form.name} onChange={(e) => set('name', e.target.value)} required />)}
        {row('연락처', <input value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="010-XXXX-XXXX" />)}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {row('직급 *', <select value={form.position} onChange={(e) => set('position', e.target.value)}>
            <option value="STAFF">직원</option>
            <option value="MANAGER">매니저</option>
            <option value="OWNER">오너</option>
          </select>)}
          {row('급여 유형 *', <select value={form.pay_type} onChange={(e) => set('pay_type', e.target.value)}>
            <option value="HOURLY">시급</option>
            <option value="MONTHLY">월급</option>
          </select>)}
        </div>

        {row('시급 (원)', <input type="number" value={form.hourly_rate} onChange={(e) => set('hourly_rate', e.target.value)} placeholder="미입력 시 기본 시급 적용" />)}

        {form.pay_type === 'MONTHLY' && <>
          {row('월 소정근로시간', <input type="number" value={form.required_hours} onChange={(e) => set('required_hours', e.target.value)} />)}
          {row('월 기본급 (원)', <input type="number" value={form.monthly_salary} onChange={(e) => set('monthly_salary', e.target.value)} />)}
        </>}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {row('은행명', <input value={form.bank_name} onChange={(e) => set('bank_name', e.target.value)} placeholder="예: 국민은행" />)}
          {row('계좌번호', <input value={form.account_number} onChange={(e) => set('account_number', e.target.value)} />)}
        </div>

        {row('입사일', <input type="date" value={form.hire_date} onChange={(e) => set('hire_date', e.target.value)} />)}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 4, borderTop: '1px solid var(--color-border)', marginTop: 4 }}>
          <Button type="button" variant="secondary" onClick={onClose}>취소</Button>
          <Button type="submit" disabled={saving}>{saving ? '저장 중…' : '추가하기'}</Button>
        </div>
      </form>
    </Modal>
  );
}
