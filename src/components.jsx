// components.jsx — shared UI primitives used across all pages
import { useState } from "react";
import { getT, sm, displaySvc } from "./theme.js";

// ── Badge ─────────────────────────────────────────────────────────────────────
export function Badge({ status }) {
  const T = getT(); const s = sm(status);
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:5, fontSize:11, fontWeight:700, letterSpacing:"0.05em", textTransform:"uppercase", padding:"3px 9px", borderRadius:20, background:s.bg, color:s.text, border:`1px solid ${s.border}`, whiteSpace:"nowrap" }}>
      <span style={{ width:5, height:5, borderRadius:"50%", background:s.color, boxShadow:`0 0 4px ${s.color}80` }}/>
      {s.label}
    </span>
  );
}

// ── Icon button ───────────────────────────────────────────────────────────────
export function IBtn({ onClick, title, children, v = "def", disabled = false }) {
  const T = getT(); const [h, setH] = useState(false);
  const V = {
    def:     { bg: h ? T.elevated  : "transparent", bd: h ? T.borderVis : T.border,  cl: h ? T.textSecond : T.textMuted },
    accept:  { bg: h ? "#0a2215"   : T.greenBg,     bd: T.greenBorder,  cl: T.green },
    decline: { bg: h ? "#220909"   : T.redBg,        bd: T.redBorder,   cl: T.red },
    complete:{ bg: h ? "#042f2e"   : T.tealBg,       bd: T.tealBorder,  cl: T.teal },
    sms:     { bg: h ? T.blueSubtle: "transparent",  bd: h ? T.blueHov : T.border, cl: h ? T.blueBright : T.textSecond },
    trash:   { bg: h ? T.redBg     : "transparent",  bd: h ? T.redBorder : T.border, cl: h ? T.red : T.textMuted },
    edit:    { bg: h ? T.elevated  : "transparent",  bd: h ? T.borderVis : T.border, cl: h ? T.textSecond : T.textMuted },
    restore: { bg: h ? T.greenBg   : "transparent",  bd: h ? T.greenBorder : T.border, cl: h ? T.green : T.textMuted },
  }[v] || { bg:"transparent", bd:T.border, cl:T.textMuted };
  return (
    <button onClick={onClick} title={title} disabled={disabled}
      onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ display:"inline-flex", alignItems:"center", justifyContent:"center", width:38, height:38, borderRadius:T.r8, background:V.bg, border:`1px solid ${V.bd}`, color:V.cl, cursor:disabled?"not-allowed":"pointer", flexShrink:0, opacity:disabled?0.4:1, transition:"all .12s" }}>
      {children}
    </button>
  );
}

// ── Primary / ghost button ─────────────────────────────────────────────────────
export function Btn({ onClick, children, variant = "primary", small = false, disabled = false, icon = null, style = {} }) {
  const T = getT(); const [h, setH] = useState(false);
  const S = {
    primary: { bg: h ? T.blueHov : T.blue,     bd: T.blue,        cl: "#fff" },
    ghost:   { bg: h ? T.elevated : "transparent", bd: h ? T.borderVis : T.border, cl: T.textSecond },
    danger:  { bg: h ? "#220909" : T.redBg,     bd: T.redBorder,   cl: T.red },
    success: { bg: h ? "#0a2215" : T.greenBg,   bd: T.greenBorder, cl: T.green },
    amber:   { bg: h ? T.amberBg : "transparent", bd: T.amberBorder, cl: T.amber },
    teal:    { bg: h ? "#042f2e" : T.tealBg,    bd: T.tealBorder,  cl: T.teal },
  }[variant] || { bg:T.blue, bd:T.blue, cl:"#fff" };
  return (
    <button onClick={onClick} disabled={disabled}
      onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ display:"inline-flex", alignItems:"center", gap:6, padding:small?"7px 13px":"10px 18px", borderRadius:T.r8, background:S.bg, border:`1px solid ${S.bd}`, color:S.cl, fontSize:small?12:13, fontWeight:600, fontFamily:T.font, cursor:disabled?"not-allowed":"pointer", opacity:disabled?0.5:1, transition:"all .12s", whiteSpace:"nowrap", ...style }}>
      {icon}{children}
    </button>
  );
}

// ── Form inputs ───────────────────────────────────────────────────────────────
export function Inp({ value, onChange, placeholder, type = "text", disabled = false, style = {} }) {
  const T = getT(); const [f, setF] = useState(false);
  return (
    <input type={type} value={value || ""} onChange={onChange} placeholder={placeholder} disabled={disabled}
      onFocus={() => setF(true)} onBlur={() => setF(false)}
      style={{ width:"100%", background:T.pageBg, border:`1.5px solid ${f?T.blue:T.border}`, borderRadius:T.r8, padding:"9px 12px", color:T.textPrimary, fontSize:13, fontFamily:T.font, outline:"none", boxSizing:"border-box", opacity:disabled?0.5:1, transition:"border-color .13s", ...style }}/>
  );
}

export function Sel({ value, onChange, options, style = {} }) {
  const T = getT(); const [f, setF] = useState(false);
  return (
    <select value={value || ""} onChange={onChange} onFocus={() => setF(true)} onBlur={() => setF(false)}
      style={{ width:"100%", background:T.pageBg, border:`1.5px solid ${f?T.blue:T.border}`, borderRadius:T.r8, padding:"9px 12px", color:T.textPrimary, fontSize:13, fontFamily:T.font, outline:"none", boxSizing:"border-box", cursor:"pointer", ...style }}>
      {options.map(o => <option key={o.value ?? o} value={o.value ?? o} style={{ background:T.cardBg }}>{o.label ?? o}</option>)}
    </select>
  );
}

// ── Modal overlay ─────────────────────────────────────────────────────────────
export function Modal({ children, onClose, wide = false }) {
  const T = getT();
  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position:"fixed", inset:0, background:"rgba(2,4,12,.85)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:16, backdropFilter:"blur(4px)" }}>
      <div style={{ background:T.panelBg, border:`1px solid ${T.borderVis}`, borderRadius:T.r16, padding:24, maxWidth:wide?720:480, width:"100%", boxShadow:T.shadowLg, maxHeight:"90vh", overflowY:"auto", position:"relative" }}>
        <button onClick={onClose} style={{ position:"absolute", top:12, right:12, background:T.elevated, border:`1px solid ${T.border}`, borderRadius:T.r8, width:28, height:28, display:"flex", alignItems:"center", justifyContent:"center", color:T.textMuted, cursor:"pointer" }}>
          <XIcon size={13}/>
        </button>
        {children}
      </div>
    </div>
  );
}

export function ModalTitle({ children, sub }) {
  const T = getT();
  return (
    <div style={{ marginBottom:16 }}>
      <div style={{ fontSize:15, fontWeight:700, color:T.textPrimary }}>{children}</div>
      {sub && <div style={{ fontSize:12, color:T.textMuted, marginTop:2 }}>{sub}</div>}
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────
export function Empty({ title, sub, icon }) {
  const T = getT();
  return (
    <div style={{ padding:"56px 20px", textAlign:"center" }}>
      <div style={{ width:44, height:44, borderRadius:"50%", background:T.elevated, border:`1px solid ${T.border}`, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 14px" }}>
        {icon
          ? <span style={{ display:"flex", alignItems:"center", justifyContent:"center" }}>{icon}</span>
          : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={T.textMuted} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
        }
      </div>
      <div style={{ fontSize:14, fontWeight:600, color:T.textPrimary, marginBottom:6 }}>{title}</div>
      {sub && <div style={{ fontSize:12, color:T.textMuted, maxWidth:260, margin:"0 auto", lineHeight:1.6 }}>{sub}</div>}
    </div>
  );
}

// ── Spinner ───────────────────────────────────────────────────────────────────
export function Spinner() {
  const T = getT();
  return (
    <div style={{ display:"flex", justifyContent:"center", padding:"48px 0" }}>
      <div style={{ width:24, height:24, borderRadius:"50%", border:`2px solid ${T.border}`, borderTopColor:T.blue, animation:"spin .7s linear infinite" }}/>
    </div>
  );
}

// ── Page header ───────────────────────────────────────────────────────────────
export function PageHeader({ title, sub, actions }) {
  const T = getT();
  return (
    <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:24, flexWrap:"wrap", gap:12 }}>
      <div>
        <h1 style={{ fontSize:22, fontWeight:700, color:T.textPrimary, margin:0, lineHeight:1.2 }}>{title}</h1>
        {sub && <div style={{ fontSize:13, color:T.textMuted, marginTop:4 }}>{sub}</div>}
      </div>
      {actions && <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>{actions}</div>}
    </div>
  );
}

// ── Card ──────────────────────────────────────────────────────────────────────
export function Card({ children, style = {} }) {
  const T = getT();
  return (
    <div style={{ background:T.cardBg, border:`1px solid ${T.border}`, borderRadius:T.r12, padding:"16px 18px", ...style }}>
      {children}
    </div>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────
export function StatCard({ label, value, sub, accent, icon }) {
  const T = getT();
  return (
    <div style={{ background:T.cardBg, border:`1px solid ${T.border}`, borderRadius:T.r12, padding:"16px 18px", position:"relative", overflow:"hidden" }}>
      <div style={{ position:"absolute", top:0, left:0, bottom:0, width:3, background:accent||T.blue, borderRadius:"3px 0 0 3px" }}/>
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:8 }}>
        <div style={{ fontSize:10, fontWeight:600, letterSpacing:"0.07em", textTransform:"uppercase", color:T.textMuted }}>{label}</div>
        {icon && <span style={{ display:"flex", alignItems:"center", justifyContent:"center", opacity:0.6 }}>{icon}</span>}
      </div>
      <div style={{ fontSize:26, fontWeight:800, color:T.textPrimary, lineHeight:1, letterSpacing:"-0.03em", fontVariantNumeric:"tabular-nums" }}>{value}</div>
      {sub && <div style={{ fontSize:11, color:T.textMuted, marginTop:5, lineHeight:1.4 }}>{sub}</div>}
    </div>
  );
}

// ── Icons ─────────────────────────────────────────────────────────────────────
const Ic = ({ size=18, color="currentColor", children }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ display:"block", flexShrink:0 }}>{children}</svg>
);
export const XIcon       = p => <Ic {...p}><path d="M18 6 6 18M6 6l12 12"/></Ic>;
export const CheckIcon   = p => <Ic {...p}><path d="M20 6 9 17l-5-5"/></Ic>;
export const CalIcon     = p => <Ic {...p}><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></Ic>;
export const ClockIcon   = p => <Ic {...p}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></Ic>;
export const UsersIcon   = p => <Ic {...p}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></Ic>;
export const TireIcon    = p => <Ic {...p}><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3.5"/><path d="M12 2.5v4M12 17.5v4M2.5 12h4M17.5 12h4"/></Ic>;
export const ChartIcon   = p => <Ic {...p}><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></Ic>;
export const SettingsIcon= p => <Ic {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></Ic>;
export const LogIcon     = p => <Ic {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></Ic>;
export const ShopIcon    = p => <Ic {...p}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></Ic>;
export const BayIcon     = p => <Ic {...p}><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><line x1="12" y1="12" x2="12" y2="16"/><line x1="10" y1="14" x2="14" y2="14"/></Ic>;
export const WrenchIcon  = p => <Ic {...p}><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></Ic>;
export const MsgIcon     = p => <Ic {...p}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></Ic>;
export const TrashIcon   = p => <Ic {...p}><path d="M3 6h18M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></Ic>;
export const PenIcon     = p => <Ic {...p}><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></Ic>;
export const FlagIcon    = p => <Ic {...p}><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></Ic>;
export const SearchIcon  = p => <Ic {...p}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></Ic>;
export const RefreshIcon = p => <Ic {...p}><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M21 4v4h-4"/><path d="M3 20v-4h4"/></Ic>;
export const SunIcon     = p => <Ic {...p}><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/></Ic>;
export const MoonIcon    = p => <Ic {...p}><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></Ic>;
export const MenuIcon    = p => <Ic {...p}><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></Ic>;
export const PlusIcon    = p => <Ic {...p}><path d="M12 5v14M5 12h14"/></Ic>;
export const LogOutIcon  = p => <Ic {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></Ic>;
export const StarIcon    = p => <Ic {...p}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></Ic>;
export const PrintIcon   = p => <Ic {...p}><path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></Ic>;
export const DownloadIcon= p => <Ic {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></Ic>;
export const RestoreIcon = p => <Ic {...p}><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></Ic>;
export const BellIcon    = p => <Ic {...p}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></Ic>;
export const NoteIcon    = p => <Ic {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></Ic>;
export const WalkInIcon  = p => <Ic {...p}><circle cx="12" cy="5" r="2"/><path d="m15 14-3-6-3 6"/><path d="M9 11H7l-2 6"/><path d="m17 11 2 6"/></Ic>;
