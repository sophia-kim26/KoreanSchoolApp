
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";

console.log("Auth0 domain:", import.meta.env.VITE_AUTH0_DOMAIN);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);