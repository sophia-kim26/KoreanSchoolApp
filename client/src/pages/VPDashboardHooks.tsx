import { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { TAData, FridayData, SaturdayData, CalendarDatesResponse } from './VPDashboardTypes';

// ---------------------------------------------------------------------------
// useVPSettings — dark mode persistence + CSS injection
// ---------------------------------------------------------------------------
export function useVPSettings() {
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('vp_dark_mode') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('vp_dark_mode', String(darkMode));
    document.body.classList.toggle('dark-mode', darkMode);
  }, [darkMode]);

  useEffect(() => {
    const styleId = 'vp-dark-mode-styles';
    const existing = document.getElementById(styleId);
    if (existing) existing.remove();
    if (darkMode) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        body.dark-mode { background-color: #111827 !important; color: #f9fafb !important; }
        body.dark-mode .page-container { background-color: #111827 !important; }
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
      `;
      document.head.appendChild(style);
    }
  }, [darkMode]);

  return { darkMode, setDarkMode };
}

// ---------------------------------------------------------------------------
// useVPToken — thin wrapper around Auth0 getAccessTokenSilently
// ---------------------------------------------------------------------------
export function useVPToken() {
  const { getAccessTokenSilently } = useAuth0();
  const getToken = (): Promise<string> =>
    getAccessTokenSilently({
      authorizationParams: { audience: import.meta.env.VITE_AUTH0_AUDIENCE },
    });
  return { getToken };
}

// ---------------------------------------------------------------------------
// useVPData — fetches TAs, Friday, Saturday, and calendar dates
// ---------------------------------------------------------------------------
export function useVPData(getToken: () => Promise<string>) {
  const [data, setData] = useState<TAData[]>([]);
  const [fridayData, setFridayData] = useState<FridayData[]>([]);
  const [saturdayData, setSaturdayData] = useState<SaturdayData[]>([]);
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set());
  const [enrichedFridayData, setEnrichedFridayData] = useState<any[]>([]);

  const { isLoading, isAuthenticated } = useAuth0();

  const fetchData = async (token: string): Promise<void> => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/tas`, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      const json = await response.json();
      if (Array.isArray(json)) {
        const sorted = json.sort((a, b) => {
          if (a.is_active === b.is_active) return a.id - b.id;
          return (b.is_active ? 1 : 0) - (a.is_active ? 1 : 0);
        });
        setData(sorted);
      } else {
        setData([]);
      }
    } catch (err) {
      console.error('Fetch TAs error:', err);
      setData([]);
    }
  };

  const fetchSavedDates = async (token: string): Promise<void> => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/friday/get-calendar-dates`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json: CalendarDatesResponse = await response.json();
      if (json.dates && Array.isArray(json.dates)) {
        setSelectedDates(new Set(json.dates));
      }
    } catch (err) {
      console.error('Error fetching saved dates:', err);
    }
  };

  const fetchFridayData = async (token: string): Promise<void> => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/friday`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      setFridayData(Array.isArray(json) ? json : []);
    } catch (err) {
      console.error('Fetch Friday error:', err);
      setFridayData([]);
    }
  };

  const fetchSaturdayData = async (token: string): Promise<void> => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/saturday`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      setSaturdayData(Array.isArray(json) ? json : []);
    } catch (err) {
      console.error('Fetch Saturday error:', err);
      setSaturdayData([]);
    }
  };

  // Initial load
  useEffect(() => {
    if (isLoading || !isAuthenticated) return;
    const loadAll = async () => {
      try {
        const token = await getToken();
        await Promise.all([
          fetchData(token),
          fetchSavedDates(token),
          fetchFridayData(token),
          fetchSaturdayData(token),
        ]);
      } catch (err) {
        console.error('Failed to initialize VP dashboard:', err);
      }
    };
    loadAll();
  }, [isAuthenticated, isLoading]);

  // Enrich friday data with classroom from TA list
  useEffect(() => {
    if (fridayData.length === 0 || data.length === 0) return;
    const enriched = fridayData.map(row => {
      const taMatch = data.find(ta => ta.id === row.id);
      return { ...row, classroom: taMatch?.classroom ?? '' };
    });
    setEnrichedFridayData(enriched);
  }, [fridayData, data]);

  return {
    data, setData,
    fridayData, setFridayData,
    saturdayData, setSaturdayData,
    selectedDates, setSelectedDates,
    enrichedFridayData, setEnrichedFridayData,
    fetchData, fetchFridayData, fetchSaturdayData, fetchSavedDates,
  };
}

// ---------------------------------------------------------------------------
// useVPActions — attendance, deactivate, classroom, save dates
// ---------------------------------------------------------------------------
export function useVPActions(
  getToken: () => Promise<string>,
  fetchData: (token: string) => Promise<void>,
  fetchFridayData: (token: string) => Promise<void>,
  fetchSaturdayData: (token: string) => Promise<void>,
  setData: React.Dispatch<React.SetStateAction<TAData[]>>,
  setEnrichedFridayData: React.Dispatch<React.SetStateAction<any[]>>,
  selectedDates: Set<string>,
  setShowCalendar: (v: boolean) => void,
) {
  const toggleAttendance = async (taId: number, currentAttendance: string): Promise<void> => {
    try {
      const token = await getToken();
      if (currentAttendance === 'Present') {
        await fetch(`${import.meta.env.VITE_API_URL}/api/attendance/clock-out/${taId}`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await fetch(`${import.meta.env.VITE_API_URL}/api/attendance/clock-in`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ ta_id: taId }),
        });
      }
      fetchData(token);
    } catch (err) {
      console.error(err);
      alert('Error updating attendance');
    }
  };

  const deactivateTA = async (taId: number): Promise<void> => {
    if (!confirm('Are you sure you want to deactivate this TA?')) return;
    try {
      const token = await getToken();
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/tas/${taId}/deactivate`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        fetchData(token);
      } else {
        alert('Failed to deactivate TA');
      }
    } catch (err) {
      console.error(err);
      alert('Error deactivating TA');
    }
  };

  const updateClassroom = async (taId: number, classroom: string): Promise<void> => {
    setData(prev => prev.map(ta => ta.id === taId ? { ...ta, classroom } : ta));
    setEnrichedFridayData(prev => prev.map(row => row.id === taId ? { ...row, classroom } : row));
    try {
      const token = await getToken();
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/tas/${taId}/classroom`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ classroom }),
      });
      if (!response.ok) throw new Error('Failed to update classroom');
    } catch (err) {
      console.error(err);
      alert('Error updating classroom');
      const token = await getToken();
      await fetchData(token);
      await fetchFridayData(token);
    }
  };

  const handleSaveDates = async (): Promise<void> => {
    try {
      const token = await getToken();
      const datesArray = Array.from(selectedDates);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/friday/save-calendar-dates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ dates: datesArray }),
      });
      if (response.ok) {
        setShowCalendar(false);
        const freshToken = await getToken();
        await Promise.all([fetchFridayData(freshToken), fetchSaturdayData(freshToken)]);
        alert('Dates saved! The table now shows only selected dates.');
      } else {
        const text = await response.text();
        alert(`Failed to save dates. Status: ${response.status}. ${text}`);
      }
    } catch (err) {
      alert(`Error saving dates: ${(err as Error).message}`);
    }
  };

  return { toggleAttendance, deactivateTA, updateClassroom, handleSaveDates };
}