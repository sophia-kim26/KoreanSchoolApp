import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import logo from '../assets/logo.png';

function VPTAView() {
  const { taId } = useParams();
  const navigate = useNavigate();
  const { isLoading: authLoading, isAuthenticated } = useAuth0();
  const [taData, setTaData] = useState(null);
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/vp/login');
    }
  }, [authLoading, isAuthenticated, navigate]);

  useEffect(() => {
    if (taId) {
      fetchTADetails();
      fetchShifts();
    }
  }, [taId]);

  const fetchTADetails = async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/ta/${taId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch TA details');
      }
      const data = await response.json();
      setTaData(data);
    } catch (err) {
      console.error(err);
      setError('Failed to load TA details');
    }
  };

  const fetchShifts = async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/ta/${taId}/shifts`);
      if (!response.ok) {
        throw new Error('Failed to fetch shifts');
      }
      const data = await response.json();
      setShifts(data || []);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError('Failed to load shift history');
      setLoading(false);
    }
  };

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

  const formatTime = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  if (authLoading || loading) {
    return (
      <div style={{ 
        padding: 20, 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        minHeight: '100vh' 
      }}>
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 20, textAlign: 'center' }}>
        <h2 style={{ color: '#ef4444' }}>{error}</h2>
        <button
          onClick={() => navigate('/vp/dashboard')}
          style={{
            marginTop: 20,
            padding: '10px 20px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer'
          }}
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  if (!taData) {
    return (
      <div style={{ padding: 20, textAlign: 'center' }}>
        <h2>TA not found</h2>
        <button
          onClick={() => navigate('/vp/dashboard')}
          style={{
            marginTop: 20,
            padding: '10px 20px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer'
          }}
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  // Calculate attendance percentage
  const totalDays = shifts.length;
  const presentDays = shifts.filter(s => s.clock_out_time).length;
  const attendancePercentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;
  const absentPercentage = 100 - attendancePercentage;

  // Group shifts by month (sorted by date descending)
  const sortedShifts = [...shifts].sort((a, b) => 
    new Date(b.shift_date) - new Date(a.shift_date)
  );

  const shiftsByMonth = sortedShifts.reduce((acc, shift) => {
    const date = new Date(shift.shift_date);
    const monthKey = `${date.getMonth() + 1}/${date.getFullYear()}`;
    if (!acc[monthKey]) {
      acc[monthKey] = [];
    }
    acc[monthKey].push(shift);
    return acc;
  }, {});

  // Calculate total completed hours
  const completedHours = shifts
    .filter(s => s.clock_out_time)
    .reduce((sum, s) => sum + parseFloat(calculateHours(s.clock_in_time, s.clock_out_time)), 0);

  // Calculate average hours per day
  const avgHoursPerDay = presentDays > 0 ? (completedHours / presentDays).toFixed(2) : '0.00';

  // Assume a target of hours per day * expected days
  const expectedHoursPerDay = 4;
  const targetHours = totalDays * expectedHoursPerDay;
  const hoursProgress = targetHours > 0 ? Math.min((completedHours / targetHours) * 100, 100) : 0;

  // Calculate donut chart (circumference = 2 * PI * radius = 2 * 3.14159 * 100 = 628.32)
  const radius = 100;
  const circumference = 2 * Math.PI * radius;
  const presentArc = (attendancePercentage / 100) * circumference;
  const absentArc = (absentPercentage / 100) * circumference;

  return (
    <div style={{ 
      padding: '40px 20px', 
      fontFamily: 'system-ui, -apple-system, sans-serif',
      backgroundColor: '#f3f4f6',
      minHeight: '100vh'
    }}>
      <img 
        src={logo} 
        alt="Logo" 
        style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          height: '60px',
          width: 'auto'
        }}
      />

      <button
        onClick={() => navigate('/vp/dashboard')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 16px',
          background: 'transparent',
          border: 'none',
          color: '#60a5fa',
          fontSize: '16px',
          cursor: 'pointer',
          marginBottom: 30,
          fontWeight: '500'
        }}
        onMouseOver={(e) => e.target.style.color = '#3b82f6'}
        onMouseOut={(e) => e.target.style.color = '#60a5fa'}
      >
        <span style={{ fontSize: '20px' }}>←</span> Back to Dashboard
      </button>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr', 
        gap: 30,
        maxWidth: '1400px',
        margin: '0 auto'
      }}>
        {/* Left Column - Shift History */}
        <div>
          {Object.entries(shiftsByMonth).map(([month, monthShifts]) => (
            <div key={month} style={{ marginBottom: 30 }}>
              <h2 style={{ 
                fontSize: '24px', 
                fontWeight: '600', 
                color: '#1e40af',
                marginBottom: 15 
              }}>
                Month: {month}
              </h2>
              <div style={{
                backgroundColor: '#bfdbfe',
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
                      padding: '14px 16px',
                      backgroundColor: '#dbeafe',
                      borderBottom: index < monthShifts.length - 1 ? '1px solid #93c5fd' : 'none',
                      color: '#1e40af',
                      fontSize: '15px'
                    }}
                  >
                    <span>{formatDate(shift.shift_date)}</span>
                    <span style={{ fontWeight: '500' }}>
                      {shift.clock_out_time 
                        ? `${calculateHours(shift.clock_in_time, shift.clock_out_time)} Hours`
                        : 'In Progress'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {shifts.length === 0 && (
            <div style={{
              backgroundColor: '#dbeafe',
              borderRadius: 8,
              padding: 30,
              textAlign: 'center',
              color: '#1e40af',
              fontSize: '16px'
            }}>
              No shift history available
            </div>
          )}
        </div>

        {/* Right Column - TA Summary */}
        <div style={{ position: 'relative' }}>
          <button
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              padding: '10px 24px',
              backgroundColor: '#fbbf24',
              color: '#78350f',
              border: 'none',
              borderRadius: 8,
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#f59e0b'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#fbbf24'}
          >
            Edit
          </button>

          <div style={{
            backgroundColor: '#fef3c7',
            borderRadius: 12,
            padding: 40,
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            marginTop: 50
          }}>
            {/* Attendance Chart */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              marginBottom: 40,
              position: 'relative'
            }}>
              <svg width="300" height="300" viewBox="0 0 300 300">
                {/* Background circle (absent - yellow) */}
                <circle
                  cx="150"
                  cy="150"
                  r={radius}
                  fill="none"
                  stroke="#fde68a"
                  strokeWidth="40"
                />
                {/* Present (blue) portion */}
                <circle
                  cx="150"
                  cy="150"
                  r={radius}
                  fill="none"
                  stroke="#60a5fa"
                  strokeWidth="40"
                  strokeDasharray={`${presentArc} ${circumference}`}
                  strokeDashoffset="0"
                  transform="rotate(-90 150 150)"
                  strokeLinecap="round"
                />
              </svg>
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '32px', fontWeight: '600', color: '#60a5fa' }}>
                  {attendancePercentage}%
                </div>
                <div style={{ fontSize: '18px', fontWeight: '500', color: '#1e40af' }}>
                  Present
                </div>
                <div style={{ fontSize: '24px', fontWeight: '500', color: '#fbbf24', marginTop: 8 }}>
                  {absentPercentage}%
                </div>
                <div style={{ fontSize: '16px', fontWeight: '500', color: '#78350f' }}>
                  Absent
                </div>
              </div>
            </div>

            {/* TA Info */}
            <div style={{ textAlign: 'center', marginBottom: 30 }}>
              <h2 style={{ 
                fontSize: '28px', 
                fontWeight: '600', 
                color: '#1e40af',
                marginBottom: 10
              }}>
                {taData.last_name}, {taData.first_name}
              </h2>
              <div style={{ 
                fontSize: '16px', 
                color: '#78350f',
                marginBottom: 5
              }}>
                {taData.email}
              </div>
              <div style={{ 
                fontSize: '16px', 
                color: '#78350f',
                fontWeight: '500'
              }}>
                PIN: {taData.ta_code}
              </div>
              <div style={{ 
                fontSize: '14px', 
                color: '#78350f',
                marginTop: 5
              }}>
                Session Day: {taData.session_day}
              </div>
            </div>

            {/* Details */}
            <div style={{ marginBottom: 30 }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '12px 0',
                borderBottom: '1px solid #fde68a',
                color: '#78350f',
                fontSize: '16px'
              }}>
                <span>Avg Hours Per Day:</span>
                <span style={{ fontWeight: '600' }}>
                  {avgHoursPerDay}h
                </span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '12px 0',
                borderBottom: '1px solid #fde68a',
                color: '#78350f',
                fontSize: '16px'
              }}>
                <span>Total Days Worked:</span>
                <span style={{ fontWeight: '600' }}>{presentDays}</span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '12px 0',
                color: '#78350f',
                fontSize: '16px'
              }}>
                <span>Status:</span>
                <span style={{ 
                  fontWeight: '600',
                  color: taData.is_active ? '#059669' : '#dc2626'
                }}>
                  {taData.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div style={{ marginTop: 30 }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                marginBottom: 10
              }}>
                <div style={{
                  flex: 1,
                  height: 32,
                  backgroundColor: '#fff',
                  borderRadius: 16,
                  overflow: 'hidden',
                  border: '2px solid #fde68a'
                }}>
                  <div style={{
                    height: '100%',
                    width: `${hoursProgress}%`,
                    backgroundColor: '#60a5fa',
                    transition: 'width 0.3s ease'
                  }} />
                </div>
                <div style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  backgroundColor: hoursProgress >= 100 ? '#10b981' : '#fbbf24',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  color: 'white'
                }}>
                  {hoursProgress >= 100 ? '✓' : '⏱'}
                </div>
              </div>
              <div style={{
                textAlign: 'center',
                fontSize: '16px',
                color: '#1e40af',
                fontWeight: '600'
              }}>
                {completedHours.toFixed(2)} / {targetHours.toFixed(2)} Hours Completed
              </div>
              <div style={{
                textAlign: 'center',
                fontSize: '14px',
                color: '#78350f',
                marginTop: 5
              }}>
                ({hoursProgress.toFixed(1)}% of target)
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VPTAView;