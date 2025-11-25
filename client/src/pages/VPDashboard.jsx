import { useEffect, useState } from "react";
import { Grid } from "gridjs-react";
import "gridjs/dist/theme/mermaid.css";

function VPDashboard() {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetch("http://localhost:3001/api/data")
      .then(res => res.json())
      .then(json => setData(json))
      .catch(err => console.error(err));
  }, []);

  // Transform your data into an array of arrays for Grid.js
  const gridData = data.map(row => [row.id, row.first_name, row.last_name, row.ta_code, row.email, row.session_day, row.google_id, row.is_active]);

  return (
    <div>
      <h1>VP Dashboard - TA List</h1>

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
    </div>
  );
}

export default VPDashboard;
