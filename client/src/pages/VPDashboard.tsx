import { useEffect, useState } from "react";
import { Grid } from "gridjs-react";
import { h } from "gridjs";
import "gridjs/dist/theme/mermaid.css";
import { useAuth0 } from "@auth0/auth0-react";
import { useNavigate, NavigateFunction } from "react-router-dom";

// Type definitions
interface TAData {
  id: number;
  first_name: string;
  last_name: string;
  korean_name: string;
  session_day: string;
  classroom?: string;
  is_active: boolean;
  total_hours: number | string;
  attendance: string;
  ta_code: string;
  email: string;
  created_at: string;
  phone?: string;
}

interface FridayData {
  id?: number;
  first_name?: string;
  last_name?: string;
  korean_name?: string;
  [key: string]: any;
}

interface SaturdayData {
  id?: number;
  first_name?: string;
  last_name?: string;
  korean_name?: string;
  [key: string]: any;
}

interface FormData {
  first_name: string;
  last_name: string;
  email: string;
  session_day: string;
  is_active: boolean;
  korean_name: string;
  classroom: string;
}

interface Translations {
  [key: string]: {
    firstName: string;
    lastName: string;
    koreanName: string;
    classroom: string;
    sessionDay: string;
    active: string;
    totalHours: string;
    attendance: string;
    analytics: string;
    actions: string;
    yes: string;
    no: string;
    viewAnalytics: string;
    remove: string;
  };
}

interface CreateAccountResponse {
  success: boolean;
  unhashed_pin: string;
  message?: string;
}

interface CalendarDatesResponse {
  dates?: string[];
}

type Language = 'en' | 'ko';
type ActiveTab = 'appearance';
type MainTab = 'tas' | 'friday' | 'saturday';

const CLASSROOMS = [
  '앵두꽃반', '제비꽃반', '접시꽃반', '초롱꽃반', '풀꽃반', '배꽃반',
  '백합반', '개나리반', '봉선화반', '수선화반', 'KSL1A.도라지꽃반',
  'KSL1B.프리지아반', 'KSL3.붓꽃반', 'KSL4.유채꽃반', 'KSL5 은방울꽃반',
  '진달래반', '채송화반', '월계수반', '모란반', '목련반', '난초반',
  '해바라기반', '장미반', '튤립반', '연꽃반', '국화반', '무궁화반',
];

function VPDashboard(): React.ReactElement {
  const [data, setData] = useState<TAData[]>([]);
  const [fridayData, setFridayData] = useState<FridayData[]>([]);
  const [saturdayData, setSaturdayData] = useState<SaturdayData[]>([]);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [showPinModal, setShowPinModal] = useState<boolean>(false);
  const [generatedPin, setGeneratedPin] = useState<string>('');
  const [newTAName, setNewTAName] = useState<string>('');
  const [activeTab, setActiveTab] = useState<ActiveTab>('appearance');
  const [mainTab, setMainTab] = useState<MainTab>('tas');
  const [language, setLanguage] = useState<Language>('en');
  const [showCalendar, setShowCalendar] = useState<boolean>(false);
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  // Dark mode — same pattern as TADashboard
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('vp_dark_mode') === 'true';
  });

  const [formData, setFormData] = useState<FormData>({
    first_name: "",
    last_name: "",
    email: "",
    session_day: "",
    is_active: true,
    korean_name: "",
    classroom: ""
  });

  // Dark mode class + persist
  useEffect(() => {
    localStorage.setItem('vp_dark_mode', String(darkMode));
    document.body.classList.toggle('dark-mode', darkMode);
  }, [darkMode]);

  // Dark mode CSS injection for gridjs elements
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

        body.dark-mode .gridjs-wrapper { 
          background-color: #1f2937 !important; 
          border: 1px solid #374151 !important; 
          border-radius: 10px !important;
          overflow: hidden !important;
        }
        body.dark-mode .gridjs-thead { background-color: #273549 !important; }
        body.dark-mode .gridjs-th { 
          background-color: #273549 !important; 
          color: #93c5fd !important; 
          border-color: #374151 !important; 
          font-weight: 600 !important;
        }
        body.dark-mode .gridjs-th-content { color: #93c5fd !important; }
        body.dark-mode .gridjs-tr { 
          background-color: #1f2937 !important; 
          border-bottom: 1px solid #2d3748 !important; 
        }
        body.dark-mode .gridjs-tr:hover { background-color: #263348 !important; }
        body.dark-mode .gridjs-td { 
          color: #e5e7eb !important; 
          border-color: #2d3748 !important; 
          background-color: transparent !important; 
        }
        body.dark-mode .gridjs-search-input { 
          background-color: #1f2937 !important; 
          color: #f9fafb !important; 
          border: 1px solid #4b5563 !important; 
          border-radius: 8px !important;
        }
        body.dark-mode .gridjs-search-input::placeholder { color: #6b7280 !important; }
        body.dark-mode .gridjs-pagination { 
          background-color: #1f2937 !important; 
          border-top: 1px solid #374151 !important; 
          color: #9ca3af !important;
        }
        body.dark-mode .gridjs-pages button { 
          background-color: #273549 !important; 
          color: #d1d5db !important; 
          border: 1px solid #374151 !important;
          border-radius: 6px !important;
        }
        body.dark-mode .gridjs-pages button:hover { background-color: #334155 !important; color: #f9fafb !important; }
        body.dark-mode .gridjs-pages button.gridjs-currentPage { 
          background-color: #3b82f6 !important; 
          color: white !important; 
          border-color: #3b82f6 !important;
        }
        body.dark-mode .gridjs-summary { color: #6b7280 !important; }
      `;
      document.head.appendChild(style);
    }
  }, [darkMode]);

  // Color shorthands for inline styles
  const dm = darkMode;
  const bg = dm ? '#111827' : undefined;
  const cardBg = dm ? '#1f2937' : 'white';
  const cardBorder = dm ? '1px solid #374151' : undefined;
  const inputBg = dm ? '#273549' : 'white';
  const inputBorder = dm ? '1px solid #4b5563' : '1px solid #d1d5db';
  const inputColor = dm ? '#e5e7eb' : '#374151';
  const labelColor = dm ? '#9ca3af' : '#374151';
  const headingColor = dm ? '#f9fafb' : 'inherit';
  const subTextColor = dm ? '#9ca3af' : '#374151';
  const tabPanelBg = dm ? '#172a45' : '#dbeafe';
  const tabBorderBottom = dm ? '2px solid #374151' : '2px solid #e5e7eb';
  const mainTabBg = (active: boolean) => active ? (dm ? '#1e3a5f' : '#bfdbfe') : 'transparent';
  const mainTabColor = (active: boolean) => active ? (dm ? '#93c5fd' : '#1e40af') : (dm ? '#9ca3af' : '#6b7280');

  const translations: Translations = {
    en: {
      firstName: "First Name", lastName: "Last Name", koreanName: "Korean Name",
      sessionDay: "Session Day", classroom: "Classroom", active: "Active",
      totalHours: "Total Hours", attendance: "Attendance", analytics: "Analytics",
      actions: "Actions", yes: "Yes", no: "No", viewAnalytics: "View Analytics", remove: "Remove"
    },
    ko: {
      firstName: "이름", lastName: "성", koreanName: "한국어 이름",
      sessionDay: "수업 요일", classroom: "교실", active: "활성 상태",
      totalHours: "총 시간", attendance: "출석", analytics: "통계",
      actions: "작업", yes: "예", no: "아니오", viewAnalytics: "통계 보기", remove: "삭제"
    }
  };

  const generatePIN = (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const { isLoading, isAuthenticated, user, logout, getAccessTokenSilently } = useAuth0();
  const navigate: NavigateFunction = useNavigate();

  const getDaysInMonth = (date: Date): { daysInMonth: number; startingDayOfWeek: number } => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    return { daysInMonth, startingDayOfWeek };
  };

  const formatDateKey = (year: number, month: number, day: number): string => {
    const m = (month + 1).toString().padStart(2, '0');
    const d = day.toString().padStart(2, '0');
    return `${year}-${m}-${d}`;
  };

  const toggleDate = (day: number): void => {
    const dateStr = formatDateKey(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const newSelected = new Set(selectedDates);
    if (newSelected.has(dateStr)) {
      newSelected.delete(dateStr);
    } else {
      newSelected.add(dateStr);
    }
    setSelectedDates(newSelected);
  };

  const isDateSelected = (day: number): boolean => {
    const dateStr = formatDateKey(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    return selectedDates.has(dateStr);
  };

  const changeMonth = (offset: number): void => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() + offset);
    setCurrentMonth(newDate);
  };

  const monthNames: string[] = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  useEffect(() => {
    fetchData();
    fetchSavedDates();
    fetchFridayData();
    fetchSaturdayData();
  }, []);

  const fetchSavedDates = (): void => {
    fetch(`${import.meta.env.VITE_API_URL}/api/friday/get-calendar-dates`)
      .then(res => res.json())
      .then((json: CalendarDatesResponse) => {
        if (json.dates && Array.isArray(json.dates)) {
          setSelectedDates(new Set(json.dates));
        }
      })
      .catch(err => console.log("No saved dates found or error fetching them"));
  };

  const handleSaveDates = async (): Promise<void> => {
    try {
      const datesArray = Array.from(selectedDates);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/friday/save-calendar-dates`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(import.meta.env.VITE_VERCEL_BYPASS_SECRET
            ? { 'x-vercel-protection-bypass': import.meta.env.VITE_VERCEL_BYPASS_SECRET }
            : {})
        },
        body: JSON.stringify({ dates: datesArray })
      });
      if (response.ok) {
        setShowCalendar(false);
        await fetchFridayData();
        await fetchSaturdayData();
        alert("Dates saved! The table now shows only selected dates.");
      } else {
        const responseText = await response.text();
        console.error("Server returned error status:", response.status);
        console.error("Response body:", responseText);
        alert(`Failed to save dates. Status: ${response.status}. Check console for details.`);
      }
    } catch (err) {
      console.error('Error in handleSaveDates:', err);
      alert(`Error saving dates: ${(err as Error).message}`);
    }
  };

  const fetchData = async (): Promise<void> => {
    try {
      const token = await getAccessTokenSilently();
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/tas`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      const json = await response.json();
      if (Array.isArray(json)) {
        const sorted = json.sort((a, b) => {
          if (a.is_active === b.is_active) return a.id - b.id;
          return (b.is_active ? 1 : 0) - (a.is_active ? 1 : 0);
        });
        setData(sorted);
      } else {
        console.error("Backend returned an error or non-array:", json);
        setData([]);
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setData([]);
    }
  };

  const fetchFridayData = async (): Promise<void> => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/friday`);
      const json = await res.json();
      setFridayData(Array.isArray(json) ? json : []);
    } catch (err) {
      console.error("Fetch Friday error:", err);
      setFridayData([]);
    }
  };

  const fetchSaturdayData = async (): Promise<void> => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/saturday`);
      const json = await res.json();
      setSaturdayData(Array.isArray(json) ? json : []);
    } catch (err) {
      console.error("Fetch Saturday error:", err);
      setSaturdayData([]);
    }
  };

  const handleSignOut = (): void => {
    logout({ logoutParams: { returnTo: window.location.origin } });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSessionDaySelect = (day: string): void => {
    setFormData(prev => ({ ...prev, session_day: day }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (!formData.session_day) {
      alert("Please select a session day (Friday, Saturday, or Both)");
      return;
    }
    try {
      const pin = generatePIN();
      const dataToSend = { ...formData, ta_code: pin };
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/create-account-vp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSend)
      });
      if (response.ok) {
        const result: CreateAccountResponse = await response.json();
        setGeneratedPin(result.unhashed_pin);
        setNewTAName(`${formData.first_name} ${formData.last_name}`);
        setFormData({ first_name: "", last_name: "", korean_name: "", email: "", session_day: "", is_active: true, classroom: "" });
        setShowModal(false);
        setShowPinModal(true);
        fetchData();
      } else {
        const error = await response.json();
        alert(error.message || "Failed to add new TA");
      }
    } catch (err) {
      console.error(err);
      alert("Error adding new TA");
    }
  };

  const copyPinToClipboard = (): void => {
    navigator.clipboard.writeText(generatedPin);
    alert('PIN copied to clipboard!');
  };

  const toggleAttendance = async (taId: number, currentAttendance: string): Promise<void> => {
    try {
      if (currentAttendance === 'Present') {
        await fetch(`${import.meta.env.VITE_API_URL}/api/attendance/clock-out/${taId}`, { method: 'POST' });
      } else {
        await fetch(`${import.meta.env.VITE_API_URL}/api/attendance/clock-in`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ta_id: taId })
        });
      }
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Error updating attendance');
    }
  };

  const deactivateTA = async (taId: number): Promise<void> => {
    if (!confirm('Are you sure you want to deactivate this TA?')) return;
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/tas/${taId}/deactivate`, { method: 'PATCH' });
      if (response.ok) {
        fetchData();
      } else {
        alert('Failed to deactivate TA');
      }
    } catch (err) {
      console.error(err);
      alert('Error deactivating TA');
    }
  };

  const handleRowClick = (taId: number): void => {
    navigate(`/vp/ta-view/${taId}`);
  };

  const gridData: (string | number | boolean)[][] = data.map(row => [
    row.first_name, row.last_name, row.korean_name, row.session_day,
    row.classroom || '', row.total_hours || '0.00', row.attendance, row.id,
  ]);

  const isDateInPast = (dateKey: string): boolean => {
    const [year, month, day] = dateKey.split('_').map(Number);
    const date = new Date(year, month - 1, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const dateRegex = /^\d{4}_\d{2}_\d{2}$/;

  const getFridayColumns = (): Array<{ name: string; id: string }> => {
    if (fridayData.length === 0) return [];
    const sampleRow = fridayData[0];
    const keys = Object.keys(sampleRow);
    const hiddenColumns = ['id', 'ta_code', 'email', 'session_day', 'is_active', 'created_at', 'phone', 'attendance_count', 'absence_count', 'classroom'];
    const nonDateKeys = keys.filter(key => !dateRegex.test(key) && !hiddenColumns.includes(key));
    const selectedDatesWithUnderscores = new Set(Array.from(selectedDates).map(date => date.replace(/-/g, '_')));
    const dateKeys = keys.filter(key => {
      if (!dateRegex.test(key)) return false;
      if (!selectedDatesWithUnderscores.has(key)) return false;
      const [year, month, day] = key.split('_').map(Number);
      const date = new Date(year, month - 1, day);
      return date.getDay() === 5;
    });
    dateKeys.sort();
    const koreanNameIndex = nonDateKeys.indexOf('korean_name');
    const insertAt = koreanNameIndex >= 0 ? koreanNameIndex + 1 : nonDateKeys.length;
    nonDateKeys.splice(insertAt, 0, 'classroom');
    const finalKeys = [...nonDateKeys, ...dateKeys];
    return [
      ...finalKeys.map(key => ({
        name: dateRegex.test(key) ? key.replace(/_/g, '-')
          : key === 'classroom' ? 'Classroom'
          : key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
        id: key
      })),
      { name: 'Days Present', id: '__days_present__' },
      { name: 'Days Absent', id: '__days_absent__' },
    ];
  };

  const getSaturdayColumns = (): Array<{ name: string; id: string }> => {
    if (saturdayData.length === 0) return [];
    const sampleRow = saturdayData[0];
    const keys = Object.keys(sampleRow);
    const hiddenColumns = ['id', 'ta_code', 'email', 'session_day', 'is_active', 'created_at', 'phone', 'attendance_count', 'absence_count'];
    const nonDateKeys = keys.filter(key => !dateRegex.test(key) && !hiddenColumns.includes(key));
    const selectedDatesWithUnderscores = new Set(Array.from(selectedDates).map(date => date.replace(/-/g, '_')));
    const dateKeys = keys.filter(key => {
      if (!dateRegex.test(key)) return false;
      if (!selectedDatesWithUnderscores.has(key)) return false;
      const [year, month, day] = key.split('_').map(Number);
      const date = new Date(year, month - 1, day);
      return date.getDay() === 6;
    });
    dateKeys.sort();
    const finalKeys = [...nonDateKeys, ...dateKeys];
    return [
      ...finalKeys.map(key => ({
        name: dateRegex.test(key) ? key.replace(/_/g, '-')
          : key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
        id: key
      })),
      { name: 'Days Present', id: '__days_present__' },
      { name: 'Days Absent', id: '__days_absent__' },
    ];
  };

  const [enrichedFridayData, setEnrichedFridayData] = useState<any[]>([]);

  useEffect(() => {
    if (fridayData.length === 0 || data.length === 0) return;
    const enriched = fridayData.map(row => {
      const taMatch = data.find(ta => ta.id === row.id);
      return { ...row, classroom: taMatch?.classroom ?? '' };
    });
    setEnrichedFridayData(enriched);
  }, [fridayData, data]);

  const selectedDatesUnderscored = new Set(Array.from(selectedDates).map(d => d.replace(/-/g, '_')));

  const fridayGridData: any[][] = enrichedFridayData.map(row => {
    const cols = getFridayColumns();
    const selectedFridayKeys = cols
      .map(c => c.id)
      .filter(id => dateRegex.test(id) && selectedDatesUnderscored.has(id));
    const daysPresent = selectedFridayKeys.filter(k => row[k] === true).length;
    const daysAbsent = selectedFridayKeys.filter(k => row[k] !== true && isDateInPast(k)).length;
    return cols.map(col => {
      if (col.id === '__days_present__') return daysPresent;
      if (col.id === '__days_absent__') return daysAbsent;
      return row[col.id];
    });
  });

  const saturdayGridData: any[][] = saturdayData.map(row => {
    const cols = getSaturdayColumns();
    const selectedSaturdayKeys = cols
      .map(c => c.id)
      .filter(id => dateRegex.test(id) && selectedDatesUnderscored.has(id));
    const daysPresent = selectedSaturdayKeys.filter(k => row[k] === true).length;
    const daysAbsent = selectedSaturdayKeys.filter(k => row[k] !== true && isDateInPast(k)).length;
    return cols.map(col => {
      if (col.id === '__days_present__') return daysPresent;
      if (col.id === '__days_absent__') return daysAbsent;
      return row[col.id];
    });
  });

  const updateClassroom = async (taId: number, classroom: string): Promise<void> => {
    setData(prev => prev.map(ta => ta.id === taId ? { ...ta, classroom } : ta));
    setEnrichedFridayData(prev => prev.map(row => row.id === taId ? { ...row, classroom } : row));
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/tas/${taId}/classroom`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classroom })
      });
      if (!response.ok) throw new Error('Failed to update classroom');
    } catch (err) {
      console.error(err);
      alert('Error updating classroom');
      await fetchData();
      await fetchFridayData();
    }
  };

  if (isLoading) return <div style={{ padding: 20, background: bg, color: headingColor, minHeight: '100vh' }}>Loading...</div>;

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentMonth);

  return (
    <div style={{ padding: '40px 20px', fontFamily: 'system-ui, -apple-system, sans-serif', backgroundColor: dm ? '#111827' : undefined, minHeight: '100vh', color: dm ? '#f9fafb' : 'inherit' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }}>
        <h1 style={{ margin: 0, fontSize: '32px', fontWeight: '600', color: headingColor }}>
          VP Dashboard - {mainTab === 'tas' ? 'TA List' : mainTab === 'friday' ? 'Friday Table' : 'Saturday Table'}
        </h1>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => setShowSettingsModal(true)}
            style={{ padding: '12px 24px', background: dm ? '#374151' : '#a39898ff', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}
          >
            Settings
          </button>
          <button
            onClick={() => setShowModal(true)}
            style={{ padding: '12px 24px', background: '#16a34a', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}
          >
            Add New TA
          </button>
          <button
            onClick={handleSignOut}
            style={{ padding: '12px 24px', background: '#dc2626', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Tab Selector */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 24, borderBottom: tabBorderBottom }}>
        {(['tas', 'friday', 'saturday'] as MainTab[]).map(tab => (
          <button key={tab} onClick={() => setMainTab(tab)} style={{
            padding: '12px 24px',
            background: mainTabBg(mainTab === tab),
            border: 'none',
            borderTopLeftRadius: 8,
            borderTopRightRadius: 8,
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: '600',
            color: mainTabColor(mainTab === tab)
          }}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {mainTab === 'tas' && (
        <>
          {data.length === 0 ? (
            <div>
              <p style={{ color: dm ? '#d1d5db' : 'inherit' }}>No data found.</p>
              <button onClick={fetchData} style={{ padding: '10px 20px', marginTop: 10 }}>Retry Load</button>
            </div>
          ) : (
            <div style={{ background: dm ? '#1f2937' : '#dbeafe', borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
              <Grid
                data={gridData}
                columns={[
                  { name: translations[language].firstName, width: '120px' },
                  { name: translations[language].lastName, width: '120px' },
                  { name: translations[language].koreanName, width: '120px' },
                  { name: translations[language].sessionDay, width: '120px' },
                  { name: translations[language].classroom, width: '150px' },
                  { name: translations[language].totalHours, width: '100px', formatter: (cell: any) => `${parseFloat(cell || 0).toFixed(2)}h` },
                  {
                    name: translations[language].attendance,
                    width: '120px',
                    formatter: (cell: any, row: any) => {
                      const taId = row.cells[7].data;
                      return h('button', {
                        style: `display: inline-block; padding: 6px 16px; border-radius: 4px; font-weight: 500; font-size: 13px; background-color: ${cell === 'Present' ? '#dcfce7' : '#fee2e2'}; color: ${cell === 'Present' ? '#166534' : '#991b1b'}; border: none; cursor: pointer;`,
                        onclick: () => toggleAttendance(taId, cell)
                      }, cell || 'Absent');
                    }
                  },
                  {
                    name: translations[language].analytics,
                    width: "140px",
                    formatter: (cell: any) => {
                      return h('button', {
                        style: `padding: 6px 12px; background-color: #2563eb; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: 600;`,
                        onclick: (e: Event) => { e.stopPropagation(); handleRowClick(cell); }
                      }, 'View Analytics');
                    }
                  },
                  {
                    name: translations[language].actions,
                    width: '100px',
                    formatter: (cell: any, row: any) => {
                      const taId = row.cells[7].data;
                      return h('button', {
                        style: `padding: 6px 12px; background-color: #ef4444; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: 500;`,
                        onclick: (e: Event) => { e.preventDefault(); e.stopPropagation(); deactivateTA(taId); }
                      }, translations[language].remove);
                    }
                  }
                ]}
                key={language}
                search={true}
                pagination={{ limit: 10 }}
                sort={true}
              />
            </div>
          )}
        </>
      )}

      {mainTab === 'friday' && (
        <>
          {fridayData.length === 0 ? (
            <div>
              <p style={{ color: dm ? '#d1d5db' : 'inherit' }}>No Friday data found. Please select dates in Settings.</p>
              <button onClick={fetchFridayData} style={{ padding: '10px 20px', marginTop: 10 }}>Retry Load</button>
            </div>
          ) : (
            <div style={{ background: dm ? '#1f2937' : '#dbeafe', borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
              <Grid
                data={fridayGridData}
                columns={getFridayColumns().map((col) => ({
                  name: col.name,
                  width: col.id === 'classroom' ? '180px' : col.id === '__days_present__' || col.id === '__days_absent__' ? '120px' : '150px',
                  formatter: (cell: any, row: any) => {
                    if (col.id === '__days_present__') {
                      return h('span', {
                        style: `font-weight: 600; color: ${dm ? '#4ade80' : '#16a34a'};`
                      }, String(cell ?? 0));
                    }
                    if (col.id === '__days_absent__') {
                      return h('span', {
                        style: `font-weight: 600; color: ${dm ? '#f87171' : '#dc2626'};`
                      }, String(cell ?? 0));
                    }
                    if (col.id === 'classroom') {
                      const fridayColumns = getFridayColumns();
                      const idColIndex = fridayColumns.findIndex(c => c.id === 'korean_name');
                      const koreanName = idColIndex >= 0 ? row.cells[idColIndex].data : null;
                      const taMatch = fridayData.find(r => r.korean_name === koreanName);
                      const taId = taMatch?.id;
                      return h('select', {
                        style: `padding: 4px 8px; border-radius: 4px; border: 1px solid ${dm ? '#4b5563' : '#93c5fd'}; background-color: ${dm ? '#273549' : '#eff6ff'}; color: ${dm ? '#e5e7eb' : '#1e40af'}; font-size: 13px; cursor: pointer; width: 100%;`,
                        onchange: (e: Event) => {
                          const newClassroom = (e.target as HTMLSelectElement).value;
                          if (taId) updateClassroom(taId, newClassroom);
                        }
                      }, [
                        h('option', { value: '' }, '— Select —'),
                        ...CLASSROOMS.map(room => h('option', { value: room, selected: cell === room }, room))
                      ]);
                    }
                    if (dateRegex.test(col.id)) {
                      if (cell === true) return '✓';
                      if (isDateInPast(col.id)) return '✗';
                      return '';
                    }
                    if (cell === true) return '✓';
                    if (cell === false) return '✗';
                    if (cell === null || cell === undefined) return '';
                    return cell;
                  }
                }))}
                search={true}
                pagination={{ limit: 10 }}
                sort={true}
              />
            </div>
          )}
        </>
      )}

      {mainTab === 'saturday' && (
        <>
          {saturdayData.length === 0 ? (
            <div>
              <p style={{ color: dm ? '#d1d5db' : 'inherit' }}>No Saturday data found. Please select dates in Settings.</p>
              <button onClick={fetchSaturdayData} style={{ padding: '10px 20px', marginTop: 10 }}>Retry Load</button>
            </div>
          ) : (
            <div style={{ background: dm ? '#1f2937' : '#dbeafe', borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
              <Grid
                data={saturdayGridData}
                columns={getSaturdayColumns().map((col) => ({
                  name: col.name,
                  width: col.id === '__days_present__' || col.id === '__days_absent__' ? '120px' : '150px',
                  formatter: (cell: any) => {
                    if (col.id === '__days_present__') {
                      return h('span', {
                        style: `font-weight: 600; color: ${dm ? '#4ade80' : '#16a34a'};`
                      }, String(cell ?? 0));
                    }
                    if (col.id === '__days_absent__') {
                      return h('span', {
                        style: `font-weight: 600; color: ${dm ? '#f87171' : '#dc2626'};`
                      }, String(cell ?? 0));
                    }
                    if (dateRegex.test(col.id)) {
                      if (cell === true) return '✓';
                      if (isDateInPast(col.id)) return '✗';
                      return '';
                    }
                    if (cell === true) return '✓';
                    if (cell === false) return '✗';
                    if (cell === null || cell === undefined) return '';
                    return cell;
                  }
                }))}
                search={true}
                pagination={{ limit: 10 }}
                sort={true}
              />
            </div>
          )}
        </>
      )}

      {/* PIN Display Modal */}
      {showPinModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1001 }}>
          <div style={{ background: cardBg, color: dm ? '#f9fafb' : 'inherit', padding: 40, borderRadius: 12, width: 500, maxWidth: '90%', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)', textAlign: 'center' }}>
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
              <button onClick={copyPinToClipboard} style={{ padding: '12px 24px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}>📋 Copy PIN</button>
              <button onClick={() => setShowPinModal(false)} style={{ padding: '12px 24px', background: '#16a34a', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}>Done</button>
            </div>
          </div>
        </div>
      )}

      {/* Add New TA Modal */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: cardBg, color: dm ? '#f9fafb' : 'inherit', padding: 30, borderRadius: 12, width: 500, maxWidth: '90%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <h2 style={{ marginTop: 0, marginBottom: 24, fontSize: '24px', fontWeight: '600' }}>Add New TA</h2>
            <form onSubmit={handleSubmit}>
              {[
                { label: 'First Name', name: 'first_name', type: 'text', required: true, value: formData.first_name },
                { label: 'Last Name', name: 'last_name', type: 'text', required: true, value: formData.last_name },
                { label: 'Korean Name (Optional)', name: 'korean_name', type: 'text', required: false, value: formData.korean_name },
                { label: 'Email', name: 'email', type: 'email', required: true, value: formData.email },
              ].map(field => (
                <div key={field.name} style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: '14px', fontWeight: '500', color: labelColor }}>{field.label}:</label>
                  <input type={field.type} name={field.name} value={field.value} onChange={handleInputChange} required={field.required}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: inputBorder, fontSize: '14px', boxSizing: 'border-box', background: inputBg, color: inputColor }} />
                </div>
              ))}

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 6, fontSize: '14px', fontWeight: '500', color: labelColor }}>Session Day:</label>
                <div style={{ display: 'flex', gap: 10 }}>
                  {(['Friday', 'Saturday', 'Both'] as const).map(day => (
                    <button key={day} type="button" onClick={() => handleSessionDaySelect(day)} style={{
                      flex: 1, padding: '10px',
                      background: formData.session_day === day ? '#2563eb' : (dm ? '#374151' : '#e5e7eb'),
                      color: formData.session_day === day ? 'white' : (dm ? '#d1d5db' : '#374151'),
                      border: 'none', borderRadius: 6, cursor: 'pointer',
                      fontWeight: formData.session_day === day ? '600' : '500', fontSize: '14px'
                    }}>{day}</button>
                  ))}
                </div>
                {formData.session_day && (
                  <p style={{ marginTop: 6, fontSize: 13, color: '#059669' }}>Selected: {formData.session_day}</p>
                )}
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 6, fontSize: '14px', fontWeight: '500', color: labelColor }}>Classroom (Optional):</label>
                <select
                  value={formData.classroom}
                  onChange={(e) => setFormData(prev => ({ ...prev, classroom: e.target.value }))}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: inputBorder, fontSize: '14px', boxSizing: 'border-box', background: inputBg, color: formData.classroom ? inputColor : (dm ? '#6b7280' : '#9ca3af'), cursor: 'pointer' }}
                >
                  <option value="">— Select Classroom —</option>
                  {CLASSROOMS.map(room => <option key={room} value={room}>{room}</option>)}
                </select>
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '14px', color: labelColor }}>
                  <input type="checkbox" name="is_active" checked={formData.is_active} onChange={handleInputChange} style={{ width: '16px', height: '16px' }} />
                  Is Active
                </label>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowModal(false)}
                  style={{ padding: '10px 20px', background: dm ? '#4b5563' : '#6b7280', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}>
                  Cancel
                </button>
                <button type="submit"
                  style={{ padding: '10px 20px', background: '#16a34a', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}>
                  Add TA
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: cardBg, color: dm ? '#f9fafb' : 'inherit', padding: 30, borderRadius: 12, width: 600, maxWidth: '90%', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
              <button onClick={() => setShowSettingsModal(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', padding: '5px 10px', marginRight: '10px', color: dm ? '#9ca3af' : '#6b7280' }}>←</button>
              <h2 style={{ margin: 0, fontSize: '32px', fontWeight: '700' }}>Settings</h2>
            </div>
            <div style={{ display: 'flex', gap: 0, marginBottom: 24, borderBottom: tabBorderBottom }}>
              <button onClick={() => setActiveTab('appearance')} style={{
                padding: '12px 24px',
                background: mainTabBg(activeTab === 'appearance'),
                border: 'none', borderTopLeftRadius: 8, borderTopRightRadius: 8, cursor: 'pointer',
                fontSize: '14px', fontWeight: '500',
                color: mainTabColor(activeTab === 'appearance')
              }}>Appearance</button>
            </div>
            <div style={{ background: tabPanelBg, padding: 30, borderRadius: 8, minHeight: '400px' }}>
              {activeTab === 'appearance' && (
                <>
                  <div style={{ marginBottom: 30 }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: 12, color: dm ? '#60a5fa' : '#1e40af' }}>Language Preferences</h3>
                    <div style={{ display: 'flex', gap: 10 }}>
                      {(['en', 'ko'] as Language[]).map(lang => (
                        <button key={lang} onClick={() => setLanguage(lang)} style={{
                          padding: '10px 30px',
                          background: language === lang ? (dm ? '#1e3a5f' : '#bfdbfe') : (dm ? '#273549' : 'white'),
                          color: language === lang ? (dm ? '#93c5fd' : '#1e40af') : (dm ? '#d1d5db' : '#374151'),
                          border: inputBorder, borderRadius: 6, cursor: 'pointer', fontSize: '14px', fontWeight: '500'
                        }}>{lang === 'en' ? 'English' : 'Korean'}</button>
                      ))}
                    </div>
                  </div>

                  {/* Theme toggle */}
                  <div style={{ marginBottom: 30 }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: 12, color: dm ? '#60a5fa' : '#1e40af' }}>Theme</h3>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button onClick={() => setDarkMode(false)} style={{
                        padding: '10px 30px',
                        background: !dm ? '#1e40af' : (dm ? '#273549' : 'white'),
                        color: !dm ? 'white' : (dm ? '#d1d5db' : '#374151'),
                        border: inputBorder, borderRadius: 6, cursor: 'pointer', fontSize: '14px', fontWeight: '500'
                      }}>Light Mode</button>
                      <button onClick={() => setDarkMode(true)} style={{
                        padding: '10px 30px',
                        background: dm ? '#3b82f6' : 'white',
                        color: dm ? 'white' : '#374151',
                        border: '1px solid #4b5563', borderRadius: 6, cursor: 'pointer', fontSize: '14px'
                      }}>Dark Mode</button>
                    </div>
                  </div>

                  <div style={{ marginBottom: 30 }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: 12, color: dm ? '#60a5fa' : '#1e40af' }}>Schedule</h3>
                    <button
                      onClick={() => { setCurrentMonth(new Date()); setShowCalendar(true); }}
                      style={{ padding: '12px 24px', background: '#2563eb', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}
                    >
                      Set Days
                    </button>
                    {selectedDates.size > 0 && (
                      <p style={{ marginTop: 12, fontSize: '14px', color: dm ? '#d1d5db' : '#374151' }}>
                        <strong>{selectedDates.size}</strong> day{selectedDates.size !== 1 ? 's' : ''} selected
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Calendar Popup Modal */}
      {showCalendar && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1002 }}>
          <div style={{ background: cardBg, color: dm ? '#f9fafb' : 'inherit', borderRadius: 12, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)', maxWidth: '450px', width: '90%', padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: dm ? '#60a5fa' : '#1e40af' }}>Select Days</h3>
              <button onClick={() => setShowCalendar(false)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: dm ? '#9ca3af' : '#6b7280', padding: '0 8px' }}>×</button>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <button onClick={() => changeMonth(-1)} style={{ padding: '8px 16px', background: dm ? '#374151' : '#e5e7eb', color: dm ? '#d1d5db' : '#374151', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '16px', fontWeight: '600' }}>←</button>
              <span style={{ fontSize: '16px', fontWeight: '600', color: dm ? '#d1d5db' : '#374151' }}>{monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}</span>
              <button onClick={() => changeMonth(1)} style={{ padding: '8px 16px', background: dm ? '#374151' : '#e5e7eb', color: dm ? '#d1d5db' : '#374151', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '16px', fontWeight: '600' }}>→</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 12 }}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} style={{ textAlign: 'center', padding: '8px 0', fontSize: '12px', fontWeight: '600', color: dm ? '#6b7280' : '#6b7280' }}>{day}</div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
              {Array.from({ length: startingDayOfWeek }).map((_, i) => <div key={`empty-${i}`} style={{ aspectRatio: '1', padding: 8 }} />)}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const selected = isDateSelected(day);
                return (
                  <button key={day} onClick={() => toggleDate(day)} style={{
                    aspectRatio: '1', padding: 8,
                    background: selected ? '#2563eb' : (dm ? '#374151' : '#f3f4f6'),
                    color: selected ? 'white' : (dm ? '#d1d5db' : '#374151'),
                    border: 'none', borderRadius: 6, cursor: 'pointer',
                    fontSize: '14px', fontWeight: selected ? '600' : '500', transition: 'all 0.2s'
                  }}
                    onMouseOver={(e) => { if (!selected) e.currentTarget.style.background = dm ? '#4b5563' : '#e5e7eb'; }}
                    onMouseOut={(e) => { if (!selected) e.currentTarget.style.background = dm ? '#374151' : '#f3f4f6'; }}
                  >{day}</button>
                );
              })}
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button onClick={() => setSelectedDates(new Set())} style={{ flex: 1, padding: '12px', background: dm ? '#374151' : '#e5e7eb', color: dm ? '#d1d5db' : '#374151', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}>Clear All</button>
              <button onClick={handleSaveDates} style={{ flex: 1, padding: '12px', background: '#2563eb', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}>Done</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default VPDashboard;