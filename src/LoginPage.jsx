// LoginPage.jsx — Email OTP (primary) + password fallback
import { useState, useRef, useEffect } from "react";
import { login, requestOtp, verifyOtp } from "./api.js";

const SHOP_NAME = import.meta.env.VITE_SHOP_NAME || "Roadstar Tire";

const T = {
  pageBg:    "#080c14", card: "#0f1623", elevated: "#192236",
  border:    "#1f2d45", borderVis: "#2a3d58",
  blue:      "#2563EB", blueLight: "#3B82F6", blueSub: "#0c1a35", blueMuted: "#172554",
  text:      "#F1F5F9", textSub: "#94A3B8", textMuted: "#4B5A6E",
  red:       "#EF4444", redBg: "#1a0606", redBorder: "#450a0a",
  green:     "#22C55E", greenBg: "#071a0f", greenBorder: "#14532D",
  font:      "'Inter', -apple-system, sans-serif",
};

const inp = (extra = {}) => ({
  width: "100%", background: T.pageBg, border: `1.5px solid ${T.border}`,
  borderRadius: 8, padding: "11px 14px", color: T.text, fontSize: 14,
  fontFamily: T.font, outline: "none", boxSizing: "border-box", ...extra,
});
const label = { display: "block", fontSize: 11, fontWeight: 600,
  letterSpacing: "0.07em", textTransform: "uppercase", color: T.textMuted, marginBottom: 6 };
const btn = (disabled, variant = "primary") => ({
  width: "100%", marginTop: 8, padding: "13px", border: "none",
  borderRadius: 8, color: "#fff", fontSize: 15, fontWeight: 700,
  fontFamily: T.font, cursor: disabled ? "not-allowed" : "pointer",
  transition: "background 0.15s",
  background: disabled ? T.elevated : variant === "ghost" ? T.elevated : T.blue,
});

// ── Logo ─────────────────────────────────────────────────────────────────────
function Logo() {
  return (
    <div style={{ textAlign: "center", marginBottom: 32 }}>
      <div style={{ width:52, height:52, borderRadius:"50%", background:T.elevated,
        border:`2px solid ${T.borderVis}`, display:"flex", alignItems:"center",
        justifyContent:"center", margin:"0 auto 14px" }}>
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none"
          stroke={T.blue} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9"/>
          <circle cx="12" cy="12" r="3"/>
          <path d="M12 3v3M12 18v3M3 12h3M18 12h3"/>
        </svg>
      </div>
      <div style={{ fontSize:18, fontWeight:800, color:T.text, letterSpacing:"0.04em" }}>
        {SHOP_NAME.toUpperCase()}
      </div>
      <div style={{ fontSize:11, color:T.textMuted, letterSpacing:"0.12em",
        textTransform:"uppercase", marginTop:3 }}>Admin Dashboard</div>
    </div>
  );
}

// ── Step 1: Email entry ───────────────────────────────────────────────────────
function StepEmail({ onSent, onUsePassword }) {
  const [email,   setEmail]   = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      await requestOtp(email.trim());
      onSent(email.trim());
    } catch (err) {
      setError(err.message || "Could not send code. Please try again.");
    } finally { setLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <Alert msg={error} />}
      <div style={{ marginBottom:16 }}>
        <label style={label}>Email address</label>
        <input type="email" value={email} required autoFocus
          placeholder="you@example.com" onChange={e=>setEmail(e.target.value)}
          style={inp()} onFocus={e=>e.target.style.borderColor=T.blue}
          onBlur={e=>e.target.style.borderColor=T.border}/>
      </div>
      <button type="submit" disabled={loading || !email} style={btn(loading || !email)}>
        {loading ? "Sending code…" : "Send Login Code →"}
      </button>
      <Divider />
      <button type="button" onClick={onUsePassword}
        style={{ ...btn(false,"ghost"), marginTop:0, fontSize:13, color:T.textMuted }}>
        Login with password instead
      </button>
    </form>
  );
}

// ── Step 2: OTP code entry ────────────────────────────────────────────────────
function StepCode({ email, onSuccess, onBack }) {
  const [digits,  setDigits]  = useState(["","","","","",""]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [resent,  setResent]  = useState(false);
  const refs = [useRef(),useRef(),useRef(),useRef(),useRef(),useRef()];

  useEffect(() => { refs[0].current?.focus(); }, []);

  const handleDigit = (i, val) => {
    // Accept paste of full code
    if (val.length === 6 && /^\d{6}$/.test(val)) {
      const arr = val.split("");
      setDigits(arr);
      refs[5].current?.focus();
      return;
    }
    const v = val.replace(/\D/g,"").slice(-1);
    const next = [...digits]; next[i] = v; setDigits(next);
    if (v && i < 5) refs[i+1].current?.focus();
  };

  const handleKeyDown = (i, e) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) refs[i-1].current?.focus();
  };

  const code = digits.join("");

  const handleVerify = async (e) => {
    e?.preventDefault();
    if (code.length !== 6) return;
    setError(""); setLoading(true);
    try {
      await verifyOtp(email, code);
      onSuccess();
    } catch (err) {
      setError(err.message || "Invalid code.");
      setDigits(["","","","","",""]);
      refs[0].current?.focus();
    } finally { setLoading(false); }
  };

  const handleResend = async () => {
    setError(""); setResent(false);
    try {
      await requestOtp(email);
      setResent(true);
      setDigits(["","","","","",""]);
      refs[0].current?.focus();
    } catch (err) { setError(err.message); }
  };

  // Auto-submit once all 6 digits filled
  useEffect(() => { if (code.length === 6 && !loading) handleVerify(); }, [code]);

  return (
    <form onSubmit={handleVerify}>
      <div style={{ textAlign:"center", marginBottom:24 }}>
        <div style={{ fontSize:13, color:T.textSub }}>A 6-digit code was sent to</div>
        <div style={{ fontSize:14, fontWeight:700, color:T.text, marginTop:4 }}>{email}</div>
      </div>
      {error && <Alert msg={error} />}
      {resent && <Alert msg="New code sent! Check your email." type="success" />}
      <div style={{ display:"flex", gap:8, justifyContent:"center", marginBottom:24 }}>
        {digits.map((d, i) => (
          <input key={i} ref={refs[i]} type="text" inputMode="numeric"
            value={d} maxLength={6}
            onChange={e => handleDigit(i, e.target.value)}
            onKeyDown={e => handleKeyDown(i, e)}
            style={{ width:44, height:54, textAlign:"center", fontSize:24, fontWeight:800,
              background: T.pageBg, border:`2px solid ${d ? T.blue : T.border}`,
              borderRadius:10, color:T.text, fontFamily:T.font, outline:"none" }}
            onFocus={e=>e.target.style.borderColor=T.blue}
            onBlur={e=>e.target.style.borderColor=digits[i]?T.blue:T.border}
          />
        ))}
      </div>
      <button type="submit" disabled={loading || code.length < 6}
        style={btn(loading || code.length < 6)}>
        {loading ? "Verifying…" : "Verify Code"}
      </button>
      <div style={{ display:"flex", justifyContent:"space-between", marginTop:16, fontSize:12 }}>
        <button type="button" onClick={onBack}
          style={{ background:"none", border:"none", color:T.textMuted, cursor:"pointer", fontFamily:T.font, fontSize:12 }}>
          ← Change email
        </button>
        <button type="button" onClick={handleResend}
          style={{ background:"none", border:"none", color:T.blue, cursor:"pointer", fontFamily:T.font, fontSize:12 }}>
          Resend code
        </button>
      </div>
    </form>
  );
}

// ── Password fallback ─────────────────────────────────────────────────────────
function StepPassword({ onSuccess, onUseOtp }) {
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      await login(email, password);
      onSuccess();
    } catch (err) {
      setError(err.message || "Invalid credentials");
    } finally { setLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <Alert msg={error} />}
      {[
        { label:"Email",    type:"email",    value:email,    set:setEmail,    ph:"admin@example.com" },
        { label:"Password", type:"password", value:password, set:setPassword, ph:"••••••••" },
      ].map(({ label:l, type, value, set, ph }) => (
        <div key={l} style={{ marginBottom:16 }}>
          <label style={label}>{l}</label>
          <input type={type} value={value} required placeholder={ph}
            onChange={e => set(e.target.value)} style={inp()}
            onFocus={e=>e.target.style.borderColor=T.blue}
            onBlur={e=>e.target.style.borderColor=T.border}/>
        </div>
      ))}
      <button type="submit" disabled={loading} style={btn(loading)}>
        {loading ? "Signing in…" : "Sign In"}
      </button>
      <Divider />
      <button type="button" onClick={onUseOtp}
        style={{ ...btn(false,"ghost"), marginTop:0, fontSize:13, color:T.textMuted }}>
        ← Login with email code instead
      </button>
    </form>
  );
}

// ── Shared components ─────────────────────────────────────────────────────────
function Alert({ msg, type = "error" }) {
  const isSuccess = type === "success";
  return (
    <div style={{ background: isSuccess ? T.greenBg : T.redBg,
      border: `1px solid ${isSuccess ? T.greenBorder : T.redBorder}`,
      borderRadius:8, padding:"10px 14px", fontSize:13,
      color: isSuccess ? T.green : T.red, marginBottom:18 }}>
      {msg}
    </div>
  );
}
function Divider() {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10, margin:"20px 0 12px" }}>
      <div style={{ flex:1, height:1, background:T.border }}/>
      <span style={{ fontSize:11, color:T.textMuted }}>or</span>
      <div style={{ flex:1, height:1, background:T.border }}/>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function LoginPage({ onLogin }) {
  // "otp-email" → "otp-code" → logged in  |  "password" → logged in
  const [step,  setStep]  = useState("otp-email"); // "otp-email" | "otp-code" | "password"
  const [email, setEmail] = useState("");

  const handleSent    = (e)  => { setEmail(e); setStep("otp-code"); };
  const handleSuccess = ()   => onLogin();
  const handleBack    = ()   => setStep("otp-email");

  return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center",
      justifyContent:"center", background:T.pageBg, fontFamily:T.font, padding:16 }}>
      <div style={{ width:"100%", maxWidth:step==="otp-code" ? 400 : 380,
        background:T.card, border:`1px solid ${T.borderVis}`,
        borderRadius:20, padding:36, boxShadow:"0 8px 40px rgba(0,0,0,0.6)" }}>
        <Logo />
        {step === "otp-email"  && <StepEmail   onSent={handleSent}    onUsePassword={() => setStep("password")} />}
        {step === "otp-code"   && <StepCode    email={email} onSuccess={handleSuccess} onBack={handleBack} />}
        {step === "password"   && <StepPassword onSuccess={handleSuccess} onUseOtp={() => setStep("otp-email")} />}
        <div style={{ fontSize:11, color:T.textMuted, textAlign:"center", marginTop:20 }}>
          Protected admin access · {SHOP_NAME}
        </div>
        <div style={{ fontSize:10, color:T.textMuted, textAlign:"center", marginTop:8, opacity:0.5, letterSpacing:"0.05em" }}>
          Built by Social Aura
        </div>
      </div>
    </div>
  );
}
