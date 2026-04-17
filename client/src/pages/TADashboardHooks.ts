import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shift, CurrentUser, ActiveShiftResponse, TextSize, ElapsedTime } from './TADashboardTypes';
import { getTaAuthHeaders } from './TADashboardUtils';

const TEXT_SIZE_MAP: Record<TextSize, string> = {
  S: '13px',
  M: '16px',
  L: '20px',
};

// ---------------------------------------------------------------------------
// useSettings — dark mode, text size, language persistence
// ---------------------------------------------------------------------------
export function useSettings() {
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('ta_dark_mode') === 'true';
  });

  const [textSize, setTextSize] = useState<TextSize>(() => {
    return (localStorage.getItem('ta_text_size') as TextSize) || 'M';
  });

  // Persist dark mode + toggle body class
  useEffect(() => {
    localStorage.setItem('ta_dark_mode', String(darkMode));
    document.body.classList.toggle('dark-mode', darkMode);
  }, [darkMode]);

  // Inject dark-mode CSS for gridjs elements that can't use React state
  useEffect(() => {
    const styleId = 'dark-mode-styles';
    const existing = document.getElementById(styleId);
    if (existing) existing.remove();

    if (darkMode) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        body.dark-mode { background-color: #111827 !important; color: #f9fafb !important; }
        body.dark-mode .page-container { background-color: #111827 !important; }
        body.dark-mode .page-header { background-color: #1f2937 !important; border-bottom: 1px solid #374151 !important; }
        body.dark-mode .page-title { color: #f9fafb !important; }
        body.dark-mode h1 { color: #f9fafb !important; }
        body.dark-mode p { color: #d1d5db !important; }
        body.dark-mode strong { color: #f9fafb !important; }
        body.dark-mode .gridjs-wrapper { background-color: #1f2937 !important; border: 1px solid #374151 !important; border-radius: 10px !important; overflow: hidden !important; }
        body.dark-mode .gridjs-thead { background-color: #273549 !important; }
        body.dark-mode .gridjs-th { background-color: #273549 !important; color: #93c5fd !important; border-color: #374151 !important; font-weight: 600 !important; }
        body.dark-mode .gridjs-th-content { color: #93c5fd !important; }
        body.dark-mode .gridjs-tr { background-color: #1f2937 !important; border-bottom: 1px solid #2d3748 !important; }
        body.dark-mode .gridjs-tr:hover { background-color: #263348 !important; }
        body.dark-mode .gridjs-td { color: #e5e7eb !important; border-color: #2d3748 !important; background-color: transparent !important; }
        body.dark-mode .gridjs-search-input { background-color: #1f2937 !important; color: #f9fafb !important; border: 1px solid #4b5563 !important; border-radius: 8px !important; }
        body.dark-mode .gridjs-search-input::placeholder { color: #6b7280 !important; }
        body.dark-mode .gridjs-pagination { background-color: #1f2937 !important; border-top: 1px solid #374151 !important; color: #9ca3af !important; }
        body.dark-mode .gridjs-pages button { background-color: #273549 !important; color: #d1d5db !important; border: 1px solid #374151 !important; border-radius: 6px !important; }
        body.dark-mode .gridjs-pages button:hover { background-color: #334155 !important; color: #f9fafb !important; }
        body.dark-mode .gridjs-pages button.gridjs-currentPage { background-color: #3b82f6 !important; color: white !important; border-color: #3b82f6 !important; }
        body.dark-mode .gridjs-summary { color: #6b7280 !important; }
        body.dark-mode .btn-primary { background-color: #2563eb !important; color: white !important; }
        body.dark-mode .btn-primary:disabled { background-color: #1e3a5f !important; color: #4b5563 !important; }
        body.dark-mode .btn-settings { background-color: #374151 !important; color: #d1d5db !important; border: 1px solid #4b5563 !important; }
        body.dark-mode .btn-danger { background-color: #dc2626 !important; color: white !important; }
      `;
      document.head.appendChild(style);
    }
  }, [darkMode]);

  // Apply font size CSS variable
  useEffect(() => {
    localStorage.setItem('ta_text_size', textSize);
    document.documentElement.style.setProperty('--ta-font-size', TEXT_SIZE_MAP[textSize]);
  }, [textSize]);

  return { darkMode, setDarkMode, textSize, setTextSize };
}

// ---------------------------------------------------------------------------
// useAuth — session management, current user, navigation guard
// ---------------------------------------------------------------------------
export function useAuth() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [assignedClassroom, setAssignedClassroom] = useState<string>('');

  // Auto-logout on tab/window close
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent): void => {
      if (!e.defaultPrevented) {
        localStorage.removeItem('current_ta_user');
        sessionStorage.setItem('ta_session_ended', 'true');
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  useEffect(() => {
    const sessionEnded = sessionStorage.getItem('ta_session_ended');
    if (sessionEnded === 'true') {
      sessionStorage.removeItem('ta_session_ended');
      localStorage.removeItem('current_ta_user');
      navigate('/ta/login');
      return;
    }

    const userStr = localStorage.getItem('current_ta_user');
    const user: CurrentUser | null = userStr ? JSON.parse(userStr) : null;
    if (!user) {
      navigate('/ta/login');
      return;
    }
    setCurrentUser(user);
    setAssignedClassroom(user.classroom ?? '');
  }, [navigate]);

  return { currentUser, setCurrentUser, assignedClassroom, setAssignedClassroom };
}

// ---------------------------------------------------------------------------
// useShifts — fetch, update, toggle attendance, update notes
// ---------------------------------------------------------------------------
export function useShifts(currentUser: CurrentUser | null) {
  const [data, setData] = useState<Shift[]>([]);

  const fetchShifts = async (): Promise<void> => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/shifts`, {
        headers: getTaAuthHeaders(),
      });
      const json: Shift[] = await res.json();
      setData(json);
    } catch (err) {
      console.error('Failed to fetch shifts:', err);
    }
  };

  useEffect(() => {
    fetchShifts();
  }, []);

  const toggleAttendance = async (shiftId: number, newStatus: string): Promise<void> => {
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/api/shifts/${shiftId}`, {
        method: 'PUT',
        headers: getTaAuthHeaders(true),
        body: JSON.stringify({ attendance: newStatus }),
      });
      setData(prev =>
        prev.map(shift => (shift.id === shiftId ? { ...shift, attendance: newStatus } : shift))
      );
    } catch (err) {
      console.error('Failed to update attendance:', err);
      alert('Failed to update attendance. Please try again.');
    }
  };

  const updateNotes = async (shiftId: number, notes: string): Promise<void> => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/shifts/${shiftId}`, {
        method: 'PUT',
        headers: getTaAuthHeaders(true),
        body: JSON.stringify({ notes }),
      });
      if (!res.ok) throw new Error('Failed to update notes');
      // mutate in place so grid.js won't rebuild
      const shift = data.find(s => s.id === shiftId);
      if (shift) shift.notes = notes;
      // setData(prev =>
      //   prev.map(shift => (shift.id === shiftId ? { ...shift, notes } : shift))
      // );
    } catch (err) {
      console.error('Failed to update notes:', err);
      alert('Failed to update notes. Please try again.');
    }
  };

  const taData = useMemo(() =>
    currentUser ? data.filter(row => row.ta_id === currentUser.id) : [],
    [data, currentUser]
  );

  return { data, setData, taData, fetchShifts, toggleAttendance, updateNotes };
}

// ---------------------------------------------------------------------------
// useClock — clock in/out state and actions
// ---------------------------------------------------------------------------
export function useClock(
  currentUser: CurrentUser | null,
  fetchShifts: () => Promise<void>
) {
  const [clockedIn, setClockedIn] = useState<boolean>(false);
  const [activeShiftId, setActiveShiftId] = useState<number | null>(null);
  const [clockInTime, setClockInTime] = useState<Date | null>(null);
  const [lastClockInTime, setLastClockInTime] = useState<Date | null>(null);
  const [clockOutTime, setClockOutTime] = useState<Date | null>(null);
  const [elapsed, setElapsed] = useState<ElapsedTime | null>(null);

  const checkActiveShift = async (userId: number): Promise<void> => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/shifts/active/${userId}`, {
        headers: getTaAuthHeaders(),
      });
      const json: ActiveShiftResponse = await res.json();
      if (json.activeShift) {
        setClockedIn(true);
        setActiveShiftId(json.activeShift.id);
        setClockInTime(new Date(json.activeShift.clock_in));
      } else {
        setClockedIn(false);
        setActiveShiftId(null);
        setClockInTime(null);
      }
    } catch (err) {
      console.error('Failed to check active shift:', err);
    }
  };

  const clockIn = async (): Promise<void> => {
    try {
      const time = new Date();
      setClockInTime(time);

      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/shifts`, {
        method: 'POST',
        headers: getTaAuthHeaders(true),
        body: JSON.stringify({
          ta_id: currentUser!.id,
          clock_in: time.toISOString(),
          notes: '',
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to clock in');
      }

      const newShift: Shift = await res.json();
      if (!newShift.id) throw new Error('No shift ID returned from server!');

      setClockedIn(true);
      setActiveShiftId(newShift.id);
      alert('Successfully clocked in!');
    } catch (err) {
      console.error('Failed to clock in:', err);
      setClockedIn(false);
      alert((err as Error).message || 'Failed to clock in. Please try again.');
    }
  };

  const clockOut = async (): Promise<void> => {
    const time = new Date();
    setClockOutTime(time);

    let elapsedTimeText = '';
    if (clockInTime) {
      const diff = time.getTime() - clockInTime.getTime();
      const totalMinutes = Math.floor(diff / 1000 / 60);
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      setElapsed({ hours, minutes });
      elapsedTimeText = `${hours}hr${minutes.toString().padStart(2, '0')}min`;
    }

    if (!activeShiftId) {
      alert('Error: No active shift found to clock out.');
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/shifts/${activeShiftId}`, {
        method: 'PUT',
        headers: getTaAuthHeaders(true),
        body: JSON.stringify({ clock_out: time.toISOString(), elapsed_time: elapsedTimeText }),
      });

      const responseData = await response.json();
      if (!response.ok) throw new Error(responseData.error || 'Failed to clock out');

      await fetchShifts();
      setClockedIn(false);
      setActiveShiftId(null);
      setLastClockInTime(clockInTime);
      setClockInTime(null);
      alert('Successfully clocked out!');
    } catch (err) {
      console.error('Clock out failed:', err);
      alert((err as Error).message || 'Failed to clock out. Please try again.');
    }
  };

  return {
    clockedIn,
    activeShiftId,
    clockInTime,
    lastClockInTime,
    clockOutTime,
    elapsed,
    checkActiveShift,
    clockIn,
    clockOut,
  };
}