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
  const gridData = data.map(row => [row.ta_id, row.fri_sat_both]);

  return (
    <div>
      <h1>VP Dashboard - TA List</h1>

      {data.length === 0 ? (
        <p>No data found.</p>
      ) : (
        <Grid
          data={gridData}
          columns={["ta_id", "fri_sat_both"]}
          search={true}
          pagination={{ enabled: true, limit: 10 }}
        />
      )}
    </div>
  );
}

export default VPDashboard;
