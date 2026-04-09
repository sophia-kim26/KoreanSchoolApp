import React from 'react';
import { FormData, CLASSROOMS } from './VPDashboardTypes';
import { MONTH_NAMES, getDaysInMonth } from './VPDashboardUtils';

interface DarkModeProps {
  darkMode: boolean;
}

// Shared dark-mode style helpers
const getCardBg = (dm: boolean) => dm ? '#1f2937' : 'white';
const getInputBg = (dm: boolean) => dm ? '#273549' : 'white';
const getInputBorder = (dm: boolean) => dm ? '1px solid #4b5563' : '1px solid #d1d5db';
const getInputColor = (dm: boolean) => dm ? '#e5e7eb' : '#374151';
const getLabelColor = (dm: boolean) => dm ? '#9ca3af' : '#374151';

// ---------------------------------------------------------------------------
// PIN Display Modal
// ---------------------------------------------------------------------------
interface PinModalProps extends DarkModeProps {
  generatedPin: string;
  newTAName: string;
  onCopy: () => void;
  onClose: () => void;
}

export function PinModal({ darkMode: dm, generatedPin, newTAName, onCopy, onClose }: PinModalProps) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1001 }}>
      <div style={{ background: getCardBg(dm), color: dm ? '#f9fafb' : 'inherit', padding: 40, borderRadius: 12, width: 500, maxWidth: '90%', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)', textAlign: 'center' }}>
        <div style={{ width: 60, height: 60, background: dm ? '#14532d' : '#dcfce7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: '30px' }}>✓</div>
        <h2 style={{ marginTop: 0, marginBottom: 16, fontSize: '24px', fontWeight: '600', color: dm ? '#4ade80' : '#166534' }}>Account Created Successfully!</h2>
        <p style={{ marginBottom: 24, fontSize: '16px', color: dm ? '#d1d5db' : '#374151' }}>New TA: <strong>{newTAName}</strong></p>
        <div style={{ background: dm ? '#273549' : '#f3f4f6', padding: 20, borderRadius: 8, marginBottom: 24 }}>
          <p style={{ marginBottom: 8, fontSize: '14px', color: dm ? '#9ca3af' : '#6b7280', fontWeight: '500' }}>Generated PIN (Save this - it cannot be retrieved later)</p>
          <div style={{ fontSize: '32px', fontWeight: '700', color: dm ? '#60a5fa' : '#1e40af', letterSpacing: '4px', fontFamily: 'monospace' }}>{generatedPin}</div>
        </div>
        <div style={{ background: dm ? '#422006' : '#fef3c7', border: `1px solid ${dm ? '#92400e' : '#f59e0b'}`, borderRadius: 6, padding: 12, marginBottom: 24, fontSize: '13px', color: dm ? '#fcd34d' : '#92400e' }}>
          ⚠️ <strong>Important:</strong> This PIN is encrypted and stored securely. Make sure to save it now - you won't be able to see it again!
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button onClick={onCopy} style={{ padding: '12px 24px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}>📋 Copy PIN</button>
          <button onClick={onClose} style={{ padding: '12px 24px', background: '#16a34a', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}>Done</button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Add New TA Modal
// ---------------------------------------------------------------------------
interface AddTAModalProps extends DarkModeProps {
  formData: FormData;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSessionDaySelect: (day: string) => void;
  onClassroomChange: (classroom: string) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
}

export function AddTAModal({ darkMode: dm, formData, onInputChange, onSessionDaySelect, onClassroomChange, onSubmit, onClose }: AddTAModalProps) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: getCardBg(dm), color: dm ? '#f9fafb' : 'inherit', padding: 30, borderRadius: 12, width: 500, maxWidth: '90%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
        <h2 style={{ marginTop: 0, marginBottom: 24, fontSize: '24px', fontWeight: '600' }}>Add New TA</h2>
        <form onSubmit={onSubmit}>
          {[
            { label: 'First Name', name: 'first_name', type: 'text', required: true, value: formData.first_name },
            { label: 'Last Name', name: 'last_name', type: 'text', required: true, value: formData.last_name },
            { label: 'Korean Name (Optional)', name: 'korean_name', type: 'text', required: false, value: formData.korean_name },
            { label: 'Email', name: 'email', type: 'email', required: true, value: formData.email },
          ].map(field => (
            <div key={field.name} style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 6, fontSize: '14px', fontWeight: '500', color: getLabelColor(dm) }}>{field.label}:</label>
              <input type={field.type} name={field.name} value={field.value} onChange={onInputChange} required={field.required}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: getInputBorder(dm), fontSize: '14px', boxSizing: 'border-box', background: getInputBg(dm), color: getInputColor(dm) }} />
            </div>
          ))}

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 6, fontSize: '14px', fontWeight: '500', color: getLabelColor(dm) }}>Session Day:</label>
            <div style={{ display: 'flex', gap: 10 }}>
              {(['Friday', 'Saturday', 'Both'] as const).map(day => (
                <button key={day} type="button" onClick={() => onSessionDaySelect(day)} style={{ flex: 1, padding: '10px', background: formData.session_day === day ? '#2563eb' : (dm ? '#374151' : '#e5e7eb'), color: formData.session_day === day ? 'white' : (dm ? '#d1d5db' : '#374151'), border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: formData.session_day === day ? '600' : '500', fontSize: '14px' }}>{day}</button>
              ))}
            </div>
            {formData.session_day && <p style={{ marginTop: 6, fontSize: 13, color: '#059669' }}>Selected: {formData.session_day}</p>}
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 6, fontSize: '14px', fontWeight: '500', color: getLabelColor(dm) }}>Classroom (Optional):</label>
            <select value={formData.classroom} onChange={e => onClassroomChange(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: getInputBorder(dm), fontSize: '14px', boxSizing: 'border-box', background: getInputBg(dm), color: formData.classroom ? getInputColor(dm) : (dm ? '#6b7280' : '#9ca3af'), cursor: 'pointer' }}>
              <option value="">— Select Classroom —</option>
              {CLASSROOMS.map(room => <option key={room} value={room}>{room}</option>)}
            </select>
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '14px', color: getLabelColor(dm) }}>
              <input type="checkbox" name="is_active" checked={formData.is_active} onChange={onInputChange} style={{ width: '16px', height: '16px' }} />
              Is Active
            </label>
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} style={{ padding: '10px 20px', background: dm ? '#4b5563' : '#6b7280', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}>Cancel</button>
            <button type="submit" style={{ padding: '10px 20px', background: '#16a34a', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}>Add TA</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Calendar Picker Modal
// ---------------------------------------------------------------------------
interface CalendarModalProps extends DarkModeProps {
  currentMonth: Date;
  selectedDates: Set<string>;
  onChangeMonth: (offset: number) => void;
  onToggleDate: (day: number) => void;
  onClearAll: () => void;
  onSave: () => void;
  onClose: () => void;
}

export function CalendarModal({ darkMode: dm, currentMonth, selectedDates, onChangeMonth, onToggleDate, onClearAll, onSave, onClose }: CalendarModalProps) {
  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentMonth);

  const formatDateKey = (day: number): string => {
    const m = (currentMonth.getMonth() + 1).toString().padStart(2, '0');
    const d = day.toString().padStart(2, '0');
    return `${currentMonth.getFullYear()}-${m}-${d}`;
  };

  const isSelected = (day: number) => selectedDates.has(formatDateKey(day));

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1002 }}>
      <div style={{ background: getCardBg(dm), color: dm ? '#f9fafb' : 'inherit', borderRadius: 12, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)', maxWidth: '450px', width: '90%', padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: dm ? '#60a5fa' : '#1e40af' }}>Select Days</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: dm ? '#9ca3af' : '#6b7280', padding: '0 8px' }}>×</button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <button onClick={() => onChangeMonth(-1)} style={{ padding: '8px 16px', background: dm ? '#374151' : '#e5e7eb', color: dm ? '#d1d5db' : '#374151', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '16px', fontWeight: '600' }}>←</button>
          <span style={{ fontSize: '16px', fontWeight: '600', color: dm ? '#d1d5db' : '#374151' }}>{MONTH_NAMES[currentMonth.getMonth()]} {currentMonth.getFullYear()}</span>
          <button onClick={() => onChangeMonth(1)} style={{ padding: '8px 16px', background: dm ? '#374151' : '#e5e7eb', color: dm ? '#d1d5db' : '#374151', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '16px', fontWeight: '600' }}>→</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 12 }}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} style={{ textAlign: 'center', padding: '8px 0', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>{day}</div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
          {Array.from({ length: startingDayOfWeek }).map((_, i) => <div key={`empty-${i}`} style={{ aspectRatio: '1', padding: 8 }} />)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const selected = isSelected(day);
            return (
              <button key={day} onClick={() => onToggleDate(day)}
                style={{ aspectRatio: '1', padding: 8, background: selected ? '#2563eb' : (dm ? '#374151' : '#f3f4f6'), color: selected ? 'white' : (dm ? '#d1d5db' : '#374151'), border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '14px', fontWeight: selected ? '600' : '500', transition: 'all 0.2s' }}
                onMouseOver={e => { if (!selected) e.currentTarget.style.background = dm ? '#4b5563' : '#e5e7eb'; }}
                onMouseOut={e => { if (!selected) e.currentTarget.style.background = dm ? '#374151' : '#f3f4f6'; }}
              >{day}</button>
            );
          })}
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button onClick={onClearAll} style={{ flex: 1, padding: '12px', background: dm ? '#374151' : '#e5e7eb', color: dm ? '#d1d5db' : '#374151', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}>Clear All</button>
          <button onClick={onSave} style={{ flex: 1, padding: '12px', background: '#2563eb', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}>Done</button>
        </div>
      </div>
    </div>
  );
}