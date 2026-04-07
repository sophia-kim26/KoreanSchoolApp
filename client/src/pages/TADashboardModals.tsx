import React from 'react';
import { translations, Language } from './translations';

interface ModalBaseProps {
  darkMode: boolean;
}

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100vw',
  height: '100vh',
  backgroundColor: 'rgba(0,0,0,0.5)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 1000,
};

const getModalStyle = (darkMode: boolean): React.CSSProperties => ({
  backgroundColor: darkMode ? '#1f2937' : '#fff',
  color: darkMode ? '#f9fafb' : 'inherit',
  padding: '30px',
  borderRadius: '8px',
  textAlign: 'center',
  minWidth: '300px',
});

// ---------------------------------------------------------------------------
// Clock In Confirmation Modal
// ---------------------------------------------------------------------------
interface ClockInModalProps extends ModalBaseProps {
  language: Language;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ClockInConfirmModal({ darkMode, language, onConfirm, onCancel }: ClockInModalProps) {
  return (
    <div style={overlayStyle}>
      <div style={getModalStyle(darkMode)}>
        <h2>Confirm Clock In</h2>
        <p>Are you sure you want to clock in?</p>
        <div style={{ marginTop: '20px' }}>
          <button onClick={onConfirm} className="btn-primary">
            Yes, I'm sure
          </button>
          <button onClick={onCancel} className="btn-danger">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Clock Out Confirmation Modal
// ---------------------------------------------------------------------------
interface ClockOutModalProps extends ModalBaseProps {
  language: Language;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ClockOutConfirmModal({ darkMode, language, onConfirm, onCancel }: ClockOutModalProps) {
  return (
    <div style={overlayStyle}>
      <div style={getModalStyle(darkMode)}>
        <h2>Confirm Clock Out</h2>
        <p>Are you sure you want to clock out?</p>
        <div style={{ marginTop: '20px' }}>
          <button onClick={onConfirm} className="btn-primary">
            Yes, I'm sure
          </button>
          <button onClick={onCancel} className="btn-danger">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Notes Edit Modal
// ---------------------------------------------------------------------------
interface NotesEditModalProps extends ModalBaseProps {
  notes: string;
  onNotesChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

export function NotesEditModal({ darkMode, notes, onNotesChange, onSave, onCancel }: NotesEditModalProps) {
  return (
    <div style={overlayStyle}>
      <div style={{ ...getModalStyle(darkMode), minWidth: '400px', textAlign: 'left' }}>
        <h2 style={{ marginBottom: '20px' }}>Edit Notes</h2>
        <textarea
          value={notes}
          onChange={e => onNotesChange(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              onSave();
            }
          }}
          placeholder="Enter notes here..."
          style={{
            width: '100%',
            minHeight: '120px',
            padding: '10px',
            borderRadius: '4px',
            border: darkMode ? '1px solid #4b5563' : '1px solid #d1d5db',
            fontSize: '14px',
            fontFamily: 'inherit',
            resize: 'vertical',
            marginBottom: '20px',
            backgroundColor: darkMode ? '#273549' : 'white',
            color: darkMode ? '#f9fafb' : 'inherit',
          }}
          autoFocus
        />
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button onClick={onSave} className="btn-primary">
            Save
          </button>
          <button onClick={onCancel} className="btn-danger">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}