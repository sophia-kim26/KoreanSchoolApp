import { useEffect, useState } from "react";
import { Grid } from "gridjs-react";
import "gridjs/dist/theme/mermaid.css";

function TADashboard({ taId }) { // <-- taId comes from login/auth
  const [data, setData] = useState([]);

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

  return (
    <div>
      <h1>TA Dashboard - Timesheet for {taName}</h1>

      {taData.length === 0 ? (
        <p>No data found.</p>
      ) : (
        <Grid
          data={gridData}
          columns={["ID", "TA ID", "TA Name", "Clock In", "Clock Out", "Manual?", "Notes"]}
          search={true}
          pagination={{ enabled: true, limit: 10 }}
        />
      )}
    </div>
  );
}

export default TADashboard;