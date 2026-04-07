import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { Auth0Provider, useAuth0 } from "@auth0/auth0-react";
import { useEffect } from "react";

import Home from "./pages/Home";
import VPLogin from "./pages/VPLogin";
import TALogin from "./pages/TALogin";
import VPDashboard from "./pages/VPDashboard";
import TADashboard from "./pages/TADashboard";
import VPTAView from "./pages/VPTAView";

function RequireVPAuth({ children }: { children: React.ReactElement }) {
  const { isLoading, isAuthenticated } = useAuth0();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/vp/login");
    }
  }, [isLoading, isAuthenticated, navigate]);

  if (isLoading) return <div>Loading...</div>;
  if (!isAuthenticated) return null;
  return children;
}

function AuthProviderWithNavigate() {

  console.log("My Audience is:", import.meta.env.VITE_AUTH0_AUDIENCE);
  const navigate = useNavigate();

  const onRedirectCallback = (appState: any) => {
    navigate(appState?.returnTo ?? "/vp/dashboard");
  };

  return (
    <Auth0Provider
      domain={import.meta.env.VITE_AUTH0_DOMAIN as string}
      clientId={import.meta.env.VITE_AUTH0_CLIENT_ID as string}
      authorizationParams={{
        redirect_uri: window.location.origin,
        audience: import.meta.env.VITE_AUTH0_AUDIENCE as string,
      }}
      onRedirectCallback={onRedirectCallback}
    >
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/vp/login" element={<VPLogin />} />
        <Route path="/ta/login" element={<TALogin />} />
        <Route path="/vp/dashboard" element={<RequireVPAuth><VPDashboard /></RequireVPAuth>} />
        <Route path="/vp/ta-view/:ta_id" element={<RequireVPAuth><VPTAView /></RequireVPAuth>} />
        <Route path="/ta/dashboard" element={<TADashboard taId={0} />} />
      </Routes>
    </Auth0Provider>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProviderWithNavigate />
    </BrowserRouter>
  );
}