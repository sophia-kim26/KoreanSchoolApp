import React from "react";
import { useVPTAView } from "./VPTAViewHooks";
import { calculateHours, formatDate } from "./VPTAViewUtils";

function VPTAView() {
  const {
    ta_id, navigate, loading, error, taInfo, shiftsByMonth, totalHours,
    presentCount, absentCount, totalRelevantDays, presentPercentage, absentPercentage,
    resettingPin, editingMonth, editedShifts, newShift, saving, showResetPinModal,
    newPin, setShowResetPinModal, setNewShift, handleEditMonth, handleCloseEdit,
    handleShiftChange, handleSaveChanges, handleResetPin, copyPinToClipboard, calculateEditedHours
  } = useVPTAView();

  if (loading) {
    return (
      <div style={{ padding: '40px 20px', fontFamily: 'system-ui, -apple-system, sans-serif', backgroundColor: '#f3f4f6', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ fontSize: '24px', color: '#5b8bb8' }}>Loading shifts for TA {ta_id}...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '40px 20px', fontFamily: 'system-ui, -apple-system, sans-serif', backgroundColor: '#f3f4f6', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 20 }}>
        <div style={{ fontSize: '24px', color: '#dc2626', fontWeight: '600' }}>Error Loading Data</div>
        <div style={{ fontSize: '16px', color: '#6b7280', maxWidth: '500px', textAlign: 'center' }}>{error}</div>
        <button onClick={() => window.location.reload()} style={{ padding: '12px 24px', backgroundColor: '#5b8bb8', color: 'white', border: 'none', borderRadius: 6, fontSize: '16px', fontWeight: '500', cursor: 'pointer' }}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '40px 20px', fontFamily: 'system-ui, -apple-system, sans-serif', backgroundColor: '#f3f4f6', minHeight: '100vh' }}>
      <button onClick={() => navigate('/vp/dashboard')}
        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', background: 'transparent', border: 'none', color: '#5b8bb8', fontSize: '20px', cursor: 'pointer', marginBottom: 30, fontWeight: '400' }}
        onMouseOver={(e) => (e.currentTarget.style.color = '#4a7298')}
        onMouseOut={(e) => (e.currentTarget.style.color = '#5b8bb8')}
      >
        <span style={{ fontSize: '24px' }}>←</span> Back to Homescreen
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, maxWidth: '1400px', margin: '0 auto', alignItems: 'start' }}>
        {/* Left Column - Shift History */}
        <div>
          {Object.entries(shiftsByMonth).length === 0 ? (
            <div style={{ backgroundColor: '#ffffff', borderRadius: 8, padding: '40px', textAlign: 'center', color: '#6b7280', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <p style={{ fontSize: '18px', margin: 0, marginBottom: 10, fontWeight: '500' }}>No shifts found for {taInfo ? `${taInfo.first_name} ${taInfo.last_name}` : `TA ID: ${ta_id}`}</p>
              <p style={{ fontSize: '14px', margin: 0, color: '#9ca3af' }}>This TA hasn't clocked in yet. Shifts will appear here once they clock in.</p>
            </div>
          ) : (
            Object.entries(shiftsByMonth).map(([month, monthShifts]) => (
              <div key={month} style={{ marginBottom: 40 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, marginLeft: 10, marginRight: 10 }}>
                  <h2 style={{ fontSize: '32px', fontWeight: '500', color: '#5b7fa8', margin: 0 }}>{month}</h2>
                  <button onClick={() => handleEditMonth(month, monthShifts)}
                    style={{ padding: '8px 24px', backgroundColor: '#f5d77e', color: '#8b7355', border: 'none', borderRadius: 20, fontSize: '16px', fontWeight: '500', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
                    onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#f0cd6b')}
                    onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#f5d77e')}
                  >Edit</button>
                </div>
                <div style={{ backgroundColor: '#ffffff', borderRadius: 8, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                  {monthShifts.map((shift, index) => {
                    const hours = calculateHours(shift.clock_in, shift.clock_out);
                    return (
                      <div key={shift.id || `${shift.clock_in}-${index}`} style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 20px', backgroundColor: '#c5ddf7', borderBottom: index < monthShifts.length - 1 ? '1px solid #a8c9e8' : 'none', color: '#5b7fa8', fontSize: '18px' }}>
                        <span>{formatDate(shift.clock_in)}</span>
                        <span style={{ fontWeight: '400' }}>{shift.clock_out && parseFloat(hours) > 0 ? `${hours} Hours` : shift.clock_out ? '0.00 Hours' : 'In Progress'}</span>
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
          <div style={{ backgroundColor: '#f9ebb5', borderRadius: 12, padding: '40px', marginTop: '60px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', position: 'sticky', top: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: 30, position: 'relative' }}>
              <svg width="280" height="280" viewBox="0 0 280 280">
                {totalRelevantDays === 0 ? (
                  <circle cx="140" cy="140" r="100" fill="none" stroke="#d1d5db" strokeWidth="40" />
                ) : (
                  <>
                    <circle cx="140" cy="140" r="100" fill="none" stroke="#5b8bb8" strokeWidth="40" strokeDasharray={`${presentPercentage * 6.283} 628.3`} strokeDashoffset="0" transform="rotate(-90 140 140)" />
                    <circle cx="140" cy="140" r="100" fill="none" stroke="#ffffff" strokeWidth="40" strokeDasharray={`${absentPercentage * 6.283} 628.3`} strokeDashoffset={`-${presentPercentage * 6.283}`} transform="rotate(-90 140 140)" />
                  </>
                )}
                <text x="140" y="125" textAnchor="middle" fontSize="22" fill="#5b8bb8" fontWeight="500">{presentPercentage}% Present</text>
                <text x="140" y="155" textAnchor="middle" fontSize="22" fill="#f5d77e" fontWeight="500">{absentPercentage}% Absent</text>
                {totalRelevantDays > 0 && <text x="140" y="182" textAnchor="middle" fontSize="13" fill="#9ca3af">{presentCount}/{totalRelevantDays} days</text>}
              </svg>
            </div>

            {taInfo?.session_day && (
              <div style={{ textAlign: 'center', marginBottom: 12 }}>
                <span style={{ display: 'inline-block', padding: '4px 14px', backgroundColor: '#dbeafe', color: '#1e40af', borderRadius: 20, fontSize: '13px', fontWeight: '600' }}>{taInfo.session_day}</span>
              </div>
            )}

            <div style={{ textAlign: 'center', marginBottom: 25 }}>
              <div style={{ fontSize: '22px', color: '#5b8bb8', fontWeight: '500', marginBottom: 8 }}>{taInfo ? `${taInfo.last_name}, ${taInfo.first_name}` : 'No TA Selected'}</div>
              <div style={{ fontSize: '16px', color: '#8b9db3' }}>TA ID: {ta_id || 'N/A'}</div>
            </div>

            <div style={{ marginBottom: 25 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', color: '#5b8bb8', marginBottom: 10 }}><span>Present Days:</span><span>{presentCount}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', color: '#5b8bb8' }}><span>Absent Days:</span><span>{absentCount}</span></div>
            </div>

            <div style={{ textAlign: 'center', marginBottom: 25 }}>
              <div style={{ width: '100%', height: '35px', backgroundColor: '#ffffff', borderRadius: 20, overflow: 'hidden', marginBottom: 10, position: 'relative' }}>
                <div style={{ width: `${Math.min((parseFloat(totalHours) / 300) * 100, 100)}%`, height: '100%', backgroundColor: '#5b8bb8', borderRadius: 20, transition: 'width 0.3s ease' }}></div>
                <div style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: '20px' }}>🏅</div>
              </div>
              <div style={{ fontSize: '18px', color: '#5b8bb8' }}>{totalHours}/300 Hours Completed</div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <button onClick={handleResetPin} disabled={resettingPin}
                style={{ padding: '12px 24px', backgroundColor: resettingPin ? '#9ca3af' : '#ef4444', color: 'white', border: 'none', borderRadius: 8, fontSize: '16px', fontWeight: '600', cursor: resettingPin ? 'not-allowed' : 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', transition: 'background-color 0.2s' }}
                onMouseOver={(e) => !resettingPin && (e.currentTarget.style.backgroundColor = '#dc2626')}
                onMouseOut={(e) => !resettingPin && (e.currentTarget.style.backgroundColor = '#ef4444')}
              >{resettingPin ? 'Resetting...' : 'Reset PIN'}</button>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editingMonth && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', borderRadius: 12, padding: '30px', maxWidth: '700px', width: '90%', maxHeight: '80vh', overflow: 'auto', boxShadow: '0 10px 40px rgba(0,0,0,0.3)' }}>
            <h2 style={{ margin: '0 0 25px 0', color: '#5b8bb8', fontSize: '28px', fontWeight: '500' }}>Edit {editingMonth}</h2>

            {shiftsByMonth[editingMonth].map((shift, index) => (
              <div key={shift.id} style={{ marginBottom: 20, padding: '20px', backgroundColor: '#f9fafb', borderRadius: 8, border: '1px solid #e5e7eb' }}>
                <div style={{ fontSize: '16px', fontWeight: '500', color: '#5b8bb8', marginBottom: 15 }}>Shift {index + 1} - {formatDate(shift.clock_in)}</div>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', fontSize: '14px', color: '#6b7280', marginBottom: 6 }}>Clock In</label>
                  <input type="datetime-local" value={editedShifts[shift.id]?.clock_in || ''} onChange={(e) => handleShiftChange(shift.id, 'clock_in', e.target.value)} style={{ width: '100%', padding: '10px', fontSize: '16px', border: '1px solid #d1d5db', borderRadius: 6 }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', color: '#6b7280', marginBottom: 6 }}>Clock Out</label>
                  <input type="datetime-local" value={editedShifts[shift.id]?.clock_out || ''} onChange={(e) => handleShiftChange(shift.id, 'clock_out', e.target.value)} style={{ width: '100%', padding: '10px', fontSize: '16px', border: '1px solid #d1d5db', borderRadius: 6 }} />
                </div>
                {(() => {
                  const hours = calculateEditedHours(shift.id);
                  return hours !== null && (<div style={{ marginTop: 12, padding: '10px', backgroundColor: '#e0f2fe', borderRadius: 6, color: '#0369a1', fontSize: '14px' }}>Total Hours: {hours}</div>);
                })()}
              </div>
            ))}

            <div style={{ marginTop: 30, padding: '20px', backgroundColor: '#f0fdf4', borderRadius: 8, border: '2px dashed #86efac' }}>
              <div style={{ fontSize: '18px', fontWeight: '500', color: '#16a34a', marginBottom: 15 }}>Add New Shift</div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: '14px', color: '#6b7280', marginBottom: 6 }}>Clock In</label>
                <input type="datetime-local" value={newShift.clock_in} onChange={(e) => setNewShift(prev => ({ ...prev, clock_in: e.target.value }))} style={{ width: '100%', padding: '10px', fontSize: '16px', border: '1px solid #d1d5db', borderRadius: 6 }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', color: '#6b7280', marginBottom: 6 }}>Clock Out</label>
                <input type="datetime-local" value={newShift.clock_out} onChange={(e) => setNewShift(prev => ({ ...prev, clock_out: e.target.value }))} style={{ width: '100%', padding: '10px', fontSize: '16px', border: '1px solid #d1d5db', borderRadius: 6 }} />
              </div>
              {newShift.clock_in && newShift.clock_out && (() => {
                const start = new Date(newShift.clock_in);
                const end = new Date(newShift.clock_out);
                const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
                return hours > 0 && (<div style={{ marginTop: 12, padding: '10px', backgroundColor: '#dcfce7', borderRadius: 6, color: '#15803d', fontSize: '14px' }}>Total Hours: {hours.toFixed(2)}</div>);
              })()}
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 25 }}>
              <button onClick={handleCloseEdit} disabled={saving} style={{ padding: '12px 24px', backgroundColor: '#e5e7eb', color: '#374151', border: 'none', borderRadius: 6, fontSize: '16px', fontWeight: '500', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.5 : 1 }}>Cancel</button>
              <button onClick={handleSaveChanges} disabled={saving} style={{ padding: '12px 24px', backgroundColor: '#5b8bb8', color: 'white', border: 'none', borderRadius: 6, fontSize: '16px', fontWeight: '500', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.5 : 1 }}>{saving ? 'Saving...' : 'Save Changes'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Reset PIN Modal */}
      {showResetPinModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1001 }}>
          <div style={{ background: 'white', padding: 40, borderRadius: 12, width: 500, maxWidth: '90%', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)', textAlign: 'center' }}>
            <div style={{ width: 60, height: 60, background: '#dcfce7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: '30px' }}>✓</div>
            <h2 style={{ marginTop: 0, marginBottom: 16, fontSize: '24px', fontWeight: '600', color: '#166534' }}>PIN Reset Successfully!</h2>
            <p style={{ marginBottom: 24, fontSize: '16px', color: '#374151' }}>New PIN for: <strong>{taInfo ? `${taInfo.first_name} ${taInfo.last_name}` : 'TA'}</strong></p>
            <div style={{ background: '#f3f4f6', padding: 20, borderRadius: 8, marginBottom: 24 }}>
              <p style={{ marginBottom: 8, fontSize: '14px', color: '#6b7280', fontWeight: '500' }}>New PIN (Save this - it cannot be retrieved later)</p>
              <div style={{ fontSize: '32px', fontWeight: '700', color: '#1e40af', letterSpacing: '4px', fontFamily: 'monospace' }}>{newPin}</div>
            </div>
            <div style={{ background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: 6, padding: 12, marginBottom: 24, fontSize: '13px', color: '#92400e' }}>
              ⚠️ <strong>Important:</strong> This PIN is encrypted and stored securely. Make sure to save it now - you won't be able to see it again!
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={copyPinToClipboard} style={{ padding: '12px 24px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}>📋 Copy PIN</button>
              <button onClick={() => setShowResetPinModal(false)} style={{ padding: '12px 24px', background: '#16a34a', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}>Done</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default VPTAView;