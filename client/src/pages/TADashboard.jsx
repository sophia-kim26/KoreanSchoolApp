import { useEffect, useState } from "react";
import { Grid } from "gridjs-react";
import "gridjs/dist/theme/mermaid.css";
import { useNavigate } from "react-router-dom";

function TADashboard({ taId }) {
  const [data, setData] = useState([]);
  const navigate = useNavigate();
  const [clockedIn, setClockedIn] = useState(false);
 
  // Check authentication on mount
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('current_ta_user') || 'null');
    if (!user) {
      navigate('/ta/login');
      return;
    }
  }, [navigate]);

  // Fetch shifts data
  useEffect(() => {
    fetch("http://localhost:3001/api/shifts")
      .then(res => res.json())
      .then(json => setData(json))
      .catch(err => console.error(err));
  }, []);

  // Filter rows for the given TA ID
  const taData = data.filter(row => row.ta_id === taId);

  // Map filtered rows for Grid.js
  const gridData = taData.map(row => [
    row.id,
    row.ta_id,
    `${row.first_name} ${row.last_name}`,
    row.clock_in,
    row.clock_out,
    row.was_manual,
    row.notes,
  ]);

  // Get TA full name for header
  const taName = taData.length > 0
    ? `${taData[0].first_name} ${taData[0].last_name}`
    : "Unknown";


  // clock in and clock out functions
  const clockIn = () => {
    console.log("Clock In pressed");
    setClockedIn(true);
    // Add your API call here
  };

  const clockOut = () => {
    console.log("Clock Out pressed");
    setClockedIn(false);
    // Add your API call here
  };

  return (
    <div>
      <h1>TA Dashboard - Timesheet for {taName}</h1>

      {/* --- NEW BUTTONS --- */}
      <div style={{ marginBottom: "20px" }}>
        <button onClick={clockIn} style={{ marginRight: "10px" }} disabled={clockedIn}>
          Clock In
        </button>
        <button onClick={clockOut} disabled={!clockedIn}>
          Clock Out
        </button>
      </div>

      {taData.length === 0 ? (
        <p>No data found.</p>
      ) : (
        <Grid
          data={gridData}
          columns={["ID", "TA ID", "TA Name", "Clock In", "Clock Out", "Manual?", "Notes"]}
          search={true}
          pagination={{ enabled: true, limit: 10 }}
          sort={true}
        />
      )}
    </div>
  );
}

export default TADashboard;