import React, { useState, useEffect } from 'react';
import { translations, Language } from './translations';
import { TabType, TextSize } from './TADashboardTypes';

interface SettingsModalProps {
  darkMode: boolean;
  setDarkMode: (value: boolean) => void;
  textSize: TextSize;
  setTextSize: (value: TextSize) => void;
  language: Language;
  setLanguage: (value: Language) => void;
  taName: string;
  email: string | undefined;
  onClose: () => void;
}

export function SettingsModal({
  darkMode,
  setDarkMode,
  textSize,
  setTextSize,
  language,
  setLanguage,
  taName,
  email,
  onClose,
}: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('appearance');
  const [showPassword, setShowPassword] = useState(false);

  // Reset password visibility when leaving the privacy tab
  useEffect(() => {
    if (activeTab !== 'privacy') setShowPassword(false);
  }, [activeTab]);

  const tabStyle = (tab: TabType): React.CSSProperties => ({
    padding: '12px 24px',
    background: activeTab === tab ? (darkMode ? '#1e3a5f' : '#bfdbfe') : 'transparent',
    border: 'none',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    color: activeTab === tab
      ? (darkMode ? '#93c5fd' : '#1e40af')
      : (darkMode ? '#9ca3af' : '#6b7280'),
  });

  const sectionHeadingStyle: React.CSSProperties = {
    fontSize: '16px',
    fontWeight: '600',
    marginBottom: 12,
    color: darkMode ? '#60a5fa' : '#1e40af',
  };

  const fieldBoxStyle: React.CSSProperties = {
    padding: '10px 16px',
    background: darkMode ? '#273549' : 'white',
    border: darkMode ? '1px solid #4b5563' : '1px solid #d1d5db',
    borderRadius: 6,
    width: '200px',
    color: darkMode ? '#e5e7eb' : 'inherit',
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        background: darkMode ? '#1f2937' : 'white',
        color: darkMode ? '#f9fafb' : 'inherit',
        padding: 30, borderRadius: 12,
        width: 600, maxWidth: '90%',
        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', fontSize: '20px',
              cursor: 'pointer', padding: '5px 10px', marginRight: '10px',
              color: darkMode ? '#9ca3af' : '#6b7280',
            }}
          >
            ←
          </button>
          <h2 style={{ margin: 0, fontSize: '32px', fontWeight: '700' }}>
            {translations[language].settings}
          </h2>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex', gap: 0, marginBottom: 24,
          borderBottom: darkMode ? '2px solid #374151' : '2px solid #e5e7eb',
        }}>
          {(['appearance', 'account', 'privacy'] as TabType[]).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={tabStyle(tab)}>
              {translations[language][tab as keyof typeof translations[typeof language]] as string}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div style={{
          background: darkMode ? '#172a45' : '#dbeafe',
          padding: 30, borderRadius: 8, minHeight: '400px',
        }}>

          {/* Appearance Tab */}
          {activeTab === 'appearance' && (
            <>
              {/* Language */}
              <div style={{ marginBottom: 30 }}>
                <h3 style={sectionHeadingStyle}>{translations[language].languagePreferences}</h3>
                <div style={{ display: 'flex', gap: 10 }}>
                  {(['en', 'ko'] as Language[]).map(lang => (
                    <button key={lang} onClick={() => setLanguage(lang)} style={{
                      padding: '10px 30px',
                      background: language === lang ? (darkMode ? '#1e3a5f' : '#bfdbfe') : (darkMode ? '#273549' : 'white'),
                      color: language === lang ? (darkMode ? '#93c5fd' : '#1e40af') : (darkMode ? '#d1d5db' : '#374151'),
                      border: darkMode ? '1px solid #4b5563' : '1px solid #d1d5db',
                      borderRadius: 6, cursor: 'pointer', fontSize: '14px', fontWeight: '500',
                    }}>
                      {lang === 'en' ? translations[language].english : translations[language].korean}
                    </button>
                  ))}
                </div>
              </div>

              {/* Theme */}
              <div style={{ marginBottom: 30 }}>
                <h3 style={sectionHeadingStyle}>{translations[language].theme}</h3>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => setDarkMode(false)} style={{
                    padding: '10px 30px',
                    background: !darkMode ? '#1e40af' : (darkMode ? '#273549' : 'white'),
                    color: !darkMode ? 'white' : (darkMode ? '#d1d5db' : '#374151'),
                    border: darkMode ? '1px solid #4b5563' : '1px solid #d1d5db',
                    borderRadius: 6, cursor: 'pointer', fontSize: '14px', fontWeight: '500',
                  }}>
                    {translations[language].lightMode}
                  </button>
                  <button onClick={() => setDarkMode(true)} style={{
                    padding: '10px 30px',
                    background: darkMode ? '#3b82f6' : 'white',
                    color: darkMode ? 'white' : '#374151',
                    border: '1px solid #4b5563',
                    borderRadius: 6, cursor: 'pointer', fontSize: '14px',
                  }}>
                    {translations[language].darkMode}
                  </button>
                </div>
              </div>

              {/* Text Size */}
              <div>
                <h3 style={sectionHeadingStyle}>{translations[language].textIconSize}</h3>
                <div style={{ display: 'flex', gap: 10 }}>
                  {(['S', 'M', 'L'] as TextSize[]).map(size => (
                    <button key={size} onClick={() => setTextSize(size)} style={{
                      padding: '10px 20px',
                      background: textSize === size ? '#1e40af' : (darkMode ? '#273549' : 'white'),
                      color: textSize === size ? 'white' : (darkMode ? '#d1d5db' : '#374151'),
                      border: `2px solid ${textSize === size ? '#1e40af' : (darkMode ? '#4b5563' : '#d1d5db')}`,
                      borderRadius: 6, cursor: 'pointer', fontWeight: '600',
                      fontSize: size === 'S' ? '12px' : size === 'M' ? '16px' : '20px',
                      minWidth: 48,
                    }}>
                      {size}
                    </button>
                  ))}
                </div>
                <p style={{ marginTop: 8, fontSize: '12px', color: '#6b7280' }}>
                  Current: {textSize === 'S' ? 'Small (13px)' : textSize === 'M' ? 'Medium (16px)' : 'Large (20px)'}
                </p>
              </div>
            </>
          )}

          {/* Account Tab */}
          {activeTab === 'account' && (
            <>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: 20, color: darkMode ? '#60a5fa' : '#1e40af' }}>
                Information
              </h3>
              {[
                { label: 'Name', value: taName },
                { label: 'Email', value: email || 'N/A' },
                { label: 'Phone Number', value: 'Not provided' },
              ].map(({ label, value }) => (
                <div key={label} style={{ marginBottom: 20 }}>
                  <p style={{ marginBottom: 8, fontSize: '14px', color: darkMode ? '#60a5fa' : '#1e40af', fontWeight: '600' }}>
                    {label}
                  </p>
                  <div style={fieldBoxStyle}>{value}</div>
                </div>
              ))}
            </>
          )}

          {/* Privacy Tab */}
          {activeTab === 'privacy' && (
            <>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: 20, color: darkMode ? '#60a5fa' : '#1e40af' }}>
                Security
              </h3>
              <div style={{ marginBottom: 24 }}>
                <p style={{ marginBottom: 8, fontSize: '14px', color: darkMode ? '#60a5fa' : '#1e40af', fontWeight: '600' }}>
                  Password
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <div style={{
                    ...fieldBoxStyle,
                    fontFamily: showPassword ? 'inherit' : 'monospace',
                    letterSpacing: showPassword ? 'normal' : '0.15em',
                    fontSize: '14px',
                  }}>
                    {showPassword
                      ? (email ? '(managed via Auth0 — reset via email)' : 'No password on file')
                      : '••••••••'}
                  </div>
                  <button
                    onClick={() => setShowPassword(prev => !prev)}
                    style={{
                      padding: '8px 16px',
                      background: darkMode ? '#273549' : 'white',
                      border: darkMode ? '1px solid #4b5563' : '1px solid #d1d5db',
                      borderRadius: 6, cursor: 'pointer', fontSize: '14px',
                      display: 'flex', alignItems: 'center', gap: 6,
                      color: darkMode ? '#e5e7eb' : '#374151',
                    }}
                    onMouseOver={e => (e.currentTarget.style.background = darkMode ? '#334155' : '#f3f4f6')}
                    onMouseOut={e => (e.currentTarget.style.background = darkMode ? '#273549' : 'white')}
                  >
                    {showPassword ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                    {showPassword ? 'Hide' : 'View'}
                  </button>
                </div>
                {showPassword && (
                  <p style={{ fontSize: '12px', color: '#6b7280', marginTop: 4, maxWidth: 320 }}>
                    Passwords are managed securely through Auth0. To change your password, click "Forgot password" on the login page.
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}