import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import Home from "./pages/Home";
import VPLogin from "./pages/VPLogin";
import TALogin from "./pages/TALogin";
import VPDashboard from "./pages/VPDashboard";
import TADashboard from "./pages/TADashboard";
import GridTable from "./pages/Grid.jsx";
import Chart from "./pages/Chart.jsx";
import { Auth0Provider } from '@auth0/auth0-react';

export default function App() {
  return (
    <Auth0Provider
      domain={import.meta.env.VITE_AUTH0_DOMAIN}
      clientId={import.meta.env.VITE_AUTH0_CLIENT_ID}
      authorizationParams={{
        redirect_uri: window.location.origin
      }}
      cacheLocation="localstorage"
    >
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
          {/* i put this here for now. you can change the number inside the brackets to load ta/dashboard for specific ta_id
          but later we need a way to get the
          ta_id after a ta logs in so we can load the
          dashboard / timesheet spectific to that ta */}
          <Route path="/ta/dashboard" element={<TADashboard taId={0} />} />
        </Routes>
      </BrowserRouter>
    </Auth0Provider>
  );
}