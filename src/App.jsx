// App.jsx  v9
import { useState, useEffect } from "react";
import RoadstarDashboard from "./RoadstarDashboard.jsx";
import LoginPage from "./LoginPage.jsx";
import { verifyToken, getToken } from "./api.js";
import { getTheme, DARK, LIGHT } from "./theme.js";

export default function App() {
  const [authed, setAuthed] = useState(null); // null=checking, false=login, true=dashboard

  useEffect(() => {
    // Apply saved theme immediately on load
    const T = getTheme() === "dark" ? DARK : LIGHT;
    document.body.style.background = T.pageBg;
    document.body.style.margin     = "0";

    const token = getToken();
    if (!token) { setAuthed(false); return; }
    verifyToken().then(v => setAuthed(v)).catch(() => setAuthed(false));
  }, []);

  const handleLogin  = () => setAuthed(true);
  const handleLogout = () => { localStorage.removeItem("roadstar_token"); setAuthed(false); };

  // Checking — spinner
  if (authed === null) {
    const T = getTheme() === "dark" ? DARK : LIGHT;
    return (
      <div style={{ minHeight:"100vh", background:T.pageBg, display:"flex", alignItems:"center", justifyContent:"center" }}>
        <div style={{ width:28, height:28, borderRadius:"50%", border:`2px solid ${T.border}`, borderTopColor:T.blue, animation:"spin .8s linear infinite" }}/>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  if (!authed) return <LoginPage onLogin={handleLogin}/>;
  return <RoadstarDashboard onLogout={handleLogout}/>;
}
