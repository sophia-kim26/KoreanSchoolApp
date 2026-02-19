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
  attendance_count: number;
  absence_count: number;
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
  attendance_count?: number;
  absence_count?: number;
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

interface Metrics {
  attendance: number;
  absence: number;
}

interface Translations {
  [key: string]: {
    firstName: string;
    lastName: string;
    koreanName: string;
    sessionDay: string;
    classroom: string;
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
type MainTab = 'tas' | 'friday';

const CLASSROOMS = [
  '앵두꽃반',
  '제비꽃반',
  '접시꽃반',
  '초롱꽃반',
  '풀꽃반',
  '배꽃반',
  '백합반',
  '개나리반',
  '봉선화반',
  '수선화반',
  'KSL1A.도라지꽃반',
  'KSL1B.프리지아반',
  'KSL3.붓꽃반',
  'KSL4.유채꽃반',
  'KSL5 은방울꽃반',
  '진달래반',
  '채송화반',
  '월계수반',
  '모란반',
  '목련반',
  '난초반',
  '해바라기반',
  '장미반',
  '튤립반',
  '연꽃반',
  '국화반',
  '무궁화반',
];

function VPDashboard(): React.ReactElement {
  const [data, setData] = useState<TAData[]>([]);
  const [fridayData, setFridayData] = useState<FridayData[]>([]);
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
  const [formData, setFormData] = useState<FormData>({
    first_name: "",
    last_name: "",
    email: "",
    session_day: "",
    is_active: true,
    korean_name: "",
    classroom: ""
  });
  const [metrics, setMetrics] = useState<Metrics>({
    attendance: 0,
    absence: 0,
  });
  
  const translations: Translations = {
    en: {
      firstName: "First Name",
      lastName: "Last Name",
      koreanName: "Korean Name",
      sessionDay: "Session Day",
      classroom: "Classroom",
      active: "Active",
      totalHours: "Total Hours",
      attendance: "Attendance",
      analytics: "Analytics",
      actions: "Actions",
      yes: "Yes",
      no: "No",
      viewAnalytics: "View Analytics",
      remove: "Remove"
    },
    ko: {
      firstName: "이름",
      lastName: "성",
      koreanName: "한국어 이름",
      sessionDay: "수업 요일",
      classroom: "교실",
      active: "활성 상태",
      totalHours: "총 시간",
      attendance: "출석",
      analytics: "통계",
      actions: "작업",
      yes: "예",
      no: "아니오",
      viewAnalytics: "통계 보기",
      remove: "삭제"
    }
  };

  const generatePIN = (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const { isLoading, isAuthenticated, user, logout } = useAuth0();
  const navigate: NavigateFunction = useNavigate();

  // Calendar helper functions
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
  }, []);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/vp/login');
    }
  }, [isLoading, isAuthenticated, navigate]);

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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dates: datesArray })
      });
      
      const responseText = await response.text();
      if (response.ok) {
        const responseData = JSON.parse(responseText);
        
        setShowCalendar(false);
        await fetchFridayData(); 
        alert("Dates saved! The table now shows only selected dates.");
      } else {
        console.error("Server returned error status:", response.status);
        console.error("Response body:", responseText);
        alert(`Failed to save dates. Status: ${response.status}. Check console for details.`);
      }
    } catch (err) {
      console.error('Error in handleSaveDates:', err);
      alert(`Error saving dates: ${(err as Error).message}`);
    }
  };

  const fetchData = (): void => {
    fetch(`${import.meta.env.VITE_API_URL}/api/tas`)
      .then(res => {
        return res.json();
      })
      .then((json: TAData[]) => {
        const sorted = json.sort((a, b) => {
          if (a.is_active === b.is_active) {
            return a.id - b.id;
          }
          return (b.is_active ? 1 : 0) - (a.is_active ? 1 : 0);
        });
        setData(sorted);
        calculateMetrics(sorted);

        setTimeout(() => {
          const rows = document.querySelectorAll('.gridjs-tr');
          rows.forEach(row => {
            if (row.querySelector('th')) return;
            
            row.addEventListener('click', (e) => {
              if ((e.target as HTMLElement).closest('button')) return;

              const cells = row.querySelectorAll('.gridjs-td');
              if (cells.length >= 9) {
                const taId = cells[8].textContent;
                if (taId) {
                  navigate(`/vp/ta-view/${taId}`);
                }
              }
            });
            
            row.addEventListener('mouseenter', () => {
              (row as HTMLElement).style.backgroundColor = '#dbeafe';
            });
            row.addEventListener('mouseleave', () => {
              (row as HTMLElement).style.backgroundColor = '#eff6ff';
            });
          });
        }, 100);
      })
      .catch(err => {
        console.error("Fetch error:", err);
        alert("Error loading data: " + err.message);
      });
  };

  const calculateMetrics = (data: TAData[]): void => {
    const attendance = data.filter(ta => ta.attendance === 'Present').length;
    const absence = data.filter(ta => ta.attendance === 'Absent').length;
    
    setMetrics({
      attendance,
      absence,
    });
  };

  const fetchFridayData = (): void => {
  fetch(`${import.meta.env.VITE_API_URL}/api/friday`)
    .then(res => res.json())
    .then(async (json: FridayData[]) => {
      // 1. Safety check: ensure we have data to process
      const dataArray = Array.isArray(json) ? json : [];
      if (dataArray.length === 0) {
        console.warn("No Friday data received from server.");
        setFridayData([]);
        return;
      }

      const tasResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/tas`);
      const tasData: TAData[] = await tasResponse.json();
      
      const enrichedData = dataArray.map(fridayRow => {
        // 2. Use a fallback for matching if ID isn't the common link
        // Check if matching by email or name is safer for your schema
        const matchingTA = tasData.find(ta => 
          ta.id === fridayRow.id || 
          ta.email === fridayRow.email
        );
        
        return {
          ...fridayRow,
          attendance_count: matchingTA?.attendance_count ?? 0,
          absence_count: matchingTA?.absence_count ?? 0,
        };
      });
      
      // 3. Only log if the array actually has content
      if (enrichedData.length > 0) {
        console.log('Enriched Friday data first row:', enrichedData[0]);
      }
      
      setFridayData(enrichedData);
    })
    .catch(err => {
      console.error("Fetch Friday error:", err);
      setFridayData([]);
    });
};

  const handleSignOut = (): void => {
    logout({ 
      logoutParams: { 
        returnTo: window.location.origin
      } 
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSessionDaySelect = (day: string): void => {
    setFormData(prev => ({
      ...prev,
      session_day: day
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    
    try {
      const pin = generatePIN();
      const dataToSend = {
        ...formData,
        ta_code: pin
      };
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/create-account-vp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(dataToSend)
      });

      if (response.ok) {
        const result: CreateAccountResponse = await response.json();
        
        setGeneratedPin(result.unhashed_pin);
        setNewTAName(`${formData.first_name} ${formData.last_name}`);
        
        setFormData({
          first_name: "",
          last_name: "",
          korean_name: "",
          email: "",
          session_day: "",
          is_active: true,
          classroom: ""
        });
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
        await fetch(`${import.meta.env.VITE_API_URL}/api/attendance/clock-out/${taId}`, {
          method: 'POST'
        });
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
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/tas/${taId}/deactivate`, {
        method: 'PATCH'
      });
      
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

  const updateClassroom = async (taId: number, classroom: string): Promise<void> => {
    try {
      const response = await fetch(`http://localhost:3001/api/tas/${taId}/classroom`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classroom })
      });
      if (response.ok) {
        fetchData();
      } else {
        alert('Failed to update classroom');
      }
    } catch (err) {
      console.error(err);
      alert('Error updating classroom');
    }
  };

  const handleRowClick = (taId: number): void => {
    navigate(`/vp/ta-view/${taId}`);
  };

  // classroom added at index 4; id is now at index 8
  const gridData: (string | number | boolean)[][] = data.map(row => [
    row.first_name,       // 0
    row.last_name,        // 1
    row.korean_name,      // 2
    row.session_day,      // 3
    row.classroom || '',  // 4  ← NEW
    row.is_active,        // 5
    row.total_hours || '0.00', // 6
    row.attendance,       // 7
    row.id,               // 8  ← was 7
    row.attendance_count || 0, // 9
    row.absence_count || 0,    // 10
  ]);

  const getFridayColumns = (): Array<{ name: string; id: string }> => {
    if (fridayData.length === 0) return [];
    
    const sampleRow = fridayData[0];
    const keys = Object.keys(sampleRow);
    
    const hiddenColumns = ['id', 'ta_code', 'email', 'session_day', 'is_active', 'created_at', 'phone'];
    
    const dateRegex = /^\d{4}_\d{2}_\d{2}$/;
    const nonDateKeys = keys.filter(key => !dateRegex.test(key) && !hiddenColumns.includes(key));
    
    const selectedDatesWithUnderscores = new Set(
      Array.from(selectedDates).map(date => date.replace(/-/g, '_'))
    );
    
    const dateKeys = keys.filter(key => dateRegex.test(key) && selectedDatesWithUnderscores.has(key));
    
    dateKeys.sort();

    const finalKeys = [...nonDateKeys, ...dateKeys];

    return finalKeys.map(key => ({
      name: dateRegex.test(key) 
        ? key.replace(/_/g, '-') 
        : key.split('_').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
          ).join(' '), 
      id: key
    }));
  };

  const fridayGridData: any[][] = fridayData.map(row => {
    return getFridayColumns().map(col => row[col.id]);
  });

  if (isLoading) {
    return <div style={{ padding: 20 }}>Loading...</div>;
  }

  if (!isAuthenticated) {
    return (
      <div style={{ padding: 20 }}>
        <h1>Access Denied</h1>
        <p>Redirecting to login...</p>
      </div>
    );
  }

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentMonth);

  return (
    <div style={{ padding: '40px 20px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }}>
        <h1 style={{ margin: 0, fontSize: '32px', fontWeight: '600' }}>
          VP Dashboard - {mainTab === 'tas' ? 'TA List' : 'Friday Table'}
        </h1>
        <div style={{ display: 'flex', gap: 10 }}>
          <button 
            onClick={() => setShowSettingsModal(true)}
            style={{ 
              padding: '12px 24px', 
              background: '#a39898ff', 
              color: 'white', 
              border: 'none', 
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            Settings
          </button>
          <button 
            onClick={() => setShowModal(true)}
            style={{ 
              padding: '12px 24px', 
              background: '#16a34a', 
              color: 'white', 
              border: 'none', 
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            Add New TA
          </button>
          <button 
            onClick={handleSignOut}
            style={{ 
              padding: '12px 24px', 
              background: '#dc2626', 
              color: 'white', 
              border: 'none', 
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            Sign Out
          </button>
        </div>
      </div>

      <p style={{ marginBottom: 30, color: '#374151', fontSize: '14px' }}>
        Logged in as: {user?.email || user?.name}
      </p>

      {/* Main Tab Selector */}
      <div style={{ 
        display: 'flex', 
        gap: 0, 
        marginBottom: 24,
        borderBottom: '2px solid #e5e7eb'
      }}>
        <button 
          onClick={() => setMainTab('tas')}
          style={{
            padding: '12px 24px',
            background: mainTab === 'tas' ? '#bfdbfe' : 'transparent',
            border: 'none',
            borderTopLeftRadius: 8,
            borderTopRightRadius: 8,
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: '600',
            color: mainTab === 'tas' ? '#1e40af' : '#6b7280'
          }}>
          TAs
        </button>
        <button 
          onClick={() => setMainTab('friday')}
          style={{
            padding: '12px 24px',
            background: mainTab === 'friday' ? '#bfdbfe' : 'transparent',
            border: 'none',
            borderTopLeftRadius: 8,
            borderTopRightRadius: 8,
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: '600',
            color: mainTab === 'friday' ? '#1e40af' : '#6b7280'
          }}>
          Friday
        </button>
      </div>

      {mainTab === 'tas' && (
        <>
          <p style={{ marginBottom: 20, color: '#374151', fontSize: '14px' }}>
            Total TAs: {data.length}
          </p>
          
          {data.length === 0 ? (
            <div>
              <p>No data found.</p>
              <button onClick={fetchData} style={{ padding: '10px 20px', marginTop: 10 }}>
                Retry Load
              </button>
            </div>
          ) : (
            <div style={{ 
              background: '#dbeafe', 
              borderRadius: 8, 
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              overflow: 'hidden'
            }}>
              <Grid
                data={gridData}
                columns={[
                  { name: translations[language].firstName, width: '120px' },
                  { name: translations[language].lastName, width: '120px' },
                  { name: translations[language].koreanName, width: '120px' },
                  { name: translations[language].sessionDay, width: '120px' },
                  {
                    name: translations[language].classroom,
                    width: '160px',
                    formatter: (cell: any, row: any) => {
                      const taId = row.cells[8].data;
                      const dropdownId = `classroom-dropdown-${taId}`;
                      const labelId = `classroom-label-${taId}`;

                      const dropdownList = h('div', {
                        id: dropdownId,
                        style: `
                          display: none;
                          position: fixed;
                          background: white;
                          border: 1px solid #bfdbfe;
                          border-radius: 6px;
                          box-shadow: 0 4px 16px rgba(0,0,0,0.15);
                          z-index: 9999;
                          max-height: 220px;
                          overflow-y: auto;
                          min-width: 180px;
                        `
                      },
                        ...CLASSROOMS.map(name =>
                          h('div', {
                            style: `
                              padding: 8px 14px;
                              font-size: 13px;
                              color: #1e40af;
                              cursor: pointer;
                              background: ${cell === name ? '#eff6ff' : 'white'};
                              font-weight: ${cell === name ? '600' : '400'};
                            `,
                            onmouseover: function(this: HTMLElement) { this.style.background = '#dbeafe'; },
                            onmouseout: function(this: HTMLElement) { this.style.background = cell === name ? '#eff6ff' : 'white'; },
                            onclick: (e: Event) => {
                              e.stopPropagation();
                              const dropdown = document.getElementById(dropdownId);
                              const label = document.getElementById(labelId);
                              if (dropdown) dropdown.style.display = 'none';
                              if (label) label.textContent = name;
                              updateClassroom(taId, name);
                            }
                          }, name)
                        )
                      );

                      const label = h('span', {
                        id: labelId,
                        style: `
                          font-size: 14px;
                          color: #1e40af;
                          cursor: pointer;
                        `
                      }, cell || '—');

                      const wrapper = h('div', {
                        style: `position: relative;`,
                        onclick: (e: Event) => {
                          e.stopPropagation();
                          const dropdown = document.getElementById(dropdownId);
                          if (!dropdown) return;

                          // Close all other open dropdowns first
                          document.querySelectorAll('[id^="classroom-dropdown-"]').forEach((el) => {
                            if (el.id !== dropdownId) (el as HTMLElement).style.display = 'none';
                          });

                          if (dropdown.style.display === 'none') {
                            // Position relative to the wrapper element
                            const trigger = (e.currentTarget as HTMLElement);
                            const rect = trigger.getBoundingClientRect();
                            dropdown.style.top = `${rect.bottom + window.scrollY}px`;
                            dropdown.style.left = `${rect.left + window.scrollX}px`;
                            dropdown.style.display = 'block';

                            // Append to body so it escapes table overflow:hidden
                            if (!document.body.contains(dropdown)) {
                              document.body.appendChild(dropdown);
                            }

                            // Close when clicking outside
                            const closeHandler = (ev: MouseEvent) => {
                              if (!dropdown.contains(ev.target as Node) && ev.target !== trigger) {
                                dropdown.style.display = 'none';
                                document.removeEventListener('click', closeHandler);
                              }
                            };
                            setTimeout(() => document.addEventListener('click', closeHandler), 0);
                          } else {
                            dropdown.style.display = 'none';
                          }
                        }
                      }, label, dropdownList);

                      return wrapper;
                    }
                  },
                  { 
                    name: translations[language].active,
                    width: '80px',
                    formatter: (cell: any) => cell ? 'Yes' : 'No'
                  },
                  {
                    name: translations[language].totalHours,
                    width: '100px',
                    formatter: (cell: any) => `${parseFloat(cell || 0).toFixed(2)}h`
                  },
                  {
                    name: translations[language].attendance,
                    width: '120px',
                    formatter: (cell: any, row: any) => {
                      const taId = row.cells[8].data; // ← was [7]
                      return h('button', {
                        style: `
                          display: inline-block;
                          padding: 6px 16px;
                          border-radius: 4px;
                          font-weight: 500;
                          font-size: 13px;
                          background-color: ${cell === 'Present' ? '#dcfce7' : '#fee2e2'};
                          color: ${cell === 'Present' ? '#166534' : '#991b1b'};
                          border: none;
                          cursor: pointer;
                          transition: opacity 0.2s;
                        `,
                        onmouseover: function(this: HTMLElement) { this.style.opacity = '0.8'; },
                        onmouseout: function(this: HTMLElement) { this.style.opacity = '1'; },
                        onclick: () => toggleAttendance(taId, cell)
                      }, cell || 'Absent');
                    }
                  },
                  {
                    name: translations[language].analytics,
                    width: "140px",
                    formatter: (cell: any) => {
                      return h('button', {
                        style: `
                          padding: 6px 12px;
                          background-color: #2563eb;
                          color: white;
                          border: none;
                          border-radius: 4px;
                          cursor: pointer;
                          font-size: 12px;
                          font-weight: 600;
                        `,
                        onclick: (e: Event) => {
                          e.stopPropagation();
                          handleRowClick(cell);
                        }
                      }, 'View Analytics');
                    }
                  },
                  {
                    name: translations[language].actions,
                    width: '100px',
                    formatter: (cell: any, row: any) => {
                      const taId = row.cells[8].data; // ← was [7]
                      return h('button', {
                        style: `
                          padding: 6px 12px;
                          background-color: #ef4444;
                          color: white;
                          border: none;
                          border-radius: 4px;
                          cursor: pointer;
                          font-size: 12px;
                          font-weight: 500;
                        `,
                        onclick: () => deactivateTA(cell)
                      }, translations[language].remove);
                    }
                  }
                ]}
                key={language}
                search={true}
                pagination={{ limit: 10 }}
                sort={true}
                style={{
                  table: {
                    'font-size': '14px',
                    'border-collapse': 'collapse'
                  },
                  th: {
                    'background-color': '#93c5fd',
                    'padding': '16px 12px',
                    'text-align': 'left',
                    'font-weight': '600',
                    'color': '#1e3a8a',
                    'border-bottom': '2px solid #3b82f6'
                  },
                  td: {
                    'padding': '14px 12px',
                    'border-bottom': '1px solid #bfdbfe',
                    'color': '#1e40af',
                    'background-color': '#eff6ff'
                  }
                }}
              />
            </div>
          )}
        </>
      )}

      {mainTab === 'friday' && (
        <>
          <p style={{ marginBottom: 20, color: '#374151', fontSize: '14px' }}>
            Total Records: {fridayData.length}
          </p>
          
          {fridayData.length === 0 ? (
            <div>
              <p>No Friday data found. Please select dates in Settings.</p>
              <button onClick={fetchFridayData} style={{ padding: '10px 20px', marginTop: 10 }}>
                Retry Load
              </button>
            </div>
          ) : (
            <div style={{ 
              background: '#dbeafe', 
              borderRadius: 8, 
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              overflow: 'hidden'
            }}>
              <Grid
                data={fridayGridData}
                columns={getFridayColumns().map(col => ({
                  name: col.name,
                  width: '150px',
                  formatter: (cell: any) => {
                    if (cell === true) return '✓';
                    if (cell === false) return '✗';
                    if (cell === null || cell === undefined) return '';
                    return cell;
                  }
                }))}
                search={true}
                pagination={{ limit: 10 }}
                sort={true}
                style={{
                  table: {
                    'font-size': '14px',
                    'border-collapse': 'collapse'
                  },
                  th: {
                    'background-color': '#93c5fd',
                    'padding': '16px 12px',
                    'text-align': 'left',
                    'font-weight': '600',
                    'color': '#1e3a8a',
                    'border-bottom': '2px solid #3b82f6'
                  },
                  td: {
                    'padding': '14px 12px',
                    'border-bottom': '1px solid #bfdbfe',
                    'color': '#1e40af',
                    'background-color': '#eff6ff'
                  }
                }}
              />
            </div>
          )}
        </>
      )}

      {/* PIN Display Modal */}
      {showPinModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1001
        }}>
          <div style={{
            background: 'white',
            padding: 40,
            borderRadius: 12,
            width: 500,
            maxWidth: '90%',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)',
            textAlign: 'center'
          }}>
            <div style={{
              width: 60,
              height: 60,
              background: '#dcfce7',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              fontSize: '30px'
            }}>
              ✓
            </div>
            <h2 style={{ marginTop: 0, marginBottom: 16, fontSize: '24px', fontWeight: '600', color: '#166534' }}>
              Account Created Successfully!
            </h2>
            <p style={{ marginBottom: 24, fontSize: '16px', color: '#374151' }}>
              New TA: <strong>{newTAName}</strong>
            </p>
            <div style={{
              background: '#f3f4f6',
              padding: 20,
              borderRadius: 8,
              marginBottom: 24
            }}>
              <p style={{ marginBottom: 8, fontSize: '14px', color: '#6b7280', fontWeight: '500' }}>
                Generated PIN (Save this - it cannot be retrieved later)
              </p>
              <div style={{
                fontSize: '32px',
                fontWeight: '700',
                color: '#1e40af',
                letterSpacing: '4px',
                fontFamily: 'monospace'
              }}>
                {generatedPin}
              </div>
            </div>
            <div style={{
              background: '#fef3c7',
              border: '1px solid #f59e0b',
              borderRadius: 6,
              padding: 12,
              marginBottom: 24,
              fontSize: '13px',
              color: '#92400e'
            }}>
              ⚠️ <strong>Important:</strong> This PIN is encrypted and stored securely. Make sure to save it now - you won't be able to see it again!
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button
                onClick={copyPinToClipboard}
                style={{
                  padding: '12px 24px',
                  background: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                📋 Copy PIN
              </button>
              <button
                onClick={() => setShowPinModal(false)}
                style={{
                  padding: '12px 24px',
                  background: '#16a34a',
                  color: 'white',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New TA Modal */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            padding: 30,
            borderRadius: 12,
            width: 500,
            maxWidth: '90%',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{ marginTop: 0, marginBottom: 24, fontSize: '24px', fontWeight: '600' }}>Add New TA</h2>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 6, fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                  First Name:
                </label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleInputChange}
                  required
                  style={{ 
                    width: '100%', 
                    padding: '10px 12px', 
                    borderRadius: 6, 
                    border: '1px solid #d1d5db',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 6, fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                  Last Name:
                </label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleInputChange}
                  required
                  style={{ 
                    width: '100%', 
                    padding: '10px 12px', 
                    borderRadius: 6, 
                    border: '1px solid #d1d5db',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 6, fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                  Korean Name (Optional):
                </label>
                <input
                  type="text"
                  name="korean_name"
                  value={formData.korean_name}
                  onChange={handleInputChange}
                  style={{ 
                    width: '100%', 
                    padding: '10px 12px', 
                    borderRadius: 6, 
                    border: '1px solid #d1d5db',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 6, fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                  Email:
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  style={{ 
                    width: '100%', 
                    padding: '10px 12px', 
                    borderRadius: 6, 
                    border: '1px solid #d1d5db',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 6, fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                  Session Day:
                </label>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => handleSessionDaySelect('Friday')}
                    style={{
                      flex: 1,
                      padding: '10px',
                      background: formData.session_day === 'Friday' ? '#2563eb' : '#e5e7eb',
                      color: formData.session_day === 'Friday' ? 'white' : '#374151',
                      border: 'none',
                      borderRadius: 6,
                      cursor: 'pointer',
                      fontWeight: formData.session_day === 'Friday' ? '600' : '500',
                      fontSize: '14px'
                    }}
                  >
                    Friday
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSessionDaySelect('Saturday')}
                    style={{
                      flex: 1,
                      padding: '10px',
                      background: formData.session_day === 'Saturday' ? '#2563eb' : '#e5e7eb',
                      color: formData.session_day === 'Saturday' ? 'white' : '#374151',
                      border: 'none',
                      borderRadius: 6,
                      cursor: 'pointer',
                      fontWeight: formData.session_day === 'Saturday' ? '600' : '500',
                      fontSize: '14px'
                    }}
                  >
                    Saturday
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSessionDaySelect('Both')}
                    style={{
                      flex: 1,
                      padding: '10px',
                      background: formData.session_day === 'Both' ? '#2563eb' : '#e5e7eb',
                      color: formData.session_day === 'Both' ? 'white' : '#374151',
                      border: 'none',
                      borderRadius: 6,
                      cursor: 'pointer',
                      fontWeight: formData.session_day === 'Both' ? '600' : '500',
                      fontSize: '14px'
                    }}
                  >
                    Both
                  </button>
                </div>
                {formData.session_day && (
                  <p style={{ marginTop: 6, fontSize: 13, color: '#059669' }}>
                    Selected: {formData.session_day}
                  </p>
                )}
              </div>
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '14px', color: '#374151' }}>
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleInputChange}
                    style={{ width: '16px', height: '16px' }}
                  />
                  Is Active
                </label>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    padding: '10px 20px',
                    background: '#6b7280',
                    color: 'white',
                    border: 'none',
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '10px 20px',
                    background: '#16a34a',
                    color: 'white',
                    border: 'none',
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  Add TA
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            padding: 30,
            borderRadius: 12,
            width: 600,
            maxWidth: '90%',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
              <button
                onClick={() => setShowSettingsModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  cursor: 'pointer',
                  padding: '5px 10px',
                  marginRight: '10px',
                  color: '#6b7280'
                }}
              >
                ←
              </button>
              <h2 style={{ margin: 0, fontSize: '32px', fontWeight: '700' }}>Settings</h2>
            </div>

            <div style={{ 
              display: 'flex', 
              gap: 0, 
              marginBottom: 24,
              borderBottom: '2px solid #e5e7eb'
            }}>
              <button 
                onClick={() => setActiveTab('appearance')}
                style={{
                  padding: '12px 24px',
                  background: activeTab === 'appearance' ? '#bfdbfe' : 'transparent',
                  border: 'none',
                  borderTopLeftRadius: 8,
                  borderTopRightRadius: 8,
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: activeTab === 'appearance' ? '#1e40af' : '#6b7280'
                }}>
                Appearance
              </button>
            </div>

            <div style={{ 
              background: '#dbeafe', 
              padding: 30, 
              borderRadius: 8,
              minHeight: '400px'
            }}>
              {activeTab === 'appearance' && (
                <>
                  <div style={{ marginBottom: 30 }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: 12, color: '#1e40af' }}>
                      Language Preferences
                    </h3>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button 
                        onClick={() => setLanguage('en')}
                        style={{
                          padding: '10px 30px',
                          background: language === 'en' ? '#bfdbfe' : 'white',
                          border: '1px solid #d1d5db',
                          borderRadius: 6,
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontWeight: '500'
                        }}>
                        English
                      </button>
                      <button 
                        onClick={() => setLanguage('ko')}
                        style={{
                          padding: '10px 30px',
                          background: language === 'ko' ? '#bfdbfe' : 'white',
                          border: '1px solid #d1d5db',
                          borderRadius: 6,
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontWeight: '500'
                        }}>
                        Korean
                      </button>
                    </div>
                  </div>

                  <div style={{ marginBottom: 30 }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: 12, color: '#1e40af' }}>
                      Schedule
                    </h3>
                    <button
                      onClick={() => {
                        setCurrentMonth(new Date());
                        setShowCalendar(true);
                      }}
                      style={{
                        padding: '12px 24px',
                        background: '#2563eb',
                        color: 'white',
                        border: 'none',
                        borderRadius: 6,
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500'
                      }}
                    >
                      📅 Set Days
                    </button>
                    {selectedDates.size > 0 && (
                      <p style={{ marginTop: 12, fontSize: '14px', color: '#374151' }}>
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
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1002
        }}>
          <div style={{
            background: 'white',
            borderRadius: 12,
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)',
            maxWidth: '450px',
            width: '90%',
            padding: 24
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#1e40af' }}>Select Days</h3>
              <button
                onClick={() => setShowCalendar(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#6b7280',
                  padding: '0 8px'
                }}
              >
                ×
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <button
                onClick={() => changeMonth(-1)}
                style={{
                  padding: '8px 16px',
                  background: '#e5e7eb',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: '600'
                }}
              >
                ←
              </button>
              <span style={{ fontSize: '16px', fontWeight: '600', color: '#374151' }}>
                {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </span>
              <button
                onClick={() => changeMonth(1)}
                style={{
                  padding: '8px 16px',
                  background: '#e5e7eb',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: '600'
                }}
              >
                →
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 12 }}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} style={{ textAlign: 'center', padding: '8px 0', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>
                  {day}
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
              {Array.from({ length: startingDayOfWeek }).map((_, i) => (
                <div key={`empty-${i}`} style={{ aspectRatio: '1', padding: 8 }} />
              ))}
              
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const selected = isDateSelected(day);
                
                return (
                  <button
                    key={day}
                    onClick={() => toggleDate(day)}
                    style={{
                      aspectRatio: '1',
                      padding: 8,
                      background: selected ? '#2563eb' : '#f3f4f6',
                      color: selected ? 'white' : '#374151',
                      border: 'none',
                      borderRadius: 6,
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: selected ? '600' : '500',
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => {
                      if (!selected) e.currentTarget.style.background = '#e5e7eb';
                    }}
                    onMouseOut={(e) => {
                      if (!selected) e.currentTarget.style.background = '#f3f4f6';
                    }}
                  >
                    {day}
                  </button>
                );
              })}
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button
                onClick={() => setSelectedDates(new Set())}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: '#e5e7eb',
                  color: '#374151',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                Clear All
              </button>
              <button
                onClick={handleSaveDates}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: '#2563eb',
                  color: 'white',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default VPDashboard;