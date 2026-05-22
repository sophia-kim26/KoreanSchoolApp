import React from "react";
import { useVPTAView } from "./VPTAViewHooks";
import { calculateHours, formatDate } from "./VPTAViewUtils";

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 10px', fontSize: '14px', border: '1px solid #d1d5db', borderRadius: 6, boxSizing: 'border-box', marginTop: 4
};

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '13px', color: '#6b7280', fontWeight: 500, marginTop: 10
};

function VPTAView() {
  const {
    ta_id, navigate, loading, error, taInfo, fullTAInfo, parents,
    shiftsByMonth, totalHours, presentCount, absentCount, totalRelevantDays,
    presentPercentage, absentPercentage, resettingPin, editingMonth,
    editedShifts, newShift, saving, showResetPinModal, newPin, setShowResetPinModal, setNewShift,
    handleEditMonth, handleCloseEdit, handleShiftChange, handleSaveChanges, handleDeleteShift, handleResetPin, copyPinToClipboard, calculateEditedHours,
    editingInfo, editingParents, editTAForm, editParentsForm, savingInfo,
    handleEditInfo, handleCancelEditInfo, handleSaveInfo,
    handleEditParents, handleCancelEditParents, handleParentFormChange, handleSaveParents
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

  const renderTAInfoCard = () => {
    const info = fullTAInfo || taInfo;
    if (!info) return null;

    if (editingInfo) {
      return (
        <div style={{ backgroundColor: '#f9ebb5', borderRadius: 12, padding: '30px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ margin: 0, fontSize: '20px', color: '#5b8bb8', fontWeight: 500 }}>TA Profile Info</h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px' }}>
            <div>
              <label style={labelStyle}>Email</label>
              <input style={inputStyle} value={editTAForm.email || ''} onChange={e => setEditTAForm(prev => ({ ...prev, email: e.target.value }))} />

              <label style={labelStyle}>Phone</label>
              <input style={inputStyle} value={editTAForm.phone || ''} onChange={e => setEditTAForm(prev => ({ ...prev, phone: e.target.value }))} />

              <label style={labelStyle}>High School</label>
              <input style={inputStyle} value={editTAForm.high_school || ''} onChange={e => setEditTAForm(prev => ({ ...prev, high_school: e.target.value }))} />

              <label style={labelStyle}>Grade</label>
              <input style={inputStyle} value={editTAForm.grade || ''} onChange={e => setEditTAForm(prev => ({ ...prev, grade: e.target.value }))} />

              <label style={labelStyle}>Age</label>
              <input style={inputStyle} value={editTAForm.age || ''} onChange={e => setEditTAForm(prev => ({ ...prev, age: e.target.value }))} />
            </div>
            <div>
              <label style={labelStyle}>Gender</label>
              <input style={inputStyle} value={editTAForm.gender || ''} onChange={e => setEditTAForm(prev => ({ ...prev, gender: e.target.value }))} />

              <label style={labelStyle}>Address</label>
              <input style={inputStyle} value={editTAForm.address || ''} onChange={e => setEditTAForm(prev => ({ ...prev, address: e.target.value }))} />

              <label style={labelStyle}>Emergency Phone</label>
              <input style={inputStyle} value={editTAForm.emergency_phone || ''} onChange={e => setEditTAForm(prev => ({ ...prev, emergency_phone: e.target.value }))} />

              <label style={labelStyle}>Notes</label>
              <textarea style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }} value={editTAForm.notes || ''} onChange={e => setEditTAForm(prev => ({ ...prev, notes: e.target.value }))} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 25 }}>
            <button onClick={handleCancelEditInfo} disabled={savingInfo}
              style={{ padding: '10px 20px', backgroundColor: '#e5e7eb', color: '#374151', border: 'none', borderRadius: 6, fontSize: '14px', fontWeight: 500, cursor: savingInfo ? 'not-allowed' : 'pointer', opacity: savingInfo ? 0.5 : 1 }}>
              Cancel
            </button>
            <button onClick={handleSaveInfo} disabled={savingInfo}
              style={{ padding: '10px 20px', backgroundColor: '#5b8bb8', color: 'white', border: 'none', borderRadius: 6, fontSize: '14px', fontWeight: 500, cursor: savingInfo ? 'not-allowed' : 'pointer', opacity: savingInfo ? 0.5 : 1 }}>
              {savingInfo ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      );
    }

    return (
      <div style={{ backgroundColor: '#f9ebb5', borderRadius: 12, padding: '30px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: '20px', color: '#5b8bb8', fontWeight: 500 }}>TA Profile Info</h3>
          <button onClick={handleEditInfo}
            style={{ padding: '6px 16px', backgroundColor: '#5b8bb8', color: 'white', border: 'none', borderRadius: 6, fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>
            Edit
          </button>
        </div>
        <div style={{ color: '#5b7fa8', fontSize: '15px', lineHeight: 1.8 }}>
          <div><strong>Email:</strong> {info.email || 'N/A'}</div>
          <div><strong>Phone:</strong> {info.phone || 'N/A'}</div>
          <div><strong>High School:</strong> {info.high_school || 'N/A'}</div>
          <div><strong>Grade:</strong> {info.grade || 'N/A'}</div>
          <div><strong>Age:</strong> {info.age || 'N/A'}</div>
          <div><strong>Gender:</strong> {info.gender || 'N/A'}</div>
          <div><strong>Address:</strong> {info.address || 'N/A'}</div>
          <div><strong>Emergency Phone:</strong> {info.emergency_phone || 'N/A'}</div>
          <div><strong>Notes:</strong> {info.notes || 'N/A'}</div>
        </div>
      </div>
    );
  };

  const renderParentInfoCard = () => {
    if (editingParents) {
      const formParents = editParentsForm.length >= 2 ? editParentsForm : [
        { englishName: '', koreanName: '', phone: '', email: '' },
        { englishName: '', koreanName: '', phone: '', email: '' }
      ];

      return (
        <div style={{ backgroundColor: '#f9ebb5', borderRadius: 12, padding: '30px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '20px', color: '#5b8bb8', fontWeight: 500 }}>Parent Information</h3>
          {formParents.map((parent, index) => (
            <div key={index} style={{ marginBottom: 20, paddingBottom: 20, borderBottom: index < formParents.length - 1 ? '1px solid #e5e7eb' : 'none' }}>
              <div style={{ fontSize: '15px', fontWeight: 600, color: '#5b8bb8', marginBottom: 10 }}>Parent {index + 1}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px' }}>
                <div>
                  <label style={labelStyle}>Korean Name</label>
                  <input style={inputStyle} value={parent.koreanName || parent.korean_name || ''} onChange={e => handleParentFormChange(index, 'koreanName', e.target.value)} />
                  <label style={labelStyle}>English Name</label>
                  <input style={inputStyle} value={parent.englishName || parent.english_name || ''} onChange={e => handleParentFormChange(index, 'englishName', e.target.value)} />
                </div>
                <div>
                  <label style={labelStyle}>Phone</label>
                  <input style={inputStyle} value={parent.phone || ''} onChange={e => handleParentFormChange(index, 'phone', e.target.value)} />
                  <label style={labelStyle}>Email</label>
                  <input style={inputStyle} value={parent.email || ''} onChange={e => handleParentFormChange(index, 'email', e.target.value)} />
                </div>
              </div>
            </div>
          ))}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 10 }}>
            <button onClick={handleCancelEditParents} disabled={savingInfo}
              style={{ padding: '10px 20px', backgroundColor: '#e5e7eb', color: '#374151', border: 'none', borderRadius: 6, fontSize: '14px', fontWeight: 500, cursor: savingInfo ? 'not-allowed' : 'pointer', opacity: savingInfo ? 0.5 : 1 }}>
              Cancel
            </button>
            <button onClick={handleSaveParents} disabled={savingInfo}
              style={{ padding: '10px 20px', backgroundColor: '#5b8bb8', color: 'white', border: 'none', borderRadius: 6, fontSize: '14px', fontWeight: 500, cursor: savingInfo ? 'not-allowed' : 'pointer', opacity: savingInfo ? 0.5 : 1 }}>
              {savingInfo ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      );
    }

    const displayParents = parents.length > 0 ? parents : [
      { koreanName: 'N/A', englishName: 'N/A', phone: 'N/A', email: 'N/A' },
      { koreanName: 'N/A', englishName: 'N/A', phone: 'N/A', email: 'N/A' }
    ];

    return (
      <div style={{ backgroundColor: '#f9ebb5', borderRadius: 12, padding: '30px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: '20px', color: '#5b8bb8', fontWeight: 500 }}>Parent Information</h3>
          <button onClick={handleEditParents}
            style={{ padding: '6px 16px', backgroundColor: '#5b8bb8', color: 'white', border: 'none', borderRadius: 6, fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>
            Edit
          </button>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
          <thead>
            <tr style={{ backgroundColor: '#5b8dc4', color: 'white' }}>
              <th style={{ padding: '10px', textAlign: 'left', borderRadius: '8px 0 0 0' }}>Korean Name</th>
              <th style={{ padding: '10px', textAlign: 'left' }}>English Name</th>
              <th style={{ padding: '10px', textAlign: 'left' }}>Phone</th>
              <th style={{ padding: '10px', textAlign: 'left', borderRadius: '0 8px 0 0' }}>Email</th>
            </tr>
          </thead>
          <tbody>
            {displayParents.map((parent, index) => (
              <tr key={index} style={{
                backgroundColor: index % 2 === 0 ? '#ffffff' : '#f9fafb',
                borderBottom: '1px solid #e5e7eb'
              }}>
                <td style={{ padding: '10px', color: '#5b7fa8' }}>{parent.koreanName || parent.korean_name || 'N/A'}</td>
                <td style={{ padding: '10px', color: '#5b7fa8' }}>{parent.englishName || parent.english_name || 'N/A'}</td>
                <td style={{ padding: '10px', color: '#5b7fa8' }}>{parent.phone || 'N/A'}</td>
                <td style={{ padding: '10px', color: '#5b7fa8' }}>{parent.email || 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

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
                    const hasNote = shift.notes && shift.notes.trim().length > 0;
                    return (
                      <div
                        key={shift.id || `${shift.clock_in}-${index}`}
                        style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', backgroundColor: '#c5ddf7', borderBottom: index < monthShifts.length - 1 ? '1px solid #a8c9e8' : 'none', color: '#5b7fa8', fontSize: '18px' }}
                        onMouseEnter={e => { if (hasNote) { const tip = e.currentTarget.querySelector('.shift-tooltip') as HTMLElement; if (tip) tip.style.opacity = '1'; if (tip) tip.style.pointerEvents = 'none'; } }}
                        onMouseLeave={e => { const tip = e.currentTarget.querySelector('.shift-tooltip') as HTMLElement; if (tip) tip.style.opacity = '0'; }}
                      >
                        <span>{formatDate(shift.clock_in)}</span>

                        <span style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: '400' }}>
                          {shift.attendance && (
    <span style={{
      fontSize: '13px',
      fontWeight: '600',
      padding: '4px 12px',
      borderRadius: '20px',
      backgroundColor: shift.attendance === 'Present' ? '#c4e9d1' : shift.attendance === 'Tardy' ? '#fef3c7' : '#dbeafe',
      color: shift.attendance === 'Present' ? '#166534' : shift.attendance === 'Tardy' ? '#92400e' : '#1e40af',
    }}>
      {shift.attendance}
    </span>
  )}
                          {shift.clock_out && parseFloat(hours) > 0 ? `${hours} Hours` : shift.clock_out ? '0.00 Hours' : 'In Progress'}
                          {hasNote && (
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                              backgroundColor: '#dbeafe', color: '#2563eb',
                              width: 28, height: 28, borderRadius: '50%',
                              border: '1px solid #bfdbfe',
                              flexShrink: 0,
                            }}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                              </svg>
                            </span>
                          )}
                        </span>

                        {hasNote && (
                          <div
                            className="shift-tooltip"
                            style={{
                              opacity: 0,
                              transition: 'opacity 0.15s ease',
                              position: 'absolute',
                              bottom: 'calc(100% + 10px)',
                              right: 0,
                              backgroundColor: '#ffffff',
                              border: '1px solid #e2e8f0',
                              borderRadius: 10,
                              padding: '14px 16px',
                              minWidth: 220,
                              maxWidth: 300,
                              boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                              zIndex: 50,
                              pointerEvents: 'none',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                              </svg>
                              <span style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#94a3b8' }}>Note</span>
                            </div>
                            <div style={{ fontSize: '14px', color: '#334155', lineHeight: '1.6', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                              {shift.notes}
                            </div>
                            {/* arrow */}
                            <div style={{ position: 'absolute', bottom: -7, right: 18, width: 12, height: 12, backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderTop: 'none', borderLeft: 'none', transform: 'rotate(45deg)' }} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Right Column - Chart and Info */}
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ backgroundColor: '#f9ebb5', borderRadius: 12, padding: '40px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', position: 'sticky', top: 20 }}>
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

          {/* TA Profile Info Card */}
          {renderTAInfoCard()}

          {/* Parent Information Card */}
          {renderParentInfoCard()}
        </div>
      </div>

      {/* Edit Modal */}
      {editingMonth && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', borderRadius: 12, padding: '30px', maxWidth: '700px', width: '90%', maxHeight: '80vh', overflow: 'auto', boxShadow: '0 10px 40px rgba(0,0,0,0.3)' }}>
            <h2 style={{ margin: '0 0 25px 0', color: '#5b8bb8', fontSize: '28px', fontWeight: '500' }}>Edit {editingMonth}</h2>

            {shiftsByMonth[editingMonth].map((shift, index) => (
              <div key={shift.id} style={{ marginBottom: 20, padding: '20px', backgroundColor: '#f9fafb', borderRadius: 8, border: '1px solid #e5e7eb' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                  <div style={{ fontSize: '16px', fontWeight: '500', color: '#5b8bb8' }}>Shift {index + 1} - {formatDate(shift.clock_in)}</div>
                  <button
                    onClick={() => handleDeleteShift(shift.id)}
                    disabled={saving}
                    style={{ padding: '6px 12px', backgroundColor: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 6, fontSize: '14px', fontWeight: '500', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.5 : 1 }}
                    onMouseOver={(e) => !saving && (e.currentTarget.style.backgroundColor = '#fecaca')}
                    onMouseOut={(e) => !saving && (e.currentTarget.style.backgroundColor = '#fee2e2')}
                  >Delete</button>
                </div>
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
