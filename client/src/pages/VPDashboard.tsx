import { Grid } from 'gridjs-react';
import { h } from 'gridjs';
import 'gridjs/dist/theme/mermaid.css';
import logo from '../assets/logo.png';
import { useAuth0 } from '@auth0/auth0-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

import { FormData, Language, MainTab, VP_TRANSLATIONS, CreateAccountResponse, CLASSROOMS } from './VPDashboardTypes';
import { generatePIN, formatDateKey } from './VPDashboardUtils';
import { useVPSettings, useVPToken, useVPData, useVPActions } from './VPDashboardHooks';
import { getFridayColumns, getSaturdayColumns, buildFridayGridColumns, buildSaturdayGridColumns } from './VPDashboardColumns';
import { PinModal, AddTAModal, CalendarModal } from './VPDashboardModals';
import { VPSettingsModal } from './VPDashboardSettings';
import { DATE_REGEX, isDateInPast } from './VPDashboardUtils';

function VPDashboard(): React.ReactElement {
  const [showModal, setShowModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [generatedPin, setGeneratedPin] = useState('');
  const [newTAName, setNewTAName] = useState('');
  const [mainTab, setMainTab] = useState<MainTab>('tas');
  const [language, setLanguage] = useState<Language>('en');
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [formData, setFormData] = useState<FormData>({
    first_name: '', last_name: '', email: '', session_day: '',
    is_active: true, korean_name: '', classroom: '',
  });

  const { isLoading, logout } = useAuth0();
  const navigate = useNavigate();
  const { darkMode: dm, setDarkMode } = useVPSettings();
  const { getToken } = useVPToken();
  const {
    data, setData,
    fridayData,
    saturdayData,
    selectedDates, setSelectedDates,
    enrichedFridayData, setEnrichedFridayData,
    enrichedSaturdayData, setEnrichedSaturdayData,
    fetchData, fetchFridayData, fetchSaturdayData,
  } = useVPData(getToken);
  const { toggleAttendance, deactivateTA, updateClassroom, handleSaveDates } = useVPActions(
    getToken, fetchData, fetchFridayData, fetchSaturdayData,
    setData, setEnrichedFridayData, setEnrichedSaturdayData, selectedDates, setShowCalendar,
  );

  // Dark-mode style shorthands
  const headingColor = dm ? '#f9fafb' : 'inherit';
  const tabBorderBottom = dm ? '2px solid #374151' : '2px solid #e5e7eb';
  const mainTabBg = (active: boolean) => active ? (dm ? '#1e3a5f' : '#bfdbfe') : 'transparent';
  const mainTabColor = (active: boolean) => active ? (dm ? '#93c5fd' : '#1e40af') : (dm ? '#9ca3af' : '#6b7280');

  // TA form handlers
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData.session_day) { alert('Please select a session day'); return; }
    try {
      const pin = generatePIN();
      const token = await getToken();
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/create-account-vp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...formData, ta_code: pin }),
      });
      if (response.ok) {
        const result: CreateAccountResponse = await response.json();
        setGeneratedPin(result.unhashed_pin);
        setNewTAName(`${formData.first_name} ${formData.last_name}`);
        setFormData({ first_name: '', last_name: '', korean_name: '', email: '', session_day: '', is_active: true, classroom: '' });
        setShowModal(false);
        setShowPinModal(true);
        const freshToken = await getToken();
        fetchData(freshToken);
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to add new TA');
      }
    } catch (err) {
      alert('Error adding new TA');
    }
  };

  // Calendar handlers
  const toggleDate = (day: number) => {
    const dateStr = formatDateKey(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const next = new Set(selectedDates);
    next.has(dateStr) ? next.delete(dateStr) : next.add(dateStr);
    setSelectedDates(next);
  };

  const changeMonth = (offset: number) => {
    const d = new Date(currentMonth);
    d.setMonth(d.getMonth() + offset);
    setCurrentMonth(d);
  };

  // Grid data
  const translations = VP_TRANSLATIONS;
  const gridData = data.map(row => [
    row.first_name, row.last_name, row.korean_name, row.session_day,
    row.classroom || '', row.total_hours || '0.00', row.attendance, row.id,
  ]);

  const fridayCols = getFridayColumns(fridayData, selectedDates);
  const saturdayCols = getSaturdayColumns(saturdayData, selectedDates);
  const selectedDatesUnderscored = new Set(Array.from(selectedDates).map(d => d.replace(/-/g, '_')));

  const fridayGridData= enrichedFridayData.map(row => {
    const selectedFridayKeys = fridayCols.map(c => c.id).filter(id => DATE_REGEX.test(id) && selectedDatesUnderscored.has(id));
    const daysPresent = selectedFridayKeys.filter(k => row[k] === true).length;
    const daysAbsent = selectedFridayKeys.filter(k => row[k] !== true && isDateInPast(k)).length;
    return fridayCols.map(col => {
      if (col.id === '__days_present__') return daysPresent;
      if (col.id === '__days_absent__') return daysAbsent;
      return row[col.id];
    });
  });

  const saturdayGridData = enrichedSaturdayData.map(row => {
    const selectedSaturdayKeys = saturdayCols.map(c => c.id).filter(id => DATE_REGEX.test(id) && selectedDatesUnderscored.has(id));
    const daysPresent = selectedSaturdayKeys.filter(k => row[k] === true).length;
    const daysAbsent = selectedSaturdayKeys.filter(k => row[k] !== true && isDateInPast(k)).length;
    return saturdayCols.map(col => {
      if (col.id === '__days_present__') return daysPresent;
      if (col.id === '__days_absent__') return daysAbsent;
      return row[col.id];
    });
  });

  // refreshign table every minute
  useEffect(() => {
    const interval = setInterval(async () => {
      const token = await getToken();
      if (mainTab === 'friday') fetchFridayData(token);
      if (mainTab === 'saturday') fetchSaturdayData(token);
    }, 60_000);

    return () => clearInterval(interval);
  }, [mainTab, getToken, fetchFridayData, fetchSaturdayData]);

  if (isLoading) return <div style={{ padding: 20, minHeight: '100vh', color: headingColor }}>Loading...</div>;

  return (
    <div style={{ padding: '40px 20px', fontFamily: 'system-ui, -apple-system, sans-serif', backgroundColor: dm ? '#111827' : undefined, minHeight: '100vh', color: dm ? '#f9fafb' : 'inherit', overflowX: 'auto' }}>

      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: 30,
        paddingTop: 80
      }}>
        <img src={logo} alt="Logo" className="page-logo" />
        <div style={{ width: 200 }} />  {/* empty left spacer */}
        <h1 style={{ margin: 0, fontSize: '32px', fontWeight: '600', color: headingColor }}>
          VP Dashboard – {mainTab === 'tas' ? 'TA List' : mainTab === 'friday' ? 'Friday Table' : 'Saturday Table'}
        </h1>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => setShowSettingsModal(true)} style={{ padding: '12px 24px', background: dm ? '#374151' : '#a39898ff', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}>Settings</button>
          <button onClick={() => setShowModal(true)} style={{ padding: '12px 24px', background: '#16a34a', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}>Add New TA</button>
          <button
            onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
            style={{ padding: '12px 24px', background: '#dc2626', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Tab Selector */}
      <div style={{ display: 'flex', marginBottom: 24, borderBottom: tabBorderBottom }}>
        {(['tas', 'friday', 'saturday'] as MainTab[]).map(tab => (
          <button key={tab} onClick={() => setMainTab(tab)} style={{ padding: '12px 24px', background: mainTabBg(mainTab === tab), border: 'none', borderTopLeftRadius: 8, borderTopRightRadius: 8, cursor: 'pointer', fontSize: '16px', fontWeight: '600', color: mainTabColor(mainTab === tab) }}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* TAs Tab */}
      {mainTab === 'tas' && (
        data.length === 0 ? (
          <div>
            <p style={{ color: dm ? '#d1d5db' : 'inherit' }}>No data found.</p>
            <button onClick={async () => { const t = await getToken(); fetchData(t); }} style={{ padding: '10px 20px', marginTop: 10 }}>Retry Load</button>
          </div>
        ) : (
          <div style={{ background: dm ? '#1f2937' : '#dbeafe', borderRadius: 8, overflow: 'auto' }}>
            <Grid
              key={language}
              data={gridData}
              columns={[
                { name: translations[language].firstName, width: '120px' },
                { name: translations[language].lastName, width: '120px' },
                { name: translations[language].koreanName, width: '120px' },
                { name: translations[language].sessionDay, width: '120px' },
                { name: translations[language].classroom, width: '150px' },
                { name: translations[language].totalHours, width: '100px', formatter: (cell: any) => `${parseFloat(cell || 0).toFixed(2)}h` },
                {
                  name: translations[language].attendance, width: '120px',
                  formatter: (cell: any, row: any) => {
                    const taId = row.cells[7].data;
                    return h('button', {
                      style: `display: inline-block; padding: 6px 16px; border-radius: 4px; font-weight: 500; font-size: 13px; background-color: ${cell === 'Present' ? '#dcfce7' : '#fee2e2'}; color: ${cell === 'Present' ? '#166534' : '#991b1b'}; border: none; cursor: pointer;`,
                      onclick: () => toggleAttendance(taId, cell),
                    }, cell || 'Absent');
                  },
                },
                {
                  name: translations[language].analytics, width: '140px',
                  formatter: (cell: any) => h('button', {
                    style: `padding: 6px 12px; background-color: #2563eb; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: 600;`,
                    onclick: (e: Event) => { e.stopPropagation(); navigate(`/vp/ta-view/${cell}`); },
                  }, 'View Analytics'),
                },
                {
                  name: translations[language].actions, width: '100px',
                  formatter: (_cell: any, row: any) => {
                    const taId = row.cells[7].data;
                    return h('button', {
                      style: `padding: 6px 12px; background-color: #ef4444; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: 500;`,
                      onclick: (e: Event) => { e.preventDefault(); e.stopPropagation(); deactivateTA(taId); },
                    }, translations[language].remove);
                  },
                },
              ]}
              search={true} pagination={{ limit: 10 }} sort={true}
            />
          </div>
        )
      )}

      {/* Friday Tab */}
      {mainTab === 'friday' && (
        fridayData.length === 0 ? (
          <div>
            <p style={{ color: dm ? '#d1d5db' : 'inherit' }}>No Friday data found. Please select dates in Settings.</p>
            <button onClick={async () => { const t = await getToken(); fetchFridayData(t); }} style={{ padding: '10px 20px', marginTop: 10 }}>Retry Load</button>
          </div>
        ) : (
          <div style={{ background: dm ? '#1f2937' : '#dbeafe', borderRadius: 8, overflow: 'auto' }}>
            <Grid data={fridayGridData} columns={buildFridayGridColumns(fridayCols, fridayData, dm, updateClassroom)} search pagination={{ limit: 10 }} sort />
          </div>
        )
      )}

      {/* Saturday Tab */}
      {mainTab === 'saturday' && (
        saturdayData.length === 0 ? (
          <div>
            <p style={{ color: dm ? '#d1d5db' : 'inherit' }}>No Saturday data found. Please select dates in Settings.</p>
            <button onClick={async () => { const t = await getToken(); fetchSaturdayData(t); }} style={{ padding: '10px 20px', marginTop: 10 }}>Retry Load</button>
          </div>
        ) : (
          <div style={{ background: dm ? '#1f2937' : '#dbeafe', borderRadius: 8, overflow: 'auto' }}>
            <Grid data={saturdayGridData} columns={buildSaturdayGridColumns(saturdayCols, dm)} search pagination={{ limit: 10 }} sort />
          </div>
        )
      )}

      {/* Modals */}
      {showPinModal && (
        <PinModal
          darkMode={dm}
          generatedPin={generatedPin}
          newTAName={newTAName}
          onCopy={() => { navigator.clipboard.writeText(generatedPin); alert('PIN copied!'); }}
          onClose={() => setShowPinModal(false)}
        />
      )}

      {showModal && (
        <AddTAModal
          darkMode={dm}
          formData={formData}
          onInputChange={handleInputChange}
          onSessionDaySelect={day => setFormData(prev => ({ ...prev, session_day: day }))}
          onClassroomChange={classroom => setFormData(prev => ({ ...prev, classroom }))}
          onSubmit={handleSubmit}
          onClose={() => setShowModal(false)}
        />
      )}

      {showSettingsModal && (
        <VPSettingsModal
          darkMode={dm}
          setDarkMode={setDarkMode}
          language={language}
          setLanguage={setLanguage}
          selectedDates={selectedDates}
          onOpenCalendar={() => { setCurrentMonth(new Date()); setShowCalendar(true); }}
          onClose={() => setShowSettingsModal(false)}
        />
      )}

      {showCalendar && (
        <CalendarModal
          darkMode={dm}
          currentMonth={currentMonth}
          selectedDates={selectedDates}
          onChangeMonth={changeMonth}
          onToggleDate={toggleDate}
          onClearAll={() => setSelectedDates(new Set())}
          onSave={handleSaveDates}
          onClose={() => setShowCalendar(false)}
        />
      )}
    </div>
  );
}

export default VPDashboard;