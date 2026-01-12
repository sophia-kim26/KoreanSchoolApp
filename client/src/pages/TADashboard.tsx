import { useEffect, useState } from "react";
import { Grid } from "gridjs-react";
import "gridjs/dist/theme/mermaid.css";
import { useAuth0 } from "@auth0/auth0-react";
import { useNavigate } from "react-router-dom";
import logo from '../assets/logo.png';
import Chart from "./Chart";

interface TAUser {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  session_day: 'Friday' | 'Saturday' | 'Both';
  is_active: boolean;
  created_at: string;
}

interface Shift {
  id: number;
  ta_id: number;
  first_name?: string;
  last_name?: string;
  clock_in: string;
  clock_out: string | null;
  elapsed_time: number | null;
  was_manual: boolean;
  notes: string | null;
}

interface ActiveShiftResponse {
  activeShift: {
    id: number;
    clock_in: string;
  } | null;
}

interface ElapsedTime {
  hours: number;
  minutes: number;
}

type SettingsTab = 'appearance' | 'navigation' | 'account' | 'privacy';

function TADashboard() {
  const [data, setData] = useState<Shift[]>([]);
  const [clockedIn, setClockedIn] = useState<boolean>(false);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<SettingsTab>('appearance');
  const { logout } = useAuth0();
  const navigate = useNavigate();

  const [clockInTime, setClockInTime] = useState<Date | null>(null);
  const [clockOutTime, setClockOutTime] = useState<Date | null>(null);
  const [elapsed, setElapsed] = useState<ElapsedTime | null>(null);
  const [currentUser, setCurrentUser] = useState<TAUser | null>(null);
  const [showClockInConfirm, setShowClockInConfirm] = useState<boolean>(false);
  const [showClockOutConfirm, setShowClockOutConfirm] = useState<boolean>(false);
  const [activeShiftId, setActiveShiftId] = useState<number | null>(null);

  const overlayStyle: React.CSSProperties = {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    backgroundColor: "rgba(0,0,0,0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  };

  const modalStyle: React.CSSProperties = {
    backgroundColor: "#fff",
    padding: "30px",
    borderRadius: "8px",
    textAlign: "center",
    minWidth: "300px",
  };

  const fetchShifts = async (): Promise<void> => {
    try {
      const res = await fetch("http://localhost:3001/api/shifts");
      const json: Shift[] = await res.json();
      setData(json);
    } catch (err) {
      console.error("Failed to fetch shifts:", err);
    }
  };

  const checkActiveShift = async (userId: number): Promise<void> => {
    try {
      const res = await fetch(`http://localhost:3001/api/shifts/active/${userId}`);
      const json: ActiveShiftResponse = await res.json();
      
      if (json.activeShift) {
        setClockedIn(true);
        setActiveShiftId(json.activeShift.id);
        setClockInTime(new Date(json.activeShift.clock_in));
        console.log("Active shift found:", json.activeShift);
      } else {
        setClockedIn(false);
        setActiveShiftId(null);
        setClockInTime(null);
      }
    } catch (err) {
      console.error("Failed to check active shift:", err);
    }
  };

  // autologout when you close the tab or window
  useEffect(() => {
    const handleBeforeUnload = () => {
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

    const userString = localStorage.getItem('current_ta_user');
    const user: TAUser | null = userString ? JSON.parse(userString) : null;
    
    if (!user) {
      navigate('/ta/login');
      return;
    }
    setCurrentUser(user);
    checkActiveShift(user.id);
  }, [navigate]);

  useEffect(() => {
    fetch("http://localhost:3001/api/shifts")
      .then(res => res.json())
      .then((json: Shift[]) => setData(json))
      .catch(err => console.error(err));
  }, []);

  const taData = currentUser 
    ? data.filter(row => row.ta_id === currentUser.id)
    : [];

  const gridData = taData.map(row => [
    row.id,
    row.clock_in,
    row.clock_out,
    row.elapsed_time,
    row.notes,
  ]);

  const handleSignOut = () => {
    localStorage.removeItem('current_ta_user');
    sessionStorage.removeItem('ta_session_ended');
    
    logout({ 
      logoutParams: { 
        returnTo: window.location.origin
      } 
    });
  };

  const taName = currentUser
    ? `${currentUser.first_name} ${currentUser.last_name}`
    : "Unknown";

  const clockIn = async (): Promise<void> => {
    console.log("Clock In pressed");
    setClockedIn(true);

    const time = new Date();
    setClockInTime(time);

    try {
      const res = await fetch("http://localhost:3001/api/shifts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ta_id: currentUser?.id,
          clock_in: time.toISOString(),
          notes: ""
        })
      });

      console.log("Response status:", res.status);
      const newShift: Shift = await res.json();
      console.log("New shift response:", newShift);

      if (!newShift.id) {
        console.error("No shift ID returned from server!");
        return;
      }

      setActiveShiftId(newShift.id);
      console.log("Shift created with ID:", newShift.id);
    } catch (err) {
      console.error("Failed to clock in:", err);
    }
    navigate('/ta/login');
  };

  const clockOut = async (): Promise<void> => {
    console.log("Clock Out pressed");
    setClockedIn(false);

    const time = new Date();
    setClockOutTime(time);

    let calculatedElapsed: ElapsedTime | null = null;

    if (clockInTime) {
      console.log("in clockInTime function");
      const diff = time.getTime() - clockInTime.getTime();
      const totalMinutes = Math.floor(diff / 1000 / 60);
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      calculatedElapsed = { hours, minutes }; 
      setElapsed(calculatedElapsed);
      console.log(`calculatedElapsed value: ${JSON.stringify(calculatedElapsed)}`);
    }

    if (!activeShiftId) {
      console.error("No active shift ID found.");
      return;
    }

    try {
      await fetch(`http://localhost:3001/api/shifts/${activeShiftId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clock_out: time,
          elapsed_time: calculatedElapsed ? calculatedElapsed.hours : 0
        })
      });

      console.log(`Shift ${activeShiftId} updated with clock-out time`);
      await fetchShifts();
      setActiveShiftId(null);
    } catch (err) {
      console.error("Failed to clock out:", err);
    }
  };

  return (
    <div className="page-container">
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
            columns={["Date", "Clock In", "Clock Out", "Elapsed Time", "Notes"]}
            search={true}
            pagination={{ enabled: true, limit: 10 }}
            sort={true}
          />
      )}

      <h1 className="page-title" style={{ marginTop: "20px" }}>Volunteer Hours for {taName}</h1>
      <h1>Hours by month</h1>
      <Chart currentUser={currentUser} />

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

            {/* Tabs */}
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
                onClick={() => setActiveTab('navigation')}
                style={{
                  padding: '12px 24px',
                  background: activeTab === 'navigation' ? '#bfdbfe' : 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: activeTab === 'navigation' ? '#1e40af' : '#6b7280'
                }}>
                Navigation
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

            {/* Settings Content */}
            <div style={{ 
              background: '#dbeafe', 
              padding: 30, 
              borderRadius: 8,
              minHeight: '400px'
            }}>
              {/* Appearance Tab */}
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
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button style={{ padding: '10px 30px', background: 'white', border: '1px solid #d1d5db', borderRadius: 6, cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}>
                        Light Mode
                      </button>
                      <button style={{ padding: '10px 30px', background: '#4b5563', color: 'white', border: '1px solid #4b5563', borderRadius: 6, cursor: 'pointer', fontSize: '14px' }}>
                        Dark Mode
                      </button>
                    </div>
                  </div>

                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: 12, color: '#1e40af' }}>
                      Text/Icon Size
                    </h3>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button style={{ padding: '10px 20px', background: 'white', border: '1px solid #d1d5db', borderRadius: 6, cursor: 'pointer', fontSize: '12px', fontWeight: '500' }}>S</button>
                      <button style={{ padding: '10px 20px', background: 'white', border: '1px solid #d1d5db', borderRadius: 6, cursor: 'pointer', fontSize: '16px', fontWeight: '500' }}>M</button>
                      <button style={{ padding: '10px 20px', background: 'white', border: '1px solid #d1d5db', borderRadius: 6, cursor: 'pointer', fontSize: '20px', fontWeight: '500' }}>L</button>
                    </div>
                  </div>
                </>
              )}

              {/* Navigation Tab */}
              {activeTab === 'navigation' && (
                <>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: 20, color: '#1e40af' }}>Keyboard Navigation</h3>
                  <button style={{ padding: '8px 20px', background: 'white', border: '1px solid #d1d5db', borderRadius: 6, cursor: 'pointer', fontSize: '14px', marginBottom: 24 }}>Edit Keybinds</button>
                  <div style={{ marginBottom: 24 }}>
                    <p style={{ marginBottom: 12, fontSize: '14px', color: '#1e40af' }}>Change Selection:</p>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button style={{ padding: '12px 24px', background: 'white', border: '1px solid #d1d5db', borderRadius: 6, fontSize: '16px' }}>↑</button>
                    </div>
                    <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                      <button style={{ padding: '12px 24px', background: 'white', border: '1px solid #d1d5db', borderRadius: 6, fontSize: '16px' }}>←</button>
                      <button style={{ padding: '12px 24px', background: 'white', border: '1px solid #d1d5db', borderRadius: 6, fontSize: '16px' }}>↓</button>
                      <button style={{ padding: '12px 24px', background: 'white', border: '1px solid #d1d5db', borderRadius: 6, fontSize: '16px' }}>→</button>
                    </div>
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <p style={{ marginBottom: 8, fontSize: '14px', color: '#1e40af' }}>Select:</p>
                    <div style={{ padding: '12px 20px', background: 'white', border: '1px solid #d1d5db', borderRadius: 6, width: '150px', textAlign: 'center' }}>Enter</div>
                  </div>
                  <div>
                    <p style={{ marginBottom: 8, fontSize: '14px', color: '#1e40af' }}>Escape/Return:</p>
                    <div style={{ padding: '12px 20px', background: 'white', border: '1px solid #d1d5db', borderRadius: 6, width: '150px', textAlign: 'center' }}>Esc</div>
                  </div>
                </>
              )}

              {/* Account Tab */}
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

              {/* Privacy Tab */}
              {activeTab === 'privacy' && (
                <>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: 20, color: '#1e40af' }}>Security</h3>
                  <div style={{ marginBottom: 24 }}>
                    <p style={{ marginBottom: 8, fontSize: '14px', color: '#1e40af', fontWeight: '600' }}>Password</p>
                    <div style={{ padding: '10px 16px', background: 'white', border: '1px solid #d1d5db', borderRadius: 6, width: '150px' }}>********</div>
                  </div>
                  <div>
                    <p style={{ marginBottom: 8, fontSize: '14px', color: '#1e40af', fontWeight: '600' }}>Two-factor Authentication</p>
                    <button style={{ padding: '8px 20px', background: 'white', border: '1px solid #d1d5db', borderRadius: 6, cursor: 'pointer', fontSize: '14px' }}>Set Up</button>
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