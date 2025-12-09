import { useEffect, useState } from "react";
import { Grid } from "gridjs-react";
import "gridjs/dist/theme/mermaid.css";
import { SignedIn, SignedOut, SignInButton, useAuth, useClerk } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";

function VPDashboard() {
  const [data, setData] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    ta_code: "",
    email: "",
    session_day: "",
    google_id: "",
    is_active: true
  });
  const { isLoaded, userId } = useAuth();
  const { signOut } = useClerk();
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = () => {
    fetch("http://localhost:3001/api/data")
      .then(res => res.json())
      .then(json => setData(json))
      .catch(err => console.error(err));
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/vp/login');
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
      const response = await fetch("http://localhost:3001/api/data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        // Reset form and close modal
        setFormData({
          first_name: "",
          last_name: "",
          ta_code: "",
          email: "",
          session_day: "",
          google_id: "",
          is_active: true
        });
        setShowModal(false);
        // Refresh the data
        fetchData();
      } else {
        alert("Failed to add new TA");
      }
    } catch (err) {
      console.error(err);
      alert("Error adding new TA");
    }
  };

  // Transform your data into an array of arrays for Grid.js
  const gridData = data.map(row => [row.id, row.first_name, row.last_name, row.ta_code, row.email, row.session_day, row.google_id, row.is_active]);

  return (
    <div style={{ padding: 20 }}>
    <SignedOut>
      <h1>Access Denied</h1>
      <p>Please sign in to access the VP Dashboard</p>
      <SignInButton mode="modal" />
    </SignedOut>

    <SignedIn>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1>VP Dashboard - TA List</h1>
        <div style={{ display: 'flex', gap: 10 }}>
          <button 
            onClick={() => setShowModal(true)}
            style={{ 
              padding: '10px 20px', 
              background: '#16a34a', 
              color: 'white', 
              border: 'none', 
              borderRadius: 5,
              cursor: 'pointer'
            }}
          >
            Add New TA
          </button>
          <button 
            onClick={handleSignOut}
            style={{ 
              padding: '10px 20px', 
              background: '#dc2626', 
              color: 'white', 
              border: 'none', 
              borderRadius: 5,
              cursor: 'pointer'
            }}
          >
            Sign Out
          </button>
        </div>
      </div>

      <p style={{ marginBottom: 20 }}>Logged in as: {userId}</p>
      
      {data.length === 0 ? (
        <p>No data found.</p>
      ) : (
        <Grid
          data={gridData}
          columns={["id", "first_name", "last_name", "ta_code", "email", "session_day", "google_id", "is_active"]}
          search={true}
          pagination={{ enabled: true, limit: 10 }}
        />
      )}

      {/* Modal */}
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
            borderRadius: 8,
            width: 500,
            maxWidth: '90%'
          }}>
            <h2 style={{ marginTop: 0 }}>Add New TA</h2>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 15 }}>
                <label style={{ display: 'block', marginBottom: 5 }}>First Name:</label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleInputChange}
                  required
                  style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
                />
              </div>
              <div style={{ marginBottom: 15 }}>
                <label style={{ display: 'block', marginBottom: 5 }}>Last Name:</label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleInputChange}
                  required
                  style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
                />
              </div>
              <div style={{ marginBottom: 15 }}>
                <label style={{ display: 'block', marginBottom: 5 }}>TA Code:</label>
                <input
                  type="text"
                  name="ta_code"
                  value={formData.ta_code}
                  onChange={handleInputChange}
                  required
                  style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
                />
              </div>
              <div style={{ marginBottom: 15 }}>
                <label style={{ display: 'block', marginBottom: 5 }}>Email:</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
                />
              </div>
              <div style={{ marginBottom: 15 }}>
                <label style={{ display: 'block', marginBottom: 5 }}>Session Day:</label>
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
                      borderRadius: 5,
                      cursor: 'pointer',
                      fontWeight: formData.session_day === 'Friday' ? 'bold' : 'normal'
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
                      borderRadius: 5,
                      cursor: 'pointer',
                      fontWeight: formData.session_day === 'Saturday' ? 'bold' : 'normal'
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
                      borderRadius: 5,
                      cursor: 'pointer',
                      fontWeight: formData.session_day === 'Both' ? 'bold' : 'normal'
                    }}
                  >
                    Both
                  </button>
                </div>
                {formData.session_day && (
                  <p style={{ marginTop: 5, fontSize: 14, color: '#059669' }}>
                    Selected: {formData.session_day}
                  </p>
                )}
              </div>
              <div style={{ marginBottom: 15 }}>
                <label style={{ display: 'block', marginBottom: 5 }}>Google ID:</label>
                <input
                  type="text"
                  name="google_id"
                  value={formData.google_id}
                  onChange={handleInputChange}
                  style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
                />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleInputChange}
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
                    borderRadius: 5,
                    cursor: 'pointer'
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
                    borderRadius: 5,
                    cursor: 'pointer'
                  }}
                >
                  Add TA
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </SignedIn>
    </div>
  );
}

export default VPDashboard;