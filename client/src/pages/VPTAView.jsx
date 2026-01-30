import { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

const calculateHours = (clockIn, clockOut) => {
  if (!clockIn || !clockOut) return 0;
  const start = new Date(clockIn);
  const end = new Date(clockOut);
  const hours = (end - start) / (1000 * 60 * 60);
  return hours > 0 ? hours.toFixed(2) : 0;
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear().toString().slice(2)}`;
};

function VPTAView() {
  // Extract ta_id from URL params
  const { ta_id } = useParams();
  const navigate = useNavigate();
  
  const [allShifts, setAllShifts] = useState([]);
  const [taInfo, setTaInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showResetPinModal, setShowResetPinModal] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [resettingPin, setResettingPin] = useState(false);

  // Fetch TA info and shifts from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch TA information
        const taResponse = await fetch(`http://localhost:3001/api/tas`);
        if (!taResponse.ok) {
          throw new Error(`Failed to fetch TA info: ${taResponse.status}`);
        }
        const allTAs = await taResponse.json();
        const currentTA = allTAs.find(ta => ta.id === parseInt(ta_id));
        
        if (!currentTA) {
          throw new Error(`TA with ID ${ta_id} not found`);
        }
        setTaInfo(currentTA);
        console.log('TA Info:', currentTA);

        // Fetch shifts
        const shiftsResponse = await fetch(`http://localhost:3001/api/shifts/ta/${ta_id}`);
        if (!shiftsResponse.ok) {
          throw new Error(`HTTP error! status: ${shiftsResponse.status}`);
        }
        
        const contentType = shiftsResponse.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          throw new Error("Server returned non-JSON response");
        }
        
        const shiftsData = await shiftsResponse.json();
        console.log('Fetched shifts data for TA:', ta_id, shiftsData);
        setAllShifts(Array.isArray(shiftsData) ? shiftsData : []);
      } catch (err) {
        setError(err.message);
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    if (ta_id) {
      fetchData();
    } else {
      setLoading(false);
      setError("No TA ID provided");
    }
  }, [ta_id]);

  const handleResetPin = async () => {
    if (!confirm(`Are you sure you want to reset the PIN for ${taInfo.first_name} ${taInfo.last_name}?`)) {
      return;
    }

    try {
      setResettingPin(true);
      const response = await fetch(`http://localhost:3001/api/reset-pin/${ta_id}`, {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error('Failed to reset PIN');
      }

      const result = await response.json();
      setNewPin(result.unhashed_pin);
      setShowResetPinModal(true);
    } catch (err) {
      console.error(err);
      alert('Error resetting PIN: ' + err.message);
    } finally {
      setResettingPin(false);
    }
  };

  const copyPinToClipboard = () => {
    navigator.clipboard.writeText(newPin);
    alert('PIN copied to clipboard!');
  };

  const shifts = useMemo(() => {
    if (!allShifts || allShifts.length === 0) {
      console.log('No shifts returned from API');
      return [];
    }
    console.log(`Using ${allShifts.length} shifts from API for TA ${ta_id}`);
    // Sort by date descending (newest first)
    return allShifts.sort((a, b) => new Date(b.clock_in) - new Date(a.clock_in));
  }, [allShifts, ta_id]);

  // Group shifts by month
  const shiftsByMonth = useMemo(() => {
    if (!shifts || shifts.length === 0) return {};
    
    const grouped = {};
    shifts.forEach(shift => {
      if (!shift.clock_in) return;
      
      const date = new Date(shift.clock_in);
      const monthYear = `${date.toLocaleString('default', { month: 'long' })} ${date.getFullYear()}`;
      
      if (!grouped[monthYear]) {
        grouped[monthYear] = [];
      }
      grouped[monthYear].push(shift);
    });

    // Sort months in reverse chronological order
    const sortedEntries = Object.entries(grouped).sort((a, b) => {
      const dateA = new Date(a[1][0].clock_in);
      const dateB = new Date(b[1][0].clock_in);
      return dateB - dateA;
    });

    return Object.fromEntries(sortedEntries);
  }, [shifts]);

  // Calculate total hours and stats
  const totalHours = useMemo(() => {
    return shifts.reduce((sum, shift) => {
      const hours = parseFloat(calculateHours(shift.clock_in, shift.clock_out));
      return sum + (isNaN(hours) ? 0 : hours);
    }, 0).toFixed(2);
  }, [shifts]);

  const completedShifts = shifts.filter(s => s.clock_out).length;
  const totalShifts = shifts.length;
  const presentPercentage = totalShifts > 0 ? Math.round((completedShifts / totalShifts) * 100) : 0;
  const absentPercentage = 100 - presentPercentage;

  if (loading) {
    return (
      <div style={{ 
        padding: '40px 20px', 
        fontFamily: 'system-ui, -apple-system, sans-serif',
        backgroundColor: '#f3f4f6',
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <div style={{ fontSize: '24px', color: '#5b8bb8' }}>Loading shifts for TA {ta_id}...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        padding: '40px 20px', 
        fontFamily: 'system-ui, -apple-system, sans-serif',
        backgroundColor: '#f3f4f6',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 20
      }}>
        <div style={{ fontSize: '24px', color: '#dc2626', fontWeight: '600' }}>Error Loading Data</div>
        <div style={{ fontSize: '16px', color: '#6b7280', maxWidth: '500px', textAlign: 'center' }}>
          {error}
        </div>
        <div style={{ fontSize: '14px', color: '#9ca3af', maxWidth: '600px', textAlign: 'center' }}>
          Please ensure your backend server is running and accessible at the correct endpoint.
        </div>
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: '12px 24px',
            backgroundColor: '#5b8bb8',
            color: 'white',
            border: 'none',
            borderRadius: 6,
            fontSize: '16px',
            fontWeight: '500',
            cursor: 'pointer'
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={{ 
      padding: '40px 20px', 
      fontFamily: 'system-ui, -apple-system, sans-serif',
      backgroundColor: '#f3f4f6',
      minHeight: '100vh'
    }}>
      <button
        onClick={() => navigate('/vp/dashboard')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 0',
          background: 'transparent',
          border: 'none',
          color: '#5b8bb8',
          fontSize: '20px',
          cursor: 'pointer',
          marginBottom: 30,
          fontWeight: '400'
        }}
        onMouseOver={(e) => e.target.style.color = '#4a7298'}
        onMouseOut={(e) => e.target.style.color = '#5b8bb8'}
      >
        <span style={{ fontSize: '24px' }}>←</span> Back to Homescreen
      </button>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr', 
        gap: 40,
        maxWidth: '1400px',
        margin: '0 auto',
        alignItems: 'start'
      }}>
        {/* Left Column - Shift History */}
        <div>
          {Object.entries(shiftsByMonth).length === 0 ? (
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: 8,
              padding: '40px',
              textAlign: 'center',
              color: '#6b7280',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <p style={{ fontSize: '18px', margin: 0, marginBottom: 10, fontWeight: '500' }}>
                No shifts found for {taInfo ? `${taInfo.first_name} ${taInfo.last_name}` : `TA ID: ${ta_id}`}
              </p>
              <p style={{ fontSize: '14px', margin: 0, color: '#9ca3af' }}>
                This TA hasn't clocked in yet. Shifts will appear here once they clock in.
              </p>
            </div>
          ) : (
            Object.entries(shiftsByMonth).map(([month, monthShifts]) => (
              <div key={month} style={{ marginBottom: 40 }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: 15,
                  marginLeft: 10,
                  marginRight: 10
                }}>
                  <h2 style={{ 
                    fontSize: '32px', 
                    fontWeight: '500', 
                    color: '#5b7fa8',
                    margin: 0
                  }}>
                    {month}
                  </h2>
                  <button
                    onClick={() => alert(`Edit ${month}`)}
                    style={{
                      padding: '8px 24px',
                      backgroundColor: '#f5d77e',
                      color: '#8b7355',
                      border: 'none',
                      borderRadius: 20,
                      fontSize: '16px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}
                    onMouseOver={(e) => e.target.style.backgroundColor = '#f0cd6b'}
                    onMouseOut={(e) => e.target.style.backgroundColor = '#f5d77e'}
                  >
                    Edit
                  </button>
                </div>

                <div style={{
                  backgroundColor: '#ffffff',
                  borderRadius: 8,
                  overflow: 'hidden',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}>
                  {monthShifts.map((shift, index) => {
                    const hours = calculateHours(shift.clock_in, shift.clock_out);
                    return (
                      <div
                        key={shift.id || `${shift.clock_in}-${index}`}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          padding: '16px 20px',
                          backgroundColor: '#c5ddf7',
                          borderBottom: index < monthShifts.length - 1 ? '1px solid #a8c9e8' : 'none',
                          color: '#5b7fa8',
                          fontSize: '18px'
                        }}
                      >
                        <span>{formatDate(shift.clock_in)}</span>
                        <span style={{ fontWeight: '400' }}>
                          {shift.clock_out && hours > 0
                            ? `${hours} Hours`
                            : shift.clock_out 
                            ? '0.00 Hours'
                            : 'In Progress'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Right Column - Chart and Info */}
        <div style={{ position: 'relative' }}>
          <div style={{
            backgroundColor: '#f9ebb5',
            borderRadius: 12,
            padding: '40px',
            marginTop: '60px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            position: 'sticky',
            top: 20
          }}>
            {/* Doughnut Chart */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center',
              marginBottom: 30,
              position: 'relative'
            }}>
              <svg width="280" height="280" viewBox="0 0 280 280">
                {/* Present segment (blue) */}
                <circle
                  cx="140"
                  cy="140"
                  r="100"
                  fill="none"
                  stroke="#5b8bb8"
                  strokeWidth="40"
                  strokeDasharray={`${presentPercentage * 6.283} 628.3`}
                  strokeDashoffset="0"
                  transform="rotate(-90 140 140)"
                />
                {/* Absent segment (light yellow/white) */}
                <circle
                  cx="140"
                  cy="140"
                  r="100"
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="40"
                  strokeDasharray={`${absentPercentage * 6.283} 628.3`}
                  strokeDashoffset={`-${presentPercentage * 6.283}`}
                  transform="rotate(-90 140 140)"
                />
                {/* Center text */}
                <text x="140" y="130" textAnchor="middle" fontSize="24" fill="#5b8bb8" fontWeight="500">
                  {presentPercentage}% Present
                </text>
                <text x="140" y="160" textAnchor="middle" fontSize="24" fill="#f5d77e" fontWeight="500">
                  {absentPercentage}% Absent
                </text>
              </svg>
            </div>

            {/* User Info */}
            <div style={{ textAlign: 'center', marginBottom: 25 }}>
              <div style={{ fontSize: '22px', color: '#5b8bb8', fontWeight: '500', marginBottom: 8 }}>
                {taInfo ? `${taInfo.last_name}, ${taInfo.first_name}` : 'No TA Selected'}
              </div>
              <div style={{ fontSize: '16px', color: '#8b9db3' }}>
                TA ID: {ta_id || 'N/A'}
              </div>
            </div>

            {/* Hours Info */}
            <div style={{ marginBottom: 25 }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                fontSize: '18px',
                color: '#5b8bb8',
                marginBottom: 10
              }}>
                <span>Hours Per Day:</span>
                <span>—</span>
              </div>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                fontSize: '18px',
                color: '#5b8bb8'
              }}>
                <span>Time:</span>
                <span>—</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div style={{ textAlign: 'center', marginBottom: 25 }}>
              <div style={{
                width: '100%',
                height: '35px',
                backgroundColor: '#ffffff',
                borderRadius: 20,
                overflow: 'hidden',
                marginBottom: 10,
                position: 'relative'
              }}>
                <div style={{
                  width: `${Math.min((parseFloat(totalHours) / 300) * 100, 100)}%`,
                  height: '100%',
                  backgroundColor: '#5b8bb8',
                  borderRadius: 20,
                  transition: 'width 0.3s ease'
                }}></div>
                <div style={{
                  position: 'absolute',
                  right: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: '20px'
                }}>
                  🏅
                </div>
              </div>
              <div style={{ fontSize: '18px', color: '#5b8bb8' }}>
                {totalHours}/300 Hours Completed
              </div>
            </div>

            {/* Reset PIN Button */}
            <div style={{ textAlign: 'center' }}>
              <button
                onClick={handleResetPin}
                disabled={resettingPin}
                style={{
                  padding: '12px 24px',
                  backgroundColor: resettingPin ? '#9ca3af' : '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: resettingPin ? 'not-allowed' : 'pointer',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => !resettingPin && (e.target.style.backgroundColor = '#dc2626')}
                onMouseOut={(e) => !resettingPin && (e.target.style.backgroundColor = '#ef4444')}
              >
                {resettingPin ? 'Resetting...' : '🔄 Reset PIN'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Reset PIN Modal */}
      {showResetPinModal && (
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
              PIN Reset Successfully!
            </h2>
            <p style={{ marginBottom: 24, fontSize: '16px', color: '#374151' }}>
              New PIN for: <strong>{taInfo ? `${taInfo.first_name} ${taInfo.last_name}` : 'TA'}</strong>
            </p>
            <div style={{
              background: '#f3f4f6',
              padding: 20,
              borderRadius: 8,
              marginBottom: 24
            }}>
              <p style={{ marginBottom: 8, fontSize: '14px', color: '#6b7280', fontWeight: '500' }}>
                New PIN (Save this - it cannot be retrieved later)
              </p>
              <div style={{
                fontSize: '32px',
                fontWeight: '700',
                color: '#1e40af',
                letterSpacing: '4px',
                fontFamily: 'monospace'
              }}>
                {newPin}
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
                onClick={() => setShowResetPinModal(false)}
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
    </div>
  );
}

export default VPTAView;