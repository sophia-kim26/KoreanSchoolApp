import { useEffect, useState } from "react";
import { Grid } from "gridjs-react";
import "gridjs/dist/theme/mermaid.css";
import { useAuth0 } from "@auth0/auth0-react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";
import Chart from "../pages/Chart.jsx";

// Helper function to get user location - OUTSIDE the component
const getUserLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by your browser"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      (error) => {
        let message = "Unable to get your location";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = "Location permission denied. Please enable location access.";
            break;
          case error.POSITION_UNAVAILABLE:
            message = "Location information unavailable.";
            break;
          case error.TIMEOUT:
            message = "Location request timed out.";
            break;
          default:
            break;
        }
        reject(new Error(message));
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  });
};

// Reverse geocode using OpenStreetMap Nominatim (best effort)
const reverseGeocode = async (lat, lon) => {
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`;
  const res = await fetch(url, {
    headers: {
      "Accept-Language": "en",
    },
  });
  if (!res.ok) throw new Error("Could not fetch location name");
  const json = await res.json();
  return json.display_name || "Unknown location";
};

function TADashboard() {
  const [data, setData] = useState([]);
  const [clockedIn, setClockedIn] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [activeTab, setActiveTab] = useState("appearance");
  const { logout } = useAuth0();
  const navigate = useNavigate();

  const [clockInTime, setClockInTime] = useState(null);
  const [clockOutTime, setClockOutTime] = useState(null);
  const [elapsed, setElapsed] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [showClockInConfirm, setShowClockInConfirm] = useState(false);
  const [showClockOutConfirm, setShowClockOutConfirm] = useState(false);
  const [activeShiftId, setActiveShiftId] = useState(null);

  // Location display states
  const [locationName, setLocationName] = useState("Location unknown");
  const [locationError, setLocationError] = useState(null);
  const [isLocating, setIsLocating] = useState(false);

  // NEW: show raw coordinates & accuracy (helps debug when “name” looks right but coords are wrong)
  const [lastCoords, setLastCoords] = useState(null);

  const overlayStyle = {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    backgroundColor: "rgba(0,0,0,0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  };

  const modalStyle = {
    backgroundColor: "#fff",
    padding: "30px",
    borderRadius: "8px",
    textAlign: "center",
    minWidth: "300px",
  };

  const fetchShifts = async () => {
    try {
      const res = await fetch("http://localhost:3001/api/shifts");
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error("Failed to fetch shifts:", err);
    }
  };

  const checkActiveShift = async (userId) => {
    try {
      const res = await fetch(`http://localhost:3001/api/shifts/active/${userId}`);
      const json = await res.json();

      if (json.activeShift) {
        setClockedIn(true);
        setActiveShiftId(json.activeShift.id);
        setClockInTime(new Date(json.activeShift.clock_in));
      } else {
        setClockedIn(false);
        setActiveShiftId(null);
        setClockInTime(null);
      }
    } catch (err) {
      console.error("Failed to check active shift:", err);
    }
  };

  // autologout when you close the tab or window
  useEffect(() => {
    const handleBeforeUnload = () => {
      localStorage.removeItem("current_ta_user");
      sessionStorage.setItem("ta_session_ended", "true");
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  useEffect(() => {
    const sessionEnded = sessionStorage.getItem("ta_session_ended");

    if (sessionEnded === "true") {
      sessionStorage.removeItem("ta_session_ended");
      localStorage.removeItem("current_ta_user");
      navigate("/ta/login");
      return;
    }

    const user = JSON.parse(localStorage.getItem("current_ta_user") || "null");
    if (!user) {
      navigate("/ta/login");
      return;
    }
    setCurrentUser(user);
    checkActiveShift(user.id);
  }, [navigate]);

  useEffect(() => {
    fetch("http://localhost:3001/api/shifts")
      .then((res) => res.json())
      .then((json) => setData(json))
      .catch((err) => console.error(err));
  }, []);

  const taData = currentUser ? data.filter((row) => row.ta_id === currentUser.id) : [];

  const gridData = taData.map((row) => [
    row.id,
    row.clock_in,
    row.clock_out,
    row.elapsed_time,
    row.notes,
  ]);

  const handleSignOut = () => {
    localStorage.removeItem("current_ta_user");
    sessionStorage.removeItem("ta_session_ended");

    logout({
      logoutParams: { returnTo: window.location.origin },
    });
  };

  const taName = currentUser ? `${currentUser.first_name} ${currentUser.last_name}` : "Unknown";

  const clockIn = async () => {
    console.log("Clock In pressed");

    try {
      setIsLocating(true);
      setLocationError(null);

      const location = await getUserLocation();
      console.log("Location obtained:", location);

      setLastCoords({
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
      });

      // Update location name in UI (best effort; NOT used for validation)
      try {
        const name = await reverseGeocode(location.latitude, location.longitude);
        setLocationName(name);
      } catch (e) {
        console.warn("Reverse geocoding failed:", e);
        setLocationName("Location detected (name unavailable)");
      } finally {
        setIsLocating(false);
      }

      const time = new Date();

      const res = await fetch("http://localhost:3001/api/shifts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ta_id: currentUser.id,
          clock_in: time.toISOString(),
          notes: "",
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy,
        }),
      });

      if (!res.ok) {
        // ✅ show server error message (distance/accuracy reason)
        let errorMsg = "Failed to clock in";
        try {
          const errorData = await res.json();
          errorMsg = errorData.error || errorMsg;
        } catch (e) {
          // ignore
        }
        throw new Error(errorMsg);
      }

      const newShift = await res.json();
      if (!newShift.id) throw new Error("No shift ID returned from server!");

      setClockInTime(time);
      setClockedIn(true);
      setActiveShiftId(newShift.id);

      alert("Successfully clocked in!");
    } catch (err) {
      console.error("Failed to clock in:", err);
      setIsLocating(false);
      setClockedIn(false);
      setClockInTime(null);
      setLocationError(err.message || "Clock in failed");
      alert(err.message || "Failed to clock in. Please try again.");
    }
  };

  const clockOut = async () => {
    setClockedIn(false);

    const time = new Date();
    setClockOutTime(time);

    let calculatedElapsed = null;
    if (clockInTime) {
      const diff = time - clockInTime;
      const totalMinutes = Math.floor(diff / 1000 / 60);
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      calculatedElapsed = { hours, minutes };
      setElapsed(calculatedElapsed);
    }

    if (!activeShiftId) return;

    try {
      await fetch(`http://localhost:3001/api/shifts/${activeShiftId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clock_out: time,
          elapsed_time: calculatedElapsed ? calculatedElapsed.hours : 0,
        }),
      });

      await fetchShifts();
      setActiveShiftId(null);
    } catch (err) {
      console.error("Failed to clock out:", err);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header" style={{ justifyContent: "flex-start", gap: "40px" }}>
        <img src={logo} alt="Logo" className="page-logo" />
        <h1 className="page-title">TA Dashboard - Timesheet for {taName}</h1>

        <div
          style={{
            position: "absolute",
            top: "100px",
            right: "20px",
            zIndex: 10,
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: 8,
          }}
        >
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={() => setShowClockInConfirm(true)}
              className="btn-primary"
              disabled={clockedIn}
            >
              Clock In
            </button>

            <button
              onClick={() => setShowClockOutConfirm(true)}
              className="btn-primary"
              disabled={!clockedIn}
            >
              Clock Out
            </button>

            <button onClick={() => setShowSettingsModal(true)} className="btn-settings">
              Settings
            </button>

            <button onClick={handleSignOut} className="btn-danger">
              Sign Out
            </button>
          </div>

          <div style={{ fontSize: "12px", color: "#374151", maxWidth: 520, textAlign: "right" }}>
            <strong>Current location:</strong> {isLocating ? "Detecting location..." : locationName}
          </div>

          {/* Debug info (helps you verify why it fails) */}
          {lastCoords && (
            <div style={{ fontSize: "12px", color: "#6b7280", maxWidth: 520, textAlign: "right" }}>
              lat: {lastCoords.latitude.toFixed(5)}, lon: {lastCoords.longitude.toFixed(5)}, acc:{" "}
              {Math.round(lastCoords.accuracy)}m
            </div>
          )}

          {locationError && (
            <div style={{ fontSize: "12px", color: "#b91c1c", maxWidth: 520, textAlign: "right" }}>
              {locationError}
            </div>
          )}
        </div>
      </div>

      <div style={{ marginBottom: "10px", fontSize: "18px" }}>
        {clockInTime && (
          <p>
            <strong>Clocked In:</strong> {clockInTime.toLocaleString()}
          </p>
        )}

        {clockOutTime && (
          <p>
            <strong>Clocked Out:</strong> {clockOutTime.toLocaleString()}
          </p>
        )}

        {elapsed && (
          <p>
            <strong>Total Time Worked:</strong> {elapsed.hours} hours and {elapsed.minutes} minutes
          </p>
        )}
      </div>

      {taData.length === 0 ? (
        <p>No data found.</p>
      ) : (
        <Grid
          key={JSON.stringify(data)}
          data={gridData}
          columns={["Date", "Clock In", "Clock Out", "Elapsed Time", "Notes"]}
          search={true}
          pagination={{ enabled: true, limit: 10 }}
          sort={true}
        />
      )}

      <h1 className="page-title" style={{ marginTop: "20px" }}>
        Volunteer Hours for {taName}
      </h1>
      <h1>Hours by month</h1>
      <Chart currentUser={currentUser} />
      
      {showClockInConfirm && (
        <div style={overlayStyle}>
          <div style={modalStyle}>
            <h2>Confirm Clock In</h2>
            <p>Are you sure you want to clock in?</p>
            <div style={{ marginTop: "20px", right: "10px" }}>
              <button
                onClick={() => {
                  setShowClockInConfirm(false);
                  clockIn();
                }}
                className="btn-primary"
              >
                Yes, I'm sure
              </button>
              <button onClick={() => setShowClockInConfirm(false)} className="btn-danger">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showClockOutConfirm && (
        <div style={overlayStyle}>
          <div style={modalStyle}>
            <h2>Confirm Clock Out</h2>
            <p>Are you sure you want to clock out?</p>
            <div style={{ marginTop: "20px", right: "10px" }}>
              <button
                onClick={() => {
                  setShowClockOutConfirm(false);
                  clockOut();
                }}
                className="btn-primary"
              >
                Yes, I'm sure
              </button>
              <button onClick={() => setShowClockOutConfirm(false)} className="btn-danger">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings modal left as-is in your file */}
      {showSettingsModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: "white",
              padding: 30,
              borderRadius: 12,
              width: 600,
              maxWidth: "90%",
              boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", marginBottom: 24 }}>
              <button
                onClick={() => setShowSettingsModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "20px",
                  cursor: "pointer",
                  padding: "5px 10px",
                  marginRight: "10px",
                  color: "#6b7280",
                }}
              >
                ←
              </button>
              <h2 style={{ margin: 0, fontSize: "32px", fontWeight: "700" }}>Settings</h2>
            </div>

            <div
              style={{
                display: "flex",
                gap: 0,
                marginBottom: 24,
                borderBottom: "2px solid #e5e7eb",
              }}
            >
              <button
                onClick={() => setActiveTab("appearance")}
                style={{
                  padding: "12px 24px",
                  background: activeTab === "appearance" ? "#bfdbfe" : "transparent",
                  border: "none",
                  borderTopLeftRadius: 8,
                  borderTopRightRadius: 8,
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "500",
                  color: activeTab === "appearance" ? "#1e40af" : "#6b7280",
                }}
              >
                Appearance
              </button>
              <button
                onClick={() => setActiveTab("navigation")}
                style={{
                  padding: "12px 24px",
                  background: activeTab === "navigation" ? "#bfdbfe" : "transparent",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "500",
                  color: activeTab === "navigation" ? "#1e40af" : "#6b7280",
                }}
              >
                Navigation
              </button>
              <button
                onClick={() => setActiveTab("account")}
                style={{
                  padding: "12px 24px",
                  background: activeTab === "account" ? "#bfdbfe" : "transparent",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "500",
                  color: activeTab === "account" ? "#1e40af" : "#6b7280",
                }}
              >
                Account
              </button>
              <button
                onClick={() => setActiveTab("privacy")}
                style={{
                  padding: "12px 24px",
                  background: activeTab === "privacy" ? "#bfdbfe" : "transparent",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "500",
                  color: activeTab === "privacy" ? "#1e40af" : "#6b7280",
                }}
              >
                Privacy
              </button>
            </div>

            {/* your settings content continues unchanged… */}
            <div
              style={{
                background: "#dbeafe",
                padding: 30,
                borderRadius: 8,
                minHeight: "400px",
              }}
            >
              {/* keep your tabs content exactly as you already had */}
              {/* (omitted here to keep the file readable) */}
              <div style={{ color: "#1e40af" }}>
                Keep your existing Settings tab content here (unchanged).
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TADashboard;
