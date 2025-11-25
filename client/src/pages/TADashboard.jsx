import { useEffect, useState } from "react";
import { Grid } from "gridjs-react";
import "gridjs/dist/theme/mermaid.css";

function TADashboard() {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetch("http://localhost:3001/api/data")
      .then(res => res.json())
      .then(json => setData(json))
      .catch(err => console.error(err));
  }, []);

  // Filter rows for ta_id = 0
  const taData = data.filter(row => row.ta_id === 0);

  // Transform your data into an array of arrays for Grid.js
  const gridData = data.map(row => [row.id, row.ta_id, row.clock_in, row.clock_out, row.was_manual, row.notes, row.TA, ]);
const taName = taData.length > 0 
  ? `${taData[0].first_name} ${taData[0].last_name}` 
  : "Unknown";

  return (
    <div>
      <h1>TA Dashboard - Timesheet for TA {taName}</h1>

      {data.length === 0 ? (
        <p>No data found.</p>
      ) : (
        <Grid
          data={gridData}
          columns={["id", "ta_id", "clock_in", "clock_out", "was_manual", "notes", "TA"]}
          search={true}
          pagination={{ enabled: true, limit: 10 }}
        />
      )}
    </div>
  );
}

export default TADashboard;
