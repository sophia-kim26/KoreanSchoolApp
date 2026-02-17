import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Auth0Provider } from "@auth0/auth0-react";
import { useNavigate } from "react-router-dom";

import Home from "./pages/Home";
import VPLogin from "./pages/VPLogin";
import TALogin from "./pages/TALogin";
import VPDashboard from "./pages/VPDashboard";
import TADashboard from "./pages/TADashboard";
import VPTAView from "./pages/VPTAView";

export default function App(){
  const navigate = useNavigate();

  const onRedirectCallback = (appState: any) => {
    navigate(appState?.returnTo || "/vp/dashboard");
  };

  return (
    <Auth0Provider
      domain={import.meta.env.VITE_AUTH0_DOMAIN as string}
      clientId={import.meta.env.VITE_AUTH0_CLIENT_ID as string}
      authorizationParams={{
        redirect_uri: window.location.origin 
      }}
      cacheLocation="localstorage"
      onRedirectCallback={onRedirectCallback}
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