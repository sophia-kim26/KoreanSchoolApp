import { useEffect, useState } from "react";
import { Grid } from "gridjs-react";
import { h } from "gridjs";
import "gridjs/dist/theme/mermaid.css";
import { useAuth0 } from "@auth0/auth0-react";
import { useNavigate } from "react-router-dom";

function VPDashboard() {
  const [data, setData] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [activeTab, setActiveTab] = useState('appearance');
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    ta_code: "",
    email: "",
    session_day: "",
    is_active: true
  });
  const { isLoading, isAuthenticated, user, logout } = useAuth0();
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/vp/login');
    }
  }, [isLoading, isAuthenticated, navigate]);

  const fetchData = () => {
    console.log("Fetching data...");
    fetch("http://localhost:3001/api/data")
      .then(res => {
        console.log("Response status:", res.status);
        return res.json();
      })
      .then(json => {
        console.log("Received data:", json);
        const sorted = json.sort((a, b) => {
          if (a.is_active === b.is_active) {
            return a.id - b.id;
          }
          return b.is_active - a.is_active;
        });
        setData(sorted);
      })
      .catch(err => {
        console.error("Fetch error:", err);
        alert("Error loading data: " + err.message);
      });
  };

  const handleSignOut = () => {
    logout({ 
      logoutParams: { 
        returnTo: window.location.origin
      } 
    });
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSessionDaySelect = (day) => {
    setFormData(prev => ({
      ...prev,
      session_day: day
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const { ...dataToSend } = formData;
      
      const response = await fetch("http://localhost:3001/api/data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(dataToSend)
      });

      if (response.ok) {
        setFormData({
          first_name: "",
          last_name: "",
          ta_code: "",
          email: "",
          session_day: "",
          is_active: true
        });
        setShowModal(false);
        fetchData();
      } else {
        alert("Failed to add new TA");
      }
    } catch (err) {
      console.error(err);
      alert("Error adding new TA");
    }
  };

  const toggleAttendance = async (taId, currentAttendance) => {
    try {
      if (currentAttendance === 'Present') {
        await fetch(`http://localhost:3001/api/attendance/clock-out/${taId}`, {
          method: 'POST'
        });
      } else {
        await fetch('http://localhost:3001/api/attendance/clock-in', {
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

  const deactivateTA = async (taId) => {
    if (!confirm('Are you sure you want to deactivate this TA?')) return;
    
    try {
      const response = await fetch(`http://localhost:3001/api/ta/${taId}/deactivate`, {
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

  const gridData = data.map(row => [
    row.id, 
    row.first_name, 
    row.last_name, 
    row.ta_code, 
    row.email, 
    row.session_day, 
    row.is_active,
    row.total_hours || '0.00',
    row.attendance,
    row.id
  ]);

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

  return (
    <div style={{ padding: '40px 20px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }}>
        <h1 style={{ margin: 0, fontSize: '32px', fontWeight: '600' }}>VP Dashboard - TA List</h1>
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
              { name: "ID", width: '60px' },
              { name: "First Name", width: '120px' },
              { name: "Last Name", width: '120px' },
              { name: "TA Code", width: '100px' },
              { name: "Email", width: '220px' },
              { name: "Session Day", width: '120px' },
              { 
                name: "Active",
                width: '80px',
                formatter: (cell) => cell ? 'Yes' : 'No'
              },
              {
                name: "Total Hours",
                width: '100px',
                formatter: (cell) => `${parseFloat(cell || 0).toFixed(2)}h`
              },
              {
                name: "Attendance",
                width: '120px',
                formatter: (cell, row) => {
                  const taId = row.cells[0].data;
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
                    onmouseover: function() { this.style.opacity = '0.8'; },
                    onmouseout: function() { this.style.opacity = '1'; },
                    onclick: () => toggleAttendance(taId, cell)
                  }, cell || 'Absent');
                }
              },
              {
                name: "Actions",
                width: '100px',
                formatter: (cell) => {
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
                  }, 'Remove');
                }
              }
            ]}
            search={true}
            pagination={{ enabled: true, limit: 10 }}
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
                  TA Code:
                </label>
                <input
                  type="text"
                  name="ta_code"
                  value={formData.ta_code}
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
                      color: formData.session_day === 'Both' ? 'white' : '#374141',
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
            width: 500,
            maxWidth: '90%',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{ marginTop: 0, marginBottom: 24, fontSize: '24px', fontWeight: '600' }}>Settings</h2>
            
            <div style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: '18px', fontWeight: '500', marginBottom: 12 }}>Account Information</h3>
              <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: 8 }}>
                Email: {user?.email || user?.name}
              </p>
            </div>

            <div style={{ marginBottom: 20, paddingTop: 20, borderTop: '1px solid #e5e7eb' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '500', marginBottom: 12 }}>Dashboard Settings</h3>
              <p style={{ color: '#6b7280', fontSize: '14px' }}>
                Configure your dashboard preferences and manage your account settings here.
              </p>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 20, borderTop: '1px solid #e5e7eb' }}>
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
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
                Close
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
                  {/* Language Preferences */}
                  <div style={{ marginBottom: 30 }}>
                    <h3 style={{ 
                      fontSize: '16px', 
                      fontWeight: '600', 
                      marginBottom: 12,
                      color: '#1e40af'
                    }}>
                      Language Preferences
                    </h3>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button style={{
                        padding: '10px 30px',
                        background: 'white',
                        border: '1px solid #d1d5db',
                        borderRadius: 6,
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500'
                      }}>
                        English
                      </button>
                      <button style={{
                        padding: '10px 30px',
                        background: 'white',
                        border: '1px solid #d1d5db',
                        borderRadius: 6,
                        cursor: 'pointer',
                        fontSize: '14px',
                        color: '#6b7280'
                      }}>
                        Korean
                      </button>
                    </div>
                  </div>

                  {/* Theme */}
                  <div style={{ marginBottom: 30 }}>
                    <h3 style={{ 
                      fontSize: '16px', 
                      fontWeight: '600', 
                      marginBottom: 12,
                      color: '#1e40af'
                    }}>
                      Theme
                    </h3>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button style={{
                        padding: '10px 30px',
                        background: '#4b5563',
                        color: 'white',
                        border: '1px solid #d1d5db',
                        borderRadius: 6,
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500'
                      }}>
                        Light Mode
                      </button>
                      <button style={{
                        padding: '10px 30px',
                        background: 'white',
                        color: 'black',
                        border: '1px solid #4b5563',
                        borderRadius: 6,
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}>
                        Dark Mode
                      </button>
                    </div>
                  </div>

                  {/* Text/Icon Size */}
                  <div>
                    <h3 style={{ 
                      fontSize: '16px', 
                      fontWeight: '600', 
                      marginBottom: 12,
                      color: '#1e40af'
                    }}>
                      Text/Icon Size
                    </h3>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button style={{
                        padding: '10px 20px',
                        background: 'white',
                        border: '1px solid #d1d5db',
                        borderRadius: 6,
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}>
                        S
                      </button>
                      <button style={{
                        padding: '10px 20px',
                        background: 'white',
                        border: '1px solid #d1d5db',
                        borderRadius: 6,
                        cursor: 'pointer',
                        fontSize: '16px',
                        fontWeight: '500'
                      }}>
                        M
                      </button>
                      <button style={{
                        padding: '10px 20px',
                        background: 'white',
                        border: '1px solid #d1d5db',
                        borderRadius: 6,
                        cursor: 'pointer',
                        fontSize: '20px',
                        fontWeight: '500'
                      }}>
                        L
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* Navigation Tab */}
              {activeTab === 'navigation' && (
                <>
                  <h3 style={{ 
                    fontSize: '18px', 
                    fontWeight: '600', 
                    marginBottom: 20,
                    color: '#1e40af'
                  }}>
                    Keyboard Navigation
                  </h3>
                  
                  <button style={{
                    padding: '8px 20px',
                    background: 'white',
                    border: '1px solid #d1d5db',
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontSize: '14px',
                    marginBottom: 24
                  }}>
                    Edit Keybinds
                  </button>

                  <div style={{ marginBottom: 24 }}>
                    <p style={{ marginBottom: 12, fontSize: '14px', color: '#1e40af' }}>
                      Change Selection:
                    </p>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button style={{
                        padding: '12px 24px',
                        background: 'white',
                        border: '1px solid #d1d5db',
                        borderRadius: 6,
                        fontSize: '16px'
                      }}>
                        ↑
                      </button>
                    </div>
                    <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                      <button style={{
                        padding: '12px 24px',
                        background: 'white',
                        border: '1px solid #d1d5db',
                        borderRadius: 6,
                        fontSize: '16px'
                      }}>
                        ←
                      </button>
                      <button style={{
                        padding: '12px 24px',
                        background: 'white',
                        border: '1px solid #d1d5db',
                        borderRadius: 6,
                        fontSize: '16px'
                      }}>
                        ↓
                      </button>
                      <button style={{
                        padding: '12px 24px',
                        background: 'white',
                        border: '1px solid #d1d5db',
                        borderRadius: 6,
                        fontSize: '16px'
                      }}>
                        →
                      </button>
                    </div>
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <p style={{ marginBottom: 8, fontSize: '14px', color: '#1e40af' }}>Select:</p>
                    <div style={{
                      padding: '12px 20px',
                      background: 'white',
                      border: '1px solid #d1d5db',
                      borderRadius: 6,
                      width: '150px',
                      textAlign: 'center'
                    }}>
                      Enter
                    </div>
                  </div>

                  <div>
                    <p style={{ marginBottom: 8, fontSize: '14px', color: '#1e40af' }}>Escape/Return:</p>
                    <div style={{
                      padding: '12px 20px',
                      background: 'white',
                      border: '1px solid #d1d5db',
                      borderRadius: 6,
                      width: '150px',
                      textAlign: 'center'
                    }}>
                      Esc
                    </div>
                  </div>
                </>
              )}

              {/* Account Tab */}
              {activeTab === 'account' && (
                <>
                  <h3 style={{ 
                    fontSize: '18px', 
                    fontWeight: '600', 
                    marginBottom: 20,
                    color: '#1e40af'
                  }}>
                    Information
                  </h3>

                  <div style={{ marginBottom: 20 }}>
                    <p style={{ marginBottom: 8, fontSize: '14px', color: '#1e40af', fontWeight: '600' }}>Name</p>
                    <div style={{
                      padding: '10px 16px',
                      background: 'white',
                      border: '1px solid #d1d5db',
                      borderRadius: 6,
                      width: '200px'
                    }}>
                      {user?.name || 'N/A'}
                    </div>
                  </div>

                  <div style={{ marginBottom: 20 }}>
                    <p style={{ marginBottom: 8, fontSize: '14px', color: '#1e40af', fontWeight: '600' }}>Email</p>
                    <div style={{
                      padding: '10px 16px',
                      background: 'white',
                      border: '1px solid #d1d5db',
                      borderRadius: 6,
                      width: '200px'
                    }}>
                      {user?.email || 'N/A'}
                    </div>
                  </div>

                  <div>
                    <p style={{ marginBottom: 8, fontSize: '14px', color: '#1e40af', fontWeight: '600' }}>Phone Number</p>
                    <div style={{
                      padding: '10px 16px',
                      background: 'white',
                      border: '1px solid #d1d5db',
                      borderRadius: 6,
                      width: '200px'
                    }}>
                      {user?.phone_number || 'Not provided'}
                    </div>
                  </div>
                </>
              )}

              {/* Privacy Tab */}
              {activeTab === 'privacy' && (
                <>
                  <h3 style={{ 
                    fontSize: '18px', 
                    fontWeight: '600', 
                    marginBottom: 20,
                    color: '#1e40af'
                  }}>
                    Security
                  </h3>

                  <div style={{ marginBottom: 24 }}>
                    <p style={{ marginBottom: 8, fontSize: '14px', color: '#1e40af', fontWeight: '600' }}>Password</p>
                    <div style={{
                      padding: '10px 16px',
                      background: 'white',
                      border: '1px solid #d1d5db',
                      borderRadius: 6,
                      width: '150px'
                    }}>
                      ********
                    </div>
                  </div>

                  <div>
                    <p style={{ marginBottom: 8, fontSize: '14px', color: '#1e40af', fontWeight: '600' }}>Two-factor Authentication</p>
                    <button style={{
                      padding: '8px 20px',
                      background: 'white',
                      border: '1px solid #d1d5db',
                      borderRadius: 6,
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}>
                      Set Up
                    </button>
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

export default VPDashboard;