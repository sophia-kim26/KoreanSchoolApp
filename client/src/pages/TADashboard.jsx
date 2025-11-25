// import { useEffect, useState } from "react";
// import { Grid } from "gridjs-react";
// import "gridjs/dist/theme/mermaid.css";
// import { useNavigate } from "react-router-dom";
// import { LogOut } from "lucide-react";

// function TADashboard() {
//   const navigate = useNavigate();
//   const [currentUser, setCurrentUser] = useState(null);
//   const [data, setData] = useState([]);

//   // Check authentication on mount
//   useEffect(() => {
//     const user = JSON.parse(localStorage.getItem('current_ta_user') || 'null');
//     if (!user) {
//       navigate('/ta/login');
//     } else {
//       setCurrentUser(user);
//     }
//   }, [navigate]);

//   // Fetch shifts data
//   useEffect(() => {
//     fetch("http://localhost:3001/api/shifts")
//       .then(res => res.json())
//       .then(json => setData(json))
//       .catch(err => console.error(err));
//   }, []);

//   const handleLogout = () => {
//     localStorage.removeItem('current_ta_user');
//     navigate('/ta/login');
//   };

//   // Show loading while checking auth
//   if (!currentUser) {
//     return (
//       <div className="min-h-screen flex items-center justify-center">
//         <p>Loading...</p>
//       </div>
//     );
//   }

//   // For now, we'll use the user ID as the taId
//   // You can modify this based on how you want to link PIN accounts to TA IDs
//   const taId = currentUser.id; 

//   // Filter rows for the given TA ID
//   const taData = data.filter(row => row.ta_id === taId);

//   // Map filtered rows for Grid.js
//   const gridData = taData.map(row => [
//     row.id,
//     row.ta_id,
//     `${row.first_name} ${row.last_name}`,
//     row.clock_in,
//     row.clock_out,
//     row.was_manual,
//     row.notes,
//   ]);

//   // Get TA full name for header
//   const taName = taData.length > 0
//     ? `${taData[0].first_name} ${taData[0].last_name}`
//     : "Unknown";

//   return (
//     <div style={{ padding: 20 }}>
//       <div style={{ 
//         display: 'flex', 
//         justifyContent: 'space-between', 
//         alignItems: 'center', 
//         marginBottom: 20,
//         background: '#f9fafb',
//         padding: 20,
//         borderRadius: 8
//       }}>
//         <div>
//           <h1 style={{ margin: 0 }}>TA Dashboard - Timesheet for {taName}</h1>
//           <p style={{ color: '#666', fontSize: 14, margin: '5px 0 0 0' }}>
//             Account ID: {currentUser.id}
//           </p>
//         </div>
//         <button
//           onClick={handleLogout}
//           style={{ 
//             display: 'flex',
//             alignItems: 'center',
//             gap: 8,
//             padding: '10px 20px', 
//             background: '#dc2626', 
//             color: 'white', 
//             border: 'none', 
//             borderRadius: 5,
//             cursor: 'pointer',
//             fontSize: 14,
//             fontWeight: 600
//           }}
//         >
//           <LogOut style={{ width: 16, height: 16 }} />
//           Sign Out
//         </button>
//       </div>

//       {taData.length === 0 ? (
//         <p>No shifts found for this TA.</p>
//       ) : (
//         <Grid
//           data={gridData}
//           columns={["ID", "TA ID", "TA Name", "Clock In", "Clock Out", "Manual?", "Notes"]}
//           search={true}
//           pagination={{ enabled: true, limit: 10 }}
//           sort={true}
//         />
//       )}
//     </div>
//   );
// }

// export default TADashboard;

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