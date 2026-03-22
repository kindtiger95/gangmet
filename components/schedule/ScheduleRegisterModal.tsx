'use client';

import { useState, useRef, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { Schedule, Employee } from '@/lib/types';
import { calcDayType } from '@/lib/schedule-utils';
import styles from './ScheduleRegisterModal.module.css';

interface TimeBlock {
  startSlot: number;
  endSlot: number;
  type: 'WORK' | 'BREAK';
}

interface Props {
  open: boolean;
  onClose: () => void;
  date: string;
  employees: Employee[];
  workplaceId: number;
  onSaved: () => void;
  // 수정 모드
  editEmployee?: Employee;
  initialSchedules?: Schedule[];
}

const TOTAL_SLOTS = 48;

function slotToTime(slot: number): string {
  const h = Math.floor(slot / 2);
  const m = (slot % 2) * 30;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function rangeEndTime(endSlot: number): string {
  const endMinutes = (endSlot + 1) * 30;
  if (endMinutes >= 1440) return '23:59';
  const h = Math.floor(endMinutes / 60);
  const m = endMinutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function scheduleToBlock(s: Schedule): TimeBlock {
  const fromTime = s.fromDatetime.split(' ')[1] ?? '00:00';
  const toTime = s.toDatetime.split(' ')[1] ?? '00:00';
  const [fh, fm] = fromTime.split(':').map(Number);
  const [th, tm] = toTime.split(':').map(Number);
  const startSlot = fh * 2 + Math.floor(fm / 30);
  const endSlot = Math.floor((th * 60 + tm) / 30) - 1;
  return { startSlot, endSlot: Math.max(startSlot, endSlot), type: s.type as 'WORK' | 'BREAK' };
}

export default function ScheduleRegisterModal({
  open, onClose, date, employees, workplaceId, onSaved,
  editEmployee, initialSchedules,
}: Props) {
  const isEditMode = !!editEmployee;

  const [employeeId, setEmployeeId] = useState<number | ''>('');
  const [selectedType, setSelectedType] = useState<'WORK' | 'BREAK'>('WORK');
  const [blocks, setBlocks] = useState<TimeBlock[]>([]);
  const [dragRange, setDragRange] = useState<{ start: number; end: number } | null>(null);
  const [saving, setSaving] = useState(false);

  const isDragging = useRef(false);
  const dragStart = useRef<number | null>(null);
  const typeRef = useRef(selectedType);
  const dragRangeRef = useRef(dragRange);

  useEffect(() => { typeRef.current = selectedType; }, [selectedType]);
  useEffect(() => { dragRangeRef.current = dragRange; }, [dragRange]);

  // 모달이 열릴 때 초기화
  useEffect(() => {
    if (open) {
      if (isEditMode && editEmployee) {
        setEmployeeId(editEmployee.id);
        setBlocks((initialSchedules ?? []).map(scheduleToBlock));
      } else {
        setEmployeeId('');
        setBlocks([]);
      }
      setSelectedType('WORK');
      setDragRange(null);
    }
  }, [open]);

  // 그리드 밖에서 마우스를 놓을 때도 처리
  useEffect(() => {
    function onGlobalMouseUp() {
      if (!isDragging.current) return;
      isDragging.current = false;
      const range = dragRangeRef.current;
      if (range) {
        setBlocks(prev => [...prev, { startSlot: range.start, endSlot: range.end, type: typeRef.current }]);
        setDragRange(null);
      }
      dragStart.current = null;
    }
    window.addEventListener('mouseup', onGlobalMouseUp);
    return () => window.removeEventListener('mouseup', onGlobalMouseUp);
  }, []);

  function handleMouseDown(e: React.MouseEvent, slot: number) {
    e.preventDefault();
    isDragging.current = true;
    dragStart.current = slot;
    setDragRange({ start: slot, end: slot });
  }

  function handleMouseEnter(slot: number) {
    if (!isDragging.current || dragStart.current === null) return;
    const s = dragStart.current;
    setDragRange({ start: Math.min(s, slot), end: Math.max(s, slot) });
  }

  function finalizeDrag() {
    if (!isDragging.current || !dragRange) return;
    isDragging.current = false;
    dragStart.current = null;
    setBlocks(prev => [...prev, { startSlot: dragRange.start, endSlot: dragRange.end, type: selectedType }]);
    setDragRange(null);
  }

  function removeBlock(index: number) {
    setBlocks(prev => prev.filter((_, i) => i !== index));
  }

  function handleClose() {
    isDragging.current = false;
    dragStart.current = null;
    onClose();
  }

  // 초기화: 기존 PENDING 스케쥴 전부 삭제 + 블록 초기화
  async function handleReset() {
    const pendingIds = (initialSchedules ?? [])
      .filter(s => s.status === 'PENDING')
      .map(s => s.id);
    await Promise.all(pendingIds.map(id => fetch(`/api/schedules/${id}`, { method: 'DELETE' })));
    setBlocks([]);
  }

  async function deleteInitialSchedules() {
    const pendingIds = (initialSchedules ?? [])
      .filter(s => s.status === 'PENDING')
      .map(s => s.id);
    await Promise.all(pendingIds.map(id => fetch(`/api/schedules/${id}`, { method: 'DELETE' })));
  }

  async function handleSubmit() {
    const empId = isEditMode ? editEmployee!.id : employeeId;
    if (!empId) { alert('직원을 선택해주세요.'); return; }
    if (blocks.length === 0) { alert('근무 시간을 선택해주세요.'); return; }
    setSaving(true);
    const dayType = calcDayType(date);
    try {
      // 수정 모드: 기존 PENDING 스케쥴 삭제 후 새로 생성
      if (isEditMode) await deleteInitialSchedules();

      for (const block of blocks) {
        const res = await fetch('/api/schedules', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            employee_id: empId,
            workplace_id: workplaceId,
            type: block.type,
            day_type: dayType,
            from_datetime: `${date} ${slotToTime(block.startSlot)}`,
            to_datetime: `${date} ${rangeEndTime(block.endSlot)}`,
          }),
        });
        if (!res.ok) {
          const err = await res.json();
          alert(err.error || '저장 실패');
          return;
        }
      }
      onSaved();
      handleClose();
    } finally {
      setSaving(false);
    }
  }

  function getSlotClass(slot: number): string {
    if (dragRange && slot >= dragRange.start && slot <= dragRange.end) {
      return selectedType === 'WORK' ? styles.slotDragWork : styles.slotDragBreak;
    }
    for (const block of blocks) {
      if (slot >= block.startSlot && slot <= block.endSlot) {
        return block.type === 'WORK' ? styles.slotWork : styles.slotBreak;
      }
    }
    return '';
  }

  const HOUR_MARKS = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24];
  const dragLabel = dragRange
    ? `${slotToTime(dragRange.start)} ~ ${rangeEndTime(dragRange.end)}`
    : null;

  const showTimeUI = isEditMode || employeeId !== '';

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={isEditMode ? `스케쥴 수정 — ${date}` : `스케쥴 등록 — ${date}`}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* 직원 */}
        {isEditMode ? (
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text)' }}>
            {editEmployee!.name}
          </div>
        ) : (
          <div>
            <label>직원 선택</label>
            <select value={employeeId} onChange={(e) => setEmployeeId(e.target.value ? Number(e.target.value) : '')}>
              <option value="">직원을 선택하세요</option>
              {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
            </select>
          </div>
        )}

        {showTimeUI && <>
          {/* 유형 선택 */}
          <div>
            <label>유형 (드래그 전 선택)</label>
            <div style={{ display: 'flex', gap: 6 }}>
              <Button variant={selectedType === 'WORK' ? 'primary' : 'secondary'} size="sm" onClick={() => setSelectedType('WORK')}>근무</Button>
              <Button variant={selectedType === 'BREAK' ? 'primary' : 'secondary'} size="sm" onClick={() => setSelectedType('BREAK')}>휴게</Button>
            </div>
          </div>

          {/* 시간 그리드 */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <label style={{ margin: 0 }}>시간 선택 (드래그, 30분 단위)</label>
              {dragLabel && (
                <span className={styles.dragLabel}>
                  {selectedType === 'WORK' ? '근무' : '휴게'} {dragLabel}
                </span>
              )}
            </div>
            <div className={styles.hourMarks}>
              {HOUR_MARKS.map((h) => (
                <span
                  key={h}
                  className={styles.hourMark}
                  style={{
                    left: `${(h / 24) * 100}%`,
                    transform: h === 0 ? 'none' : h === 24 ? 'translateX(-100%)' : 'translateX(-50%)',
                  }}
                >
                  {h === 24 ? '24' : String(h).padStart(2, '0')}
                </span>
              ))}
            </div>
            <div
              className={styles.slotGrid}
              onMouseUp={finalizeDrag}
              onMouseLeave={finalizeDrag}
            >
              {Array.from({ length: TOTAL_SLOTS }, (_, i) => (
                <div
                  key={i}
                  className={`${styles.slot} ${i % 2 === 0 && i !== 0 ? styles.slotHourBorder : ''} ${getSlotClass(i)}`}
                  onMouseDown={(e) => handleMouseDown(e, i)}
                  onMouseEnter={() => handleMouseEnter(i)}
                />
              ))}
            </div>
          </div>

          {/* 블록 목록 또는 OFF */}
          {blocks.length === 0 ? (
            <div className={styles.offBadge}>OFF</div>
          ) : (
            <div className={styles.blockList}>
              {blocks.map((block, i) => (
                <div key={i} className={`${styles.blockItem} ${block.type === 'WORK' ? styles.blockWork : styles.blockBreak}`}>
                  <span>
                    <strong>{block.type === 'WORK' ? '근무' : '휴게'}</strong>
                    {' '}{slotToTime(block.startSlot)} ~ {rangeEndTime(block.endSlot)}
                  </span>
                  <button className={styles.removeBtn} onClick={() => removeBlock(i)}>✕</button>
                </div>
              ))}
            </div>
          )}
        </>}

        {/* 푸터 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 4, borderTop: '1px solid var(--color-border)', marginTop: 4 }}>
          <div>
            {isEditMode && (
              <Button variant="danger" size="sm" onClick={handleReset}>초기화</Button>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="secondary" onClick={handleClose}>취소</Button>
            <Button disabled={saving || !showTimeUI || blocks.length === 0} onClick={handleSubmit}>
              {saving ? '저장 중…' : isEditMode ? '저장하기' : '등록하기'}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
