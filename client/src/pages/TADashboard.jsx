import { useEffect, useState } from "react";
import { Grid } from "gridjs-react";
import "gridjs/dist/theme/mermaid.css";
import { useNavigate } from "react-router-dom";

function TADashboard() {
  const [data, setData] = useState([]);
  const navigate = useNavigate();
  const [clockedIn, setClockedIn] = useState(false);

  // for marking time
  const [clockInTime, setClockInTime] = useState(null);
  const [clockOutTime, setClockOutTime] = useState(null);
  const [elapsed, setElapsed] = useState(null);
 
  const [currentUser, setCurrentUser] = useState(null);
  const [showClockInConfirm, setShowClockInConfirm] = useState(false);
  const [showClockOutConfirm, setShowClockOutConfirm] = useState(false);
  const [activeShiftId, setActiveShiftId] = useState(null);




  const overlayStyle = {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    backgroundColor: "rgba(0,0,0,0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  };

  const modalStyle = {
    backgroundColor: "#fff",
    padding: "30px",
    borderRadius: "8px",
    textAlign: "center",
    minWidth: "300px",
  };

    const fetchShifts = async () => {
    try {
      const res = await fetch("http://localhost:3001/api/shifts");
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error("Failed to fetch shifts:", err);
    }
  };


  // Check authentication on mount
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('current_ta_user') || 'null');
    if (!user) {
      navigate('/ta/login');
      return;
    }
    setCurrentUser(user);
  }, [navigate]);

  // Fetch shifts data
  useEffect(() => {
    fetch("http://localhost:3001/api/shifts")
      .then(res => res.json())
      .then(json => setData(json))
      .catch(err => console.error(err));
  }, []);

  // Filter rows for the current user's TA ID
  const taData = currentUser 
    ? data.filter(row => row.ta_id === currentUser.id)
    : [];

  // Map filtered rows for Grid.js
  const gridData = taData.map(row => [
    row.id,
    row.ta_id, // hide this later?
    `${row.first_name} ${row.last_name}`,
    row.clock_in,
    row.clock_out,
    row.elapsed_time,
    row.notes,
  ]);

  // Get TA full name from currentUser
  const taName = currentUser
    ? `${currentUser.first_name} ${currentUser.last_name}`
    : "Unknown";

  // clock in and clock out functions
  const clockIn = async () => {
    console.log("Clock In pressed");
    setClockedIn(true);

    const time = new Date();
    setClockInTime(time);

    try {
      // create database row
      const res = await fetch("http://localhost:3001/api/shifts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ta_id: currentUser.id,
          clock_in: time.toISOString(), // Convert to ISO string
          elapsed_time: false,
          notes: ""
        })
      });

      console.log("Response status:", res.status);
      const newShift = await res.json();
      console.log("New shift response:", newShift);

      if (!newShift.id) {
        console.error("No shift ID returned from server!");
        return;
      }

      // store new row ID so we can update it later
      setActiveShiftId(newShift.id);
      console.log("Shift created with ID:", newShift.id);
      console.log("activeShiftId set to:", newShift.id);

    } catch (err) {
      console.error("Failed to clock in:", err);
  }};

  const clockOut = async () => {
    console.log("Clock Out pressed");
    setClockedIn(false);

    const time = new Date();
    setClockOutTime(time);

    // calculate elapsed
    if (clockInTime) {
      const diff = time - clockInTime;
      const totalMinutes = Math.floor(diff / 1000 / 60);
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      setElapsed({ hours, minutes });
    }

    // update existing database row
    if (!activeShiftId) {
      console.error("No active shift ID found.");
      return;
    }

    try {
      await fetch(`http://localhost:3001/api/shifts/${activeShiftId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clock_out: time,
          elapsed_time: elapsed
        })
      });

      console.log(`Shift ${activeShiftId} updated with clock-out time`);

      // Refresh the data to show updated clock-out time in the grid
      await fetchShifts();

      // Reset active shift
      setActiveShiftId(null);
    } catch (err) {
      console.error("Failed to clock out:", err);
    }
  };

  return (
    <div>
      <h1>TA Dashboard - Timesheet for {taName}</h1>

      {/* --- NEW BUTTONS --- */}
      <div style={{ marginBottom: "20px" }}>
        <button
          onClick={() => setShowClockInConfirm(true)}
          style={{ marginRight: "10px" }}
          disabled={clockedIn}
        >
          Clock In
        </button>
        <button
          onClick={() => setShowClockOutConfirm(true)}
          style={{ marginRight: "10px" }}
          disabled={!clockedIn}
        >
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
         <p><strong>Total Time Worked:</strong> {elapsed.hours} hours and {elapsed.minutes} minutes</p>
      )}
      </div>


      {taData.length === 0 ? (
        <p>No data found.</p>
      ) : (
         <Grid
            key={JSON.stringify(data)}
            data={gridData}
            columns={["ID", "TA ID", "TA Name", "Clock In", "Clock Out", "Elapsed Time", "Notes"]}
            search={true}
            pagination={{ enabled: true, limit: 10 }}
            sort={true}
          />
      )}

      {/* clock in popup */}
      {showClockInConfirm && (
        <div style={overlayStyle}>
          <div style={modalStyle}>
            <h2>Confirm Clock In</h2>
            <p>Are you sure you want to clock in?</p>

            <div style={{ marginTop: "20px" }}>
              <button
                onClick={() => {
                  setShowClockInConfirm(false);
                  clockIn();
                }}
                style={{ marginRight: "10px" }}
              >
                Yes, I'm sure
              </button>

              <button onClick={() => setShowClockInConfirm(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* clock out popup */}
      {showClockOutConfirm && (
        <div style={overlayStyle}>
          <div style={modalStyle}>
            <h2>Confirm Clock Out</h2>
            <p>Are you sure you want to clock out?</p>

            <div style={{ marginTop: "20px" }}>
              <button
                onClick={() => {
                  setShowClockOutConfirm(false);
                  clockOut();
                }}
                style={{ marginRight: "10px" }}
              >
                Yes, I'm sure
              </button>

              <button onClick={() => setShowClockOutConfirm(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TADashboard;