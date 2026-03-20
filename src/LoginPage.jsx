import { useState } from "react";
import { login } from "./api.js";

const T = {
  pageBg:  "#080c14", card: "#0f1623", elevated: "#192236",
  border:  "#1f2d45", borderVis: "#2a3d58",
  blue:    "#2563EB", blueLight: "#3B82F6",
  text:    "#F1F5F9", textSub: "#94A3B8", textMuted: "#4B5A6E",
  red:     "#EF4444", redBg: "#1a0606", redBorder: "#450a0a",
  font:    "'Inter', -apple-system, sans-serif",
};

export default function LoginPage({ onLogin }) {
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      await login(email, password);
      onLogin();
    } catch (err) {
      setError(err.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex",
      alignItems: "center", justifyContent: "center",
      background: T.pageBg, fontFamily: T.font, padding: 16,
    }}>
      <div style={{
        width: "100%", maxWidth: 380,
        background: T.card, border: `1px solid ${T.borderVis}`,
        borderRadius: 20, padding: 36,
        boxShadow: "0 8px 40px rgba(0,0,0,0.6)",
      }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            width: 52, height: 52, borderRadius: "50%",
            background: T.elevated, border: `2px solid ${T.borderVis}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 14px",
          }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none"
              stroke={T.blue} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9"/>
              <circle cx="12" cy="12" r="3"/>
              <path d="M12 3v3M12 18v3M3 12h3M18 12h3"/>
            </svg>
          </div>
          <div style={{ fontSize: 18, fontWeight: 800, color: T.text, letterSpacing: "0.04em" }}>
            ROADSTAR TIRE
          </div>
          <div style={{ fontSize: 11, color: T.textMuted, letterSpacing: "0.12em",
            textTransform: "uppercase", marginTop: 3 }}>
            Admin Dashboard
          </div>
        </div>

        {error && (
          <div style={{
            background: T.redBg, border: `1px solid ${T.redBorder}`,
            borderRadius: 8, padding: "10px 14px",
            fontSize: 13, color: T.red, marginBottom: 18,
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {[
            { label: "Email", type: "email", value: email, onChange: setEmail, placeholder: "admin@roadstartire.com" },
            { label: "Password", type: "password", value: password, onChange: setPassword, placeholder: "••••••••" },
          ].map(({ label, type, value, onChange, placeholder }) => (
            <div key={label} style={{ marginBottom: 16 }}>
              <label style={{
                display: "block", fontSize: 11, fontWeight: 600,
                letterSpacing: "0.07em", textTransform: "uppercase",
                color: T.textMuted, marginBottom: 6,
              }}>{label}</label>
              <input
                type={type} value={value} placeholder={placeholder}
                onChange={e => onChange(e.target.value)} required
                style={{
                  width: "100%", background: T.pageBg,
                  border: `1.5px solid ${T.border}`,
                  borderRadius: 8, padding: "11px 14px",
                  color: T.text, fontSize: 14, fontFamily: T.font,
                  outline: "none", boxSizing: "border-box",
                }}
                onFocus={e => e.target.style.borderColor = T.blue}
                onBlur={e  => e.target.style.borderColor = T.border}
              />
            </div>
          ))}

          <button type="submit" disabled={loading} style={{
            width: "100%", marginTop: 8, padding: "13px",
            background: loading ? T.elevated : T.blue, border: "none",
            borderRadius: 8, color: "#fff", fontSize: 15, fontWeight: 700,
            fontFamily: T.font, cursor: loading ? "not-allowed" : "pointer",
            transition: "background 0.15s",
          }}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div style={{ fontSize: 11, color: T.textMuted, textAlign: "center", marginTop: 20 }}>
          Protected admin access · Roadstar Tire
        </div>
      </div>
    </div>
  );
}
