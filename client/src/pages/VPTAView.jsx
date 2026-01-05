import { useState, useMemo, useEffect } from "react";

function VPTAView({ ta_id }) {
  const [allShifts, setAllShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch shifts from API
  useEffect(() => {
    const fetchShifts = async () => {
      try {
        const response = await fetch('/api/shifts');
        if (!response.ok) throw new Error('Failed to fetch shifts');
        const data = await response.json();
        setAllShifts(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchShifts();
  }, []);

  // Filter shifts for the specific TA
  const shifts = useMemo(() => {
    if (!allShifts || !ta_id) return [];
    return allShifts.filter(shift => shift.ta_id === ta_id);
  }, [allShifts, ta_id]);

  const calculateHours = (clockIn, clockOut) => {
    if (!clockIn || !clockOut) return 0;
    const start = new Date(clockIn);
    const end = new Date(clockOut);
    return ((end - start) / (1000 * 60 * 60)).toFixed(2);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear().toString().slice(2)}`;
  };

  // Get TA info from first shift
  const taInfo = shifts.length > 0 ? shifts[0] : null;

  // Group shifts by month
  const shiftsByMonth = useMemo(() => {
    const grouped = {};
    shifts.forEach(shift => {
      const date = new Date(shift.clock_in);
      const monthYear = `${date.toLocaleString('default', { month: 'long' })} ${date.getFullYear()}`;
      if (!grouped[monthYear]) {
        grouped[monthYear] = [];
      }
      grouped[monthYear].push(shift);
    });
    return grouped;
  }, [shifts]);

  // Calculate total hours and stats
  const totalHours = useMemo(() => {
    return shifts.reduce((sum, shift) => {
      return sum + parseFloat(calculateHours(shift.clock_in, shift.clock_out));
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
        <div style={{ fontSize: '24px', color: '#5b8bb8' }}>Loading...</div>
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
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <div style={{ fontSize: '24px', color: '#dc2626' }}>Error: {error}</div>
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
        onClick={() => window.location.href = '/vp/dashboard'}
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
          {Object.entries(shiftsByMonth).map(([month, monthShifts]) => (
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
                {monthShifts.map((shift, index) => (
                  <div
                    key={shift.id || index}
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
                      {shift.clock_out 
                        ? `${calculateHours(shift.clock_in, shift.clock_out)} Hours`
                        : 'In Progress'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
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
            <div style={{ textAlign: 'center' }}>
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
                  width: `${(parseFloat(totalHours) / 300) * 100}%`,
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
          </div>
        </div>
      </div>
    </div>
  );
}

export default VPTAView;