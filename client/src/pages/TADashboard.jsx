import { useEffect, useState } from "react";
import { Grid } from "gridjs-react";
import "gridjs/dist/theme/mermaid.css";
import { useNavigate } from "react-router-dom";

function TADashboard({ taId }) {
  const [data, setData] = useState([]);
  const navigate = useNavigate();
  const [clockedIn, setClockedIn] = useState(false);

  // for marking time
  const now = new Date();  
  const [clockInTime, setClockInTime] = useState(null);
  const [clockOutTime, setClockOutTime] = useState(null);
  const [elapsed, setElapsed] = useState(null);
 
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
    
    setClockInTime(now);
    setClockOutTime(null);
    setElapsed(null);
  };

  const clockOut = () => {
    console.log("Clock Out pressed");
    setClockedIn(false);
    
    setClockOutTime(now);
    if (clockInTime) {
      const diffMins = now - clockInTime;
      const diffHrs = (diffMins / 1000 / 60 / 60).toFixed(2);
      setElapsed(diffHrs);
      console.log(`Elapsed time: ${diffHrs} hours`);
    }
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

      <div style={{ marginBottom: "20px", fontSize: "18px" }}>
        {clockInTime && (
          <p><strong>Clocked In:</strong> {clockInTime.toLocaleString()}</p>
        )}

        {clockOutTime && (
          <p><strong>Clocked Out:</strong> {clockOutTime.toLocaleString()}</p>
        )}

        {elapsed && (
          <p><strong>Total Time Worked:</strong> {elapsed} hours</p>
        )}
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