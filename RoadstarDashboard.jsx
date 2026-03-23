// ─────────────────────────────────────────────────────────────────────────────
// RoadstarDashboard.jsx  v7
// Changes from v6:
//   • Google Reviews section REMOVED
//   • Live at Bay updated for new resourcePool fields
//   • Tire SVG icon (no emoji)
//   • Fixed completed_review SMS flow + modal mapping
//   • iPhone-only hamburger (< 640px breakpoint)
//   • service_duration / equipment_recovery_time shown in cards
//   • customer_quantity stored but hidden from UI (future-safe)
//   • New services: 6 only (no old dead services)
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback, useRef } from "react";
import { fetchBookings, updateBooking, deleteBooking, sendSMS, getToken } from "./api.js";

const API_BASE = (import.meta.env.VITE_API_URL || "https://roadstar-api.onrender.com/api");

const SERVICES = [
  "Tire Change + Installation",
  "Flat Tire Repair",
  "Tire Rotation",
  "Wheel Alignment",
  "Tire Purchase",
  "Other",
];

const TIME_SLOTS = [
  "9:00 AM","9:15 AM","9:30 AM","9:45 AM",
  "10:00 AM","10:15 AM","10:30 AM","10:45 AM",
  "11:00 AM","11:15 AM","11:30 AM","11:45 AM",
  "12:00 PM","12:15 PM","12:30 PM","12:45 PM",
  "1:00 PM","1:15 PM","1:30 PM","1:45 PM",
  "2:00 PM","2:15 PM","2:30 PM","2:45 PM",
  "3:00 PM","3:15 PM","3:30 PM","3:45 PM",
  "4:00 PM","4:15 PM","4:30 PM","4:45 PM",
  "5:00 PM","5:15 PM","5:30 PM","5:45 PM",
];

const LOGO_URL = "";

// ── Design tokens ─────────────────────────────────────────────────────────────
const T = {
  pageBg:"#07090f", cardBg:"#0d1120", cardBgHov:"#111728",
  panelBg:"#0f1422", elevated:"#171e30", elevatedHov:"#1c2438",
  border:"#1d2b40", borderVis:"#263550",
  blue:"#2563EB", blueLight:"#3B82F6", blueBright:"#60A5FA",
  blueMuted:"#172554", blueSubtle:"#0c1a35",
  textPrimary:"#F0F4FF", textSecond:"#8896B0", textMuted:"#49576a",
  amber:"#F59E0B", amberBg:"#1c1200", amberBorder:"#3d2800", amberText:"#FCD34D",
  green:"#22C55E", greenBg:"#071a0f", greenBorder:"#14532D", greenText:"#86EFAC",
  purple:"#8B5CF6", purpleBg:"#130d24", purpleBorder:"#2e1b5e", purpleText:"#C4B5FD",
  teal:"#14B8A6", tealBg:"#042f2e", tealBorder:"#0f3d3a", tealText:"#5eead4",
  red:"#EF4444", redBg:"#1a0606", redBorder:"#450a0a", redText:"#FCA5A5",
  orange:"#F97316", orangeBg:"#1c0d02", orangeBorder:"#4a2008", orangeText:"#FDB88A",
  font:"'Inter',-apple-system,BlinkMacSystemFont,sans-serif",
  r6:"6px", r8:"8px", r10:"10px", r12:"12px", r16:"16px",
  shadow:"0 1px 3px rgba(0,0,0,.55)",
  shadowLg:"0 8px 40px rgba(0,0,0,.7)",
};

const STATUS = {
  pending:   {color:T.amber,  text:T.amberText,  bg:T.amberBg,  border:T.amberBorder,  accent:T.amber,  label:"Pending"},
  confirmed: {color:T.green,  text:T.greenText,  bg:T.greenBg,  border:T.greenBorder,  accent:T.green,  label:"Confirmed"},
  waitlist:  {color:T.purple, text:T.purpleText, bg:T.purpleBg, border:T.purpleBorder, accent:T.purple, label:"Waitlist"},
  completed: {color:T.teal,   text:T.tealText,   bg:T.tealBg,   border:T.tealBorder,   accent:T.teal,   label:"Completed"},
  cancelled: {color:T.red,    text:T.redText,    bg:T.redBg,    border:T.redBorder,    accent:T.red,    label:"Cancelled"},
};
const sm = s => STATUS[s] || STATUS.pending;

// ── Icons ─────────────────────────────────────────────────────────────────────
const Ic = ({size=20,color="currentColor",children,style={}}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
    style={{flexShrink:0,display:"block",...style}}>{children}</svg>
);

// Proper tire SVG icon — no emoji
const TireIcon = p => (
  <Ic {...p}>
    <circle cx="12" cy="12" r="9"/>
    <circle cx="12" cy="12" r="3.5"/>
    <path d="M12 2.5v4M12 17.5v4M2.5 12h4M17.5 12h4"/>
    <path d="M5.5 5.5l2.8 2.8M15.7 15.7l2.8 2.8M18.5 5.5l-2.8 2.8M8.3 15.7l-2.8 2.8"/>
  </Ic>
);

const CalIcon     = p=><Ic {...p}><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></Ic>;
const CheckCiIcon = p=><Ic {...p}><circle cx="12" cy="12" r="9"/><path d="m9 12 2 2 4-4"/></Ic>;
const ClockIcon   = p=><Ic {...p}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></Ic>;
const UsersIcon   = p=><Ic {...p}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></Ic>;
const PlusIcon    = p=><Ic {...p}><path d="M12 5v14M5 12h14"/></Ic>;
const CheckIcon   = p=><Ic {...p}><path d="M20 6 9 17l-5-5"/></Ic>;
const XIcon       = p=><Ic {...p}><path d="M18 6 6 18M6 6l12 12"/></Ic>;
const CalClkIcon  = p=><Ic {...p}><path d="M21 7.5V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3.5"/><path d="M16 2v4M8 2v4M3 10h5"/><circle cx="17.5" cy="17.5" r="4.5"/><path d="M17.5 15v2.5l1.5 1.5"/></Ic>;
const MsgIcon     = p=><Ic {...p}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></Ic>;
const PenIcon     = p=><Ic {...p}><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></Ic>;
const TrashIcon   = p=><Ic {...p}><path d="M3 6h18M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></Ic>;
const BellIcon    = p=><Ic {...p}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></Ic>;
const FlagIcon    = p=><Ic {...p}><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></Ic>;
const PrintIcon   = p=><Ic {...p}><path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></Ic>;
const BarIcon     = p=><Ic {...p}><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></Ic>;
const SearchIcon  = p=><Ic {...p}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></Ic>;
const RefreshIcon = p=><Ic {...p}><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M21 4v4h-4"/><path d="M3 20v-4h4"/></Ic>;
const LogOutIcon  = p=><Ic {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></Ic>;
const ShieldIcon  = p=><Ic {...p}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></Ic>;
const NoteIcon    = p=><Ic {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></Ic>;
const WalkInIcon  = p=><Ic {...p}><circle cx="12" cy="5" r="2"/><path d="m15 14-3-6-3 6"/><path d="M9 11H7l-2 6"/><path d="m17 11 2 6"/></Ic>;
const StarIcon    = p=><Ic {...p}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></Ic>;
const MenuIcon    = p=><Ic {...p}><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></Ic>;
const BayIcon     = p=><Ic {...p}><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><line x1="12" y1="12" x2="12" y2="16"/><line x1="10" y1="14" x2="14" y2="14"/></Ic>;

// ── Helpers ───────────────────────────────────────────────────────────────────
const todayStr = () => new Date().toISOString().slice(0,10);
const fmtDate  = d => {
  if (!d) return "";
  if (d === todayStr()) return "Today";
  return new Date(d+"T00:00:00").toLocaleDateString("en-CA",{weekday:"short",month:"short",day:"numeric"});
};
const displaySvc = b => b.service === "Other" && b.customService
  ? `Other — ${b.customService}` : b.service;

// SERVICE_DEFS mirror (kept in sync with server/config/business.js)
const SVC_DEFS = {
  "Tire Change + Installation": { service_duration: 40, equipment_recovery_time: 0 },
  "Flat Tire Repair":           { service_duration: 15, equipment_recovery_time: 0 },
  "Tire Rotation":              { service_duration: 20, equipment_recovery_time: 0 },
  "Wheel Alignment":            { service_duration: 60, equipment_recovery_time: 0 },
  "Tire Purchase":              { service_duration: 10, equipment_recovery_time: 0 },
  "Other":                      { service_duration: 30, equipment_recovery_time: 0 },
};

// Resolve effective occupation — uses DB value if it was saved correctly (> 10 or is Tire Purchase),
// otherwise falls back to the service definition. This handles old bookings that were saved
// before service_duration was denormalized into the schema.
const effectiveOcc = b => {
  const def = SVC_DEFS[b.service];
  const storedDur = b.service_duration;
  // If stored duration is the schema default (10) but service isn't Tire Purchase, use the def
  const dur = (storedDur && (storedDur !== 10 || b.service === "Tire Purchase"))
    ? storedDur
    : (def?.service_duration || 10);
  const rec = b.equipment_recovery_time || def?.equipment_recovery_time || 0;
  return dur + rec;
};

// ── Primitives ────────────────────────────────────────────────────────────────
function Badge({ status }) {
  const s = sm(status);
  return (
    <span style={{display:"inline-flex",alignItems:"center",gap:5,fontSize:11,fontWeight:700,
      letterSpacing:"0.05em",textTransform:"uppercase",padding:"4px 10px",borderRadius:20,
      background:s.bg,color:s.text,border:`1px solid ${s.border}`,whiteSpace:"nowrap"}}>
      <span style={{width:5,height:5,borderRadius:"50%",background:s.color,boxShadow:`0 0 4px ${s.color}80`}}/>
      {s.label}
    </span>
  );
}

function IBtn({ onClick, title, children, v="def", disabled=false }) {
  const [h,setH] = useState(false);
  const V = {
    def:       {bg:h?T.elevated:"transparent",  bd:h?T.borderVis:T.border, cl:h?T.textSecond:T.textMuted},
    accept:    {bg:h?"#0a2215":T.greenBg,       bd:T.greenBorder,          cl:T.green},
    decline:   {bg:h?"#220909":T.redBg,         bd:T.redBorder,            cl:T.red},
    complete:  {bg:h?"#042f2e":T.tealBg,        bd:T.tealBorder,           cl:T.teal},
    reschedule:{bg:h?T.elevated:"transparent",  bd:h?T.borderVis:T.border, cl:h?T.blueBright:T.textSecond},
    sms:       {bg:h?T.blueSubtle:"transparent",bd:h?T.blueLight:T.border, cl:h?T.blueBright:T.textSecond},
    edit:      {bg:h?T.elevated:"transparent",  bd:h?T.borderVis:T.border, cl:h?T.textSecond:T.textMuted},
    trash:     {bg:h?T.redBg:"transparent",     bd:h?T.redBorder:T.border, cl:h?T.red:T.textMuted},
    note:      {bg:h?T.orangeBg:"transparent",  bd:h?T.orangeBorder:T.border,cl:h?T.orange:T.textMuted},
    snooze:    {bg:h?T.amberBg:"transparent",   bd:h?T.amberBorder:T.border,cl:h?T.amber:T.textMuted},
  };
  const s = V[v]||V.def;
  return (
    <button onClick={onClick} title={title} disabled={disabled}
      onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)}
      style={{display:"inline-flex",alignItems:"center",justifyContent:"center",
        width:44,height:44,borderRadius:T.r8,background:s.bg,border:`1px solid ${s.bd}`,
        color:s.cl,cursor:disabled?"not-allowed":"pointer",flexShrink:0,opacity:disabled?0.4:1,
        transition:"all .13s"}}>
      {children}
    </button>
  );
}

function Btn({ onClick, children, variant="primary", icon=null, small=false, disabled=false, style={} }) {
  const [h,setH] = useState(false);
  const S = {
    primary: {bg:h?T.blueLight:T.blue,        bd:h?T.blueLight:T.blue,    cl:"#fff"},
    ghost:   {bg:h?T.elevated:"transparent",   bd:h?T.borderVis:T.border,  cl:T.textSecond},
    danger:  {bg:h?"#220909":T.redBg,          bd:T.redBorder,             cl:T.red},
    success: {bg:h?"#0a2215":T.greenBg,        bd:T.greenBorder,           cl:T.green},
    teal:    {bg:h?"#042f2e":T.tealBg,         bd:T.tealBorder,            cl:T.teal},
    amber:   {bg:h?T.amberBg:"transparent",    bd:T.amberBorder,           cl:T.amber},
  }[variant]||{bg:T.blue,bd:T.blue,cl:"#fff"};
  return (
    <button onClick={onClick} disabled={disabled}
      onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)}
      style={{display:"inline-flex",alignItems:"center",gap:7,
        padding:small?"8px 14px":"11px 20px",borderRadius:T.r8,
        background:S.bg,border:`1px solid ${S.bd}`,color:S.cl,
        fontSize:small?12:14,fontWeight:600,fontFamily:T.font,
        cursor:disabled?"not-allowed":"pointer",whiteSpace:"nowrap",
        opacity:disabled?0.5:1,transition:"all .13s",...style}}>
      {icon}{children}
    </button>
  );
}

function FLbl({ children }) {
  return <label style={{display:"block",fontSize:11,fontWeight:600,
    letterSpacing:"0.07em",textTransform:"uppercase",color:T.textMuted,marginBottom:6}}>
    {children}</label>;
}
function Inp({ value, onChange, placeholder, type="text", disabled=false, style={} }) {
  const [f,setF] = useState(false);
  return (
    <input type={type} value={value} onChange={onChange} placeholder={placeholder}
      disabled={disabled} onFocus={()=>setF(true)} onBlur={()=>setF(false)}
      style={{width:"100%",background:T.pageBg,border:`1.5px solid ${f?T.blue:T.border}`,
        borderRadius:T.r8,padding:"11px 13px",color:T.textPrimary,fontSize:14,
        fontFamily:T.font,outline:"none",boxSizing:"border-box",
        transition:"border-color .15s",opacity:disabled?0.5:1,...style}}/>
  );
}
function Sel({ value, onChange, options, style={} }) {
  const [f,setF] = useState(false);
  return (
    <select value={value} onChange={onChange} onFocus={()=>setF(true)} onBlur={()=>setF(false)}
      style={{width:"100%",background:T.pageBg,border:`1.5px solid ${f?T.blue:T.border}`,
        borderRadius:T.r8,padding:"11px 13px",color:T.textPrimary,fontSize:14,
        fontFamily:T.font,outline:"none",boxSizing:"border-box",cursor:"pointer",...style}}>
      {options.map(o=><option key={o.value??o} value={o.value??o} style={{background:T.panelBg}}>{o.label??o}</option>)}
    </select>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, filterKey, activeFilter, onToggle, statusKey, accentOverride }) {
  const isActive = activeFilter===filterKey;
  const [h,setH] = useState(false);
  const s = statusKey ? sm(statusKey) : null;
  const ac  = accentOverride||s?.color||T.blue;
  const acBg = s?.bg||T.blueSubtle; const acBd = s?.border||T.blue; const acTx = s?.text||T.blueBright;
  return (
    <button onClick={()=>onToggle(filterKey)} onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)}
      style={{flex:"1 1 0",minWidth:90,textAlign:"left",cursor:"pointer",outline:"none",
        background:isActive?acBg:h?T.cardBgHov:T.cardBg,
        border:`1.5px solid ${isActive?acBd:h?T.borderVis:T.border}`,
        borderLeft:`4px solid ${isActive?ac:h?T.borderVis:T.border}`,
        borderRadius:T.r12,padding:"14px 14px 12px",boxShadow:T.shadow,
        transition:"all .15s",position:"relative"}}>
      <div style={{width:32,height:32,borderRadius:T.r8,marginBottom:10,
        background:isActive?`${ac}18`:T.elevated,display:"flex",alignItems:"center",
        justifyContent:"center",color:isActive?ac:T.textMuted,transition:"all .15s"}}>{icon}</div>
      <div style={{fontSize:28,fontWeight:800,lineHeight:1,color:T.textPrimary,marginBottom:3,
        letterSpacing:"-0.03em",fontVariantNumeric:"tabular-nums"}}>{value}</div>
      <div style={{fontSize:11,fontWeight:500,color:isActive?acTx:T.textMuted}}>{label}</div>
      {isActive&&<div style={{position:"absolute",top:9,right:9,fontSize:9,fontWeight:700,
        letterSpacing:"0.07em",textTransform:"uppercase",color:acTx,
        background:acBg,border:`1px solid ${acBd}`,padding:"2px 6px",borderRadius:20}}>ON</div>}
    </button>
  );
}

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ alerts, onDismiss }) {
  if (!alerts.length) return null;
  return (
    <div style={{position:"fixed",top:66,right:12,zIndex:9999,
      display:"flex",flexDirection:"column",gap:7,maxWidth:320}}>
      {alerts.map(a=>(
        <div key={a.id} style={{background:T.panelBg,border:`1px solid ${T.borderVis}`,
          borderLeft:`3px solid ${a.type==="error"?T.red:a.type==="new"?T.green:T.blue}`,
          borderRadius:T.r10,padding:"11px 12px",display:"flex",alignItems:"flex-start",gap:9,
          boxShadow:T.shadowLg,animation:"toastIn .22s ease"}}>
          <div style={{width:24,height:24,borderRadius:T.r6,flexShrink:0,
            background:a.type==="error"?T.redBg:a.type==="new"?T.greenBg:T.blueMuted,
            display:"flex",alignItems:"center",justifyContent:"center",
            color:a.type==="error"?T.red:a.type==="new"?T.green:T.blueBright}}>
            {a.type==="new"?<BellIcon size={12}/>:a.type==="error"?<XIcon size={12}/>:<CheckIcon size={12}/>}
          </div>
          <div style={{flex:1}}>
            <div style={{fontSize:10,fontWeight:700,letterSpacing:"0.06em",textTransform:"uppercase",
              marginBottom:2,color:a.type==="error"?T.red:a.type==="new"?T.green:T.blueBright}}>
              {a.type==="new"?"New Booking":a.type==="error"?"Error":"Update"}
            </div>
            <div style={{fontSize:12.5,color:T.textSecond,lineHeight:1.45}}>{a.message}</div>
          </div>
          <button onClick={()=>onDismiss(a.id)} style={{background:"none",border:"none",color:T.textMuted,cursor:"pointer",padding:2}}><XIcon size={12}/></button>
        </div>
      ))}
    </div>
  );
}

// ── Overlay ───────────────────────────────────────────────────────────────────
function Overlay({ children, onClose, wide=false }) {
  return (
    <div onClick={e=>{if(e.target===e.currentTarget)onClose();}}
      style={{position:"fixed",inset:0,background:"rgba(2,4,12,.86)",zIndex:1000,
        display:"flex",alignItems:"center",justifyContent:"center",padding:16,backdropFilter:"blur(5px)"}}>
      <div style={{background:T.panelBg,border:`1px solid ${T.borderVis}`,borderRadius:T.r16,
        padding:26,maxWidth:wide?720:500,width:"100%",boxShadow:T.shadowLg,
        maxHeight:"92vh",overflowY:"auto",position:"relative"}}>
        <button onClick={onClose} style={{position:"absolute",top:14,right:14,background:T.elevated,
          border:`1px solid ${T.border}`,borderRadius:T.r8,width:30,height:30,
          display:"flex",alignItems:"center",justifyContent:"center",color:T.textMuted,cursor:"pointer"}}>
          <XIcon size={13}/>
        </button>
        {children}
      </div>
    </div>
  );
}
function MHdr({ icon, title, sub }) {
  return (
    <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:4}}>
      <div style={{width:38,height:38,borderRadius:T.r8,background:T.blueMuted,
        display:"flex",alignItems:"center",justifyContent:"center",color:T.blueBright}}>{icon}</div>
      <div>
        <div style={{fontSize:15,fontWeight:700,color:T.textPrimary}}>{title}</div>
        {sub&&<div style={{fontSize:12,color:T.textMuted,marginTop:1}}>{sub}</div>}
      </div>
    </div>
  );
}
const HDivider = () => <div style={{height:1,background:T.border,margin:"14px 0"}}/>;

// ── Complete Modal — FIXED completedSmsVariant mapping ────────────────────────
function CompleteModal({ booking, onClose, onComplete }) {
  const [busy,setBusy] = useState(false);
  // variant values must exactly match backend enum: "with_review" | "without_review" | "none"
  const go = async(variant) => { setBusy(true); await onComplete(booking, variant); setBusy(false); };
  return (
    <Overlay onClose={onClose}>
      <MHdr icon={<FlagIcon size={18}/>} title="Mark as Completed"
        sub={`${booking.firstName} ${booking.lastName} · ${displaySvc(booking)}`}/>
      <HDivider/>
      <p style={{fontSize:13,color:T.textSecond,lineHeight:1.6,marginBottom:16}}>
        Send a thank-you SMS to the customer?
      </p>
      {[
        {variant:"with_review",    icon:<StarIcon size={16} color={T.amber}/>,       title:"Send with Google Review",   desc:"Thank-you + Google review link at the bottom of the SMS.", bg:T.amberBg, bd:T.amberBorder, cl:T.amber},
        {variant:"without_review", icon:<MsgIcon  size={16} color={T.teal}/>,        title:"Send Thank-You Only",        desc:"Short thank-you SMS, no review link.",                    bg:T.tealBg,  bd:T.tealBorder,  cl:T.teal},
        {variant:"none",           icon:<XIcon    size={16} color={T.textMuted}/>,   title:"Complete — No SMS",          desc:"Mark complete without sending any message.",              bg:T.elevated,bd:T.border,       cl:T.textMuted},
      ].map(({variant,icon,title,desc,bg,bd,cl})=>(
        <div key={variant} style={{background:T.elevated,border:`1.5px solid ${bd}`,borderRadius:T.r12,padding:"14px 16px",marginBottom:9}}>
          <div style={{display:"flex",alignItems:"center",gap:11,marginBottom:10}}>
            <div style={{width:34,height:34,borderRadius:T.r8,background:bg,border:`1px solid ${bd}`,
              flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>{icon}</div>
            <div>
              <div style={{fontSize:13,fontWeight:700,color:T.textPrimary,marginBottom:2}}>{title}</div>
              <div style={{fontSize:12,color:T.textMuted,lineHeight:1.5}}>{desc}</div>
            </div>
          </div>
          <Btn onClick={()=>go(variant)} disabled={busy}
            style={{width:"100%",justifyContent:"center",color:cl,background:bg,border:`1px solid ${bd}`}}>
            <CheckIcon size={14} color={cl}/>
            {variant==="with_review"?"Send with Google Review":variant==="without_review"?"Send Thank-You":"Complete Without SMS"}
          </Btn>
        </div>
      ))}
      <Btn onClick={onClose} disabled={busy} variant="ghost"
        style={{width:"100%",justifyContent:"center",marginTop:4,color:T.red,borderColor:T.redBorder}}>
        Cancel
      </Btn>
    </Overlay>
  );
}

// ── Delete Modal ──────────────────────────────────────────────────────────────
function DeleteModal({ booking, onClose, onConfirm }) {
  const [busy,setBusy] = useState(false);
  return (
    <Overlay onClose={onClose}>
      <div style={{textAlign:"center",padding:"6px 0 2px"}}>
        <div style={{width:50,height:50,borderRadius:"50%",background:T.redBg,border:`1.5px solid ${T.redBorder}`,
          display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 14px"}}><TrashIcon size={21} color={T.red}/></div>
        <div style={{fontSize:17,fontWeight:700,color:T.textPrimary,marginBottom:7}}>Delete Booking?</div>
        <div style={{fontSize:13,color:T.textSecond,lineHeight:1.65,marginBottom:18}}>
          You're about to permanently delete<br/>
          <strong style={{color:T.textPrimary}}>{booking.firstName} {booking.lastName}</strong>
          {" "}— <span style={{color:T.amber}}>{displaySvc(booking)}</span>
          <br/>{booking.date} at {booking.time}
          <br/><span style={{color:T.red,fontWeight:600,fontSize:12}}>This cannot be undone.</span>
        </div>
        <div style={{display:"flex",gap:10,justifyContent:"center"}}>
          <Btn onClick={async()=>{setBusy(true);await onConfirm(booking._id);setBusy(false);}}
            disabled={busy} variant="danger" icon={<TrashIcon size={14} color={T.red}/>}>
            {busy?"Deleting…":"Yes, Delete"}
          </Btn>
          <Btn onClick={onClose} disabled={busy} variant="ghost">No, Keep It</Btn>
        </div>
      </div>
    </Overlay>
  );
}

// ── Note Modal ────────────────────────────────────────────────────────────────
function NoteModal({ booking, onClose, onSave }) {
  const [note,setNote] = useState(booking.notes||"");
  const [busy,setBusy] = useState(false);
  return (
    <Overlay onClose={onClose}>
      <MHdr icon={<NoteIcon size={18}/>} title="Staff Note" sub={`${booking.firstName} ${booking.lastName}`}/>
      <HDivider/>
      <FLbl>Internal note (not sent to customer)</FLbl>
      <textarea value={note} onChange={e=>setNote(e.target.value)} rows={4} placeholder="Add a note..."
        style={{width:"100%",background:T.pageBg,border:`1.5px solid ${T.border}`,borderRadius:T.r8,
          padding:"11px 13px",color:T.textPrimary,fontSize:14,fontFamily:T.font,
          resize:"vertical",outline:"none",boxSizing:"border-box"}}/>
      <div style={{display:"flex",gap:10,marginTop:16}}>
        <Btn onClick={async()=>{setBusy(true);await onSave(booking._id,{notes:note});setBusy(false);onClose();}}
          disabled={busy} icon={<CheckIcon size={15} color="#fff"/>}>{busy?"Saving…":"Save Note"}</Btn>
        <Btn onClick={onClose} variant="ghost">Cancel</Btn>
      </div>
    </Overlay>
  );
}

// ── SMS Modal ─────────────────────────────────────────────────────────────────
function SMSModal({ booking, onClose, onSend }) {
  const [type,setType] = useState("confirmed");
  const [busy,setBusy] = useState(false);
  const TYPES = [
    {k:"confirmed",          label:"Confirmed",              desc:"Appointment confirmed"},
    {k:"reminder",           label:"Reminder",               desc:"Reminder for today"},
    {k:"declined",           label:"Declined",               desc:"Appointment cancelled"},
    {k:"waitlist",           label:"Waitlist",               desc:"A spot opened"},
    {k:"completed_review",   label:"Completed + Review",     desc:"Thank-you with Google review link at bottom"},
    {k:"completed_no_review",label:"Completed — No Review",  desc:"Thank-you without review link"},
  ];
  return (
    <Overlay onClose={onClose}>
      <MHdr icon={<MsgIcon size={18}/>} title="Send SMS"
        sub={`${booking.firstName} ${booking.lastName} · ${booking.phone}`}/>
      <HDivider/>
      <div style={{display:"flex",flexDirection:"column",gap:7,marginBottom:16}}>
        {TYPES.map(({k,label,desc})=>{
          const active=type===k;
          return (
            <button key={k} onClick={()=>setType(k)} style={{
              display:"flex",alignItems:"center",gap:11,padding:"10px 13px",borderRadius:T.r10,
              cursor:"pointer",textAlign:"left",background:active?T.blueSubtle:T.elevated,
              border:`1.5px solid ${active?T.blue:T.border}`,transition:"all .12s"}}>
              <div style={{width:15,height:15,borderRadius:"50%",flexShrink:0,
                border:`2px solid ${active?T.blue:T.textMuted}`,background:active?T.blue:"transparent",
                display:"flex",alignItems:"center",justifyContent:"center"}}>
                {active&&<div style={{width:5,height:5,borderRadius:"50%",background:"#fff"}}/>}
              </div>
              <div>
                <div style={{fontSize:13,fontWeight:600,color:active?T.textPrimary:T.textSecond}}>{label}</div>
                <div style={{fontSize:11,color:T.textMuted,marginTop:1}}>{desc}</div>
              </div>
            </button>
          );
        })}
      </div>
      <button onClick={async()=>{setBusy(true);await onSend(booking,type);setBusy(false);}} disabled={busy}
        style={{width:"100%",padding:"12px",borderRadius:T.r8,background:busy?T.blueMuted:T.blue,
          border:"none",color:"#fff",fontSize:14,fontWeight:600,fontFamily:T.font,
          cursor:busy?"not-allowed":"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
        <MsgIcon size={15} color="#fff"/>{busy?"Sending…":"Send SMS"}
      </button>
    </Overlay>
  );
}

// ── Edit Modal ────────────────────────────────────────────────────────────────
function EditModal({ booking, onClose, onSave }) {
  const [form,setForm] = useState({
    status:booking.status, notes:booking.notes||"",
    date:booking.date, time:booking.time,
    tireSize:booking.tireSize||"", doesntKnowTireSize:booking.doesntKnowTireSize||false,
  });
  const [busy,setBusy] = useState(false);
  const [err,setErr]   = useState("");
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  return (
    <Overlay onClose={onClose}>
      <MHdr icon={<PenIcon size={18}/>} title="Edit Appointment" sub={`${booking.firstName} ${booking.lastName}`}/>
      <HDivider/>
      {err&&<div style={{background:T.redBg,border:`1px solid ${T.redBorder}`,borderRadius:T.r8,
        padding:"10px 13px",fontSize:13,color:T.redText,marginBottom:12}}>{err}</div>}
      <div style={{display:"flex",flexDirection:"column",gap:13}}>
        <div><FLbl>Status</FLbl>
          <Sel value={form.status} onChange={e=>set("status",e.target.value)}
            options={["pending","confirmed","waitlist","completed","cancelled"]
              .map(v=>({value:v,label:v.charAt(0).toUpperCase()+v.slice(1)}))}/>
        </div>
        <div><FLbl>Date</FLbl><Inp value={form.date} onChange={e=>set("date",e.target.value)} placeholder="YYYY-MM-DD"/></div>
        <div><FLbl>Time</FLbl>
          <Sel value={form.time} onChange={e=>set("time",e.target.value)}
            options={TIME_SLOTS.map(t=>({value:t,label:t}))}/>
        </div>
        <div><FLbl>Tire Size</FLbl>
          <Inp value={form.tireSize} onChange={e=>set("tireSize",e.target.value)}
            placeholder="225/55R17" disabled={form.doesntKnowTireSize}/>
          <label style={{display:"flex",alignItems:"center",gap:8,marginTop:8,cursor:"pointer",
            fontSize:13,color:form.doesntKnowTireSize?T.amber:T.textMuted}}>
            <input type="checkbox" checked={form.doesntKnowTireSize}
              onChange={e=>{set("doesntKnowTireSize",e.target.checked);if(e.target.checked)set("tireSize","");}}
              style={{width:14,height:14,accentColor:T.amber}}/>
            Doesn't know tire size
          </label>
        </div>
        <div><FLbl>Notes</FLbl>
          <textarea value={form.notes} onChange={e=>set("notes",e.target.value)} rows={3}
            style={{width:"100%",background:T.pageBg,border:`1.5px solid ${T.border}`,borderRadius:T.r8,
              padding:"10px 13px",color:T.textPrimary,fontSize:14,fontFamily:T.font,
              resize:"vertical",outline:"none",boxSizing:"border-box"}}/>
        </div>
      </div>
      <div style={{display:"flex",gap:10,marginTop:20}}>
        <Btn onClick={async()=>{setBusy(true);setErr("");try{await onSave(booking._id,form);}catch(e){setErr(e.message||"Save failed");}setBusy(false);}}
          disabled={busy} icon={<CheckIcon size={15} color="#fff"/>}>{busy?"Saving…":"Save Changes"}</Btn>
        <Btn onClick={onClose} variant="ghost">Cancel</Btn>
      </div>
    </Overlay>
  );
}

// ── Walk-In Modal ─────────────────────────────────────────────────────────────
function WalkInModal({ onClose, onSave, bookings }) {
  const [f,setF] = useState({firstName:"",lastName:"",phone:"",service:"Tire Change + Installation",date:todayStr(),time:"9:00 AM",notes:""});
  const [busy,setBusy] = useState(false);
  const [err,setErr]   = useState("");
  const set=(k,v)=>setF(p=>({...p,[k]:v}));
  const avail = TIME_SLOTS.filter(t=>!bookings.filter(b=>b.date===f.date&&b.status==="confirmed").map(b=>b.time).includes(t));
  return (
    <Overlay onClose={onClose}>
      <MHdr icon={<WalkInIcon size={18}/>} title="Walk-in Booking" sub="Create an immediate appointment"/>
      <HDivider/>
      {err&&<div style={{background:T.redBg,border:`1px solid ${T.redBorder}`,borderRadius:T.r8,padding:"10px 13px",fontSize:13,color:T.redText,marginBottom:12}}>{err}</div>}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:13}}>
        <div><FLbl>First Name</FLbl><Inp value={f.firstName} onChange={e=>set("firstName",e.target.value)} placeholder="John"/></div>
        <div><FLbl>Last Name</FLbl><Inp value={f.lastName}  onChange={e=>set("lastName",e.target.value)}  placeholder="Smith"/></div>
        <div><FLbl>Phone</FLbl><Inp value={f.phone} onChange={e=>set("phone",e.target.value)} placeholder="+1 (416) 555-0000"/></div>
        <div><FLbl>Service</FLbl><Sel value={f.service} onChange={e=>set("service",e.target.value)} options={SERVICES.map(s=>({value:s,label:s}))}/></div>
        <div><FLbl>Date</FLbl><Inp type="date" value={f.date} onChange={e=>set("date",e.target.value)} style={{padding:"10px 13px"}}/></div>
        <div><FLbl>Time</FLbl><Sel value={f.time} onChange={e=>set("time",e.target.value)} options={avail.length?avail.map(t=>({value:t,label:t})):[{value:"",label:"No slots"}]}/></div>
      </div>
      <div style={{marginTop:12}}><FLbl>Notes</FLbl>
        <textarea value={f.notes} onChange={e=>set("notes",e.target.value)} rows={2}
          style={{width:"100%",background:T.pageBg,border:`1.5px solid ${T.border}`,borderRadius:T.r8,
            padding:"10px 13px",color:T.textPrimary,fontSize:13,fontFamily:T.font,
            resize:"vertical",outline:"none",boxSizing:"border-box"}}/>
      </div>
      <div style={{display:"flex",gap:10,marginTop:16}}>
        <Btn onClick={async()=>{
          if(!f.firstName||!f.lastName||!f.phone){setErr("Name and phone required.");return;}
          setBusy(true);setErr("");
          try{
            const res=await fetch(API_BASE+"/book",{method:"POST",headers:{"Content-Type":"application/json","Authorization":`Bearer ${getToken()}`},body:JSON.stringify({...f,status:"confirmed",isWalkIn:true})});
            const d=await res.json();
            if(!res.ok) throw new Error(d.message||"Failed");
            onSave();onClose();
          }catch(e){setErr(e.message);}
          finally{setBusy(false);}
        }} disabled={busy} icon={<PlusIcon size={15} color="#fff"/>}>
          {busy?"Creating…":"Create Walk-in"}
        </Btn>
        <Btn onClick={onClose} variant="ghost">Cancel</Btn>
      </div>
    </Overlay>
  );
}

// ── Customer History Modal ────────────────────────────────────────────────────
function CustomerModal({ onClose }) {
  const [search,setSearch] = useState("");
  const [loading,setLoading] = useState(false);
  const [customers,setCustomers] = useState([]);
  const [selected,setSelected]   = useState(null);

  const fetchC = useCallback(async(q="")=>{
    setLoading(true);
    try{
      const res=await fetch(`${API_BASE}/customers?search=${encodeURIComponent(q)}`,{headers:{"Authorization":`Bearer ${getToken()}`}});
      const d=await res.json();setCustomers(d.customers||[]);
    }catch(e){}finally{setLoading(false);}
  },[]);

  useEffect(()=>{fetchC();},[fetchC]);

  if(selected) return (
    <Overlay onClose={()=>setSelected(null)} wide>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}>
        <button onClick={()=>setSelected(null)} style={{background:"none",border:"none",color:T.textMuted,cursor:"pointer",padding:4,display:"flex"}}><XIcon size={14}/></button>
        <div>
          <div style={{fontSize:15,fontWeight:700,color:T.textPrimary}}>{selected.firstName} {selected.lastName}</div>
          <div style={{fontSize:12,color:T.textMuted}}>{selected.phone} · {selected.visitCount} visit{selected.visitCount!==1?"s":""}</div>
        </div>
      </div>
      <HDivider/>
      {selected.tireSizes?.length>0&&<div style={{fontSize:12,color:T.orange,marginBottom:12}}>Tire sizes: {selected.tireSizes.join(", ")}</div>}
      <div style={{display:"flex",flexDirection:"column",gap:8,maxHeight:400,overflowY:"auto"}}>
        {(selected.bookings||[]).map(b=>(
          <div key={b._id} style={{background:T.elevated,border:`1px solid ${T.border}`,borderRadius:T.r8,padding:"10px 13px"}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
              <div style={{fontSize:13,fontWeight:600,color:T.textPrimary}}>{displaySvc(b)}</div>
              <Badge status={b.status}/>
            </div>
            <div style={{fontSize:12,color:T.textMuted}}>{b.date} at {b.time}
              {b.tireSize&&<span style={{marginLeft:10,color:T.orange}}>{b.tireSize}</span>}
            </div>
            {b.notes&&<div style={{fontSize:11,color:T.orange,marginTop:4,fontStyle:"italic"}}>{b.notes}</div>}
          </div>
        ))}
      </div>
    </Overlay>
  );

  return (
    <Overlay onClose={onClose} wide>
      <MHdr icon={<UsersIcon size={18}/>} title="Customer History" sub="Search by name or phone"/>
      <HDivider/>
      <div style={{display:"flex",gap:8,marginBottom:14}}>
        <Inp value={search} onChange={e=>setSearch(e.target.value)} placeholder="Name or phone..."/>
        <Btn onClick={()=>fetchC(search)} small icon={<SearchIcon size={14} color="#fff"/>}>Search</Btn>
      </div>
      {loading ? <div style={{textAlign:"center",padding:"20px 0",color:T.textMuted}}>Loading...</div>
        : customers.length===0 ? <div style={{textAlign:"center",padding:"20px 0",color:T.textMuted,fontSize:13}}>No customers found.</div>
        : <div style={{display:"flex",flexDirection:"column",gap:8,maxHeight:420,overflowY:"auto"}}>
            {customers.map(c=>(
              <button key={c.phone} onClick={()=>setSelected(c)}
                style={{display:"flex",alignItems:"center",gap:13,padding:"11px 13px",
                  background:T.elevated,border:`1px solid ${T.border}`,borderRadius:T.r8,
                  cursor:"pointer",textAlign:"left",width:"100%",transition:"border-color .13s"}}
                onMouseEnter={e=>e.currentTarget.style.borderColor=T.borderVis}
                onMouseLeave={e=>e.currentTarget.style.borderColor=T.border}>
                <div style={{width:36,height:36,borderRadius:"50%",background:T.cardBg,border:`1px solid ${T.border}`,
                  display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,
                  fontWeight:700,fontSize:13,color:T.blueBright}}>
                  {c.firstName?.[0]||"?"}{c.lastName?.[0]||""}
                </div>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:600,color:T.textPrimary}}>
                    {c.firstName} {c.lastName}
                    {c.visitCount>=2&&<span style={{marginLeft:7,fontSize:10,fontWeight:700,padding:"1px 6px",borderRadius:20,background:T.orangeBg,color:T.orange,border:`1px solid ${T.orangeBorder}`}}>★{c.visitCount}x</span>}
                  </div>
                  <div style={{fontSize:12,color:T.textMuted}}>{c.phone}</div>
                  {c.tireSizes?.length>0&&<div style={{fontSize:11,color:T.orange}}>{c.tireSizes.join(", ")}</div>}
                </div>
                <div style={{fontSize:11,color:T.textMuted,textAlign:"right"}}>
                  {c.visitCount} visit{c.visitCount!==1?"s":""}<br/>
                  <span style={{fontSize:10}}>{c.lastVisit}</span>
                </div>
              </button>
            ))}
          </div>
      }
    </Overlay>
  );
}

// ── Heatmap Modal ─────────────────────────────────────────────────────────────
function HeatmapModal({ bookings, onClose }) {
  const counts = {};
  TIME_SLOTS.forEach(s=>counts[s]=0);
  bookings.forEach(b=>{ if(counts[b.time]!==undefined) counts[b.time]++; });
  const maxC = Math.max(...Object.values(counts),1);
  return (
    <Overlay onClose={onClose} wide>
      <MHdr icon={<BarIcon size={18}/>} title="Busiest Hours" sub="All-time bookings by time slot"/>
      <HDivider/>
      <div style={{display:"flex",flexDirection:"column",gap:6}}>
        {TIME_SLOTS.map(s=>{
          const c=counts[s]||0,pct=c/maxC;
          const bc=pct>.8?T.red:pct>.5?T.amber:pct>.2?T.green:T.teal;
          return (
            <div key={s} style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{fontSize:11.5,fontWeight:600,color:T.textSecond,width:68,textAlign:"right",flexShrink:0,fontVariantNumeric:"tabular-nums"}}>{s}</div>
              <div style={{flex:1,height:26,background:T.elevated,borderRadius:T.r6,overflow:"hidden",position:"relative"}}>
                <div style={{height:"100%",width:`${Math.round(pct*100)}%`,background:bc,borderRadius:T.r6,minWidth:c?3:0,opacity:.7}}/>
                {c>0&&<div style={{position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",fontSize:10.5,fontWeight:700,color:T.textPrimary}}>{c}</div>}
              </div>
              <div style={{width:26,textAlign:"right",fontSize:11,fontWeight:700,color:c>0?bc:T.textMuted,flexShrink:0}}>{c}</div>
            </div>
          );
        })}
      </div>
    </Overlay>
  );
}

// ── Live at Bay ───────────────────────────────────────────────────────────────
function LiveAtBay({ onSnooze, onComplete }) {
  const [data,setData]       = useState(null);
  const [loading,setLoading] = useState(true);

  const fetchBay = useCallback(async()=>{
    try{
      const res=await fetch(`${API_BASE}/live-bay`,{headers:{"Authorization":`Bearer ${getToken()}`}});
      const d=await res.json();
      if(d.success) setData(d);
    }catch(e){}finally{setLoading(false);}
  },[]);

  useEffect(()=>{ fetchBay(); const iv=setInterval(fetchBay,60_000); return()=>clearInterval(iv); },[fetchBay]);

  if(loading) return null;

  const now = new Date();
  const BAY_COLORS = {
    1:         {bg:T.blueSubtle,  bd:T.blue,        cl:T.blueBright},
    2:         {bg:T.tealBg,      bd:T.tealBorder,   cl:T.teal},
    3:         {bg:T.purpleBg,    bd:T.purpleBorder,  cl:T.purpleText},
    alignment: {bg:T.amberBg,    bd:T.amberBorder,   cl:T.amberText},
  };
  const snoozed = b => b.bayCheckSnoozeUntil && new Date(b.bayCheckSnoozeUntil)>now;

  return (
    <div style={{marginBottom:28}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
        <BayIcon size={16} color={T.green}/>
        <span style={{fontSize:14,fontWeight:700,color:T.textPrimary}}>Live at Bay</span>
        <span style={{fontSize:11,color:T.textMuted,background:T.elevated,padding:"2px 8px",borderRadius:20,border:`1px solid ${T.border}`}}>
          {data?.active?.length||0} active
        </span>
        <button onClick={fetchBay} style={{background:"none",border:"none",color:T.textMuted,cursor:"pointer",padding:2,display:"flex",marginLeft:"auto"}}><RefreshIcon size={14}/></button>
      </div>

      {(!data?.active||data.active.length===0) ? (
        <div style={{background:T.cardBg,border:`1px solid ${T.border}`,borderRadius:T.r12,
          padding:"22px 16px",textAlign:"center",color:T.textMuted,fontSize:13}}>
          No customers currently in a bay.
        </div>
      ) : (
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:12}}>
          {data.active.map((b,i)=>{
            const bayKey   = b.resourcePool==="alignment" ? "alignment" : (b.assignedBay||i+1);
            const bc       = BAY_COLORS[bayKey]||BAY_COLORS[1];
            const isOver   = b.minutesRemaining<=0 && !snoozed(b);
            const needsChk = b.minutesRemaining<=5 && b.minutesRemaining>0 && !snoozed(b);
            return (
              <div key={b._id} style={{background:bc.bg,border:`1.5px solid ${isOver?T.red:bc.bd}`,
                borderRadius:T.r12,padding:"14px 16px",position:"relative",
                boxShadow:isOver?`0 0 12px ${T.red}40`:T.shadow}}>
                <div style={{position:"absolute",top:10,right:12,fontSize:10,fontWeight:700,
                  letterSpacing:"0.06em",textTransform:"uppercase",color:bc.cl,
                  background:T.cardBg,padding:"2px 7px",borderRadius:20,border:`1px solid ${bc.bd}`}}>
                  {b.resourcePool==="alignment"?"Alignment":bayKey===1?"Bay 1":bayKey===2?"Bay 2":"Bay 3"}
                </div>
                <div style={{fontSize:15,fontWeight:700,color:T.textPrimary,marginBottom:3,paddingRight:80}}>
                  {b.firstName} {b.lastName}
                </div>
                <div style={{fontSize:12,fontWeight:600,color:bc.cl,textTransform:"uppercase",letterSpacing:"0.04em",marginBottom:4}}>{displaySvc(b)}</div>
                <div style={{fontSize:11,color:T.textMuted,marginBottom:10}}>
                  {b.time} · {effectiveOcc(b)} min
                  {b.minutesRemaining>0&&<span style={{marginLeft:8,color:T.green}}>~{b.minutesRemaining} min left</span>}
                  {b.minutesRemaining<=0&&<span style={{marginLeft:8,color:T.red,fontWeight:600}}>Overdue</span>}
                </div>
                {(isOver||needsChk)&&(
                  <div style={{background:T.redBg,border:`1px solid ${T.redBorder}`,borderRadius:T.r8,
                    padding:"7px 10px",marginBottom:10,fontSize:12,color:T.redText}}>
                    Is {b.firstName} done?
                  </div>
                )}
                <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
                  <Btn small onClick={()=>onComplete(b)} variant="teal"
                    icon={<CheckIcon size={12} color={T.teal}/>}>Done</Btn>
                  {(isOver||needsChk)&&(
                    <Btn small onClick={()=>onSnooze(b._id)} variant="amber"
                      icon={<ClockIcon size={12} color={T.amber}/>}>+10 min</Btn>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {data?.upcoming?.length>0&&(
        <div style={{marginTop:12,padding:"10px 14px",background:T.cardBg,border:`1px solid ${T.border}`,borderRadius:T.r10}}>
          <div style={{fontSize:10,fontWeight:700,letterSpacing:"0.07em",textTransform:"uppercase",color:T.textMuted,marginBottom:8}}>Up Next</div>
          <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
            {data.upcoming.slice(0,3).map(b=>(
              <div key={b._id} style={{fontSize:12,color:T.textSecond,display:"flex",alignItems:"center",gap:6}}>
                <span style={{fontWeight:700,color:T.textPrimary}}>{b.time}</span>
                {b.firstName} {b.lastName}<Badge status={b.status}/>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Appointment Card ──────────────────────────────────────────────────────────
function ApptCard({ booking, onUpdate, onDelete, onEdit, onSMS, onNote, onComplete, visitCount, isCompleted=false }) {
  const [reschedule,setReschedule] = useState(false);
  const [newTime,setNewTime]       = useState("");
  const [hov,setHov]               = useState(false);
  const [busy,setBusy]             = useState(false);
  const s = sm(booking.status);
  const svcLabel = displaySvc(booking);
  const occ = effectiveOcc(booking);

  const act = async(updates)=>{ setBusy(true); try{await onUpdate(booking._id,updates);}finally{setBusy(false);} };

  const poolBadge = booking.resourcePool==="alignment"
    ? <span style={{fontSize:10,fontWeight:600,padding:"1px 6px",borderRadius:20,background:T.purpleBg,color:T.purpleText,border:`1px solid ${T.purpleBorder}`,whiteSpace:"nowrap"}}>Alignment lane</span>
    : booking.resourcePool==="bay"
    ? <span style={{fontSize:10,fontWeight:600,padding:"1px 6px",borderRadius:20,background:T.blueSubtle,color:T.blueBright,border:`1px solid rgba(37,99,235,.3)`,whiteSpace:"nowrap"}}>Bay</span>
    : null;

  return (
    <div onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{background:hov?T.cardBgHov:T.cardBg,borderLeft:`4px solid ${s.accent}`,
        border:`1px solid ${hov?T.borderVis:T.border}`,borderRadius:T.r12,
        boxShadow:T.shadow,overflow:"hidden",transition:"background .14s,border-color .14s",opacity:busy?0.7:1}}>

      <div style={{padding:"16px 18px",display:"flex",flexWrap:"wrap",alignItems:"center",gap:13}}>
        {/* Time block */}
        <div style={{flexShrink:0,minWidth:68,padding:"9px 11px",background:T.elevated,border:`1px solid ${T.border}`,borderRadius:T.r10,textAlign:"center"}}>
          <div style={{fontSize:15,fontWeight:800,color:T.textPrimary,letterSpacing:"-0.02em",lineHeight:1,marginBottom:3,fontVariantNumeric:"tabular-nums"}}>{booking.time}</div>
          <div style={{fontSize:10,fontWeight:500,color:T.textMuted}}>{occ} min</div>
        </div>

        {/* Tire SVG icon — no emoji */}
        <div style={{flexShrink:0,width:42,height:42,background:`${s.color}13`,border:`1px solid ${s.border}`,borderRadius:T.r10,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <TireIcon size={20} color={s.color}/>
        </div>

        {/* Info */}
        <div style={{flex:1,minWidth:150}}>
          <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:3,flexWrap:"wrap"}}>
            <div style={{fontSize:14,fontWeight:700,color:T.textPrimary}}>{booking.firstName} {booking.lastName}</div>
            {visitCount>=2&&<span style={{fontSize:10,fontWeight:700,padding:"1px 6px",borderRadius:20,background:T.orangeBg,color:T.orange,border:`1px solid ${T.orangeBorder}`}}>★{visitCount}x</span>}
            {booking.reminderStatus==="sent"&&<span style={{fontSize:10,fontWeight:600,padding:"1px 6px",borderRadius:20,background:T.greenBg,color:T.green,border:`1px solid ${T.greenBorder}`}}>Reminder sent</span>}
            {booking.reminderStatus==="failed"&&<span style={{fontSize:10,fontWeight:600,padding:"1px 6px",borderRadius:20,background:T.redBg,color:T.red,border:`1px solid ${T.redBorder}`}}>Reminder failed</span>}
          </div>
          <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:3,flexWrap:"wrap"}}>
            <div style={{fontSize:12,fontWeight:700,color:s.color,letterSpacing:"0.03em",textTransform:"uppercase"}}>{svcLabel}</div>
            {poolBadge}
          </div>
          <div style={{fontSize:11,color:T.textMuted}}>
            {booking.phone}<span style={{marginLeft:9}}>{booking.date}</span>
            {booking.tireSize&&<span style={{marginLeft:9,color:T.orange,fontWeight:600}}>{booking.tireSize}</span>}
            {booking.doesntKnowTireSize&&!booking.tireSize&&<span style={{marginLeft:9,color:T.amberText,fontSize:10}}>Doesn't know size</span>}
          </div>
          {booking.notes&&(
            <div style={{fontSize:11,color:T.orange,fontStyle:"italic",marginTop:4,display:"flex",alignItems:"flex-start",gap:5}}>
              <NoteIcon size={11} color={T.orange} style={{marginTop:1,flexShrink:0}}/>
              {booking.notes}
            </div>
          )}
        </div>

        <Badge status={booking.status}/>

        {/* Actions */}
        <div style={{display:"flex",gap:4,alignItems:"center",flexShrink:0,flexWrap:"wrap"}}>
          {!isCompleted&&booking.status!=="confirmed"&&booking.status!=="completed"&&(
            <IBtn onClick={()=>act({status:"confirmed"})} title="Confirm (sends SMS)" v="accept" disabled={busy}><CheckIcon size={17}/></IBtn>
          )}
          {!isCompleted&&(booking.status==="confirmed"||booking.status==="pending")&&(
            <IBtn onClick={()=>onComplete(booking)} title="Mark as Completed" v="complete" disabled={busy}><FlagIcon size={17}/></IBtn>
          )}
          {!isCompleted&&booking.status!=="cancelled"&&booking.status!=="completed"&&(
            <IBtn onClick={()=>act({status:"cancelled"})} title="Decline (sends SMS)" v="decline" disabled={busy}><XIcon size={17}/></IBtn>
          )}
          <div style={{width:1,height:24,background:T.border,margin:"0 2px"}}/>
          {!isCompleted&&<IBtn onClick={()=>setReschedule(r=>!r)} title="Reschedule" v="reschedule" disabled={busy}><CalClkIcon size={15}/></IBtn>}
          <IBtn onClick={()=>onSMS(booking)}  title="Send SMS"      v="sms"   disabled={busy}><MsgIcon  size={15}/></IBtn>
          <IBtn onClick={()=>onNote(booking)} title="Add/edit note" v="note"  disabled={busy}><NoteIcon size={15}/></IBtn>
          <IBtn onClick={()=>onEdit(booking)} title="Edit"          v="edit"  disabled={busy}><PenIcon  size={15}/></IBtn>
          <IBtn onClick={()=>onDelete(booking)} title="Delete"      v="trash" disabled={busy}><TrashIcon size={15}/></IBtn>
        </div>
      </div>

      {reschedule&&(
        <div style={{borderTop:`1px solid ${T.border}`,background:T.elevated,padding:"12px 18px",display:"flex",gap:10,alignItems:"flex-end",flexWrap:"wrap"}}>
          <div style={{minWidth:180}}>
            <FLbl>New Time Slot</FLbl>
            <Sel value={newTime} onChange={e=>setNewTime(e.target.value)}
              options={["Select…",...TIME_SLOTS].map(t=>({value:t,label:t}))}
              style={{fontSize:13,padding:"9px 12px"}}/>
          </div>
          <Btn small onClick={async()=>{if(!newTime||newTime==="Select…")return;await act({time:newTime,sendSMS:true});setReschedule(false);setNewTime("");}} disabled={busy} icon={<CheckIcon size={12} color="#fff"/>}>Confirm</Btn>
          <Btn small variant="ghost" onClick={()=>setReschedule(false)} icon={<XIcon size={12}/>}>Cancel</Btn>
        </div>
      )}
    </div>
  );
}

// ── Date group ────────────────────────────────────────────────────────────────
function DateGroup({ date, bookings, onUpdate, onDelete, onEdit, onSMS, onNote, onComplete, allBookings, onPrint }) {
  const phoneCount = {};
  allBookings.forEach(b=>{ phoneCount[b.phone]=(phoneCount[b.phone]||0)+1; });
  return (
    <div style={{marginBottom:24}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:9,padding:"7px 13px",background:T.elevated,borderRadius:T.r8,border:`1px solid ${T.border}`}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <CalIcon size={13} color={T.blue}/>
          <span style={{fontSize:13,fontWeight:700,color:T.textPrimary}}>{fmtDate(date)}</span>
          <span style={{fontSize:10,color:T.textMuted,background:T.cardBg,padding:"1px 7px",borderRadius:20,border:`1px solid ${T.border}`}}>{bookings.length} appt{bookings.length!==1?"s":""}</span>
        </div>
        <button onClick={()=>onPrint(date)}
          style={{display:"flex",alignItems:"center",gap:5,padding:"4px 10px",background:"transparent",border:`1px solid ${T.border}`,borderRadius:T.r6,color:T.textMuted,fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:T.font}}
          onMouseEnter={e=>{e.currentTarget.style.borderColor=T.borderVis;e.currentTarget.style.color=T.textSecond;}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border;e.currentTarget.style.color=T.textMuted;}}>
          <PrintIcon size={12}/>Print
        </button>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:9}}>
        {bookings.map(b=>(
          <ApptCard key={b._id} booking={b}
            onUpdate={onUpdate} onDelete={onDelete} onEdit={onEdit}
            onSMS={onSMS} onNote={onNote} onComplete={onComplete}
            visitCount={phoneCount[b.phone]||1}/>
        ))}
      </div>
    </div>
  );
}

// ── Print ─────────────────────────────────────────────────────────────────────
const printDay = (bookings, date) => {
  const rows = bookings.filter(b=>b.date===date&&b.status!=="cancelled").sort((a,b)=>a.time.localeCompare(b.time));
  const html = `<!DOCTYPE html><html><head><title>Roadstar Tire — ${date}</title>
  <style>body{font-family:Arial,sans-serif;max-width:800px;margin:32px auto;font-size:13px}
  h1{font-size:18px;margin-bottom:4px}.meta{color:#666;font-size:11px;margin-bottom:18px}
  table{width:100%;border-collapse:collapse}th{text-align:left;padding:7px 10px;background:#f0f0f0;font-size:10px;text-transform:uppercase}
  td{padding:8px 10px;border-bottom:1px solid #e5e7eb;vertical-align:top}
  .badge{display:inline-block;padding:1px 7px;border-radius:10px;font-size:9px;font-weight:700;text-transform:uppercase}
  .confirmed{background:#dcfce7;color:#166534}.pending{background:#fef3c7;color:#92400e}
  .completed{background:#ccfbf1;color:#0f766e}.waitlist{background:#ede9fe;color:#4c1d95}
  @media print{body{margin:16px}}</style></head><body>
  <h1>Roadstar Tire — Daily Schedule</h1>
  <div class="meta">Date: ${date} · Printed: ${new Date().toLocaleString()} · ${rows.length} appointments</div>
  <table><tr><th>Time</th><th>Duration</th><th>Customer</th><th>Phone</th><th>Service</th><th>Tire Size</th><th>Status</th><th>Notes</th></tr>
  ${rows.map(b=>`<tr><td><strong>${b.time}</strong></td>
  <td>${effectiveOcc(b)} min</td>
  <td><strong>${b.firstName} ${b.lastName}</strong></td>
  <td>${b.phone}</td><td>${b.service}${b.customService?` — ${b.customService}`:""}</td>
  <td>${b.tireSize||(b.doesntKnowTireSize?"Doesn't know":"—")}</td>
  <td><span class="badge ${b.status}">${b.status}</span></td>
  <td style="color:#666;font-size:11px">${b.notes||""}</td></tr>`).join("")}
  </table></body></html>`;
  const w=window.open("","_blank");w.document.write(html);w.document.close();w.print();
};

// ── Logo ──────────────────────────────────────────────────────────────────────
function Logo() {
  return (
    <div style={{display:"flex",alignItems:"center",gap:11}}>
      <div style={{width:36,height:36,borderRadius:"50%",background:T.cardBg,border:`1.5px solid ${T.borderVis}`,display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden"}}>
        {LOGO_URL ? <img src={LOGO_URL} alt="Logo" style={{width:"100%",height:"100%",objectFit:"cover"}}/> : <TireIcon size={20} color={T.blue}/>}
      </div>
      <div>
        <div style={{fontSize:14,fontWeight:800,letterSpacing:"0.07em",color:T.textPrimary,lineHeight:1,textTransform:"uppercase"}}>Roadstar Tire</div>
        <div style={{fontSize:9.5,fontWeight:500,letterSpacing:"0.1em",color:T.textMuted,textTransform:"uppercase",marginTop:3}}>Admin Dashboard</div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// ROOT DASHBOARD
// ═════════════════════════════════════════════════════════════════════════════
export default function RoadstarDashboard({ onLogout }) {
  const [tab,         setTab]         = useState("queue");
  const [bookings,    setBookings]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [connected,   setConnected]   = useState(false);
  const [filter,      setFilter]      = useState("all");
  const [search,      setSearch]      = useState("");
  const [alerts,      setAlerts]      = useState([]);
  const [mobileMenu,  setMobileMenu]  = useState(false);

  const [editB,        setEditB]       = useState(null);
  const [smsB,         setSmsB]        = useState(null);
  const [noteB,        setNoteB]       = useState(null);
  const [completeB,    setCompleteB]   = useState(null);
  const [deleteB,      setDeleteB]     = useState(null);
  const [showWalkIn,   setShowWalkIn]  = useState(false);
  const [showCustomers,setShowCustomers]=useState(false);
  const [showHeatmap,  setShowHeatmap] = useState(false);

  const prevCount   = useRef(0);
  const audioCtxRef = useRef(null);

  // Audit log
  useEffect(()=>{
    const logs = JSON.parse(localStorage.getItem("roadstar_audit")||"[]");
    logs.push({time:new Date().toLocaleString(),event:"Dashboard opened"});
    if(logs.length>100) logs.splice(0,logs.length-100);
    localStorage.setItem("roadstar_audit",JSON.stringify(logs));
  },[]);

  // Audio unlock for iPad/iPhone Safari
  const unlockAudio = useCallback(()=>{
    if(audioCtxRef.current) return;
    try{ audioCtxRef.current=new(window.AudioContext||window.webkitAudioContext)(); if(audioCtxRef.current.state==="suspended")audioCtxRef.current.resume().catch(()=>{}); }catch(e){}
  },[]);
  useEffect(()=>{
    window.addEventListener("touchstart",unlockAudio,{once:true,passive:true});
    window.addEventListener("click",     unlockAudio,{once:true,passive:true});
    return()=>{ window.removeEventListener("touchstart",unlockAudio); window.removeEventListener("click",unlockAudio); };
  },[unlockAudio]);

  const playSound = useCallback(()=>{
    try{
      const ac=audioCtxRef.current||new(window.AudioContext||window.webkitAudioContext)();
      if(!audioCtxRef.current) audioCtxRef.current=ac;
      const now=ac.currentTime;
      const tone=(f,s,d)=>{ const o=ac.createOscillator(),g=ac.createGain(); o.connect(g);g.connect(ac.destination);o.type="sine";o.frequency.setValueAtTime(f,s);g.gain.setValueAtTime(0,s);g.gain.linearRampToValueAtTime(0.4,s+0.025);g.gain.exponentialRampToValueAtTime(0.001,s+d);o.start(s);o.stop(s+d); };
      tone(800,now,.35);tone(1050,now+.22,.45);
    }catch(e){}
  },[]);

  const pushAlert = useCallback((message,type="info")=>{
    const id=Date.now()+Math.random();
    setAlerts(a=>[...a,{id,message,type}]);
    setTimeout(()=>setAlerts(a=>a.filter(x=>x.id!==id)),6000);
  },[]);
  const dismissAlert = useCallback(id=>setAlerts(a=>a.filter(x=>x.id!==id)),[]);

  const load = useCallback(async(silent=false)=>{
    if(!silent) setLoading(true);
    try{
      const data=await fetchBookings();
      if(silent&&data.length>prevCount.current){
        const n=data[data.length-1];
        const svcLabel=n.service==="Other"&&n.customService?`Other — ${n.customService}`:n.service;
        pushAlert(`New booking: ${n.firstName} ${n.lastName} — ${svcLabel} at ${n.time}`,"new");
        playSound();
      }
      prevCount.current=data.length;
      setBookings(data);setConnected(true);
    }catch(e){ setConnected(false); if(!silent)pushAlert("Could not load bookings","error"); }
    finally{ if(!silent)setLoading(false); }
  },[pushAlert,playSound]);

  useEffect(()=>{ load(); const iv=setInterval(()=>load(true),15000); return()=>clearInterval(iv); },[load]);

  const handleUpdate = async(id,updates)=>{
    try{ const updated=await updateBooking(id,updates); setBookings(b=>b.map(x=>x._id===id?updated:x)); pushAlert(`Updated: ${updated.firstName} ${updated.lastName}`); }
    catch(e){ pushAlert(e.message||"Update failed","error"); }
  };
  const handleDelete = async(id)=>{
    try{ await deleteBooking(id); setBookings(b=>b.filter(x=>x._id!==id)); prevCount.current--; pushAlert("Booking deleted"); setDeleteB(null); }
    catch(e){ pushAlert(e.message||"Delete failed","error"); }
  };
  const handleSaveEdit = async(id,updates)=>{ await handleUpdate(id,updates); setEditB(null); };
  const handleSaveNote = async(id,updates)=>{ await handleUpdate(id,updates); setNoteB(null); };
  const handleSendSMS  = async(booking,msgType)=>{
    try{ await sendSMS(booking._id,msgType); pushAlert(`SMS sent to ${booking.firstName} ${booking.lastName}`); }
    catch(e){ pushAlert(e.message||"SMS failed","error"); }
    setSmsB(null);
  };

  // FIXED complete handler — variant string passed directly to API
  const handleComplete = async(booking, variant)=>{
    try{
      const updated=await updateBooking(booking._id,{
        status:"completed",
        completedSmsVariant: variant,        // "with_review" | "without_review" | "none"
        sendSMS: variant!=="none",
      });
      setBookings(b=>b.map(x=>x._id===booking._id?updated:x));
      const msg=variant==="with_review"?"Marked complete + review SMS sent":variant==="without_review"?"Marked complete + thank-you SMS sent":"Marked complete";
      pushAlert(msg);
    }catch(e){ pushAlert(e.message||"Complete failed","error"); }
    setCompleteB(null);
  };

  const handleBaySnooze = async(id)=>{
    try{
      await fetch(`${API_BASE}/bookings/${id}/bay-snooze`,{method:"PATCH",headers:{"Authorization":`Bearer ${getToken()}`}});
      pushAlert("Check snoozed 10 min");
    }catch(e){}
  };

  // Filter toggle — any re-click clears
  const handleFilterToggle = (key) => setFilter(prev => prev===key ? "all" : key);

  // Derived
  const today           = todayStr();
  const activeBookings  = bookings.filter(b=>!["completed","cancelled"].includes(b.status));
  const completedBookings = bookings.filter(b=>b.status==="completed");

  const searched = search
    ? bookings.filter(b=>{ const q=search.toLowerCase(); return `${b.firstName} ${b.lastName}`.toLowerCase().includes(q)||b.phone.includes(q)||b.service.toLowerCase().includes(q)||b.date.includes(q); })
    : activeBookings;

  const filtered = searched.filter(b=>{
    if(["completed","cancelled"].includes(b.status)) return false;
    if(filter==="today")     return b.date===today;
    if(filter==="confirmed") return b.status==="confirmed";
    if(filter==="pending")   return b.status==="pending";
    if(filter==="waitlist")  return b.status==="waitlist";
    return true;
  });

  const byDate = {};
  [...filtered].sort((a,b)=>`${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`))
    .forEach(b=>{ if(!byDate[b.date]) byDate[b.date]=[]; byDate[b.date].push(b); });

  const counts = {
    active:    activeBookings.filter(b=>b.date===today).length,
    confirmed: bookings.filter(b=>b.status==="confirmed").length,
    pending:   bookings.filter(b=>b.status==="pending").length,
    waitlist:  bookings.filter(b=>b.status==="waitlist").length,
    completed: completedBookings.length,
  };

  // Toolbar items
  const toolbarItems = [
    {label:"Walk-in",    icon:<WalkInIcon size={13} color={T.green}/>,   onClick:()=>{setShowWalkIn(true);setMobileMenu(false);}},
    {label:"Customers",  icon:<UsersIcon  size={13} color={T.textSecond}/>,onClick:()=>{setShowCustomers(true);setMobileMenu(false);}},
    {label:"Heatmap",    icon:<BarIcon    size={13} color={T.textSecond}/>,onClick:()=>{setShowHeatmap(true);setMobileMenu(false);}},
    {label:"Print Today",icon:<PrintIcon  size={13} color={T.textSecond}/>,onClick:()=>{printDay(bookings,today);setMobileMenu(false);}},
    {label:"Refresh",    icon:<RefreshIcon size={13} color={T.textSecond}/>,onClick:()=>{load();setMobileMenu(false);}},
    {label:"Sign Out",   icon:<LogOutIcon size={13} color={T.red}/>,     onClick:onLogout, danger:true},
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        html,body{background:${T.pageBg};color:${T.textPrimary};font-family:${T.font};-webkit-font-smoothing:antialiased}
        ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:${T.border};border-radius:10px}
        @keyframes livePulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.2;transform:scale(2.4)}}
        @keyframes toastIn{from{opacity:0;transform:translateX(14px)}to{opacity:1;transform:translateX(0)}}
        @keyframes shimmer{0%,100%{opacity:.5}50%{opacity:.25}}
        select option{background:${T.panelBg}}::placeholder{color:${T.textMuted}}button{font-family:${T.font}}
        input[type=date]{color-scheme:dark}

        /* iPhone-only hamburger (phones < 640px; iPads 768px+ keep full toolbar) */
        .toolbar-desktop{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
        .hamburger-btn{display:none}
        @media(max-width:639px){
          .toolbar-desktop{display:none}
          .hamburger-btn{display:flex;align-items:center;justify-content:center;
            width:40px;height:40px;background:${T.elevated};border:1px solid ${T.border};
            border-radius:${T.r8};cursor:pointer;color:${T.textSecond}}
        }
      `}</style>

      <Toast alerts={alerts} onDismiss={dismissAlert}/>

      {/* Mobile menu overlay */}
      {mobileMenu&&<div onClick={()=>setMobileMenu(false)} style={{position:"fixed",inset:0,background:"rgba(2,4,12,.7)",zIndex:500,backdropFilter:"blur(4px)"}}/>}
      {mobileMenu&&(
        <div style={{position:"fixed",top:57,right:12,zIndex:600,background:T.panelBg,border:`1px solid ${T.borderVis}`,borderRadius:T.r12,padding:"10px 6px",boxShadow:T.shadowLg,minWidth:180}}>
          {toolbarItems.map(item=>(
            <button key={item.label} onClick={item.onClick}
              style={{display:"flex",alignItems:"center",gap:10,width:"100%",padding:"11px 14px",
                background:"none",border:"none",borderRadius:T.r8,cursor:"pointer",
                color:item.danger?T.red:T.textSecond,fontSize:14,fontWeight:500,
                fontFamily:T.font,textAlign:"left",transition:"background .12s"}}
              onMouseEnter={e=>e.currentTarget.style.background=T.elevated}
              onMouseLeave={e=>e.currentTarget.style.background="none"}>
              {item.icon}{item.label}
            </button>
          ))}
        </div>
      )}

      {/* Modals */}
      {editB       &&<EditModal     booking={editB}    onClose={()=>setEditB(null)}    onSave={handleSaveEdit}/>}
      {smsB        &&<SMSModal      booking={smsB}     onClose={()=>setSmsB(null)}     onSend={handleSendSMS}/>}
      {noteB       &&<NoteModal     booking={noteB}    onClose={()=>setNoteB(null)}    onSave={handleSaveNote}/>}
      {completeB   &&<CompleteModal booking={completeB} onClose={()=>setCompleteB(null)} onComplete={handleComplete}/>}
      {deleteB     &&<DeleteModal   booking={deleteB}  onClose={()=>setDeleteB(null)}  onConfirm={handleDelete}/>}
      {showWalkIn  &&<WalkInModal   onClose={()=>setShowWalkIn(false)}   onSave={()=>load()} bookings={bookings}/>}
      {showCustomers&&<CustomerModal onClose={()=>setShowCustomers(false)}/>}
      {showHeatmap &&<HeatmapModal  bookings={bookings} onClose={()=>setShowHeatmap(false)}/>}

      {/* HEADER */}
      <header style={{background:T.pageBg,borderBottom:`1px solid ${T.border}`,padding:"10px 18px",
        display:"flex",alignItems:"center",justifyContent:"space-between",
        position:"sticky",top:0,zIndex:100,gap:10}}>
        <Logo/>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            <div style={{position:"relative",width:8,height:8}}>
              <div style={{position:"absolute",inset:0,borderRadius:"50%",background:connected?T.green:T.amber,animation:"livePulse 2.2s infinite"}}/>
              <div style={{position:"absolute",inset:0,borderRadius:"50%",background:connected?T.green:T.amber}}/>
            </div>
            <span style={{fontSize:11,fontWeight:600,color:connected?T.green:T.amber,letterSpacing:"0.06em"}}>{connected?"LIVE":"OFFLINE"}</span>
          </div>
          <div style={{width:1,height:14,background:T.border}}/>
          {/* Desktop toolbar */}
          <div className="toolbar-desktop">
            {toolbarItems.map(item=>(
              <Btn key={item.label} small onClick={item.onClick} icon={item.icon} variant="ghost"
                style={item.danger?{color:T.red,borderColor:T.redBorder}:{}}>
                {item.label}
              </Btn>
            ))}
          </div>
          {/* iPhone hamburger */}
          <button className="hamburger-btn" onClick={()=>setMobileMenu(m=>!m)}><MenuIcon size={18}/></button>
        </div>
      </header>

      <main style={{maxWidth:1200,margin:"0 auto",padding:"22px 14px"}}>

        {/* STAT CARDS */}
        <div style={{display:"flex",gap:9,marginBottom:22,flexWrap:"wrap"}}>
          <StatCard icon={<CalIcon size={16}/>}     label="Today (Active)"  value={counts.active}     filterKey="today"     activeFilter={filter} onToggle={handleFilterToggle}/>
          <StatCard icon={<CheckCiIcon size={16}/>} label="Confirmed"       value={counts.confirmed}  filterKey="confirmed" activeFilter={filter} onToggle={handleFilterToggle} statusKey="confirmed"/>
          <StatCard icon={<ClockIcon size={16}/>}   label="Pending"         value={counts.pending}    filterKey="pending"   activeFilter={filter} onToggle={handleFilterToggle} statusKey="pending"/>
          <StatCard icon={<UsersIcon size={16}/>}   label="Waitlist"        value={counts.waitlist}   filterKey="waitlist"  activeFilter={filter} onToggle={handleFilterToggle} statusKey="waitlist"/>
          <StatCard icon={<FlagIcon size={16}/>}    label="Completed"       value={counts.completed}  filterKey="completed" activeFilter={filter}
            onToggle={k=>{handleFilterToggle(k);if(filter!==k)setTab("completed");}}
            accentOverride={T.teal}/>
        </div>

        {/* TABS + SEARCH */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16,flexWrap:"wrap",gap:10}}>
          <div style={{display:"flex",gap:2,background:T.cardBg,border:`1px solid ${T.border}`,borderRadius:T.r10,padding:4}}>
            {[{id:"queue",label:"Live Queue",icon:<CalIcon size={13}/>},{id:"completed",label:"Completed",icon:<FlagIcon size={13}/>}].map(t=>{
              const active=tab===t.id;
              return (
                <button key={t.id} onClick={()=>setTab(t.id)}
                  style={{display:"flex",alignItems:"center",gap:7,padding:"8px 13px",borderRadius:T.r8,border:"none",fontWeight:600,fontSize:13,fontFamily:T.font,cursor:"pointer",transition:"all .13s",background:active?T.elevated:"transparent",color:active?T.textPrimary:T.textMuted}}>
                  <span style={{color:active?T.blue:T.textMuted}}>{t.icon}</span>{t.label}
                  {t.id==="completed"&&counts.completed>0&&<span style={{background:T.tealBg,color:T.teal,border:`1px solid ${T.tealBorder}`,padding:"1px 6px",borderRadius:20,fontSize:10,fontWeight:700}}>{counts.completed}</span>}
                </button>
              );
            })}
          </div>
          <div style={{position:"relative",width:240}}>
            <div style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",color:T.textMuted,pointerEvents:"none"}}><SearchIcon size={14}/></div>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search name, phone, date..."
              style={{width:"100%",background:T.cardBg,border:`1px solid ${T.border}`,borderRadius:T.r8,padding:"8px 12px 8px 32px",color:T.textPrimary,fontSize:13,fontFamily:T.font,outline:"none",boxSizing:"border-box"}}/>
          </div>
        </div>

        {/* Active filter pill */}
        {filter!=="all"&&(
          <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:13}}>
            <span style={{fontSize:12,color:T.textMuted}}>Showing:</span>
            <span style={{background:sm(filter==="today"?"confirmed":filter).bg,color:sm(filter==="today"?"confirmed":filter).text,border:`1px solid ${sm(filter==="today"?"confirmed":filter).border}`,padding:"2px 9px",borderRadius:20,fontWeight:700,fontSize:11,letterSpacing:"0.05em",textTransform:"uppercase"}}>{filter}</span>
            <button onClick={()=>setFilter("all")} style={{background:"none",border:"none",color:T.textMuted,cursor:"pointer",fontSize:12,fontFamily:T.font,padding:0}}>Clear</button>
          </div>
        )}

        {/* QUEUE TAB */}
        {tab==="queue"&&(
          loading
            ? <div style={{display:"flex",flexDirection:"column",gap:9}}>{[1,2,3].map(i=><div key={i} style={{background:T.cardBg,border:`1px solid ${T.border}`,borderRadius:T.r12,height:88,animation:"shimmer 1.6s ease-in-out infinite"}}/>)}</div>
            : Object.keys(byDate).length===0
            ? <div style={{background:T.cardBg,border:`1px solid ${T.border}`,borderRadius:T.r12,padding:"44px 20px",textAlign:"center",color:T.textMuted,fontSize:13}}>
                {search?"No bookings match your search.":"No active appointments in the queue."}
              </div>
            : Object.entries(byDate).map(([date,bkgs])=>(
                <DateGroup key={date} date={date} bookings={bkgs}
                  onUpdate={handleUpdate} onDelete={setDeleteB} onEdit={setEditB}
                  onSMS={setSmsB} onNote={setNoteB} onComplete={setCompleteB}
                  allBookings={bookings} onPrint={d=>printDay(bookings,d)}/>
              ))
        )}

        {/* COMPLETED TAB */}
        {tab==="completed"&&(
          <div>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 13px",background:T.tealBg,border:`1px solid ${T.tealBorder}`,borderRadius:T.r8,marginBottom:11}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <FlagIcon size={13} color={T.teal}/>
                <span style={{fontSize:13,fontWeight:700,color:T.teal}}>Completed — {completedBookings.length}</span>
              </div>
            </div>
            {completedBookings.length===0
              ? <div style={{background:T.cardBg,border:`1px solid ${T.border}`,borderRadius:T.r12,padding:"32px 20px",textAlign:"center",color:T.textMuted,fontSize:13}}>No completed appointments yet.</div>
              : <div style={{display:"flex",flexDirection:"column",gap:9}}>
                  {[...completedBookings].sort((a,b)=>`${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`))
                    .map(b=>(
                      <ApptCard key={b._id} booking={b}
                        onUpdate={handleUpdate} onDelete={setDeleteB} onEdit={setEditB}
                        onSMS={setSmsB} onNote={setNoteB} onComplete={setCompleteB}
                        visitCount={bookings.filter(x=>x.phone===b.phone).length} isCompleted/>
                    ))}
                </div>
            }
          </div>
        )}

        {/* LIVE AT BAY — shown below both tabs, always visible */}
        <div style={{marginTop:32,paddingTop:24,borderTop:`1px solid ${T.border}`}}>
          <LiveAtBay
            onSnooze={handleBaySnooze}
            onComplete={(b)=>setCompleteB(b)}/>
        </div>

      </main>
    </>
  );
}
