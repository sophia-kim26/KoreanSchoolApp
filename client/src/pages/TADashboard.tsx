import { useEffect, useState } from "react";
import { Grid } from "gridjs-react";
import { h } from "preact";
import "gridjs/dist/theme/mermaid.css";
import { useAuth0 } from "@auth0/auth0-react";
import { useNavigate, NavigateFunction } from "react-router-dom";
import logo from '../assets/logo.png';
import Chart from "./Chart";

// Type definitions
interface UserLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
}

interface ElapsedTime {
  hours: number;
  minutes: number;
}

interface TADashboardProps {
  taId: number;
}

interface Shift {
  id: number;
  ta_id: number;
  clock_in: string;
  clock_out: string | null;
  elapsed_time: number | null;
  attendance: string;
  notes: string;
}

interface CurrentUser {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  classroom: string | null;
}

interface ActiveShiftResponse {
  activeShift: {
    id: number;
    clock_in: string;
  } | null;
}

type TabType = 'appearance' | 'navigation' | 'account' | 'privacy';
type TextSize = 'S' | 'M' | 'L';

// Helper function to get user location - OUTSIDE the component
const getUserLocation = (): Promise<UserLocation> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
      },
      (error) => {
        let message = 'Unable to get your location';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = 'Location permission denied. Please enable location access.';
            break;
          case error.POSITION_UNAVAILABLE:
            message = 'Location information unavailable.';
            break;
          case error.TIMEOUT:
            message = 'Location request timed out.';
            break;
        }
        reject(new Error(message));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  });
};

// Helper function to format date
const formatDate = (dateString: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit' 
  });
};

// Helper function to format time only
const formatTime = (dateString: string | null): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    second: '2-digit'
  });
};

// Map TextSize to actual CSS font sizes
const TEXT_SIZE_MAP: Record<TextSize, string> = {
  S: '13px',
  M: '16px',
  L: '20px',
};

function TADashboard({ taId }: TADashboardProps): React.ReactElement {
  const [data, setData] = useState<Shift[]>([]);
  const [clockedIn, setClockedIn] = useState<boolean>(false);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<TabType>('appearance');
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('ta_dark_mode') === 'true';
  });

  // Text size state - persisted to localStorage
  const [textSize, setTextSize] = useState<TextSize>(() => {
    return (localStorage.getItem('ta_text_size') as TextSize) || 'M';
  });

  // Password visibility state
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const { logout } = useAuth0();
  const navigate: NavigateFunction = useNavigate();

  const [clockInTime, setClockInTime] = useState<Date | null>(null);
  const [clockOutTime, setClockOutTime] = useState<Date | null>(null);
  const [elapsed, setElapsed] = useState<ElapsedTime | null>(null);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [showClockInConfirm, setShowClockInConfirm] = useState<boolean>(false);
  const [showClockOutConfirm, setShowClockOutConfirm] = useState<boolean>(false);
  const [activeShiftId, setActiveShiftId] = useState<number | null>(null);

  // New states for notes editing
  const [showNotesModal, setShowNotesModal] = useState<boolean>(false);
  const [editingShiftId, setEditingShiftId] = useState<number | null>(null);
  const [editingNotes, setEditingNotes] = useState<string>('');

  const overlayStyle = {
    position: "fixed" as const,
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    backgroundColor: "rgba(0,0,0,0.5)",
    display: "flex" as const,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    zIndex: 1000,
  };

  const modalStyle = {
    backgroundColor: "#fff",
    padding: "30px",
    borderRadius: "8px",
    textAlign: "center" as const,
    minWidth: "300px",
  };

  const fetchShifts = async (): Promise<void> => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/shifts`);
      const json: Shift[] = await res.json();
      setData(json);
    } catch (err) {
      console.error("Failed to fetch shifts:", err);
    }
  };

  const checkActiveShift = async (userId: number): Promise<void> => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/shifts/active/${userId}`);
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
      console.error("Failed to check active shift:", err);
    }
  };

  // Function to update notes in database
  const updateNotes = async (shiftId: number, notes: string): Promise<void> => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/shifts/${shiftId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notes: notes
        })
      });
      
      if (!res.ok) {
        throw new Error('Failed to update notes');
      }
            
      // Immediately update the local state to reflect the change
      setData(prevData => 
        prevData.map(shift => 
          shift.id === shiftId 
            ? { ...shift, notes: notes }
            : shift
        )
      );
      
    } catch (err) {
      console.error("Failed to update notes:", err);
      alert("Failed to update notes. Please try again.");
    }
  };
  

  // Handler for opening notes modal
  const handleEditNotes = (shiftId: number, currentNotes: string): void => {
    setEditingShiftId(shiftId);
    setEditingNotes(currentNotes || '');
    setShowNotesModal(true);
  };

  // Handler for saving notes
  const handleSaveNotes = async (): Promise<void> => {
    if (editingShiftId) {
      await updateNotes(editingShiftId, editingNotes);
      setShowNotesModal(false);
      setEditingShiftId(null);
      setEditingNotes('');
    }
  };

  // dark mode
  useEffect(() => {
    localStorage.setItem('ta_dark_mode', String(darkMode));
    document.body.classList.toggle('dark-mode', darkMode);
  }, [darkMode]);

  // text size — apply CSS variable to root so it cascades everywhere
  useEffect(() => {
    localStorage.setItem('ta_text_size', textSize);
    document.documentElement.style.setProperty('--ta-font-size', TEXT_SIZE_MAP[textSize]);
  }, [textSize]);

  // Reset password visibility whenever the privacy tab is opened or closed
  useEffect(() => {
    if (activeTab !== 'privacy') {
      setShowPassword(false);
    }
  }, [activeTab]);

  // autologout when you close the tab or window
  useEffect(() => {
    const handleBeforeUnload = (): void => {
      localStorage.removeItem('current_ta_user');
      sessionStorage.setItem('ta_session_ended', 'true');
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
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
    checkActiveShift(user.id);
  }, [navigate]);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/shifts`)
      .then(res => res.json())
      .then((json: Shift[]) => setData(json))
      .catch(err => console.error(err));
  }, []);

  const taData: Shift[] = currentUser 
    ? data.filter(row => row.ta_id === currentUser.id)
    : [];

  // Updated grid data with formatted date and time
  const gridData: (string | number | null)[][] = taData.map(row => [
    row.id, // Keep id for internal use
    formatDate(row.clock_in), // Date column - just the date
    row.attendance,
    formatTime(row.clock_in), // Clock In - just the time
    formatTime(row.clock_out), // Clock Out - just the time
    row.elapsed_time,
    row.notes
  ]);

  const handleSignOut = (): void => {
    localStorage.removeItem('current_ta_user');
    sessionStorage.removeItem('ta_session_ended');
    
    logout({ 
      logoutParams: { 
        returnTo: window.location.origin
      } 
    });
  };

  const taName: string = currentUser
    ? `${currentUser.first_name} ${currentUser.last_name}`
    : "Unknown";

  // ✅ Fixed - proper ternary with else branch
  const [assignedClassroom, setAssignedClassroom] = useState<string>(
  currentUser ? `${currentUser.classroom}` : ''
  );

  // Clock in function - IP based validation (no GPS needed)
  const clockIn = async (): Promise<void> => {
    
    try {
      const time = new Date();
      setClockInTime(time);

      // Send clock-in request - backend validates IP address
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/shifts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ta_id: currentUser!.id,
          clock_in: time.toISOString(),
          notes: ""
        })
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to clock in');
      }

      const newShift: Shift = await res.json();

      if (!newShift.id) {
        throw new Error("No shift ID returned from server!");
      }

      setClockedIn(true);
      setActiveShiftId(newShift.id);
      
      alert("Successfully clocked in!");
      
    } catch (err) {
      console.error("Failed to clock in:", err);
      setClockedIn(false);
      alert((err as Error).message || "Failed to clock in. Please try again.");
    }
  };


const clockOut = async (): Promise<void> => {
  console.log("=== CLOCK OUT STARTED ===");
  console.log("Active Shift ID:", activeShiftId);
  console.log("Clock In Time:", clockInTime);
  
  const time = new Date();
  setClockOutTime(time);

  let calculatedElapsed: ElapsedTime | null = null;
  let elapsedTimeText = "";

  if (clockInTime) {
    const diff = time.getTime() - clockInTime.getTime();
    const totalMinutes = Math.floor(diff / 1000 / 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    calculatedElapsed = { hours, minutes }; 
    setElapsed(calculatedElapsed);
    
    // Format as text: "2hr30min"
    elapsedTimeText = `${hours}hr${minutes.toString().padStart(2, '0')}min`;
    console.log("Calculated elapsed time:", elapsedTimeText);
  }

  if (!activeShiftId) {
    console.error("No active shift ID found.");
    alert("Error: No active shift found to clock out.");
    return;
  }

  try {
    const requestBody = {
      clock_out: time.toISOString(),
      elapsed_time: elapsedTimeText
    };
    
    console.log("Sending PUT request to:", `${import.meta.env.VITE_API_URL}/api/shifts/${activeShiftId}`);
    console.log("Request body:", JSON.stringify(requestBody, null, 2));
    
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/shifts/${activeShiftId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody)
    });

    console.log("Response status:", response.status);
    console.log("Response ok:", response.ok);
    
    const responseData = await response.json();
    console.log("Response data:", responseData);

    if (!response.ok) {
      throw new Error(responseData.error || 'Failed to clock out');
    }

    console.log("Fetching updated shifts...");
    await fetchShifts();
    
    console.log("Resetting state...");
    setClockedIn(false);
    setActiveShiftId(null);
    setClockInTime(null);
    
    alert("Successfully clocked out!");
    console.log("=== CLOCK OUT COMPLETED ===");
    
  } catch (err) {
    console.error("=== CLOCK OUT FAILED ===");
    console.error("Error:", err);
    console.error("Error message:", (err as Error).message);
    console.error("Error stack:", (err as Error).stack);
    alert((err as Error).message || "Failed to clock out. Please try again.");
  }
};

  const toggleAttendance = async (shiftId: number, newStatus: string): Promise<void> => {
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/api/shifts/${shiftId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attendance: newStatus })
      });

      // Update local state so the correct value persists across re-renders
      setData(prevData =>
        prevData.map(shift =>
          shift.id === shiftId
            ? { ...shift, attendance: newStatus }
            : shift
        )
      );

    } catch (err) {
      console.error("Failed to update attendance:", err);
      alert("Failed to update attendance. Please try again.");
    }
  };

  // Derive the active font size for inline use where CSS var may not cascade
  const activeFontSize = TEXT_SIZE_MAP[textSize];

  return (
  <div
    className={`page-container${darkMode ? ' dark-mode' : ''}`}
    style={{ fontSize: activeFontSize }}
  >
      <div className="page-header" style={{ justifyContent: "flex-start", gap: "40px"}}>
        <img 
          src={logo} 
          alt="Logo" 
          className="page-logo"
        />
        
        <h1 className="page-title">TA Dashboard - Timesheet for {taName}</h1>
          <div style={{
            position: 'absolute',
            top: '100px',
            right: '20px',
            display: 'flex',
            gap: 10,
            zIndex: 10
          }}>
            <button
              onClick={() => setShowClockInConfirm(true)}
              className="btn-primary"
              disabled={clockedIn}
            >
              Clock In
            </button>
            
            <button
              onClick={() => setShowClockOutConfirm(true)}
              className="btn-primary"
              disabled={!clockedIn}
            >
              Clock Out
            </button>
            <button 
              onClick={() => setShowSettingsModal(true)}
              className="btn-settings"
            >
              Settings
            </button>
            <button 
              onClick={handleSignOut}
              className="btn-danger"
            >
              Sign Out
            </button>
          </div>
      </div>

      {/* Assigned Classroom Box */}
      <div style={{
        marginTop: "20px",
        marginBottom: "20px",
        padding: "12px 20px",
        backgroundColor: "#e0f2fe",
        border: "2px solid #0ea5e9",
        borderRadius: "8px",
        display: "inline-block",
        fontSize: "16px",
        fontWeight: "500",
        color: "#0c4a6e"
      }}>
        <strong>Assigned Classroom:</strong> {assignedClassroom}
      </div>

      <div style={{ marginBottom: "10px", fontSize: "18px" }}>
        {clockInTime && (
          <p><strong>Clocked In:</strong> {clockInTime.toLocaleString()}</p>
        )}

        {clockOutTime && (
          <p><strong>Clocked Out:</strong> {clockOutTime.toLocaleString()}</p>
        )}

        {elapsed && (
         <p><strong>Total Time Worked:</strong> {elapsed.hours} hours and {elapsed.minutes} minutes</p>
      )}
      </div>

      {taData.length === 0 ? (
        <p>No data found.</p>
      ) : (
          <Grid
            key={JSON.stringify(data)}
            data={gridData}
            columns={[
              {
                name: "ID",
                hidden: true // Hide the ID column but keep it for row identification
              },
              "Date",
              {
                name: "Attendance",
                width: '120px',
                formatter: (cell: any, row: any) => {
                  const shiftId = row.cells[0].data; // Get ID from first (hidden) column
                  const dropdownId = `dropdown-${shiftId}`;
                  const buttonId = `btn-${shiftId}`;
                  
                  // Determine button color based on status
                  const getColors = (status: string): { bg: string; text: string } => {
                    if (status === 'Tardy') {
                      return { bg: '#fef3c7', text: '#92400e' }; // yellow
                    } else if (status === 'Early Leave') {
                      return { bg: '#dbeafe', text: '#1e40af' }; // blue
                    } else { // Present
                      return { bg: '#c4e9d1ff', text: '#166534' }; // green
                    }
                  };
                  
                  const colors = getColors(cell);
                  
                  return h('div', {
                    style: 'position: relative; display: inline-block;'
                  }, [
                    h('button', {
                      id: buttonId,
                      style: `
                        display: inline-block;
                        padding: 6px 16px;
                        border-radius: 4px;
                        font-weight: 500;
                        font-size: 13px;
                        background-color: ${colors.bg};
                        color: ${colors.text};
                        border: none;
                        cursor: pointer;
                        transition: opacity 0.2s;
                      `,
                      onmouseover: function(this: HTMLElement) { 
                        this.style.opacity = '0.8'; 
                      },
                      onmouseout: function(this: HTMLElement) { 
                        this.style.opacity = '1'; 
                      },
                      onclick: (e: Event) => {
                        e.stopPropagation();
                        const dropdown = document.getElementById(dropdownId);
                        const allDropdowns = document.querySelectorAll('[id^="dropdown-"]');
                        allDropdowns.forEach(d => {
                          if (d.id !== dropdownId) (d as HTMLElement).style.display = 'none';
                        });
                        if (dropdown) {
                          dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
                        }
                      }
                    }, cell || 'Present'),
                    h('div', {
                      id: dropdownId,
                      style: `
                        display: none;
                        position: absolute;
                        top: 100%;
                        left: 0;
                        margin-top: 4px;
                        background: white;
                        border: 1px solid #e5e7eb;
                        border-radius: 4px;
                        box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
                        z-index: 1000;
                        min-width: 120px;
                      `
                    }, [
                      h('div', {
                        style: `
                          padding: 8px 12px;
                          cursor: pointer;
                          font-size: 13px;
                          transition: background-color 0.2s;
                        `,
                        onmouseover: function(this: HTMLElement) { this.style.backgroundColor = '#f3f4f6'; },
                        onmouseout: function(this: HTMLElement) { this.style.backgroundColor = 'transparent'; },
                        onclick: (e: Event) => {
                          e.stopPropagation();
                          const button = document.getElementById(buttonId);
                          const colors = getColors('Present');
                          if (button) {
                            (button as HTMLElement).style.backgroundColor = colors.bg;
                            (button as HTMLElement).style.color = colors.text;
                            (button as HTMLElement).textContent = 'Present';
                          }
                          const dropdown = document.getElementById(dropdownId);
                          if (dropdown) dropdown.style.display = 'none';
                          toggleAttendance(shiftId, 'Present');
                        }
                      }, 'Present'),
                      h('div', {
                        style: `
                          padding: 8px 12px;
                          cursor: pointer;
                          font-size: 13px;
                          transition: background-color 0.2s;
                        `,
                        onmouseover: function(this: HTMLElement) { this.style.backgroundColor = '#f3f4f6'; },
                        onmouseout: function(this: HTMLElement) { this.style.backgroundColor = 'transparent'; },
                        onclick: (e: Event) => {
                          e.stopPropagation();
                          const button = document.getElementById(buttonId);
                          const colors = getColors('Tardy');
                          if (button) {
                            (button as HTMLElement).style.backgroundColor = colors.bg;
                            (button as HTMLElement).style.color = colors.text;
                            (button as HTMLElement).textContent = 'Tardy';
                          }
                          const dropdown = document.getElementById(dropdownId);
                          if (dropdown) dropdown.style.display = 'none';
                          toggleAttendance(shiftId, 'Tardy');
                        }
                      }, 'Tardy'),
                      h('div', {
                        style: `
                          padding: 8px 12px;
                          cursor: pointer;
                          font-size: 13px;
                          transition: background-color 0.2s; 
                        `,
                        onmouseover: function(this: HTMLElement) { this.style.backgroundColor = '#f3f4f6'; },
                        onmouseout: function(this: HTMLElement) { this.style.backgroundColor = 'transparent'; },
                        onclick: (e: Event) => {
                          e.stopPropagation();
                          const button = document.getElementById(buttonId);
                          const colors = getColors('Early Leave');
                          if (button) {
                            (button as HTMLElement).style.backgroundColor = colors.bg;
                            (button as HTMLElement).style.color = colors.text;
                            (button as HTMLElement).textContent = 'Early Leave';
                          }
                          const dropdown = document.getElementById(dropdownId);
                          if (dropdown) dropdown.style.display = 'none';
                          toggleAttendance(shiftId, 'Early Leave');
                        }
                      }, 'Early Leave'),
                    ])
                  ]);
                }
              },
              "Clock In",
              "Clock Out",
              "Elapsed Time",
              {
                name: "Notes",
                formatter: (cell: any, row: any) => {
                  const shiftId = row.cells[0].data; // Get ID from first (hidden) column
                  const currentNotes = cell || '';
                  
                  return h('div', {
                    style: 'display: flex; align-items: center; gap: 8px;'
                  }, [
                    h('span', {
                      style: 'flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;'
                    }, currentNotes || 'No notes'),
                    h('button', {
                      style: `
                        background: none;
                        border: none;
                        cursor: pointer;
                        padding: 4px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        color: #6b7280;
                        transition: color 0.2s;
                      `,
                      onmouseover: function(this: HTMLElement) { this.style.color = '#1e40af'; },
                      onmouseout: function(this: HTMLElement) { this.style.color = '#6b7280'; },
                      onclick: (e: Event) => {
                        e.stopPropagation();
                        handleEditNotes(shiftId, currentNotes);
                      },
                      title: 'Edit notes'
                    }, 
                    // Pencil icon SVG
                    h('svg', {
                      width: '16',
                      height: '16',
                      viewBox: '0 0 24 24',
                      fill: 'none',
                      stroke: 'currentColor',
                      'stroke-width': '2',
                      'stroke-linecap': 'round',
                      'stroke-linejoin': 'round'
                    }, [
                      h('path', { d: 'M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z' })
                    ]))
                  ]);
                }
              }
            ]}
            search={true}
            pagination={{ limit: 4 }}
            sort={true}
          />
      )}

      <h1 className="page-title" style={{ marginTop: "20px" }}>Volunteer Hours for {taName}</h1>
      <h1>Hours by month</h1>
      {currentUser && <Chart currentUser={currentUser}/>}

      {/* Notes Edit Modal */}
      {showNotesModal && (
        <div style={overlayStyle}>
          <div style={{
            ...modalStyle,
            minWidth: '400px',
            textAlign: 'left'
          }}>
            <h2 style={{ marginBottom: '20px' }}>Edit Notes</h2>
            <textarea
              value={editingNotes}
              onChange={(e) => setEditingNotes(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSaveNotes();
                }
              }}
              placeholder="Enter notes here..."
              style={{
                width: '100%',
                minHeight: '120px',
                padding: '10px',
                borderRadius: '4px',
                border: '1px solid #d1d5db',
                fontSize: '14px',
                fontFamily: 'inherit',
                resize: 'vertical',
                marginBottom: '20px'
              }}
              autoFocus
            />
            <div style={{ 
              display: 'flex', 
              gap: '10px', 
              justifyContent: 'flex-end' 
            }}>
              <button
                onClick={handleSaveNotes}
                className="btn-primary"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setShowNotesModal(false);
                  setEditingShiftId(null);
                  setEditingNotes('');
                }}
                className="btn-danger"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clock In Confirmation */}
      {showClockInConfirm && (
        <div style={overlayStyle}>
          <div style={modalStyle}>
            <h2>Confirm Clock In</h2>
            <p>Are you sure you want to clock in?</p>
            <div style={{ marginTop: "20px", right: "10px" }}>
              <button
                onClick={() => {
                  setShowClockInConfirm(false);
                  clockIn();
                }}
                className="btn-primary"
              >
                Yes, I'm sure
              </button>
              <button
                onClick={() => setShowClockInConfirm(false)}
                className="btn-danger"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clock Out Confirmation */}
      {showClockOutConfirm && (
        <div style={overlayStyle}>
          <div style={modalStyle}>
            <h2>Confirm Clock Out</h2>
            <p>Are you sure you want to clock out?</p>
            <div style={{ marginTop: "20px", right: "10px" }}>
              <button
                onClick={() => {
                  setShowClockOutConfirm(false);
                  clockOut();
                }}
                className="btn-primary"
              >
                Yes, I'm sure
              </button>
              <button 
                onClick={() => setShowClockOutConfirm(false)}
                className="btn-danger"
              >
                Cancel
              </button>
            </div>
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
              <button 
                onClick={() => setActiveTab('account')}
                style={{
                  padding: '12px 24px',
                  background: activeTab === 'account' ? '#bfdbfe' : 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: activeTab === 'account' ? '#1e40af' : '#6b7280'
                }}>
                Account
              </button>
              <button 
                onClick={() => setActiveTab('privacy')}
                style={{
                  padding: '12px 24px',
                  background: activeTab === 'privacy' ? '#bfdbfe' : 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: activeTab === 'privacy' ? '#1e40af' : '#6b7280'
                }}>
                Privacy
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
                      <button style={{ padding: '10px 30px', background: 'white', border: '1px solid #d1d5db', borderRadius: 6, cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}>
                        English
                      </button>
                      <button style={{ padding: '10px 30px', background: 'white', border: '1px solid #d1d5db', borderRadius: 6, cursor: 'pointer', fontSize: '14px', color: '#6b7280' }}>
                        Korean
                      </button>
                    </div>
                  </div>

                  <div style={{ marginBottom: 30 }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: 12, color: '#1e40af' }}>
                      Theme
                    </h3>
                    <button
                      onClick={() => setDarkMode(false)}
                      style={{
                        padding: '10px 30px',
                        background: !darkMode ? '#1e40af' : 'white',
                        color: !darkMode ? 'white' : '#374151',
                        border: '1px solid #d1d5db',
                        borderRadius: 6,
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500'
                      }}>
                      Light Mode
                    </button>
                    <button
                      onClick={() => setDarkMode(true)}
                      style={{
                        padding: '10px 30px',
                        background: darkMode ? '#4b5563' : 'white',
                        color: darkMode ? 'white' : '#374151',
                        border: '1px solid #4b5563',
                        borderRadius: 6,
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}>
                      Dark Mode
                    </button>
                    </div>

                  {/* ── Text / Icon Size ── */}
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: 12, color: '#1e40af' }}>
                      Text/Icon Size
                    </h3>
                    <div style={{ display: 'flex', gap: 10 }}>
                      {(['S', 'M', 'L'] as TextSize[]).map((size) => (
                        <button
                          key={size}
                          onClick={() => setTextSize(size)}
                          style={{
                            padding: '10px 20px',
                            background: textSize === size ? '#1e40af' : 'white',
                            color: textSize === size ? 'white' : '#374151',
                            border: `2px solid ${textSize === size ? '#1e40af' : '#d1d5db'}`,
                            borderRadius: 6,
                            cursor: 'pointer',
                            fontWeight: '600',
                            // Show each button in its own representative size
                            fontSize: size === 'S' ? '12px' : size === 'M' ? '16px' : '20px',
                            transition: 'background 0.15s, color 0.15s, border-color 0.15s',
                            minWidth: 48,
                          }}
                        >
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

              {activeTab === 'account' && (
                <>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: 20, color: '#1e40af' }}>Information</h3>
                  <div style={{ marginBottom: 20 }}>
                    <p style={{ marginBottom: 8, fontSize: '14px', color: '#1e40af', fontWeight: '600' }}>Name</p>
                    <div style={{ padding: '10px 16px', background: 'white', border: '1px solid #d1d5db', borderRadius: 6, width: '200px' }}>
                      {taName}
                    </div>
                  </div>
                  <div style={{ marginBottom: 20 }}>
                    <p style={{ marginBottom: 8, fontSize: '14px', color: '#1e40af', fontWeight: '600' }}>Email</p>
                    <div style={{ padding: '10px 16px', background: 'white', border: '1px solid #d1d5db', borderRadius: 6, width: '200px' }}>
                      {currentUser?.email || 'N/A'}
                    </div>
                  </div>
                  <div>
                    <p style={{ marginBottom: 8, fontSize: '14px', color: '#1e40af', fontWeight: '600' }}>Phone Number</p>
                    <div style={{ padding: '10px 16px', background: 'white', border: '1px solid #d1d5db', borderRadius: 6, width: '200px' }}>
                      Not provided
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'privacy' && (
                <>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: 20, color: '#1e40af' }}>Security</h3>
                  <div style={{ marginBottom: 24 }}>
                    <p style={{ marginBottom: 8, fontSize: '14px', color: '#1e40af', fontWeight: '600' }}>Password</p>

                    {/* Password display row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                      <div style={{
                        padding: '10px 16px',
                        background: 'white',
                        border: '1px solid #d1d5db',
                        borderRadius: 6,
                        minWidth: '180px',
                        fontFamily: showPassword ? 'inherit' : 'monospace',
                        letterSpacing: showPassword ? 'normal' : '0.15em',
                        fontSize: '14px',
                        color: '#374151',
                      }}>
                        {showPassword
                          ? (currentUser?.email
                              ? '(managed via Auth0 — reset via email)'
                              : 'No password on file')
                          : '••••••••'}
                      </div>

                      {/* View / Hide toggle button */}
                      <button
                        onClick={() => setShowPassword(prev => !prev)}
                        style={{
                          padding: '8px 16px',
                          background: 'white',
                          border: '1px solid #d1d5db',
                          borderRadius: 6,
                          cursor: 'pointer',
                          fontSize: '14px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          color: '#374151',
                          transition: 'background 0.15s',
                        }}
                        onMouseOver={e => (e.currentTarget.style.background = '#f3f4f6')}
                        onMouseOut={e => (e.currentTarget.style.background = 'white')}
                      >
                        {/* Eye / Eye-off icon */}
                        {showPassword ? (
                          /* Eye-off SVG */
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                            <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                            <line x1="1" y1="1" x2="23" y2="23"/>
                          </svg>
                        ) : (
                          /* Eye SVG */
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                            <circle cx="12" cy="12" r="3"/>
                          </svg>
                        )}
                        {showPassword ? 'Hide' : 'View'}
                      </button>
                    </div>

                    {/* Contextual note when revealed */}
                    {showPassword && (
                      <p style={{
                        fontSize: '12px',
                        color: '#6b7280',
                        marginTop: 4,
                        maxWidth: 320,
                      }}>
                        Passwords are managed securely through Auth0. To change your password, use the "Forgot password" flow on the login page.
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TADashboard;