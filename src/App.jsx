import { useState, useEffect } from "react";
import RoadstarDashboard from "./RoadstarDashboard.jsx";
import LoginPage from "./LoginPage.jsx";
import { verifyToken, getToken } from "./api.js";

export default function App() {
  // null = still checking, false = not logged in, true = logged in
  const [authed, setAuthed] = useState(null);

  useEffect(() => {
    // On every mount/reload: check if there's a valid token in localStorage
    const token = getToken();
    if (!token) {
      setAuthed(false);
      return;
    }
    // Verify the token is still valid with the server
    verifyToken()
      .then(valid => setAuthed(valid))
      .catch(() => setAuthed(false));
  }, []);

  const handleLogin  = () => setAuthed(true);
  const handleLogout = () => {
    localStorage.removeItem("roadstar_token");
    setAuthed(false);
  };

  // Still checking token — show blank dark screen, not a flash of login
  if (authed === null) {
    return (
      <div style={{
        minHeight: "100vh",
        background: "#07090f",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        <div style={{
          width: 28, height: 28, borderRadius: "50%",
          border: "2px solid #1d2b40",
          borderTopColor: "#2563EB",
          animation: "spin 0.8s linear infinite",
        }}/>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  if (!authed) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return <RoadstarDashboard onLogout={handleLogout} />;
}
