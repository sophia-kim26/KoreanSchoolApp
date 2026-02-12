import React, { useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { useNavigate } from "react-router-dom";
import "./style/global.css";
import logo from "../assets/logo.png";

export default function VPLogin() {
  const { isLoading, isAuthenticated, loginWithRedirect, logout } = useAuth0();
  const navigate = useNavigate();

  useEffect(() => {
    sessionStorage.setItem("appWasOpen", "true");

    const handleBeforeUnload = (): void => {
      sessionStorage.removeItem("appWasOpen");
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  // ✅ Redirect AFTER successful login
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate("/vp/dashboard");
    }
  }, [isLoading, isAuthenticated, navigate]);

  // ✅ DO NOT override redirect_uri here
  const handleLogin = (): void => {
    loginWithRedirect();
  };

  const handleBack = (): void => {
    logout({
      logoutParams: {
        returnTo: window.location.origin
      }
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <img
          src={logo}
          alt="Logo"
          className="absolute top-4 right-4 h-16 w-auto"
        />

        {!isAuthenticated && !isLoading && (
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-800">
                Vice-Principal Login
              </h1>
              <p className="text-gray-600 mt-2">
                Please sign in to continue
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleLogin}
                className="w-full bg-blue-600 text-white py-4 rounded-lg font-semibold hover:bg-blue-700 transition"
              >
                Sign In
              </button>

              <div className="flex justify-center">
                <button onClick={handleBack} className="btn-danger">
                  ← Back
                </button>
              </div>
            </div>
          </div>
        )}

        {isAuthenticated && (
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-800">
              Redirecting…
            </h1>
            <p className="text-gray-600 mt-2">
              Taking you to your dashboard
            </p>
          </div>
        )}

        {isLoading && (
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-800">Loading…</h1>
            <p className="text-gray-600 mt-2">Please wait</p>
          </div>
        )}
      </div>
    </div>
  );
}