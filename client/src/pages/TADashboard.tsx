import { useState, useMemo } from 'react';
import { Grid } from 'gridjs-react';
import { useAuth0 } from '@auth0/auth0-react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';
import Chart from './Chart';
import { translations, Language } from './translations';
import { TADashboardProps } from './TADashboardTypes';
import { formatDate, formatTime, parseElapsedToHours } from './TADashboardUtils';
import { useSettings, useAuth, useShifts, useClock } from './TADashboardHooks';
import { useGridColumns } from './TADashboardColumns';
import { ClockInConfirmModal, ClockOutConfirmModal, NotesEditModal } from './TADashboardModals';
import { SettingsModal } from './TADashboardSettings';
import 'gridjs/dist/theme/mermaid.css';

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

function TADashboard({ taId }: TADashboardProps): React.ReactElement {
  const [language, setLanguage] = useState<Language>('en');
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showClockInConfirm, setShowClockInConfirm] = useState(false);
  const [showClockOutConfirm, setShowClockOutConfirm] = useState(false);

  // Notes modal state
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [editingShiftId, setEditingShiftId] = useState<number | null>(null);
  const [editingNotes, setEditingNotes] = useState('');

  const { logout } = useAuth0();
  const navigate = useNavigate();

  // Custom hooks
  const { darkMode, setDarkMode, textSize, setTextSize } = useSettings();
  const { currentUser, assignedClassroom } = useAuth();
  const { taData, fetchShifts, toggleAttendance, updateNotes } = useShifts(currentUser);
  const {
    clockedIn, clockInTime, lastClockInTime, clockOutTime, elapsed,
    checkActiveShift, clockIn, clockOut,
  } = useClock(currentUser, fetchShifts);

  // Grid columns
  const handleEditNotes = (shiftId: number, currentNotes: string) => {
    setEditingShiftId(shiftId);
    setEditingNotes(currentNotes || '');
    setShowNotesModal(true);
  };

  const handleSaveNotes = async () => {
    if (editingShiftId) {
      await updateNotes(editingShiftId, editingNotes);
      setShowNotesModal(false);
      setEditingShiftId(null);
      setEditingNotes('');
    }
  };

  const gridColumns = useGridColumns({ language, toggleAttendance, handleEditNotes });

  // Grid data
  const gridData = useMemo(() =>
    taData.map(row => [
      row.id,
      formatDate(row.clock_in),
      row.attendance,
      formatTime(row.clock_in),
      formatTime(row.clock_out),
      row.elapsed_time,
      row.notes,
    ]),
    [taData]
  );

  // Monthly hours for chart
  const totalHours = taData.reduce((sum, shift) => {
    if (!shift.clock_in || !shift.clock_out) return sum;
    const hours = (new Date(shift.clock_out).getTime() - new Date(shift.clock_in).getTime()) / (1000 * 60 * 60);
    return sum + (hours > 0 ? hours : 0);
  }, 0);

  const { monthlyHours, monthLabels } = useMemo(() => {
    const now = new Date();
    const schoolYearStart = now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1;
    const months: { year: number; month: number }[] = [];
    for (let m = 8; m <= 11; m++) months.push({ year: schoolYearStart, month: m });
    for (let m = 0; m <= now.getMonth() && schoolYearStart + 1 <= now.getFullYear(); m++) {
      months.push({ year: schoolYearStart + 1, month: m });
    }
    const monthlyHours = months.map(({ year, month }) =>
      Math.round(
        taData
          .filter(shift => {
            const d = new Date(shift.clock_in);
            return d.getFullYear() === year && d.getMonth() === month;
          })
          .reduce((sum, shift) => sum + parseElapsedToHours(shift.elapsed_time as unknown as string), 0)
        * 10) / 10
    );
    const monthLabels = months.map(({ month }) => MONTH_NAMES[month]);
    return { monthlyHours, monthLabels };
  }, [taData]);

  const taName = currentUser ? `${currentUser.first_name} ${currentUser.last_name}` : 'Unknown';
  const activeFontSize = textSize === 'S' ? '13px' : textSize === 'M' ? '16px' : '20px';

  const handleSignOut = () => {
    localStorage.removeItem('current_ta_user');
    sessionStorage.removeItem('ta_session_ended');
    logout({ logoutParams: { returnTo: window.location.origin } });
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Attendance', 'Clock In', 'Clock Out', 'Elapsed Time', 'Notes'];
    const rows = taData.map(row => [
      formatDate(row.clock_in),
      row.attendance ?? '',
      formatTime(row.clock_in),
      formatTime(row.clock_out),
      row.elapsed_time ?? '',
      row.notes ?? '',
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `timesheet_${taName.replace(/\s+/g, '_')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`page-container${darkMode ? ' dark-mode' : ''}`} style={{ fontSize: activeFontSize }}>

      {/* Header */}
      <div className="page-header" style={{ justifyContent: 'center', alignItems: 'center', flexDirection: 'column', gap: '8px', paddingBottom: '16px' }}>
  <img src={logo} alt="Logo" style={{ height: '64px', width: 'auto' }} />
  <h1 className="page-title" style={{ margin: 0, fontSize: '28px', fontWeight: '700', textAlign: 'center', letterSpacing: '0.5px' }}>
    TA Dashboard
  </h1>
  <p style={{ margin: 0, fontSize: '15px', color: darkMode ? '#9ca3af' : '#6b7280', fontWeight: '400' }}>
    Timesheet for <strong style={{ color: darkMode ? '#93c5fd' : '#0369a1' }}>{taName}</strong>
  </p>
        <div style={{ position: 'absolute', top: '100px', right: '20px', display: 'flex', gap: 10, zIndex: 10 }}>
          <button onClick={() => setShowClockInConfirm(true)} className="btn-primary" disabled={clockedIn}>
            {translations[language].clockIn}
          </button>
          <button onClick={() => setShowClockOutConfirm(true)} className="btn-primary" disabled={!clockedIn}>
            {translations[language].clockOut}
          </button>
          <button onClick={() => setShowSettingsModal(true)} className="btn-settings">
            {translations[language].settings}
          </button>
          <button onClick={handleSignOut} className="btn-danger">
            {translations[language].signOut}
          </button>
        </div>
      </div>

      {/* Assigned Classroom */}
      <div style={{
        marginTop: '20px', marginBottom: '20px', padding: '12px 20px',
        backgroundColor: darkMode ? '#1e3a5f' : '#e0f2fe',
        border: darkMode ? '2px solid #3b82f6' : '2px solid #0ea5e9',
        borderRadius: '8px', display: 'inline-block',
        fontSize: '16px', fontWeight: '500',
        color: darkMode ? '#93c5fd' : '#0c4a6e',
      }}>
        <strong>{translations[language].assignedClassroom}: </strong>{assignedClassroom}
      </div>

      {/* Clock status */}
      <div style={{ marginBottom: '10px', fontSize: '18px' }}>
        {(clockInTime || lastClockInTime) && (
          <p><strong>Clocked In:</strong> {(clockInTime || lastClockInTime)!.toLocaleString()}</p>
        )}
        {clockOutTime && (
          <p><strong>Clocked Out:</strong> {clockOutTime.toLocaleString()}</p>
        )}
        {elapsed && (
          <p><strong>Total Time Worked:</strong> {elapsed.hours} hours and {elapsed.minutes} minutes</p>
        )}
      </div>

      {/* Shifts Table */}
      {taData.length === 0 ? (
        <p>No data found.</p>
      ) : (
        <div style={{ position: 'relative' }}>
          <button
            onClick={exportToCSV}
            className="btn-primary"
            style={{ position: 'absolute', top: '-40px', right: '0', zIndex: 1 }}
          >
            Export CSV
          </button>
          <Grid
            key={`ta-shifts-grid-${language}`}
            data={gridData}
            columns={gridColumns}
            search={true}
            pagination={{ limit: 8 }}
            sort={true}
          />
        </div>
      )}

      {/* Chart */}
      <h1 className="page-title" style={{ marginTop: '20px' }}>Volunteer Hours for {taName}</h1>
      <h1>Hours by month</h1>
      {currentUser && (
        <Chart
          currentUser={currentUser}
          darkMode={darkMode}
          monthlyHours={monthlyHours}
          monthLabels={monthLabels}
          shifts={taData}
          totalHours={totalHours}
          language={language}
        />
      )}

      {/* Modals */}
      {showNotesModal && (
        <NotesEditModal
          darkMode={darkMode}
          notes={editingNotes}
          onNotesChange={setEditingNotes}
          onSave={handleSaveNotes}
          onCancel={() => { setShowNotesModal(false); setEditingShiftId(null); setEditingNotes(''); }}
        />
      )}

      {showClockInConfirm && (
        <ClockInConfirmModal
          darkMode={darkMode}
          language={language}
          onConfirm={() => { setShowClockInConfirm(false); clockIn(); }}
          onCancel={() => setShowClockInConfirm(false)}
        />
      )}

      {showClockOutConfirm && (
        <ClockOutConfirmModal
          darkMode={darkMode}
          language={language}
          onConfirm={() => { setShowClockOutConfirm(false); clockOut(); }}
          onCancel={() => setShowClockOutConfirm(false)}
        />
      )}

      {showSettingsModal && (
        <SettingsModal
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          textSize={textSize}
          setTextSize={setTextSize}
          language={language}
          setLanguage={setLanguage}
          taName={taName}
          email={currentUser?.email}
          onClose={() => setShowSettingsModal(false)}
        />
      )}
    </div>
  );
}

export default TADashboard;