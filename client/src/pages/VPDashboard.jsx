import { useEffect, useState } from "react";
import { Grid } from "gridjs-react";
import "gridjs/dist/theme/mermaid.css";
import { SignedIn, SignedOut, SignInButton, useAuth, useClerk } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";

function VPDashboard() {
  const [data, setData] = useState([]);
  const { isLoaded, userId } = useAuth();
  const { signOut } = useClerk();
  const navigate = useNavigate();

  useEffect(() => {
    fetch("http://localhost:3001/api/data")
      .then(res => res.json())
      .then(json => setData(json))
      .catch(err => console.error(err));
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate('/vp/login');
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
      </SignedIn>
    </div>
  );
}

export default VPDashboard;
