// ─────────────────────────────────────────────────────────────────────────────
// Roadstar Tire — Admin Dashboard (live API version)
// Connects to Node/Express backend via ./api.js
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback, useRef } from "react";
import { fetchBookings, updateBooking, deleteBooking, sendSMS } from "./api.js";

// ══ DESIGN TOKENS ════════════════════════════════════════════════════════════
const T = {
  pageBg:      "#080c14",
  cardBg:      "#0f1623",
  cardBgHov:   "#141d2e",
  panelBg:     "#111827",
  elevated:    "#192236",
  border:      "#1f2d45",
  borderVis:   "#2a3d58",
  borderFaint: "#161e2e",
  blue:        "#2563EB",
  blueLight:   "#3B82F6",
  blueBright:  "#60A5FA",
  blueMuted:   "#172554",
  blueSubtle:  "#0f1e3d",
  textPrimary: "#F1F5F9",
  textSecond:  "#94A3B8",
  textMuted:   "#4B5A6E",
  amber:  "#F59E0B", amberBg:  "#1c1200", amberBorder:  "#3d2800", amberText:  "#FCD34D",
  green:  "#22C55E", greenBg:  "#071a0f", greenBorder:  "#14532D", greenText:  "#86EFAC",
  purple: "#8B5CF6", purpleBg: "#130d24", purpleBorder: "#2e1b5e", purpleText: "#C4B5FD",
  red:    "#EF4444", redBg:    "#1a0606", redBorder:    "#450a0a", redText:    "#FCA5A5",
  teal: "#14B8A6", tealBg: "#042f2e", tealBorder: "#0f3d3a", tealText: "#5eead4",
  slateText: "#64748B", slateBg: "#0f1623", slateBorder: "#1f2d45",
  font: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  r8: "8px", r10: "10px", r12: "12px", r16: "16px",
  shadowCard: "0 1px 3px rgba(0,0,0,0.5)",
  shadowLg:   "0 8px 40px rgba(0,0,0,0.65)",
};

const STATUS = {
  pending:   { color: T.amber,     text: T.amberText,  bg: T.amberBg,  border: T.amberBorder,  accent: T.amber,    label: "Pending"   },
  confirmed: { color: T.green,     text: T.greenText,  bg: T.greenBg,  border: T.greenBorder,  accent: T.green,    label: "Confirmed" },
  waitlist:  { color: T.purple,    text: T.purpleText, bg: T.purpleBg, border: T.purpleBorder, accent: T.purple,   label: "Waitlist"  },
  cancelled: { color: T.red,       text: T.redText,    bg: T.redBg,    border: T.redBorder,    accent: T.red,      label: "Cancelled" },
  completed: { color: T.teal,      text: T.tealText,   bg: T.tealBg,   border: T.tealBorder,   accent: T.teal,    label: "Completed" },
};
const sm = (s) => STATUS[s] || STATUS.completed;

const TIME_SLOTS = [
  "9:00 AM","9:40 AM","10:00 AM","10:40 AM","11:00 AM","11:40 AM",
  "12:00 PM","1:00 PM","1:40 PM","2:00 PM","2:40 PM","3:00 PM","3:40 PM","4:00 PM",
];

// ══ ICON SYSTEM ══════════════════════════════════════════════════════════════
const Ic = ({ size=20, color="currentColor", children, style={} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
    style={{ flexShrink:0, display:"block", ...style }}>
    {children}
  </svg>
);
const CalendarIcon    = p => <Ic {...p}><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></Ic>;
const CheckCircleIcon = p => <Ic {...p}><circle cx="12" cy="12" r="9"/><path d="m9 12 2 2 4-4"/></Ic>;
const ClockIcon       = p => <Ic {...p}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></Ic>;
const UsersIcon       = p => <Ic {...p}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></Ic>;
const PlusIcon        = p => <Ic {...p}><path d="M12 5v14M5 12h14"/></Ic>;
const CheckIcon       = p => <Ic {...p}><path d="M20 6 9 17l-5-5"/></Ic>;
const XIcon           = p => <Ic {...p}><path d="M18 6 6 18M6 6l12 12"/></Ic>;
const CalClockIcon    = p => <Ic {...p}><path d="M21 7.5V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3.5"/><path d="M16 2v4M8 2v4M3 10h5"/><circle cx="17.5" cy="17.5" r="4.5"/><path d="M17.5 15v2.5l1.5 1.5"/></Ic>;
const MsgIcon         = p => <Ic {...p}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></Ic>;
const PencilIcon      = p => <Ic {...p}><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></Ic>;
const TrashIcon       = p => <Ic {...p}><path d="M3 6h18M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></Ic>;
const WrenchIcon      = p => <Ic {...p}><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></Ic>;
const CartIcon        = p => <Ic {...p}><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></Ic>;
const BellIcon        = p => <Ic {...p}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></Ic>;
const HistoryIcon     = p => <Ic {...p}><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/></Ic>;
const SearchIcon      = p => <Ic {...p}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></Ic>;
const TireIcon        = p => <Ic {...p}><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3"/></Ic>;
const FlagIcon        = p => <Ic {...p}><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></Ic>;
const RefreshIcon     = p => <Ic {...p}><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M21 4v4h-4"/><path d="M3 20v-4h4"/></Ic>;

// ══ UI PRIMITIVES ════════════════════════════════════════════════════════════
function Badge({ status }) {
  const s = sm(status);
  return (
    <span style={{
      display:"inline-flex", alignItems:"center", gap:5,
      fontSize:11, fontWeight:700, letterSpacing:"0.05em", textTransform:"uppercase",
      padding:"5px 11px", borderRadius:20,
      background:s.bg, color:s.text, border:`1px solid ${s.border}`, whiteSpace:"nowrap",
    }}>
      <span style={{ width:5, height:5, borderRadius:"50%", background:s.color, flexShrink:0, boxShadow:`0 0 5px ${s.color}90` }} />
      {s.label}
    </span>
  );
}

function IconBtn({ onClick, title, children, variant="default", disabled=false }) {
  const [hov, setHov] = useState(false);
  const V = {
    default:    { bg:hov?T.elevated:"transparent",    bd:hov?T.borderVis:T.border,   cl:hov?T.textSecond:T.textMuted },
    accept:     { bg:hov?"#0a2215":T.greenBg,         bd:T.greenBorder,              cl:T.green   },
    decline:    { bg:hov?"#220909":T.redBg,           bd:T.redBorder,               cl:T.red     },
    complete:   { bg:hov?"#042f2e":T.tealBg,          bd:T.tealBorder,              cl:T.teal    },
    reschedule: { bg:hov?T.elevated:"transparent",    bd:hov?T.borderVis:T.border,   cl:hov?T.blueBright:T.textSecond },
    sms:        { bg:hov?T.blueSubtle:"transparent",  bd:hov?T.blueLight:T.border,   cl:hov?T.blueBright:T.textSecond },
    edit:       { bg:hov?T.elevated:"transparent",    bd:hov?T.borderVis:T.border,   cl:hov?T.textSecond:T.textMuted },
    trash:      { bg:hov?T.redBg:"transparent",       bd:hov?T.redBorder:T.border,   cl:hov?T.red:T.textMuted },
  };
  const v = V[variant] || V.default;
  return (
    <button onClick={onClick} title={title} disabled={disabled}
      onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{
        display:"inline-flex", alignItems:"center", justifyContent:"center",
        width:44, height:44, borderRadius:T.r8,
        background:v.bg, border:`1px solid ${v.bd}`, color:v.cl,
        cursor:disabled?"not-allowed":"pointer", flexShrink:0, opacity:disabled?0.4:1,
        transition:"all 0.14s",
      }}>
      {children}
    </button>
  );
}

function TxtBtn({ onClick, children, variant="primary", icon=null, small=false, disabled=false }) {
  const [hov, setHov] = useState(false);
  const S = {
    primary: { bg:hov?T.blueLight:T.blue,      bd:hov?T.blueLight:T.blue, cl:"#fff" },
    ghost:   { bg:hov?T.elevated:"transparent", bd:hov?T.borderVis:T.border, cl:T.textSecond },
    danger:  { bg:hov?"#220909":T.redBg,        bd:T.redBorder,            cl:T.red },
  }[variant];
  return (
    <button onClick={onClick} disabled={disabled}
      onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{
        display:"inline-flex", alignItems:"center", gap:7,
        padding:small?"8px 14px":"11px 20px",
        borderRadius:T.r8, background:S.bg, border:`1px solid ${S.bd}`,
        color:S.cl, fontSize:small?12:14, fontWeight:600, fontFamily:T.font,
        cursor:disabled?"not-allowed":"pointer", whiteSpace:"nowrap", opacity:disabled?0.5:1,
        transition:"all 0.14s",
      }}>
      {icon}{children}
    </button>
  );
}

function FLabel({ children }) {
  return (
    <label style={{
      display:"block", fontSize:11, fontWeight:600, letterSpacing:"0.07em",
      textTransform:"uppercase", color:T.textMuted, marginBottom:6,
    }}>{children}</label>
  );
}

function Inp({ value, onChange, placeholder, style={} }) {
  const [foc, setFoc] = useState(false);
  return (
    <input value={value} onChange={onChange} placeholder={placeholder}
      onFocus={()=>setFoc(true)} onBlur={()=>setFoc(false)}
      style={{
        width:"100%", background:T.pageBg, border:`1.5px solid ${foc?T.blue:T.border}`,
        borderRadius:T.r8, padding:"11px 14px", color:T.textPrimary,
        fontSize:14, fontFamily:T.font, outline:"none", boxSizing:"border-box",
        transition:"border-color 0.15s", ...style,
      }} />
  );
}

function Sel({ value, onChange, options, style={} }) {
  const [foc, setFoc] = useState(false);
  return (
    <select value={value} onChange={onChange}
      onFocus={()=>setFoc(true)} onBlur={()=>setFoc(false)}
      style={{
        width:"100%", background:T.pageBg, border:`1.5px solid ${foc?T.blue:T.border}`,
        borderRadius:T.r8, padding:"11px 14px", color:T.textPrimary,
        fontSize:14, fontFamily:T.font, outline:"none", boxSizing:"border-box",
        cursor:"pointer", transition:"border-color 0.15s", ...style,
      }}>
      {options.map(o=><option key={o.value??o} value={o.value??o} style={{background:T.panelBg}}>{o.label??o}</option>)}
    </select>
  );
}

// ══ STAT CARD ════════════════════════════════════════════════════════════════
function StatCard({ icon, label, value, filterKey, activeFilter, onToggle, statusKey }) {
  const isActive = activeFilter === filterKey;
  const [hov, setHov] = useState(false);
  const s = statusKey ? sm(statusKey) : null;
  const ac = s ? s.color : T.blue;
  const acBg = s ? s.bg : T.blueSubtle;
  const acBd = s ? s.border : T.blue;
  const acTx = s ? s.text : T.blueBright;
  return (
    <button onClick={()=>onToggle(filterKey)}
      onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{
        flex:"1 1 0", minWidth:130, textAlign:"left", cursor:"pointer", outline:"none",
        background: isActive ? acBg : hov ? T.cardBgHov : T.cardBg,
        border:`1.5px solid ${isActive?acBd:hov?T.borderVis:T.border}`,
        borderLeft:`4px solid ${isActive?ac:hov?T.borderVis:T.border}`,
        borderRadius:T.r12, padding:"22px 22px 20px",
        boxShadow:T.shadowCard, transition:"all 0.16s", position:"relative",
      }}>
      <div style={{ width:40, height:40, borderRadius:T.r8, marginBottom:18,
        background:isActive?`${ac}18`:T.elevated,
        display:"flex", alignItems:"center", justifyContent:"center",
        color:isActive?ac:T.textMuted, transition:"all 0.16s" }}>
        {icon}
      </div>
      <div style={{ fontSize:36, fontWeight:800, lineHeight:1, color:T.textPrimary,
        marginBottom:6, letterSpacing:"-0.03em", fontVariantNumeric:"tabular-nums" }}>
        {value}
      </div>
      <div style={{ fontSize:12, fontWeight:500, color:isActive?acTx:T.textMuted, transition:"color 0.16s" }}>
        {label}
      </div>
      {isActive && (
        <div style={{ position:"absolute", top:14, right:14, fontSize:9, fontWeight:700,
          letterSpacing:"0.08em", textTransform:"uppercase", color:acTx,
          background:acBg, border:`1px solid ${acBd}`, padding:"2px 7px", borderRadius:20 }}>
          Active
        </div>
      )}
    </button>
  );
}

// ══ ALERT TOAST ══════════════════════════════════════════════════════════════
function AlertToast({ alerts, onDismiss }) {
  if (!alerts.length) return null;
  return (
    <div style={{ position:"fixed", top:70, right:16, zIndex:9999,
      display:"flex", flexDirection:"column", gap:8, maxWidth:330 }}>
      {alerts.map(a => (
        <div key={a.id} style={{
          background:T.panelBg, border:`1px solid ${T.borderVis}`,
          borderLeft:`3px solid ${a.type==="error"?T.red:T.blue}`,
          borderRadius:T.r10, padding:"13px 14px",
          display:"flex", alignItems:"flex-start", gap:11,
          boxShadow:"0 4px 20px rgba(0,0,0,0.55)", animation:"toastIn 0.22s ease",
        }}>
          <div style={{ width:30, height:30, borderRadius:T.r8,
            background:a.type==="error"?T.redBg:T.blueMuted,
            display:"flex", alignItems:"center", justifyContent:"center",
            color:a.type==="error"?T.red:T.blueBright, flexShrink:0 }}>
            {a.type==="error" ? <XIcon size={15}/> : <BellIcon size={15}/>}
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:10, fontWeight:700, letterSpacing:"0.07em",
              textTransform:"uppercase", marginBottom:3,
              color:a.type==="error"?T.red:T.blueBright }}>
              {a.type==="error" ? "Error" : "Update"}
            </div>
            <div style={{ fontSize:13, color:T.textSecond, lineHeight:1.5 }}>{a.message}</div>
          </div>
          <button onClick={()=>onDismiss(a.id)} style={{
            background:"none", border:"none", color:T.textMuted,
            cursor:"pointer", padding:2, display:"flex", alignItems:"center" }}>
            <XIcon size={14}/>
          </button>
        </div>
      ))}
    </div>
  );
}

// ══ OVERLAY + MODAL ══════════════════════════════════════════════════════════
function Overlay({ children, onClose }) {
  return (
    <div onClick={e=>{if(e.target===e.currentTarget)onClose();}}
      style={{ position:"fixed", inset:0, background:"rgba(2,5,12,0.82)", zIndex:1000,
        display:"flex", alignItems:"center", justifyContent:"center", padding:20,
        backdropFilter:"blur(4px)" }}>
      <div style={{ background:T.panelBg, border:`1px solid ${T.borderVis}`, borderRadius:T.r16,
        padding:30, maxWidth:500, width:"100%", boxShadow:"0 8px 40px rgba(0,0,0,0.65)",
        maxHeight:"90vh", overflowY:"auto", position:"relative" }}>
        <button onClick={onClose} style={{ position:"absolute", top:16, right:16,
          background:T.elevated, border:`1px solid ${T.border}`, borderRadius:T.r8,
          width:32, height:32, display:"flex", alignItems:"center", justifyContent:"center",
          color:T.textMuted, cursor:"pointer" }}>
          <XIcon size={14}/>
        </button>
        {children}
      </div>
    </div>
  );
}

function EditModal({ booking, onClose, onSave }) {
  const [form, setForm] = useState({
    status: booking.status,
    notes:  booking.notes || "",
    date:   booking.date,
    time:   booking.time,
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const handleSave = async () => {
    setSaving(true); setErr("");
    try {
      const updated = await updateBooking(booking._id, form);
      onSave(updated);
    } catch(e) {
      setErr(e.message || "Could not save changes.");
    } finally { setSaving(false); }
  };

  return (
    <Overlay onClose={onClose}>
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:4 }}>
        <div style={{ width:40, height:40, borderRadius:T.r8, background:T.blueMuted,
          display:"flex", alignItems:"center", justifyContent:"center", color:T.blueBright }}>
          <PencilIcon size={18}/>
        </div>
        <div>
          <div style={{ fontSize:16, fontWeight:700, color:T.textPrimary }}>Edit Appointment</div>
          <div style={{ fontSize:12, color:T.textMuted }}>{booking.firstName} {booking.lastName}</div>
        </div>
      </div>
      <div style={{ height:1, background:T.border, margin:"18px 0" }}/>

      {err && (
        <div style={{ background:T.redBg, border:`1px solid ${T.redBorder}`, borderRadius:T.r8,
          padding:"10px 14px", fontSize:13, color:T.redText, marginBottom:14 }}>
          {err}
        </div>
      )}

      <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
        <div>
          <FLabel>Status</FLabel>
          <Sel value={form.status} onChange={e=>set("status",e.target.value)}
            options={["pending","confirmed","waitlist","cancelled"].map(v=>({value:v,label:v.charAt(0).toUpperCase()+v.slice(1)}))} />
        </div>
        <div>
          <FLabel>Date (YYYY-MM-DD)</FLabel>
          <Inp value={form.date} onChange={e=>set("date",e.target.value)} placeholder="2026-03-19"/>
        </div>
        <div>
          <FLabel>Time Slot</FLabel>
          <Sel value={form.time} onChange={e=>set("time",e.target.value)}
            options={TIME_SLOTS.map(t=>({value:t,label:t}))} />
        </div>
        <div>
          <FLabel>Admin Notes</FLabel>
          <Inp value={form.notes} onChange={e=>set("notes",e.target.value)} placeholder="Internal notes..."/>
        </div>
      </div>

      <div style={{ display:"flex", gap:10, marginTop:24 }}>
        <TxtBtn onClick={handleSave} disabled={saving} icon={<CheckIcon size={15} color="#fff"/>}>
          {saving ? "Saving..." : "Save Changes"}
        </TxtBtn>
        <TxtBtn onClick={onClose} variant="ghost">Cancel</TxtBtn>
      </div>
    </Overlay>
  );
}

// ══ SMS MODAL ═════════════════════════════════════════════════════════════════
function SMSModal({ booking, onClose, onSend }) {
  const [msgType, setMsgType] = useState("confirmed");
  const [sending, setSending] = useState(false);

  const MSG_TYPES = [
    { key: "confirmed", label: "Confirmed",  desc: `Appointment confirmed for ${booking.date} at ${booking.time}` },
    { key: "reminder",  label: "Reminder",   desc: `Reminder for today at ${booking.time}` },
    { key: "declined",  label: "Declined",   desc: `Appointment at ${booking.time} cancelled` },
    { key: "waitlist",  label: "Waitlist",   desc: `A spot just opened up` },
  ];

  const handleSend = async () => {
    setSending(true);
    await onSend(booking, msgType);
    setSending(false);
  };

  return (
    <div onClick={e=>{if(e.target===e.currentTarget)onClose();}}
      style={{ position:"fixed",inset:0,background:"rgba(2,5,12,0.82)",zIndex:1000,
        display:"flex",alignItems:"center",justifyContent:"center",padding:20,backdropFilter:"blur(4px)" }}>
      <div style={{ background:T.panelBg,border:`1px solid ${T.borderVis}`,borderRadius:T.r16,
        padding:28,maxWidth:460,width:"100%",boxShadow:"0 8px 40px rgba(0,0,0,0.65)",position:"relative" }}>

        {/* Close */}
        <button onClick={onClose} style={{ position:"absolute",top:14,right:14,
          background:T.elevated,border:`1px solid ${T.border}`,borderRadius:T.r8,
          width:30,height:30,display:"flex",alignItems:"center",justifyContent:"center",
          color:T.textMuted,cursor:"pointer" }}>
          <XIcon size={14}/>
        </button>

        {/* Header */}
        <div style={{ display:"flex",alignItems:"center",gap:12,marginBottom:18 }}>
          <div style={{ width:40,height:40,borderRadius:T.r8,background:T.blueMuted,
            display:"flex",alignItems:"center",justifyContent:"center",color:T.blueBright }}>
            <MsgIcon size={18}/>
          </div>
          <div>
            <div style={{ fontSize:16,fontWeight:700,color:T.textPrimary }}>Send SMS via Twilio</div>
            <div style={{ fontSize:12,color:T.textMuted }}>{booking.firstName} {booking.lastName} · {booking.phone}</div>
          </div>
        </div>

        <div style={{ height:1,background:T.border,marginBottom:18 }}/>

        {/* Message type selector */}
        <div style={{ fontSize:11,fontWeight:600,letterSpacing:"0.07em",textTransform:"uppercase",
          color:T.textMuted,marginBottom:10 }}>Message Type</div>

        <div style={{ display:"flex",flexDirection:"column",gap:8,marginBottom:22 }}>
          {MSG_TYPES.map(({ key, label, desc }) => {
            const active = msgType === key;
            return (
              <button key={key} onClick={()=>setMsgType(key)} style={{
                display:"flex",alignItems:"center",gap:12,
                padding:"12px 14px",borderRadius:T.r10,cursor:"pointer",textAlign:"left",
                background: active ? T.blueSubtle : T.elevated,
                border:`1.5px solid ${active ? T.blue : T.border}`,
                transition:"all 0.13s",
              }}>
                <div style={{ width:16,height:16,borderRadius:"50%",flexShrink:0,
                  border:`2px solid ${active ? T.blue : T.textMuted}`,
                  background: active ? T.blue : "transparent",
                  display:"flex",alignItems:"center",justifyContent:"center" }}>
                  {active && <div style={{ width:6,height:6,borderRadius:"50%",background:"#fff" }}/>}
                </div>
                <div>
                  <div style={{ fontSize:13,fontWeight:600,color:active?T.textPrimary:T.textSecond }}>{label}</div>
                  <div style={{ fontSize:11,color:T.textMuted,marginTop:1 }}>{desc}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Send button */}
        <button onClick={handleSend} disabled={sending} style={{
          width:"100%",padding:"12px",borderRadius:T.r8,
          background:sending?T.blueMuted:T.blue,border:"none",
          color:"#fff",fontSize:14,fontWeight:600,fontFamily:T.font,
          cursor:sending?"not-allowed":"pointer",
          display:"flex",alignItems:"center",justifyContent:"center",gap:8,
          transition:"background 0.14s",
        }}>
          <MsgIcon size={15} color="#fff"/>
          {sending ? "Sending..." : "Send SMS"}
        </button>
      </div>
    </div>
  );
}


// ══ APPOINTMENT CARD ══════════════════════════════════════════════════════════
function AppointmentCard({ booking, onUpdate, onDelete, onEdit, onSMS }) {
  const [rescheduling, setRescheduling] = useState(false);
  const [newTime, setNewTime] = useState("");
  const [hov, setHov] = useState(false);
  const [busy, setBusy] = useState(false);
  const s = sm(booking.status);

  const SvcIcon = ({ sz=20 }) => {
    if (booking.service?.includes("Installation")) return <WrenchIcon size={sz} color={s.color}/>;
    if (booking.service?.includes("Purchase"))     return <CartIcon   size={sz} color={s.color}/>;
    return <TireIcon size={sz} color={s.color}/>;
  };

  const act = async (updates) => {
    setBusy(true);
    try { await onUpdate(booking._id, updates); }
    finally { setBusy(false); }
  };

  const handleReschedule = async () => {
    if (!newTime || newTime === "Select a slot...") return;
    await act({ time: newTime });
    setRescheduling(false); setNewTime("");
  };

  return (
    <div onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{
        background:hov?T.cardBgHov:T.cardBg,
        borderLeft:`4px solid ${s.accent}`,
        border:`1px solid ${hov?T.borderVis:T.border}`,
        borderRadius:T.r12, boxShadow:T.shadowCard, overflow:"hidden",
        transition:"background 0.15s, border-color 0.15s", opacity:busy?0.7:1,
      }}>
      <div style={{ padding:"20px 22px", display:"flex", flexWrap:"wrap", alignItems:"center", gap:18 }}>

        {/* Time block */}
        <div style={{ flexShrink:0, minWidth:78, padding:"11px 14px",
          background:T.elevated, border:`1px solid ${T.border}`,
          borderRadius:T.r10, textAlign:"center" }}>
          <div style={{ fontSize:17, fontWeight:800, color:T.textPrimary,
            letterSpacing:"-0.02em", lineHeight:1, marginBottom:4,
            fontVariantNumeric:"tabular-nums" }}>{booking.time}</div>
          <div style={{ fontSize:10, fontWeight:500, color:T.textMuted }}>{booking.duration} min</div>
        </div>

        {/* Service icon */}
        <div style={{ flexShrink:0, width:46, height:46,
          background:`${s.color}14`, border:`1px solid ${s.border}`,
          borderRadius:T.r10, display:"flex", alignItems:"center", justifyContent:"center" }}>
          <SvcIcon sz={21}/>
        </div>

        {/* Customer info */}
        <div style={{ flex:1, minWidth:200 }}>
          <div style={{ fontSize:16, fontWeight:700, color:T.textPrimary, marginBottom:4, lineHeight:1.2 }}>
            {booking.firstName} {booking.lastName}
          </div>
          <div style={{ fontSize:13, fontWeight:700, color:s.color,
            letterSpacing:"0.04em", textTransform:"uppercase", marginBottom:4 }}>
            {booking.service}
          </div>
          <div style={{ fontSize:12, color:T.textMuted, marginBottom:booking.notes?5:0 }}>
            {booking.phone}
            {booking.date && <span style={{ marginLeft:10, color:T.textMuted }}>{booking.date}</span>}
          </div>
          {booking.notes && (
            <div style={{ fontSize:12, color:T.textMuted, fontStyle:"italic",
              paddingLeft:9, borderLeft:`2px solid ${T.border}`, marginTop:2 }}>
              {booking.notes}
            </div>
          )}
          {booking.customService && (
            <div style={{ fontSize:12, color:T.textSecond, marginTop:3 }}>
              Custom: {booking.customService}
            </div>
          )}
        </div>

        {/* Badge */}
        <div style={{ flexShrink:0 }}><Badge status={booking.status}/></div>

        {/* Actions */}
        <div style={{ display:"flex", gap:6, alignItems:"center", flexShrink:0 }}>
          {booking.status !== "confirmed" && booking.status !== "completed" && (
            <IconBtn onClick={()=>act({ status:"confirmed" })} title="Accept & confirm" variant="accept" disabled={busy}>
              <CheckIcon size={18}/>
            </IconBtn>
          )}
          {/* Mark as Completed — teal flag */}
          {(booking.status === "confirmed" || booking.status === "pending") && (
            <IconBtn onClick={()=>act({ status:"completed" })} title="Mark as Completed" variant="complete" disabled={busy}>
              <FlagIcon size={18}/>
            </IconBtn>
          )}
          {booking.status !== "cancelled" && (
            <IconBtn onClick={()=>act({ status:"cancelled" })} title="Decline" variant="decline" disabled={busy}>
              <XIcon size={18}/>
            </IconBtn>
          )}
          <div style={{ width:1, height:28, background:T.border, margin:"0 2px" }}/>
          <IconBtn onClick={()=>setRescheduling(r=>!r)} title="Reschedule" variant="reschedule" disabled={busy}>
            <CalClockIcon size={17}/>
          </IconBtn>
          <IconBtn onClick={()=>onSMS(booking)} title="Send SMS" variant="sms" disabled={busy}>
            <MsgIcon size={17}/>
          </IconBtn>
          <IconBtn onClick={()=>onEdit(booking)} title="Edit" variant="edit" disabled={busy}>
            <PencilIcon size={17}/>
          </IconBtn>
          <IconBtn onClick={()=>onDelete(booking._id)} title="Delete" variant="trash" disabled={busy}>
            <TrashIcon size={17}/>
          </IconBtn>
        </div>
      </div>

      {/* Reschedule panel */}
      {rescheduling && (
        <div style={{ borderTop:`1px solid ${T.border}`, background:T.elevated,
          padding:"14px 22px", display:"flex", gap:10, alignItems:"flex-end", flexWrap:"wrap" }}>
          <div style={{ minWidth:190 }}>
            <FLabel>New Time Slot</FLabel>
            <Sel value={newTime} onChange={e=>setNewTime(e.target.value)}
              options={["Select a slot...", ...TIME_SLOTS].map(t=>({value:t,label:t}))}
              style={{ fontSize:13, padding:"9px 12px" }}/>
          </div>
          <TxtBtn small onClick={handleReschedule} disabled={busy} icon={<CheckIcon size={13} color="#fff"/>}>
            Confirm Slot
          </TxtBtn>
          <TxtBtn small variant="ghost" onClick={()=>setRescheduling(false)} icon={<XIcon size={13}/>}>
            Cancel
          </TxtBtn>
        </div>
      )}
    </div>
  );
}

// ══ LOADING SKELETON ═════════════════════════════════════════════════════════
function Skeleton() {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
      {[1,2,3].map(i => (
        <div key={i} style={{ background:T.cardBg, border:`1px solid ${T.border}`,
          borderRadius:T.r12, padding:"20px 22px", height:90,
          animation:"shimmer 1.6s ease-in-out infinite" }}>
        </div>
      ))}
    </div>
  );
}

// ══ LOGO + LIVE PULSE ════════════════════════════════════════════════════════
function Logo() {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:12 }}>
      <div style={{ width:40, height:40, borderRadius:"50%", background:T.cardBg,
        border:`1.5px solid ${T.borderVis}`, display:"flex", alignItems:"center", justifyContent:"center" }}>
        <TireIcon size={22} color={T.blue}/>
      </div>
      <div>
        <div style={{ fontSize:15, fontWeight:800, letterSpacing:"0.07em",
          color:T.textPrimary, lineHeight:1, textTransform:"uppercase" }}>Roadstar Tire</div>
        <div style={{ fontSize:10, fontWeight:500, letterSpacing:"0.1em",
          color:T.textMuted, textTransform:"uppercase", marginTop:3 }}>Admin Dashboard</div>
      </div>
    </div>
  );
}

function LivePulse({ connected }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:7 }}>
      <div style={{ position:"relative", width:8, height:8 }}>
        <div style={{ position:"absolute", inset:0, borderRadius:"50%",
          background:connected?T.green:T.amber, animation:"livePulse 2.2s ease-in-out infinite" }}/>
        <div style={{ position:"absolute", inset:0, borderRadius:"50%", background:connected?T.green:T.amber }}/>
      </div>
      <span style={{ fontSize:11, fontWeight:600, color:connected?T.green:T.amber, letterSpacing:"0.07em" }}>
        {connected ? "API LIVE" : "CONNECTING..."}
      </span>
    </div>
  );
}

function TabBtn({ active, onClick, icon, children }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{
        display:"flex", alignItems:"center", gap:8, padding:"10px 18px",
        borderRadius:T.r8, border:"none",
        background:active?T.elevated:hov?T.cardBgHov:"transparent",
        color:active?T.textPrimary:T.textMuted, fontWeight:600, fontSize:13,
        fontFamily:T.font, cursor:"pointer", transition:"all 0.15s",
      }}>
      <span style={{ color:active?T.blue:hov?T.textSecond:T.textMuted }}>{icon}</span>
      {children}
    </button>
  );
}

// ══ ROOT DASHBOARD ════════════════════════════════════════════════════════════
export default function RoadstarDashboard() {
  const [activeTab,    setActiveTab]    = useState("queue");
  const [bookings,     setBookings]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [apiConnected, setApiConnected] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");
  const [search,       setSearch]       = useState("");
  const [alerts,       setAlerts]       = useState([]);
  const [editBooking,  setEditBooking]  = useState(null);
  const [smsBooking,   setSmsBooking]   = useState(null);
  const prevCountRef = useRef(0);

  // ── Push alert helper ─────────────────────────────────────────────────────
  const pushAlert = useCallback((message, type="info") => {
    const id = Date.now();
    setAlerts(a => [...a, { id, message, type }]);
    setTimeout(() => setAlerts(a => a.filter(x => x.id !== id)), 5000);
  }, []);

  const dismissAlert = useCallback(id => setAlerts(a => a.filter(x => x.id !== id)), []);

  // ── Load bookings from API ─────────────────────────────────────────────────
  const loadBookings = useCallback(async (silent=false) => {
    if (!silent) setLoading(true);
    try {
      const data = await fetchBookings();
      // Alert on new booking (polling)
      if (silent && data.length > prevCountRef.current) {
        const newest = data[data.length - 1];
        pushAlert(`New booking: ${newest.firstName} ${newest.lastName} — ${newest.service} at ${newest.time}`);
      }
      prevCountRef.current = data.length;
      setBookings(data);
      setApiConnected(true);
    } catch(e) {
      setApiConnected(false);
      if (!silent) pushAlert("Could not connect to API. Is the server running?", "error");
    } finally {
      if (!silent) setLoading(false);
    }
  }, [pushAlert]);

  // Initial load + polling every 30s
  useEffect(() => {
    loadBookings();
    const interval = setInterval(() => loadBookings(true), 30_000);
    return () => clearInterval(interval);
  }, [loadBookings]);

  // ── CRUD handlers ──────────────────────────────────────────────────────────
  const handleUpdate = async (id, updates) => {
    try {
      const updated = await updateBooking(id, updates);
      setBookings(b => b.map(x => x._id === id ? updated : x));
      pushAlert(`Booking updated: ${updated.firstName} ${updated.lastName}`);
    } catch(e) {
      pushAlert(e.message || "Update failed.", "error");
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteBooking(id);
      setBookings(b => b.filter(x => x._id !== id));
      prevCountRef.current -= 1;
      pushAlert("Booking deleted.");
    } catch(e) {
      pushAlert(e.message || "Delete failed.", "error");
    }
  };

  const handleSaveEdit = (updated) => {
    setBookings(b => b.map(x => x._id === updated._id ? updated : x));
    setEditBooking(null);
    pushAlert(`Saved: ${updated.firstName} ${updated.lastName}`);
  };

  const handleSMS = (booking) => {
    setSmsBooking(booking);
  };

  const handleSendSMS = async (booking, messageType) => {
    try {
      await sendSMS(booking._id, messageType);
      pushAlert(`SMS sent to ${booking.firstName} ${booking.lastName} (${booking.phone})`);
    } catch(e) {
      pushAlert(e.message || "SMS failed. Check Twilio config on Render.", "error");
    }
    setSmsBooking(null);
  };

  // ── Filter + search ────────────────────────────────────────────────────────
  const today = new Date().toISOString().slice(0,10);

  const filtered = bookings.filter(b => {
    if (activeFilter === "today"     && b.date   !== today) return false;
    if (activeFilter === "confirmed" && b.status !== "confirmed") return false;
    if (activeFilter === "pending"   && b.status !== "pending")   return false;
    if (activeFilter === "waitlist"  && b.status !== "waitlist")  return false;
    if (search) {
      const q = search.toLowerCase();
      const name = `${b.firstName} ${b.lastName}`.toLowerCase();
      if (!name.includes(q) && !b.phone.includes(q) && !b.service.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const counts = {
    today:     bookings.filter(b=>b.date===today).length,
    confirmed: bookings.filter(b=>b.status==="confirmed").length,
    pending:   bookings.filter(b=>b.status==="pending").length,
    waitlist:  bookings.filter(b=>b.status==="waitlist").length,
  };

  const handleFilterToggle = key => setActiveFilter(p => p===key ? "all" : key);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        html,body{background:${T.pageBg};color:${T.textPrimary};font-family:${T.font};-webkit-font-smoothing:antialiased;}
        ::-webkit-scrollbar{width:5px;height:5px}::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:${T.border};border-radius:10px}
        @keyframes livePulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.25;transform:scale(2.2)}}
        @keyframes toastIn{from{opacity:0;transform:translateX(14px)}to{opacity:1;transform:translateX(0)}}
        @keyframes shimmer{0%,100%{opacity:.6}50%{opacity:.3}}
        select option{background:${T.panelBg}} ::placeholder{color:${T.textMuted}} button{font-family:${T.font}}
      `}</style>

      <AlertToast alerts={alerts} onDismiss={dismissAlert}/>
      {editBooking && <EditModal booking={editBooking} onClose={()=>setEditBooking(null)} onSave={handleSaveEdit}/>}
      {smsBooking  && <SMSModal  booking={smsBooking}  onClose={()=>setSmsBooking(null)}  onSend={handleSendSMS}/>}

      {/* HEADER */}
      <header style={{ background:T.pageBg, borderBottom:`1px solid ${T.border}`,
        padding:"14px 28px", display:"flex", alignItems:"center", justifyContent:"space-between",
        position:"sticky", top:0, zIndex:100 }}>
        <Logo/>
        <div style={{ display:"flex", alignItems:"center", gap:22 }}>
          <LivePulse connected={apiConnected}/>
          <div style={{ width:1, height:16, background:T.border }}/>
          <TxtBtn small onClick={()=>loadBookings()} icon={<RefreshIcon size={14} color={T.textSecond}/>} variant="ghost">
            Refresh
          </TxtBtn>
          <span style={{ fontSize:12, color:T.textMuted, fontWeight:500 }}>
            {new Date().toLocaleDateString("en-CA", { month:"short", day:"numeric", year:"numeric" })}
          </span>
        </div>
      </header>

      <main style={{ maxWidth:1120, margin:"0 auto", padding:"32px 24px" }}>

        {/* STAT CARDS */}
        <div style={{ display:"flex", gap:14, marginBottom:32, flexWrap:"wrap" }}>
          <StatCard icon={<CalendarIcon size={18}/>}    label="Today's Bookings" value={counts.today}     filterKey="today"     activeFilter={activeFilter} onToggle={handleFilterToggle}/>
          <StatCard icon={<CheckCircleIcon size={18}/>} label="Confirmed"         value={counts.confirmed} filterKey="confirmed" activeFilter={activeFilter} onToggle={handleFilterToggle} statusKey="confirmed"/>
          <StatCard icon={<ClockIcon size={18}/>}       label="Pending"           value={counts.pending}   filterKey="pending"   activeFilter={activeFilter} onToggle={handleFilterToggle} statusKey="pending"/>
          <StatCard icon={<UsersIcon size={18}/>}       label="Waitlist"          value={counts.waitlist}  filterKey="waitlist"  activeFilter={activeFilter} onToggle={handleFilterToggle} statusKey="waitlist"/>
        </div>

        {/* TABS */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
          marginBottom:22, flexWrap:"wrap", gap:12 }}>
          <div style={{ display:"flex", gap:2, background:T.cardBg,
            border:`1px solid ${T.border}`, borderRadius:T.r10, padding:4 }}>
            <TabBtn active={activeTab==="queue"}   onClick={()=>setActiveTab("queue")}   icon={<CalendarIcon size={16}/>}>Live Queue</TabBtn>
            <TabBtn active={activeTab==="history"} onClick={()=>setActiveTab("history")} icon={<HistoryIcon  size={16}/>}>All Bookings</TabBtn>
          </div>
          {/* Search */}
          <div style={{ position:"relative", width:260 }}>
            <div style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)",
              color:T.textMuted, pointerEvents:"none" }}><SearchIcon size={15}/></div>
            <input value={search} onChange={e=>setSearch(e.target.value)}
              placeholder="Search name, phone, service..."
              style={{ width:"100%", background:T.cardBg, border:`1px solid ${T.border}`,
                borderRadius:T.r8, padding:"9px 14px 9px 38px",
                color:T.textPrimary, fontSize:13, fontFamily:T.font,
                outline:"none", boxSizing:"border-box" }}/>
          </div>
        </div>

        {/* QUEUE TAB */}
        {activeTab==="queue" && (
          <div>
            {activeFilter !== "all" && (
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:16 }}>
                <span style={{ fontSize:12, color:T.textMuted }}>Filtered:</span>
                <span style={{ background:sm(activeFilter==="today"?"confirmed":activeFilter).bg,
                  color:sm(activeFilter==="today"?"confirmed":activeFilter).text,
                  border:`1px solid ${sm(activeFilter==="today"?"confirmed":activeFilter).border}`,
                  padding:"2px 10px", borderRadius:20, fontWeight:700, fontSize:11,
                  letterSpacing:"0.05em", textTransform:"uppercase" }}>
                  {activeFilter==="today"?"Today":activeFilter}
                </span>
                <button onClick={()=>setActiveFilter("all")} style={{
                  background:"none", border:"none", color:T.textMuted,
                  cursor:"pointer", fontSize:12, fontFamily:T.font, padding:0 }}>
                  Clear
                </button>
              </div>
            )}

            {loading ? <Skeleton/> : filtered.length === 0 ? (
              <div style={{ background:T.cardBg, border:`1px solid ${T.border}`,
                borderRadius:T.r12, padding:"52px 24px", textAlign:"center", color:T.textMuted, fontSize:14 }}>
                {search ? `No bookings match "${search}"` : "No appointments match the current filter."}
              </div>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                {filtered
                  .sort((a,b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`))
                  .map(booking => (
                    <AppointmentCard
                      key={booking._id}
                      booking={booking}
                      onUpdate={handleUpdate}
                      onDelete={handleDelete}
                      onEdit={setEditBooking}
                      onSMS={handleSMS}
                    />
                  ))
                }
              </div>
            )}
          </div>
        )}

        {/* ALL BOOKINGS TAB (full list with search) */}
        {activeTab==="history" && (
          <div>
            <div style={{ background:T.cardBg, border:`1px solid ${T.border}`,
              borderRadius:T.r12, overflow:"hidden" }}>
              <div style={{ display:"grid", gridTemplateColumns:"1.5fr 1.2fr 1.6fr 1fr 1fr 100px",
                padding:"11px 20px", borderBottom:`1px solid ${T.border}`,
                background:T.elevated, gap:12 }}>
                {["Customer","Phone","Service","Date","Time","Status"].map(h=>(
                  <div key={h} style={{ fontSize:10, fontWeight:700, color:T.textMuted,
                    textTransform:"uppercase", letterSpacing:"0.08em" }}>{h}</div>
                ))}
              </div>
              {loading ? (
                <div style={{ padding:"40px 20px", textAlign:"center", color:T.textMuted, fontSize:14 }}>
                  Loading bookings...
                </div>
              ) : filtered.length === 0 ? (
                <div style={{ padding:"40px 20px", textAlign:"center", color:T.textMuted, fontSize:14 }}>
                  No bookings found.
                </div>
              ) : (
                filtered
                  .sort((a,b) => new Date(`${b.date} ${b.time}`) - new Date(`${a.date} ${a.time}`))
                  .map((b,i,arr) => {
                    const [hov, setHov] = [false, ()=>{}]; // inline row
                    const s = sm(b.status);
                    return (
                      <div key={b._id}
                        style={{ display:"grid", gridTemplateColumns:"1.5fr 1.2fr 1.6fr 1fr 1fr 100px",
                          padding:"14px 20px", borderBottom:i<arr.length-1?`1px solid ${T.borderFaint}`:"none",
                          borderLeft:`3px solid transparent`, alignItems:"center", gap:12,
                          transition:"background 0.12s" }}
                        onMouseEnter={e=>{e.currentTarget.style.background=T.cardBgHov;e.currentTarget.style.borderLeftColor=s.accent;}}
                        onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.borderLeftColor="transparent";}}>
                        <div style={{ fontSize:14, fontWeight:600, color:T.textPrimary }}>{b.firstName} {b.lastName}</div>
                        <div style={{ fontSize:13, color:T.textMuted }}>{b.phone}</div>
                        <div style={{ fontSize:13, fontWeight:600, color:T.textSecond }}>{b.service}</div>
                        <div style={{ fontSize:12, color:T.textMuted }}>{b.date}</div>
                        <div style={{ fontSize:12, color:T.textMuted }}>{b.time}</div>
                        <Badge status={b.status}/>
                      </div>
                    );
                  })
              )}
            </div>
            <div style={{ fontSize:11, color:T.textMuted, marginTop:10 }}>
              {filtered.length} booking{filtered.length!==1?"s":""}
              {search?` matching "${search}"`:""}
            </div>
          </div>
        )}

        {/* API REFERENCE */}
        <div style={{ marginTop:40, background:T.cardBg, border:`1px solid ${T.border}`,
          borderRadius:T.r12, padding:"18px 22px" }}>
          <div style={{ fontSize:10, fontWeight:700, color:T.textMuted,
            letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:14 }}>
            API Endpoints
          </div>
          <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
            {[
              { method:"POST", path:"/api/book",                 desc:"Create new booking",          color:T.green  },
              { method:"GET",  path:"/api/availability?date=…",  desc:"Available time slots",        color:T.blue   },
              { method:"GET",  path:"/api/bookings",             desc:"All bookings (admin)",         color:T.amber  },
              { method:"PATCH",path:"/api/bookings/:id",         desc:"Update status / reschedule",   color:T.purple },
              { method:"DELETE",path:"/api/bookings/:id",        desc:"Delete booking (admin)",       color:T.red    },
            ].map(({ method, path, desc, color }) => (
              <div key={path} style={{ background:T.pageBg, border:`1px solid ${T.border}`,
                borderRadius:T.r8, padding:"10px 14px", flex:"1 0 200px" }}>
                <div style={{ display:"flex", gap:6, alignItems:"center", marginBottom:4 }}>
                  <span style={{ fontSize:9, fontWeight:800, color, letterSpacing:"0.08em",
                    background:`${color}18`, border:`1px solid ${color}40`,
                    padding:"1px 6px", borderRadius:4 }}>{method}</span>
                  <code style={{ fontSize:11, color:T.textSecond, fontFamily:"monospace" }}>{path}</code>
                </div>
                <div style={{ fontSize:11, color:T.textMuted }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>

      </main>
    </>
  );
}
