// App.jsx  v9 — with session-expired banner (UX1)
import { useState, useEffect } from "react";
import RoadstarDashboard from "./RoadstarDashboard.jsx";
import LoginPage from "./LoginPage.jsx";
import { verifyToken, getToken, isTokenExpired, logout } from "./api.js";
import { getTheme, DARK, LIGHT } from "./theme.js";

export default function App() {
  const [authed,   setAuthed]   = useState(null); // null=checking, false=login, true=dashboard
  const [expired,  setExpired]  = useState(false); // show "session expired" banner on login page

  useEffect(() => {
    // Apply saved theme immediately on load
    const T = getTheme() === "dark" ? DARK : LIGHT;
    document.body.style.background = T.pageBg;
    document.body.style.margin     = "0";

    const token = getToken();
    if (!token) { setAuthed(false); return; }
    // Only a real 401 signs the user out. If the server can't answer right now
    // (429, 5xx, offline) keep them in while the stored token hasn't expired;
    // a truly expired session is still caught by api.js on the next call.
    verifyToken()
      .then(v => setAuthed(v))
      .catch(() => setAuthed(!isTokenExpired()));
  }, []);

  // UX1: listen for the rs:sessionExpired event fired by api.js on TOKEN_EXPIRED
  useEffect(() => {
    const handler = (e) => {
      // ACCOUNT_INACTIVE → show the API's "account deactivated" message instead
      setExpired(e?.detail?.code === "ACCOUNT_INACTIVE" ? (e.detail.message || "Your account has been deactivated.") : true);
      setAuthed(false);
    };
    window.addEventListener("rs:sessionExpired", handler);
    return () => window.removeEventListener("rs:sessionExpired", handler);
  }, []);

  const handleLogin  = () => { setExpired(false); setAuthed(true); };
  // Tell the API (audit-logged) before dropping the token. Fire-and-forget so
  // signing out never waits on, or fails because of, the network.
  const handleLogout = () => { logout(); localStorage.removeItem("roadstar_token"); setAuthed(false); };

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

  if (!authed) {
    return (
      <>
        {/* UX1: session-expired banner above login form */}
        {expired && (
          /* In the page flow (sticky, not fixed) so it pushes the login card down
             instead of covering its top on short / narrow screens. */
          <div style={{ position:"sticky", top:0, zIndex:9999, overflowWrap:"anywhere", lineHeight:1.5,
            background:"#1a0606", borderBottom:"1px solid #450a0a",
            padding:"12px 20px", textAlign:"center",
            fontSize:13, color:"#FCA5A5", fontFamily:"'Inter',-apple-system,sans-serif" }}>
            ⚠️ {typeof expired === "string" ? expired : "Your session expired. Please log in again."}
          </div>
        )}
        <LoginPage onLogin={handleLogin}/>
      </>
    );
  }

  return <RoadstarDashboard onLogout={handleLogout}/>;
}
