// App.jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import VPLogin from "./pages/VPLogin";
import TALogin from "./pages/TALogin";
import VPDashboard from "./pages/VPDashboard";
import TADashboard from "./pages/TADashboard";
import GridTable from "./pages/Grid.jsx";
import Chart from "./pages/Chart.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={
          <div>
            <h1>Hello world</h1>
            <h2>Grid.js example</h2>
            <GridTable />
            <h2>Chart.js example</h2>
            <Chart />
            <h2>Log in Screens</h2>
            <Home />
          </div>
        } />
        <Route path="/vp/login" element={<VPLogin />} />
        <Route path="/ta/login" element={<TALogin />} />
        <Route path="/vp/dashboard" element={<VPDashboard />} />
        <Route path="/ta/dashboard" element={<TADashboard />} />
      </Routes>
    </BrowserRouter>
  );
}