import React from 'react';
import { Language } from './VPDashboardTypes';

interface VPSettingsModalProps {
  darkMode: boolean;
  setDarkMode: (v: boolean) => void;
  language: Language;
  setLanguage: (v: Language) => void;
  selectedDates: Set<string>;
  onOpenCalendar: () => void;
  onClose: () => void;
}

export function VPSettingsModal({
  darkMode: dm, setDarkMode,
  language, setLanguage,
  selectedDates,
  onOpenCalendar,
  onClose,
}: VPSettingsModalProps) {
  const cardBg = dm ? '#1f2937' : 'white';
  const tabPanelBg = dm ? '#172a45' : '#dbeafe';
  const tabBorderBottom = dm ? '2px solid #374151' : '2px solid #e5e7eb';
  const inputBorder = dm ? '1px solid #4b5563' : '1px solid #d1d5db';
  const tabBg = dm ? '#1e3a5f' : '#bfdbfe';
  const tabColor = dm ? '#93c5fd' : '#1e40af';

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: cardBg, color: dm ? '#f9fafb' : 'inherit', padding: 30, borderRadius: 12, width: 600, maxWidth: '90%', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', padding: '5px 10px', marginRight: '10px', color: dm ? '#9ca3af' : '#6b7280' }}>←</button>
          <h2 style={{ margin: 0, fontSize: '32px', fontWeight: '700' }}>Settings</h2>
        </div>

        {/* Tab bar — only one tab currently */}
        <div style={{ display: 'flex', marginBottom: 24, borderBottom: tabBorderBottom }}>
          <button style={{ padding: '12px 24px', background: tabBg, border: 'none', borderTopLeftRadius: 8, borderTopRightRadius: 8, cursor: 'pointer', fontSize: '14px', fontWeight: '500', color: tabColor }}>
            Appearance
          </button>
        </div>

        {/* Panel */}
        <div style={{ background: tabPanelBg, padding: 30, borderRadius: 8, minHeight: '400px' }}>

          {/* Language */}
          <div style={{ marginBottom: 30 }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: 12, color: dm ? '#60a5fa' : '#1e40af' }}>Language Preferences</h3>
            <div style={{ display: 'flex', gap: 10 }}>
              {(['en', 'ko'] as Language[]).map(lang => (
                <button key={lang} onClick={() => setLanguage(lang)} style={{
                  padding: '10px 30px',
                  background: language === lang ? (dm ? '#1e3a5f' : '#bfdbfe') : (dm ? '#273549' : 'white'),
                  color: language === lang ? (dm ? '#93c5fd' : '#1e40af') : (dm ? '#d1d5db' : '#374151'),
                  border: inputBorder, borderRadius: 6, cursor: 'pointer', fontSize: '14px', fontWeight: '500',
                }}>{lang === 'en' ? 'English' : 'Korean'}</button>
              ))}
            </div>
          </div>

          {/* Theme */}
          <div style={{ marginBottom: 30 }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: 12, color: dm ? '#60a5fa' : '#1e40af' }}>Theme</h3>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setDarkMode(false)} style={{ padding: '10px 30px', background: !dm ? '#1e40af' : (dm ? '#273549' : 'white'), color: !dm ? 'white' : (dm ? '#d1d5db' : '#374151'), border: inputBorder, borderRadius: 6, cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}>Light Mode</button>
              <button onClick={() => setDarkMode(true)} style={{ padding: '10px 30px', background: dm ? '#3b82f6' : 'white', color: dm ? 'white' : '#374151', border: '1px solid #4b5563', borderRadius: 6, cursor: 'pointer', fontSize: '14px' }}>Dark Mode</button>
            </div>
          </div>

          {/* Schedule / Calendar */}
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: 12, color: dm ? '#60a5fa' : '#1e40af' }}>Schedule</h3>
            <button onClick={onOpenCalendar} style={{ padding: '12px 24px', background: '#2563eb', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}>Set Days</button>
            {selectedDates.size > 0 && (
              <p style={{ marginTop: 12, fontSize: '14px', color: dm ? '#d1d5db' : '#374151' }}>
                <strong>{selectedDates.size}</strong> day{selectedDates.size !== 1 ? 's' : ''} selected
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}