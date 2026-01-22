import { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

function VPTAView() {
  const { ta_id } = useParams();
  const navigate = useNavigate();
  
  const [allShifts, setAllShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingMonth, setEditingMonth] = useState(null);
  const [editedShifts, setEditedShifts] = useState({});
  const [saving, setSaving] = useState(false);
  const [newShift, setNewShift] = useState({
    clock_in: '',
    clock_out: ''
  });

  // Fetch shifts from API
  useEffect(() => {
    const fetchShifts = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`http://localhost:3001/api/shifts/ta/${ta_id}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          throw new Error("Server returned non-JSON response. Is the backend running on http://localhost:3001?");
        }
        
        const data = await response.json();
        console.log('Fetched shifts data for TA:', ta_id, data);
        setAllShifts(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message);
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    if (ta_id) {
      fetchShifts();
    } else {
      setLoading(false);
      setError("No TA ID provided");
    }
  }, [ta_id]);

  const shifts = useMemo(() => {
    if (!allShifts || allShifts.length === 0) {
      return [];
    }
    return allShifts.sort((a, b) => new Date(b.clock_in) - new Date(a.clock_in));
  }, [allShifts]);

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

  // Format date for datetime-local input (no timezone conversion)
  const formatDateTimeLocal = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    // Get local time components
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Convert datetime-local input to ISO string preserving local time
  const localToISO = (localDateTimeString) => {
    if (!localDateTimeString) return null;
    // The datetime-local input gives us a string like "2024-01-15T14:30"
    // We need to treat this as local time and convert to ISO
    // Add seconds if not present
    const withSeconds = localDateTimeString.includes(':') && localDateTimeString.split(':').length === 2
      ? `${localDateTimeString}:00`
      : localDateTimeString;
    
    const date = new Date(withSeconds);
    return date.toISOString();
  };

  const taInfo = shifts.length > 0 ? shifts[0] : null;

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
    
    const sortedEntries = Object.entries(grouped).sort((a, b) => {
      const dateA = new Date(a[1][0].clock_in);
      const dateB = new Date(b[1][0].clock_in);
      return dateB - dateA;
    });
    
    return Object.fromEntries(sortedEntries);
  }, [shifts]);

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

  const handleEditMonth = (month, monthShifts) => {
    setEditingMonth(month);
    const initialEdits = {};
    monthShifts.forEach(shift => {
      initialEdits[shift.id] = {
        clock_in: formatDateTimeLocal(shift.clock_in),
        clock_out: shift.clock_out ? formatDateTimeLocal(shift.clock_out) : ''
      };
    });
    setEditedShifts(initialEdits);
  };

  const handleCloseEdit = () => {
    setEditingMonth(null);
    setEditedShifts({});
    setNewShift({ clock_in: '', clock_out: '' });
  };

  const handleShiftChange = (shiftId, field, value) => {
    setEditedShifts(prev => ({
      ...prev,
      [shiftId]: {
        ...prev[shiftId],
        [field]: value
      }
    }));
  };

  const handleSaveChanges = async () => {
    setSaving(true);
    try {
      // Update existing shifts first
      const updatePromises = Object.entries(editedShifts).map(([shiftId, data]) => {
        const payload = {};
        
        if (data.clock_in) {
          payload.clock_in = localToISO(data.clock_in);
        }
        
        if (data.clock_out) {
          payload.clock_out = localToISO(data.clock_out);
        }
        
        console.log(`Updating shift ${shiftId}:`, payload);
        
        return fetch(`http://localhost:3001/api/shifts/${shiftId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload)
        });
      });

      if (updatePromises.length > 0) {
        const updateResponses = await Promise.all(updatePromises);
        for (let i = 0; i < updateResponses.length; i++) {
          if (!updateResponses[i].ok) {
            const errorText = await updateResponses[i].text();
            console.error(`Update ${i} failed:`, updateResponses[i].status, errorText);
            throw new Error(`Failed to update shift: ${errorText}`);
          }
        }
        console.log('All updates successful');
      }

      // Create new shift if data is present
      if (newShift.clock_in && newShift.clock_out) {
        const newShiftPayload = {
          ta_id: parseInt(ta_id),
          clock_in: localToISO(newShift.clock_in),
          clock_out: localToISO(newShift.clock_out),
        };

        console.log('=== CREATING NEW SHIFT ===');
        console.log('Payload:', JSON.stringify(newShiftPayload, null, 2));
        console.log('Clock In ISO:', newShiftPayload.clock_in);
        console.log('Clock Out ISO:', newShiftPayload.clock_out);

        const createResponse = await fetch(`http://localhost:3001/api/shifts/manual`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newShiftPayload)
        });

        console.log('Create response status:', createResponse.status);
        const responseText = await createResponse.text();
        console.log('Create response body:', responseText);

        if (!createResponse.ok) {
          throw new Error(`Failed to create shift: ${createResponse.status} - ${responseText}`);
        }

        console.log('New shift created successfully');
      } else {
        console.log('No new shift to create', { 
          clock_in: newShift.clock_in, 
          clock_out: newShift.clock_out 
        });
      }
      
      // Refresh shifts data
      console.log('Refreshing shifts data...');
      const response = await fetch(`http://localhost:3001/api/shifts/ta/${ta_id}`);
      const data = await response.json();
      setAllShifts(Array.isArray(data) ? data : []);
      
      handleCloseEdit();
    } catch (err) {
      console.error('=== ERROR SAVING CHANGES ===');
      console.error('Error object:', err);
      console.error('Error message:', err.message);
      console.error('Error stack:', err.stack);
      alert(`Failed to save changes: ${err.message}`);
    } finally {
      setSaving(false);
    }
};

  const calculateEditedHours = (shiftId) => {
    const shift = editedShifts[shiftId];
    if (!shift || !shift.clock_in || !shift.clock_out) return null;
    
    const start = new Date(shift.clock_in);
    const end = new Date(shift.clock_out);
    const hours = (end - start) / (1000 * 60 * 60);
    return hours > 0 ? hours.toFixed(2) : 0;
  };

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
                No shifts found for TA ID: {ta_id}
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
                    onClick={() => handleEditMonth(month, monthShifts)}
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
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center',
              marginBottom: 30,
              position: 'relative'
            }}>
              <svg width="280" height="280" viewBox="0 0 280 280">
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
                <text x="140" y="130" textAnchor="middle" fontSize="24" fill="#5b8bb8" fontWeight="500">
                  {presentPercentage}% Present
                </text>
                <text x="140" y="160" textAnchor="middle" fontSize="24" fill="#f5d77e" fontWeight="500">
                  {absentPercentage}% Absent
                </text>
              </svg>
            </div>

            <div style={{ textAlign: 'center', marginBottom: 25 }}>
              <div style={{ fontSize: '22px', color: '#5b8bb8', fontWeight: '500', marginBottom: 8 }}>
                {taInfo ? `${taInfo.last_name}, ${taInfo.first_name}` : 'No TA Selected'}
              </div>
              <div style={{ fontSize: '16px', color: '#8b9db3' }}>
                TA ID: {ta_id || 'N/A'}
              </div>
            </div>

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
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editingMonth && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: 12,
            padding: '30px',
            maxWidth: '700px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto',
            boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
          }}>
            <h2 style={{ 
              margin: '0 0 25px 0', 
              color: '#5b8bb8',
              fontSize: '28px',
              fontWeight: '500'
            }}>
              Edit {editingMonth}
            </h2>

            {shiftsByMonth[editingMonth].map((shift, index) => (
              <div key={shift.id} style={{
                marginBottom: 20,
                padding: '20px',
                backgroundColor: '#f9fafb',
                borderRadius: 8,
                border: '1px solid #e5e7eb'
              }}>
                <div style={{ 
                  fontSize: '16px', 
                  fontWeight: '500', 
                  color: '#5b8bb8',
                  marginBottom: 15
                }}>
                  Shift {index + 1} - {formatDate(shift.clock_in)}
                </div>
                
                <div style={{ marginBottom: 12 }}>
                  <label style={{ 
                    display: 'block', 
                    fontSize: '14px', 
                    color: '#6b7280',
                    marginBottom: 6
                  }}>
                    Clock In
                  </label>
                  <input
                    type="datetime-local"
                    value={editedShifts[shift.id]?.clock_in || ''}
                    onChange={(e) => handleShiftChange(shift.id, 'clock_in', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px',
                      fontSize: '16px',
                      border: '1px solid #d1d5db',
                      borderRadius: 6,
                      fontFamily: 'system-ui, -apple-system, sans-serif'
                    }}
                  />
                </div>

                <div>
                  <label style={{ 
                    display: 'block', 
                    fontSize: '14px', 
                    color: '#6b7280',
                    marginBottom: 6
                  }}>
                    Clock Out
                  </label>
                  <input
                    type="datetime-local"
                    value={editedShifts[shift.id]?.clock_out || ''}
                    onChange={(e) => handleShiftChange(shift.id, 'clock_out', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px',
                      fontSize: '16px',
                      border: '1px solid #d1d5db',
                      borderRadius: 6,
                      fontFamily: 'system-ui, -apple-system, sans-serif'
                    }}
                  />
                </div>

                {(() => {
                  const hours = calculateEditedHours(shift.id);
                  return hours !== null && (
                    <div style={{
                      marginTop: 12,
                      padding: '10px',
                      backgroundColor: '#e0f2fe',
                      borderRadius: 6,
                      color: '#0369a1',
                      fontSize: '14px'
                    }}>
                      Total Hours: {hours}
                    </div>
                  );
                })()}
              </div>
            ))}

            {/* Add New Shift Section */}
            <div style={{
              marginTop: 30,
              padding: '20px',
              backgroundColor: '#f0fdf4',
              borderRadius: 8,
              border: '2px dashed #86efac'
            }}>
              <div style={{ 
                fontSize: '18px', 
                fontWeight: '500', 
                color: '#16a34a',
                marginBottom: 15
              }}>
                Add New Shift
              </div>
              
              <div style={{ marginBottom: 12 }}>
                <label style={{ 
                  display: 'block', 
                  fontSize: '14px', 
                  color: '#6b7280',
                  marginBottom: 6
                }}>
                  Clock In
                </label>
                <input
                  type="datetime-local"
                  value={newShift.clock_in}
                  onChange={(e) => setNewShift(prev => ({ ...prev, clock_in: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '10px',
                    fontSize: '16px',
                    border: '1px solid #d1d5db',
                    borderRadius: 6,
                    fontFamily: 'system-ui, -apple-system, sans-serif'
                  }}
                />
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: '14px', 
                  color: '#6b7280',
                  marginBottom: 6
                }}>
                  Clock Out
                </label>
                <input
                  type="datetime-local"
                  value={newShift.clock_out}
                  onChange={(e) => setNewShift(prev => ({ ...prev, clock_out: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '10px',
                    fontSize: '16px',
                    border: '1px solid #d1d5db',
                    borderRadius: 6,
                    fontFamily: 'system-ui, -apple-system, sans-serif'
                  }}
                />
              </div>

              {newShift.clock_in && newShift.clock_out && (() => {
                const start = new Date(newShift.clock_in);
                const end = new Date(newShift.clock_out);
                const hours = (end - start) / (1000 * 60 * 60);
                return hours > 0 && (
                  <div style={{
                    marginTop: 12,
                    padding: '10px',
                    backgroundColor: '#dcfce7',
                    borderRadius: 6,
                    color: '#15803d',
                    fontSize: '14px'
                  }}>
                    Total Hours: {hours.toFixed(2)}
                  </div>
                );
              })()}
            </div>

            <div style={{ 
              display: 'flex', 
              gap: 12, 
              justifyContent: 'flex-end',
              marginTop: 25
            }}>
              <button
                onClick={handleCloseEdit}
                disabled={saving}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#e5e7eb',
                  color: '#374151',
                  border: 'none',
                  borderRadius: 6,
                  fontSize: '16px',
                  fontWeight: '500',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  opacity: saving ? 0.5 : 1
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveChanges}
                disabled={saving}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#5b8bb8',
                  color: 'white',
                  border: 'none',
                  borderRadius: 6,
                  fontSize: '16px',
                  fontWeight: '500',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  opacity: saving ? 0.5 : 1
                }}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default VPTAView;