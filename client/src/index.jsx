import React from "react";
import ReactDOM from "react-dom/client";
import { ClerkProvider } from "@clerk/clerk-react";
import App from "./App.jsx";

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ClerkProvider 
      publishableKey={PUBLISHABLE_KEY}
      afterSignOutUrl="/vp/login"
      sessionOptions={{
        // Session expires immediately when browser tab closes
        cookieDomain: window.location.hostname,
        cookieSameSite: 'Lax'
      }}
    >
      <App />
    </ClerkProvider>
  </React.StrictMode>
);