import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Auth0Provider } from "@auth0/auth0-react";

import Home from "./pages/Home";
import VPLogin from "./pages/VPLogin";
import TALogin from "./pages/TALogin";
import VPDashboard from "./pages/VPDashboard";
import TADashboard from "./pages/TADashboard";
import VPTAView from "./pages/VPTAView";

export default function App() {
  return (
    <Auth0Provider
      domain={import.meta.env.VITE_AUTH0_DOMAIN}
      clientId={import.meta.env.VITE_AUTH0_CLIENT_ID}

      // ✅ THIS is the redirect that replaces /api/auth/callback
      authorizationParams={{
        redirect_uri: window.location.origin
      }}

      // ✅ OK for now (see note below)
      cacheLocation="memory"
      useRefreshTokens={false}
    >
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/vp/login" element={<VPLogin />} />
          <Route path="/ta/login" element={<TALogin />} />
          <Route path="/vp/dashboard" element={<VPDashboard />} />
          <Route path="/vp/ta-view/:ta_id" element={<VPTAView />} />

          {/* Temporary TA dashboard */}
          <Route path="/ta/dashboard" element={<TADashboard taId={0} />} />
        </Routes>
      </BrowserRouter>
    </Auth0Provider>
  );
}