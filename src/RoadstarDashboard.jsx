// ─────────────────────────────────────────────────────────────────────────────
// Roadstar Tire — Admin Dashboard v4
// Features: Live queue · History · Walk-in booking · Daily schedule PDF
//           Heatmap · Returning customer detection · Login audit log
//           Notes per booking · Date-grouped queue · Completed section
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback, useRef } from "react";
import { fetchBookings, updateBooking, deleteBooking, sendSMS, getToken } from "./api.js";

const API_BASE = (import.meta.env.VITE_API_URL || "https://roadstar-api.onrender.com/api");

const SERVICES = ["Tire Change","Tire Purchase","Tire Change + Installation","Flat Tire Repair","Wheel Balancing","Tire Rotation","TPMS Service","Other"];
const TIME_SLOTS = ["9:00 AM","9:40 AM","10:00 AM","10:40 AM","11:00 AM","11:40 AM","12:00 PM","1:00 PM","1:40 PM","2:00 PM","2:40 PM","3:00 PM","3:40 PM","4:00 PM"];
const LOGO_URL = ""; // paste your logo URL here

// ══ TOKENS ═══════════════════════════════════════════════════════════════════
const T = {
  pageBg:"#07090f", cardBg:"#0d1120", cardBgHov:"#111728",
  panelBg:"#0f1422", elevated:"#171e30", elevatedHov:"#1c2438",
  border:"#1d2b40", borderVis:"#263550", borderFaint:"#141c2c",
  blue:"#2563EB", blueLight:"#3B82F6", blueBright:"#60A5FA",
  blueMuted:"#172554", blueSubtle:"#0c1a35",
  textPrimary:"#F0F4FF", textSecond:"#8896B0", textMuted:"#49576a",
  amber:"#F59E0B", amberBg:"#1c1200", amberBorder:"#3d2800", amberText:"#FCD34D",
  green:"#22C55E", greenBg:"#071a0f", greenBorder:"#14532D", greenText:"#86EFAC",
  purple:"#8B5CF6", purpleBg:"#130d24", purpleBorder:"#2e1b5e", purpleText:"#C4B5FD",
  teal:"#14B8A6", tealBg:"#042f2e", tealBorder:"#0f3d3a", tealText:"#5eead4",
  red:"#EF4444", redBg:"#1a0606", redBorder:"#450a0a", redText:"#FCA5A5",
  orange:"#F97316", orangeBg:"#1c0d02", orangeBorder:"#4a2008", orangeText:"#FDB88A",
  slateText:"#64748B", slateBg:"#0d1120", slateBorder:"#1d2b40",
  font:"'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  r6:"6px", r8:"8px", r10:"10px", r12:"12px", r16:"16px",
  shadow:"0 1px 3px rgba(0,0,0,0.6), 0 2px 8px rgba(0,0,0,0.3)",
  shadowLg:"0 8px 40px rgba(0,0,0,0.7)",
};

const STATUS = {
  pending:   {color:T.amber,  text:T.amberText,  bg:T.amberBg,  border:T.amberBorder,  accent:T.amber,  label:"Pending"},
  confirmed: {color:T.green,  text:T.greenText,  bg:T.greenBg,  border:T.greenBorder,  accent:T.green,  label:"Confirmed"},
  waitlist:  {color:T.purple, text:T.purpleText, bg:T.purpleBg, border:T.purpleBorder, accent:T.purple, label:"Waitlist"},
  completed: {color:T.teal,   text:T.tealText,   bg:T.tealBg,   border:T.tealBorder,   accent:T.teal,   label:"Completed"},
  cancelled: {color:T.red,    text:T.redText,    bg:T.redBg,    border:T.redBorder,    accent:T.red,    label:"Cancelled"},
};
const sm = s => STATUS[s] || STATUS.pending;

// ══ ICONS ════════════════════════════════════════════════════════════════════
const Ic = ({size=20,color="currentColor",children,style={}}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
    strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
    style={{flexShrink:0,display:"block",...style}}>{children}</svg>
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
const RefreshIcon     = p => <Ic {...p}><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M21 4v4h-4"/><path d="M3 20v-4h4"/></Ic>;
const FlagIcon        = p => <Ic {...p}><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></Ic>;
const PrintIcon       = p => <Ic {...p}><path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></Ic>;
const BarChartIcon    = p => <Ic {...p}><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></Ic>;
const UserCheckIcon   = p => <Ic {...p}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/></Ic>;
const LogOutIcon      = p => <Ic {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></Ic>;
const ShieldIcon      = p => <Ic {...p}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></Ic>;
const NoteIcon        = p => <Ic {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></Ic>;
const WalkInIcon      = p => <Ic {...p}><circle cx="12" cy="5" r="2"/><path d="m15 14-3-6-3 6"/><path d="M9 11H7l-2 6"/><path d="m17 11 2 6"/><path d="m10 17 2 4"/><path d="m14 17-2 4"/></Ic>;
const StarIcon        = p => <Ic {...p}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></Ic>;

// ══ HELPERS ══════════════════════════════════════════════════════════════════
const today = () => new Date().toISOString().slice(0,10);
const fmtDate = d => {
  if (!d) return "";
  if (d === today()) return "Today";
  const dt = new Date(d+"T00:00:00");
  return dt.toLocaleDateString("en-CA",{weekday:"short",month:"short",day:"numeric"});
};

// ══ PRIMITIVES ════════════════════════════════════════════════════════════════
function Badge({status}) {
  const s = sm(status);
  return (
    <span style={{display:"inline-flex",alignItems:"center",gap:5,fontSize:11,fontWeight:700,
      letterSpacing:"0.05em",textTransform:"uppercase",padding:"5px 11px",borderRadius:20,
      background:s.bg,color:s.text,border:`1px solid ${s.border}`,whiteSpace:"nowrap"}}>
      <span style={{width:5,height:5,borderRadius:"50%",background:s.color,boxShadow:`0 0 5px ${s.color}90`}}/>
      {s.label}
    </span>
  );
}

function IconBtn({onClick,title,children,variant="default",disabled=false}) {
  const [hov,setHov] = useState(false);
  const V = {
    default:    {bg:hov?T.elevated:"transparent",   bd:hov?T.borderVis:T.border,  cl:hov?T.textSecond:T.textMuted},
    accept:     {bg:hov?"#0a2215":T.greenBg,        bd:T.greenBorder,             cl:T.green},
    decline:    {bg:hov?"#220909":T.redBg,          bd:T.redBorder,               cl:T.red},
    complete:   {bg:hov?"#042f2e":T.tealBg,         bd:T.tealBorder,              cl:T.teal},
    reschedule: {bg:hov?T.elevated:"transparent",   bd:hov?T.borderVis:T.border,  cl:hov?T.blueBright:T.textSecond},
    sms:        {bg:hov?T.blueSubtle:"transparent", bd:hov?T.blueLight:T.border,  cl:hov?T.blueBright:T.textSecond},
    edit:       {bg:hov?T.elevated:"transparent",   bd:hov?T.borderVis:T.border,  cl:hov?T.textSecond:T.textMuted},
    trash:      {bg:hov?T.redBg:"transparent",      bd:hov?T.redBorder:T.border,  cl:hov?T.red:T.textMuted},
    note:       {bg:hov?T.orangeBg:"transparent",   bd:hov?T.orangeBorder:T.border, cl:hov?T.orange:T.textMuted},
  };
  const v = V[variant]||V.default;
  return (
    <button onClick={onClick} title={title} disabled={disabled}
      onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{display:"inline-flex",alignItems:"center",justifyContent:"center",
        width:44,height:44,borderRadius:T.r8,background:v.bg,border:`1px solid ${v.bd}`,
        color:v.cl,cursor:disabled?"not-allowed":"pointer",flexShrink:0,opacity:disabled?0.4:1,
        transition:"all 0.13s"}}>
      {children}
    </button>
  );
}

function TxtBtn({onClick,children,variant="primary",icon=null,small=false,disabled=false,style={}}) {
  const [hov,setHov] = useState(false);
  const S = {
    primary: {bg:hov?T.blueLight:T.blue,    bd:hov?T.blueLight:T.blue,   cl:"#fff"},
    ghost:   {bg:hov?T.elevated:"transparent",bd:hov?T.borderVis:T.border,cl:T.textSecond},
    danger:  {bg:hov?"#220909":T.redBg,     bd:T.redBorder,              cl:T.red},
    success: {bg:hov?"#0a2215":T.greenBg,   bd:T.greenBorder,            cl:T.green},
    teal:    {bg:hov?"#042f2e":T.tealBg,    bd:T.tealBorder,             cl:T.teal},
  }[variant]||{bg:T.blue,bd:T.blue,cl:"#fff"};
  return (
    <button onClick={onClick} disabled={disabled}
      onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{display:"inline-flex",alignItems:"center",gap:7,
        padding:small?"8px 14px":"11px 20px",borderRadius:T.r8,background:S.bg,
        border:`1px solid ${S.bd}`,color:S.cl,fontSize:small?12:14,fontWeight:600,
        fontFamily:T.font,cursor:disabled?"not-allowed":"pointer",whiteSpace:"nowrap",
        opacity:disabled?0.5:1,transition:"all 0.13s",...style}}>
      {icon}{children}
    </button>
  );
}

function FLabel({children}) {
  return <label style={{display:"block",fontSize:11,fontWeight:600,letterSpacing:"0.07em",
    textTransform:"uppercase",color:T.textMuted,marginBottom:6}}>{children}</label>;
}
function Inp({value,onChange,placeholder,type="text",style={}}) {
  const [foc,setFoc]=useState(false);
  return <input type={type} value={value} onChange={onChange} placeholder={placeholder}
    onFocus={()=>setFoc(true)} onBlur={()=>setFoc(false)}
    style={{width:"100%",background:T.pageBg,border:`1.5px solid ${foc?T.blue:T.border}`,
      borderRadius:T.r8,padding:"11px 14px",color:T.textPrimary,fontSize:14,
      fontFamily:T.font,outline:"none",boxSizing:"border-box",transition:"border-color 0.15s",...style}}/>;
}
function Sel({value,onChange,options,style={}}) {
  const [foc,setFoc]=useState(false);
  return <select value={value} onChange={onChange} onFocus={()=>setFoc(true)} onBlur={()=>setFoc(false)}
    style={{width:"100%",background:T.pageBg,border:`1.5px solid ${foc?T.blue:T.border}`,
      borderRadius:T.r8,padding:"11px 14px",color:T.textPrimary,fontSize:14,
      fontFamily:T.font,outline:"none",boxSizing:"border-box",cursor:"pointer",...style}}>
    {options.map(o=><option key={o.value??o} value={o.value??o} style={{background:T.panelBg}}>{o.label??o}</option>)}
  </select>;
}

// ══ STAT CARD ════════════════════════════════════════════════════════════════
function StatCard({icon,label,value,filterKey,activeFilter,onToggle,statusKey,accentOverride}) {
  const isActive = activeFilter===filterKey;
  const [hov,setHov]=useState(false);
  const s = statusKey?sm(statusKey):null;
  const ac=accentOverride||s?.color||T.blue;
  const acBg=s?.bg||T.blueSubtle;
  const acBd=s?.border||T.blue;
  const acTx=s?.text||T.blueBright;
  return (
    <button onClick={()=>onToggle(filterKey)} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{flex:"1 1 0",minWidth:110,textAlign:"left",cursor:"pointer",outline:"none",
        background:isActive?acBg:hov?T.cardBgHov:T.cardBg,
        border:`1.5px solid ${isActive?acBd:hov?T.borderVis:T.border}`,
        borderLeft:`4px solid ${isActive?ac:hov?T.borderVis:T.border}`,
        borderRadius:T.r12,padding:"18px 18px 16px",boxShadow:T.shadow,
        transition:"all 0.15s",position:"relative"}}>
      <div style={{width:36,height:36,borderRadius:T.r8,marginBottom:14,
        background:isActive?`${ac}18`:T.elevated,
        display:"flex",alignItems:"center",justifyContent:"center",
        color:isActive?ac:T.textMuted,transition:"all 0.15s"}}>
        {icon}
      </div>
      <div style={{fontSize:32,fontWeight:800,lineHeight:1,color:T.textPrimary,
        marginBottom:5,letterSpacing:"-0.03em",fontVariantNumeric:"tabular-nums"}}>{value}</div>
      <div style={{fontSize:11,fontWeight:500,color:isActive?acTx:T.textMuted}}>{label}</div>
      {isActive&&<div style={{position:"absolute",top:12,right:12,fontSize:9,fontWeight:700,
        letterSpacing:"0.07em",textTransform:"uppercase",color:acTx,
        background:acBg,border:`1px solid ${acBd}`,padding:"2px 6px",borderRadius:20}}>ON</div>}
    </button>
  );
}

// ══ ALERT TOAST ══════════════════════════════════════════════════════════════
function AlertToast({alerts,onDismiss}) {
  if(!alerts.length) return null;
  return (
    <div style={{position:"fixed",top:70,right:16,zIndex:9999,display:"flex",flexDirection:"column",gap:8,maxWidth:340}}>
      {alerts.map(a=>(
        <div key={a.id} style={{background:T.panelBg,border:`1px solid ${T.borderVis}`,
          borderLeft:`3px solid ${a.type==="error"?T.red:a.type==="new"?T.green:T.blue}`,
          borderRadius:T.r10,padding:"12px 14px",display:"flex",alignItems:"flex-start",gap:10,
          boxShadow:T.shadowLg,animation:"toastIn 0.22s ease"}}>
          <div style={{width:28,height:28,borderRadius:T.r6,flexShrink:0,
            background:a.type==="error"?T.redBg:a.type==="new"?T.greenBg:T.blueMuted,
            display:"flex",alignItems:"center",justifyContent:"center",
            color:a.type==="error"?T.red:a.type==="new"?T.green:T.blueBright}}>
            {a.type==="new"?<BellIcon size={13}/>:a.type==="error"?<XIcon size={13}/>:<CheckIcon size={13}/>}
          </div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:10,fontWeight:700,letterSpacing:"0.07em",textTransform:"uppercase",marginBottom:2,
              color:a.type==="error"?T.red:a.type==="new"?T.green:T.blueBright}}>
              {a.type==="new"?"New Booking":a.type==="error"?"Error":"Update"}
            </div>
            <div style={{fontSize:13,color:T.textSecond,lineHeight:1.45}}>{a.message}</div>
          </div>
          <button onClick={()=>onDismiss(a.id)} style={{background:"none",border:"none",color:T.textMuted,cursor:"pointer",padding:2}}>
            <XIcon size={13}/>
          </button>
        </div>
      ))}
    </div>
  );
}

// ══ OVERLAY ══════════════════════════════════════════════════════════════════
function Overlay({children,onClose,wide=false}) {
  return (
    <div onClick={e=>{if(e.target===e.currentTarget)onClose();}}
      style={{position:"fixed",inset:0,background:"rgba(2,4,12,0.85)",zIndex:1000,
        display:"flex",alignItems:"center",justifyContent:"center",padding:20,backdropFilter:"blur(5px)"}}>
      <div style={{background:T.panelBg,border:`1px solid ${T.borderVis}`,borderRadius:T.r16,
        padding:28,maxWidth:wide?720:500,width:"100%",boxShadow:T.shadowLg,
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
function ModalHdr({icon,title,sub}) {
  return (
    <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:4}}>
      <div style={{width:40,height:40,borderRadius:T.r8,background:T.blueMuted,
        display:"flex",alignItems:"center",justifyContent:"center",color:T.blueBright}}>{icon}</div>
      <div>
        <div style={{fontSize:16,fontWeight:700,color:T.textPrimary}}>{title}</div>
        {sub&&<div style={{fontSize:12,color:T.textMuted,marginTop:1}}>{sub}</div>}
      </div>
    </div>
  );
}

// ══ WALK-IN MODAL ════════════════════════════════════════════════════════════
function WalkInModal({onClose,onSave,existingBookings}) {
  const [form,setForm] = useState({firstName:"",lastName:"",phone:"",service:"Tire Change",date:today(),time:"9:00 AM",notes:""});
  const [saving,setSaving] = useState(false);
  const [err,setErr] = useState("");
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));

  // Filter out already-booked slots for selected date
  const bookedSlots = new Set(existingBookings.filter(b=>b.date===form.date&&b.status!=="cancelled").map(b=>b.time));
  const available = TIME_SLOTS.filter(t=>!bookedSlots.has(t));

  const handleSave = async () => {
    if(!form.firstName||!form.lastName||!form.phone) { setErr("Name and phone are required"); return; }
    if(!form.time) { setErr("Please select a time slot"); return; }
    setSaving(true); setErr("");
    try {
      await onSave(form);
      onClose();
    } catch(e) { setErr(e.message||"Failed to create booking"); }
    finally { setSaving(false); }
  };

  return (
    <Overlay onClose={onClose}>
      <ModalHdr icon={<WalkInIcon size={18}/>} title="Walk-in Booking" sub="Create an immediate appointment"/>
      <div style={{height:1,background:T.border,margin:"18px 0"}}/>
      {err&&<div style={{background:T.redBg,border:`1px solid ${T.redBorder}`,borderRadius:T.r8,
        padding:"10px 14px",fontSize:13,color:T.redText,marginBottom:14}}>{err}</div>}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
        <div><FLabel>First Name</FLabel><Inp value={form.firstName} onChange={e=>set("firstName",e.target.value)} placeholder="John"/></div>
        <div><FLabel>Last Name</FLabel><Inp value={form.lastName} onChange={e=>set("lastName",e.target.value)} placeholder="Smith"/></div>
        <div><FLabel>Phone</FLabel><Inp value={form.phone} onChange={e=>set("phone",e.target.value)} placeholder="+1 (416) 555-0000"/></div>
        <div><FLabel>Service</FLabel>
          <Sel value={form.service} onChange={e=>set("service",e.target.value)} options={SERVICES.map(s=>({value:s,label:s}))}/>
        </div>
        <div><FLabel>Date</FLabel>
          <Inp type="date" value={form.date} onChange={e=>set("date",e.target.value)}
            style={{padding:"10px 14px"}}/>
        </div>
        <div><FLabel>Time Slot</FLabel>
          <Sel value={form.time} onChange={e=>set("time",e.target.value)}
            options={available.length?available.map(t=>({value:t,label:t})):[{value:"",label:"No slots available"}]}/>
        </div>
      </div>
      <div style={{marginTop:14}}><FLabel>Notes (optional)</FLabel>
        <textarea value={form.notes} onChange={e=>set("notes",e.target.value)}
          placeholder="Any special instructions..."
          style={{width:"100%",background:T.pageBg,border:`1.5px solid ${T.border}`,borderRadius:T.r8,
            padding:"10px 14px",color:T.textPrimary,fontSize:13,fontFamily:T.font,
            resize:"vertical",outline:"none",boxSizing:"border-box",minHeight:70}}/>
      </div>
      <div style={{display:"flex",gap:10,marginTop:20}}>
        <TxtBtn onClick={handleSave} disabled={saving} icon={<PlusIcon size={15} color="#fff"/>}>
          {saving?"Creating...":"Create Walk-in"}
        </TxtBtn>
        <TxtBtn onClick={onClose} variant="ghost">Cancel</TxtBtn>
      </div>
    </Overlay>
  );
}

// ══ NOTE MODAL ════════════════════════════════════════════════════════════════
function NoteModal({booking,onClose,onSave}) {
  const [note,setNote] = useState(booking.notes||"");
  const [saving,setSaving] = useState(false);
  const handleSave = async () => {
    setSaving(true);
    await onSave(booking._id, {notes: note});
    setSaving(false); onClose();
  };
  return (
    <Overlay onClose={onClose}>
      <ModalHdr icon={<NoteIcon size={18}/>} title="Staff Note"
        sub={`${booking.firstName} ${booking.lastName} · ${booking.service}`}/>
      <div style={{height:1,background:T.border,margin:"18px 0"}}/>
      <FLabel>Internal note (not sent to customer)</FLabel>
      <textarea value={note} onChange={e=>setNote(e.target.value)}
        placeholder="Add an internal note about this appointment..."
        rows={5}
        style={{width:"100%",background:T.pageBg,border:`1.5px solid ${T.border}`,
          borderRadius:T.r8,padding:"12px 14px",color:T.textPrimary,fontSize:14,
          fontFamily:T.font,resize:"vertical",outline:"none",boxSizing:"border-box"}}/>
      <div style={{display:"flex",gap:10,marginTop:20}}>
        <TxtBtn onClick={handleSave} disabled={saving} icon={<CheckIcon size={15} color="#fff"/>}>
          {saving?"Saving...":"Save Note"}
        </TxtBtn>
        <TxtBtn onClick={onClose} variant="ghost">Cancel</TxtBtn>
      </div>
    </Overlay>
  );
}

// ══ SMS MODAL ════════════════════════════════════════════════════════════════
function SMSModal({booking,onClose,onSend}) {
  const [msgType,setMsgType] = useState("confirmed");
  const [sending,setSending] = useState(false);
  const TYPES = [
    {key:"confirmed",label:"Confirmed",  desc:"Appointment confirmed"},
    {key:"reminder", label:"Reminder",   desc:"Reminder for today"},
    {key:"declined", label:"Declined",   desc:"Appointment cancelled"},
    {key:"waitlist", label:"Waitlist",   desc:"Spot opened up"},
    {key:"completed",label:"Completed",  desc:"Service done, thank you"},
  ];
  const handleSend = async () => { setSending(true); await onSend(booking,msgType); setSending(false); };
  return (
    <Overlay onClose={onClose}>
      <ModalHdr icon={<MsgIcon size={18}/>} title="Send SMS via Twilio"
        sub={`${booking.firstName} ${booking.lastName} · ${booking.phone}`}/>
      <div style={{height:1,background:T.border,margin:"18px 0"}}/>
      <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:20}}>
        {TYPES.map(({key,label,desc})=>{
          const active=msgType===key;
          return (
            <button key={key} onClick={()=>setMsgType(key)} style={{
              display:"flex",alignItems:"center",gap:12,padding:"12px 14px",
              borderRadius:T.r10,cursor:"pointer",textAlign:"left",
              background:active?T.blueSubtle:T.elevated,
              border:`1.5px solid ${active?T.blue:T.border}`,transition:"all 0.12s"}}>
              <div style={{width:16,height:16,borderRadius:"50%",flexShrink:0,
                border:`2px solid ${active?T.blue:T.textMuted}`,
                background:active?T.blue:"transparent",
                display:"flex",alignItems:"center",justifyContent:"center"}}>
                {active&&<div style={{width:6,height:6,borderRadius:"50%",background:"#fff"}}/>}
              </div>
              <div>
                <div style={{fontSize:13,fontWeight:600,color:active?T.textPrimary:T.textSecond}}>{label}</div>
                <div style={{fontSize:11,color:T.textMuted,marginTop:1}}>{desc}</div>
              </div>
            </button>
          );
        })}
      </div>
      <button onClick={handleSend} disabled={sending} style={{
        width:"100%",padding:"12px",borderRadius:T.r8,
        background:sending?T.blueMuted:T.blue,border:"none",color:"#fff",
        fontSize:14,fontWeight:600,fontFamily:T.font,cursor:sending?"not-allowed":"pointer",
        display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
        <MsgIcon size={15} color="#fff"/>
        {sending?"Sending...":"Send SMS"}
      </button>
    </Overlay>
  );
}

// ══ EDIT MODAL ════════════════════════════════════════════════════════════════
function EditModal({booking,onClose,onSave}) {
  const [form,setForm] = useState({status:booking.status,notes:booking.notes||"",date:booking.date,time:booking.time});
  const [saving,setSaving] = useState(false);
  const [err,setErr] = useState("");
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const handleSave = async () => {
    setSaving(true); setErr("");
    try { await onSave(booking._id,form); }
    catch(e) { setErr(e.message||"Could not save"); }
    finally { setSaving(false); }
  };
  return (
    <Overlay onClose={onClose}>
      <ModalHdr icon={<PencilIcon size={18}/>} title="Edit Appointment"
        sub={`${booking.firstName} ${booking.lastName}`}/>
      <div style={{height:1,background:T.border,margin:"18px 0"}}/>
      {err&&<div style={{background:T.redBg,border:`1px solid ${T.redBorder}`,borderRadius:T.r8,
        padding:"10px 14px",fontSize:13,color:T.redText,marginBottom:14}}>{err}</div>}
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        <div><FLabel>Status</FLabel>
          <Sel value={form.status} onChange={e=>set("status",e.target.value)}
            options={["pending","confirmed","waitlist","completed","cancelled"].map(v=>({value:v,label:v.charAt(0).toUpperCase()+v.slice(1)}))}/>
        </div>
        <div><FLabel>Date (YYYY-MM-DD)</FLabel>
          <Inp value={form.date} onChange={e=>set("date",e.target.value)} placeholder="2026-03-20"/>
        </div>
        <div><FLabel>Time Slot</FLabel>
          <Sel value={form.time} onChange={e=>set("time",e.target.value)} options={TIME_SLOTS.map(t=>({value:t,label:t}))}/>
        </div>
        <div><FLabel>Notes</FLabel>
          <textarea value={form.notes} onChange={e=>set("notes",e.target.value)}
            placeholder="Staff notes..."
            style={{width:"100%",background:T.pageBg,border:`1.5px solid ${T.border}`,borderRadius:T.r8,
              padding:"11px 14px",color:T.textPrimary,fontSize:14,fontFamily:T.font,
              resize:"vertical",outline:"none",boxSizing:"border-box",minHeight:80}}/>
        </div>
      </div>
      <div style={{display:"flex",gap:10,marginTop:24}}>
        <TxtBtn onClick={handleSave} disabled={saving} icon={<CheckIcon size={15} color="#fff"/>}>
          {saving?"Saving...":"Save Changes"}
        </TxtBtn>
        <TxtBtn onClick={onClose} variant="ghost">Cancel</TxtBtn>
      </div>
    </Overlay>
  );
}

// ══ HEATMAP MODAL ════════════════════════════════════════════════════════════
function HeatmapModal({bookings,onClose}) {
  const slotCounts = {};
  TIME_SLOTS.forEach(s=>slotCounts[s]=0);
  bookings.forEach(b=>{ if(slotCounts[b.time]!==undefined) slotCounts[b.time]++; });
  const maxCount = Math.max(...Object.values(slotCounts),1);

  return (
    <Overlay onClose={onClose} wide>
      <ModalHdr icon={<BarChartIcon size={18}/>} title="Busiest Hours Heatmap"
        sub="All-time booking frequency by time slot"/>
      <div style={{height:1,background:T.border,margin:"18px 0"}}/>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {TIME_SLOTS.map(slot=>{
          const count = slotCounts[slot]||0;
          const pct = count/maxCount;
          const intensity = Math.round(pct*100);
          const barColor = pct>0.8?T.red:pct>0.5?T.amber:pct>0.2?T.green:T.teal;
          return (
            <div key={slot} style={{display:"flex",alignItems:"center",gap:12}}>
              <div style={{fontSize:12,fontWeight:600,color:T.textSecond,
                width:74,textAlign:"right",flexShrink:0,fontVariantNumeric:"tabular-nums"}}>{slot}</div>
              <div style={{flex:1,height:32,background:T.elevated,borderRadius:T.r6,overflow:"hidden",position:"relative"}}>
                <div style={{height:"100%",width:`${intensity}%`,
                  background:`linear-gradient(90deg,${barColor}80,${barColor})`,
                  borderRadius:T.r6,transition:"width 0.6s ease",minWidth:intensity?4:0}}/>
                {count>0&&<div style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",
                  fontSize:11,fontWeight:700,color:T.textPrimary}}>{count} booking{count!==1?"s":""}</div>}
              </div>
              <div style={{width:36,textAlign:"right",fontSize:11,fontWeight:700,
                color:count>0?barColor:T.textMuted,flexShrink:0}}>{count}</div>
            </div>
          );
        })}
      </div>
      <div style={{marginTop:20,padding:"12px 14px",background:T.elevated,borderRadius:T.r8,
        fontSize:12,color:T.textMuted}}>
        Total bookings tracked: <strong style={{color:T.textPrimary}}>{bookings.length}</strong>
        &nbsp;·&nbsp; Most popular: <strong style={{color:T.amber}}>
          {Object.entries(slotCounts).sort((a,b)=>b[1]-a[1])[0]?.[0]||"—"}
        </strong>
      </div>
    </Overlay>
  );
}

// ══ AUDIT LOG MODAL ══════════════════════════════════════════════════════════
function AuditLogModal({onClose}) {
  const logs = JSON.parse(localStorage.getItem("roadstar_audit")||"[]");
  return (
    <Overlay onClose={onClose} wide>
      <ModalHdr icon={<ShieldIcon size={18}/>} title="Login Audit Log"
        sub="All admin access events stored locally"/>
      <div style={{height:1,background:T.border,margin:"18px 0"}}/>
      {logs.length===0
        ? <div style={{textAlign:"center",padding:"32px 0",color:T.textMuted,fontSize:14}}>No audit events recorded yet.</div>
        : (
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            {[...logs].reverse().map((l,i)=>(
              <div key={i} style={{display:"grid",gridTemplateColumns:"160px 1fr 1fr",
                padding:"10px 14px",background:T.elevated,borderRadius:T.r8,gap:12,alignItems:"center"}}>
                <div style={{fontSize:11,fontFamily:"monospace",color:T.textMuted}}>{l.time}</div>
                <div style={{fontSize:13,color:T.textPrimary,fontWeight:600}}>{l.event}</div>
                <div style={{fontSize:11,color:T.textMuted}}>{l.detail}</div>
              </div>
            ))}
          </div>
        )
      }
    </Overlay>
  );
}

// ══ RETURNING CUSTOMER BADGE ═════════════════════════════════════════════════
function ReturningBadge({count}) {
  if(count<2) return null;
  return (
    <span style={{display:"inline-flex",alignItems:"center",gap:4,fontSize:10,fontWeight:700,
      letterSpacing:"0.04em",padding:"2px 8px",borderRadius:20,
      background:T.orangeBg,color:T.orange,border:`1px solid ${T.orangeBorder}`,whiteSpace:"nowrap"}}>
      <StarIcon size={9} color={T.orange}/>
      {count}x customer
    </span>
  );
}

// ══ APPOINTMENT CARD ══════════════════════════════════════════════════════════
function AppointmentCard({booking,onUpdate,onDelete,onEdit,onSMS,onNote,visitCount,isCompleted=false}) {
  const [rescheduling,setRescheduling]=useState(false);
  const [newTime,setNewTime]=useState("");
  const [hov,setHov]=useState(false);
  const [busy,setBusy]=useState(false);
  const s = sm(booking.status);

  const SvcIcon=({sz=20})=>{
    if(booking.service?.includes("Installation")) return <WrenchIcon size={sz} color={s.color}/>;
    if(booking.service?.includes("Purchase"))     return <CartIcon size={sz} color={s.color}/>;
    return <TireIcon size={sz} color={s.color}/>;
  };

  const act=async(updates)=>{
    setBusy(true);
    try { await onUpdate(booking._id,updates); }
    finally { setBusy(false); }
  };

  const handleReschedule=async()=>{
    if(!newTime||newTime==="Select a slot...") return;
    await act({time:newTime,sendSMS:true});
    setRescheduling(false); setNewTime("");
  };

  return (
    <div onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{background:hov?T.cardBgHov:T.cardBg,
        borderLeft:`4px solid ${s.accent}`,
        border:`1px solid ${hov?T.borderVis:T.border}`,
        borderRadius:T.r12,boxShadow:T.shadow,overflow:"hidden",
        transition:"background 0.14s, border-color 0.14s",opacity:busy?0.7:1}}>
      <div style={{padding:"18px 20px",display:"flex",flexWrap:"wrap",alignItems:"center",gap:16}}>

        {/* Time */}
        <div style={{flexShrink:0,minWidth:74,padding:"10px 12px",
          background:T.elevated,border:`1px solid ${T.border}`,borderRadius:T.r10,textAlign:"center"}}>
          <div style={{fontSize:16,fontWeight:800,color:T.textPrimary,letterSpacing:"-0.02em",lineHeight:1,marginBottom:4,fontVariantNumeric:"tabular-nums"}}>{booking.time}</div>
          <div style={{fontSize:10,fontWeight:500,color:T.textMuted}}>{booking.duration||10} min</div>
        </div>

        {/* Icon */}
        <div style={{flexShrink:0,width:44,height:44,background:`${s.color}14`,
          border:`1px solid ${s.border}`,borderRadius:T.r10,
          display:"flex",alignItems:"center",justifyContent:"center"}}>
          <SvcIcon sz={20}/>
        </div>

        {/* Info */}
        <div style={{flex:1,minWidth:180}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3}}>
            <div style={{fontSize:15,fontWeight:700,color:T.textPrimary}}>{booking.firstName} {booking.lastName}</div>
            <ReturningBadge count={visitCount}/>
          </div>
          <div style={{fontSize:12,fontWeight:700,color:s.color,letterSpacing:"0.04em",textTransform:"uppercase",marginBottom:4}}>{booking.service}</div>
          <div style={{fontSize:12,color:T.textMuted}}>{booking.phone}<span style={{marginLeft:10}}>{booking.date}</span></div>
          {booking.notes&&(
            <div style={{fontSize:11,color:T.orange,fontStyle:"italic",marginTop:5,
              display:"flex",alignItems:"flex-start",gap:5}}>
              <NoteIcon size={11} color={T.orange} style={{marginTop:1,flexShrink:0}}/>
              {booking.notes}
            </div>
          )}
        </div>

        <Badge status={booking.status}/>

        {/* Actions */}
        <div style={{display:"flex",gap:5,alignItems:"center",flexShrink:0,flexWrap:"wrap"}}>
          {!isCompleted&&booking.status!=="confirmed"&&booking.status!=="completed"&&(
            <IconBtn onClick={()=>act({status:"confirmed"})} title="Confirm (auto-sends SMS)" variant="accept" disabled={busy}>
              <CheckIcon size={17}/>
            </IconBtn>
          )}
          {!isCompleted&&(booking.status==="confirmed"||booking.status==="pending")&&(
            <IconBtn onClick={()=>act({status:"completed"})} title="Mark as Completed" variant="complete" disabled={busy}>
              <FlagIcon size={17}/>
            </IconBtn>
          )}
          {!isCompleted&&booking.status!=="cancelled"&&booking.status!=="completed"&&(
            <IconBtn onClick={()=>act({status:"cancelled"})} title="Decline" variant="decline" disabled={busy}>
              <XIcon size={17}/>
            </IconBtn>
          )}
          <div style={{width:1,height:26,background:T.border,margin:"0 1px"}}/>
          {!isCompleted&&<IconBtn onClick={()=>setRescheduling(r=>!r)} title="Reschedule" variant="reschedule" disabled={busy}>
            <CalClockIcon size={16}/>
          </IconBtn>}
          <IconBtn onClick={()=>onSMS(booking)} title="Send SMS" variant="sms" disabled={busy}>
            <MsgIcon size={16}/>
          </IconBtn>
          <IconBtn onClick={()=>onNote(booking)} title="Add/edit note" variant="note" disabled={busy}>
            <NoteIcon size={16}/>
          </IconBtn>
          <IconBtn onClick={()=>onEdit(booking)} title="Edit" variant="edit" disabled={busy}>
            <PencilIcon size={16}/>
          </IconBtn>
          <IconBtn onClick={()=>onDelete(booking._id)} title="Delete" variant="trash" disabled={busy}>
            <TrashIcon size={16}/>
          </IconBtn>
        </div>
      </div>

      {rescheduling&&(
        <div style={{borderTop:`1px solid ${T.border}`,background:T.elevated,
          padding:"13px 20px",display:"flex",gap:10,alignItems:"flex-end",flexWrap:"wrap"}}>
          <div style={{minWidth:180}}>
            <FLabel>New Time Slot</FLabel>
            <Sel value={newTime} onChange={e=>setNewTime(e.target.value)}
              options={["Select a slot...",...TIME_SLOTS].map(t=>({value:t,label:t}))}
              style={{fontSize:13,padding:"9px 12px"}}/>
          </div>
          <TxtBtn small onClick={handleReschedule} disabled={busy} icon={<CheckIcon size={12} color="#fff"/>}>Confirm</TxtBtn>
          <TxtBtn small variant="ghost" onClick={()=>setRescheduling(false)} icon={<XIcon size={12}/>}>Cancel</TxtBtn>
        </div>
      )}
    </div>
  );
}

// ══ DAILY PRINT ══════════════════════════════════════════════════════════════
const printDailySchedule = (bookings, date) => {
  const dayBookings = bookings
    .filter(b=>b.date===date&&b.status!=="cancelled")
    .sort((a,b)=>a.time.localeCompare(b.time));
  const html = `<!DOCTYPE html><html><head><title>Roadstar Tire — ${date}</title>
  <style>
    body{font-family:Arial,sans-serif;max-width:800px;margin:40px auto;color:#111;font-size:13px}
    h1{font-size:20px;margin-bottom:4px}
    .meta{color:#666;font-size:12px;margin-bottom:24px}
    table{width:100%;border-collapse:collapse}
    th{text-align:left;padding:8px 12px;background:#f0f0f0;font-size:11px;letter-spacing:.05em;text-transform:uppercase}
    td{padding:10px 12px;border-bottom:1px solid #e5e7eb;vertical-align:top}
    .status{display:inline-block;padding:2px 8px;border-radius:12px;font-size:10px;font-weight:700;text-transform:uppercase}
    .confirmed{background:#dcfce7;color:#166534}
    .pending{background:#fef3c7;color:#92400e}
    .completed{background:#ccfbf1;color:#0f766e}
    .waitlist{background:#ede9fe;color:#4c1d95}
    @media print{body{margin:20px}}
  </style></head><body>
  <h1>Roadstar Tire — Daily Schedule</h1>
  <div class="meta">Date: ${date} &nbsp;·&nbsp; Printed: ${new Date().toLocaleString()} &nbsp;·&nbsp; ${dayBookings.length} appointment(s)</div>
  <table>
    <tr><th>Time</th><th>Customer</th><th>Phone</th><th>Service</th><th>Status</th><th>Notes</th></tr>
    ${dayBookings.map(b=>`
    <tr>
      <td><strong>${b.time}</strong><br/><span style="color:#666;font-size:11px">${b.duration||10} min</span></td>
      <td><strong>${b.firstName} ${b.lastName}</strong></td>
      <td>${b.phone}</td>
      <td>${b.service}</td>
      <td><span class="status ${b.status}">${b.status}</span></td>
      <td style="color:#666">${b.notes||""}</td>
    </tr>`).join("")}
  </table>
  </body></html>`;
  const w = window.open("","_blank");
  w.document.write(html);
  w.document.close();
  w.print();
};

// ══ DATE GROUP ════════════════════════════════════════════════════════════════
function DateGroup({date,bookings,onUpdate,onDelete,onEdit,onSMS,onNote,allBookings,onPrint}) {
  const phoneCount = {};
  allBookings.forEach(b=>{ phoneCount[b.phone]=(phoneCount[b.phone]||0)+1; });

  return (
    <div style={{marginBottom:28}}>
      {/* Date header */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",
        marginBottom:10,padding:"8px 14px",
        background:T.elevated,borderRadius:T.r8,border:`1px solid ${T.border}`}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <CalendarIcon size={15} color={T.blue}/>
          <span style={{fontSize:13,fontWeight:700,color:T.textPrimary}}>{fmtDate(date)}</span>
          <span style={{fontSize:11,color:T.textMuted,background:T.cardBg,
            padding:"2px 8px",borderRadius:20,border:`1px solid ${T.border}`}}>
            {bookings.length} appointment{bookings.length!==1?"s":""}
          </span>
        </div>
        <button onClick={()=>onPrint(date)} title="Print daily schedule"
          style={{display:"flex",alignItems:"center",gap:6,padding:"5px 12px",
            background:"transparent",border:`1px solid ${T.border}`,borderRadius:T.r6,
            color:T.textMuted,fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:T.font,
            transition:"all 0.12s"}}
          onMouseEnter={e=>{e.currentTarget.style.borderColor=T.borderVis;e.currentTarget.style.color=T.textSecond;}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border;e.currentTarget.style.color=T.textMuted;}}>
          <PrintIcon size={13}/> Print
        </button>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {bookings.map(b=>(
          <AppointmentCard key={b._id} booking={b}
            onUpdate={onUpdate} onDelete={onDelete}
            onEdit={onEdit} onSMS={onSMS} onNote={onNote}
            visitCount={phoneCount[b.phone]||1}/>
        ))}
      </div>
    </div>
  );
}

// ══ COMPLETED SECTION ════════════════════════════════════════════════════════
function CompletedSection({bookings,onUpdate,onDelete,onEdit,onSMS,onNote,allBookings}) {
  const [expanded,setExpanded] = useState(true);
  const phoneCount = {};
  allBookings.forEach(b=>{ phoneCount[b.phone]=(phoneCount[b.phone]||0)+1; });

  if(!bookings.length) return (
    <div style={{textAlign:"center",padding:"32px",color:T.textMuted,fontSize:13,
      background:T.cardBg,border:`1px solid ${T.border}`,borderRadius:T.r12}}>
      No completed appointments yet today.
    </div>
  );

  return (
    <div>
      <button onClick={()=>setExpanded(e=>!e)}
        style={{display:"flex",alignItems:"center",justifyContent:"space-between",width:"100%",
          padding:"10px 14px",background:T.tealBg,border:`1px solid ${T.tealBorder}`,
          borderRadius:T.r8,cursor:"pointer",marginBottom:expanded?12:0,fontFamily:T.font}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <FlagIcon size={15} color={T.teal}/>
          <span style={{fontSize:13,fontWeight:700,color:T.teal}}>Completed — {bookings.length} appointment{bookings.length!==1?"s":""}</span>
        </div>
        <span style={{fontSize:12,color:T.teal}}>{expanded?"▲ Collapse":"▼ Expand"}</span>
      </button>
      {expanded&&(
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {bookings.map(b=>(
            <AppointmentCard key={b._id} booking={b}
              onUpdate={onUpdate} onDelete={onDelete}
              onEdit={onEdit} onSMS={onSMS} onNote={onNote}
              visitCount={phoneCount[b.phone]||1}
              isCompleted/>
          ))}
        </div>
      )}
    </div>
  );
}

// ══ LOGO ════════════════════════════════════════════════════════════════════
function Logo() {
  return (
    <div style={{display:"flex",alignItems:"center",gap:12}}>
      <div style={{width:40,height:40,borderRadius:"50%",background:T.cardBg,
        border:`1.5px solid ${T.borderVis}`,display:"flex",alignItems:"center",
        justifyContent:"center",overflow:"hidden"}}>
        {LOGO_URL?<img src={LOGO_URL} alt="Logo" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
          :<TireIcon size={22} color={T.blue}/>}
      </div>
      <div>
        <div style={{fontSize:15,fontWeight:800,letterSpacing:"0.07em",color:T.textPrimary,lineHeight:1,textTransform:"uppercase"}}>Roadstar Tire</div>
        <div style={{fontSize:10,fontWeight:500,letterSpacing:"0.1em",color:T.textMuted,textTransform:"uppercase",marginTop:3}}>Admin Dashboard</div>
      </div>
    </div>
  );
}

// ══ ROOT ══════════════════════════════════════════════════════════════════════
export default function RoadstarDashboard({onLogout}) {
  const [tab,        setTab]        = useState("queue");      // queue | completed | heatmap
  const [bookings,   setBookings]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [connected,  setConnected]  = useState(false);
  const [filter,     setFilter]     = useState("all");
  const [search,     setSearch]     = useState("");
  const [alerts,     setAlerts]     = useState([]);
  const [editB,      setEditB]      = useState(null);
  const [smsB,       setSmsB]       = useState(null);
  const [noteB,      setNoteB]      = useState(null);
  const [showWalkIn, setShowWalkIn] = useState(false);
  const [showHeatmap,setShowHeatmap]= useState(false);
  const [showAudit,  setShowAudit]  = useState(false);
  const prevCount = useRef(0);

  // ── Audit log ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const logs = JSON.parse(localStorage.getItem("roadstar_audit")||"[]");
    logs.push({time:new Date().toLocaleString(),event:"Dashboard opened",detail:`Token: ...${(getToken()||"").slice(-8)}`});
    if(logs.length>100) logs.splice(0,logs.length-100);
    localStorage.setItem("roadstar_audit",JSON.stringify(logs));
  },[]);

  // ── Sound ─────────────────────────────────────────────────────────────────
  const playSound = useCallback(()=>{
    try {
      const ac=new(window.AudioContext||window.webkitAudioContext)();
      const now=ac.currentTime;
      const tone=(f,s,d)=>{
        const o=ac.createOscillator(),g=ac.createGain();
        o.connect(g);g.connect(ac.destination);
        o.type="sine";o.frequency.setValueAtTime(f,s);
        g.gain.setValueAtTime(0,s);g.gain.linearRampToValueAtTime(0.4,s+0.02);
        g.gain.exponentialRampToValueAtTime(0.001,s+d);
        o.start(s);o.stop(s+d);
      };
      tone(800,now,0.35);tone(1050,now+0.22,0.45);
    } catch(e){}
  },[]);

  // ── Alert helper ──────────────────────────────────────────────────────────
  const pushAlert = useCallback((message,type="info")=>{
    const id=Date.now();
    setAlerts(a=>[...a,{id,message,type}]);
    setTimeout(()=>setAlerts(a=>a.filter(x=>x.id!==id)),6000);
  },[]);
  const dismissAlert = useCallback(id=>setAlerts(a=>a.filter(x=>x.id!==id)),[]);

  // ── Load ──────────────────────────────────────────────────────────────────
  const load = useCallback(async(silent=false)=>{
    if(!silent) setLoading(true);
    try {
      const data = await fetchBookings();
      if(silent && data.length > prevCount.current) {
        const n=data[data.length-1];
        pushAlert(`New booking: ${n.firstName} ${n.lastName} — ${n.service} at ${n.time}`,"new");
        playSound();
      }
      prevCount.current=data.length;
      setBookings(data);
      setConnected(true);
    } catch(e) {
      setConnected(false);
      if(!silent) pushAlert("Could not connect to API","error");
    } finally { if(!silent) setLoading(false); }
  },[pushAlert,playSound]);

  useEffect(()=>{
    load();
    const iv=setInterval(()=>load(true),15000);
    return()=>clearInterval(iv);
  },[load]);

  // ── CRUD ──────────────────────────────────────────────────────────────────
  const handleUpdate = async(id,updates)=>{
    try {
      const updated = await updateBooking(id,updates);
      setBookings(b=>b.map(x=>x._id===id?updated:x));
      pushAlert(`Updated: ${updated.firstName} ${updated.lastName}`);
    } catch(e) { pushAlert(e.message||"Update failed","error"); }
  };
  const handleDelete = async id=>{
    try {
      await deleteBooking(id);
      setBookings(b=>b.filter(x=>x._id!==id));
      prevCount.current--;
      pushAlert("Booking deleted");
    } catch(e) { pushAlert(e.message||"Delete failed","error"); }
  };
  const handleSaveEdit = async(id,updates)=>{
    await handleUpdate(id,updates);
    setEditB(null);
  };
  const handleSaveNote = async(id,updates)=>{
    await handleUpdate(id,updates);
    setNoteB(null);
  };
  const handleSendSMS = async(booking,msgType)=>{
    try {
      await sendSMS(booking._id,msgType);
      pushAlert(`SMS sent to ${booking.firstName} ${booking.lastName}`);
    } catch(e) { pushAlert(e.message||"SMS failed","error"); }
    setSmsB(null);
  };
  const handleWalkIn = async(form)=>{
    const res = await fetch(API_BASE+"/book",{
      method:"POST",
      headers:{"Content-Type":"application/json","Authorization":`Bearer ${getToken()}`},
      body:JSON.stringify({...form,status:"confirmed"}),
    });
    const data = await res.json();
    if(!res.ok) throw new Error(data.message||"Booking failed");
    await load();
    pushAlert(`Walk-in created: ${form.firstName} ${form.lastName}`);
  };

  // ── Derived data ──────────────────────────────────────────────────────────
  const todayStr = today();
  const todayActive = bookings.filter(b=>b.date===todayStr&&!["completed","cancelled"].includes(b.status));
  const todayCompleted = bookings.filter(b=>b.date===todayStr&&b.status==="completed");

  // Queue: active bookings grouped by date, sorted by date then time
  const activeBookings = bookings.filter(b=>!["completed","cancelled"].includes(b.status));
  const searchedActive = search
    ? activeBookings.filter(b=>{
        const q=search.toLowerCase();
        return `${b.firstName} ${b.lastName}`.toLowerCase().includes(q)||
          b.phone.includes(q)||b.service.toLowerCase().includes(q)||b.date.includes(q);
      })
    : activeBookings;

  // Apply filter
  const filteredActive = searchedActive.filter(b=>{
    if(filter==="today")     return b.date===todayStr;
    if(filter==="confirmed") return b.status==="confirmed";
    if(filter==="pending")   return b.status==="pending";
    if(filter==="waitlist")  return b.status==="waitlist";
    return true;
  });

  // Group by date
  const byDate = {};
  filteredActive
    .sort((a,b)=>`${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`))
    .forEach(b=>{ if(!byDate[b.date]) byDate[b.date]=[]; byDate[b.date].push(b); });

  const counts = {
    active:    activeBookings.filter(b=>b.date===todayStr).length,
    confirmed: bookings.filter(b=>b.status==="confirmed").length,
    pending:   bookings.filter(b=>b.status==="pending").length,
    waitlist:  bookings.filter(b=>b.status==="waitlist").length,
    completed: bookings.filter(b=>b.status==="completed").length,
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        html,body{background:${T.pageBg};color:${T.textPrimary};font-family:${T.font};-webkit-font-smoothing:antialiased}
        ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:${T.border};border-radius:10px}
        @keyframes livePulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.2;transform:scale(2.4)}}
        @keyframes toastIn{from{opacity:0;transform:translateX(14px)}to{opacity:1;transform:translateX(0)}}
        @keyframes shimmer{0%,100%{opacity:.5}50%{opacity:.25}}
        select option{background:${T.panelBg}}::placeholder{color:${T.textMuted}}button{font-family:${T.font}}
        input[type=date]{color-scheme:dark}
      `}</style>

      <AlertToast alerts={alerts} onDismiss={dismissAlert}/>
      {editB    &&<EditModal    booking={editB}   onClose={()=>setEditB(null)}    onSave={handleSaveEdit}/>}
      {smsB     &&<SMSModal     booking={smsB}    onClose={()=>setSmsB(null)}     onSend={handleSendSMS}/>}
      {noteB    &&<NoteModal    booking={noteB}   onClose={()=>setNoteB(null)}    onSave={handleSaveNote}/>}
      {showWalkIn &&<WalkInModal onClose={()=>setShowWalkIn(false)} onSave={handleWalkIn} existingBookings={bookings}/>}
      {showHeatmap&&<HeatmapModal bookings={bookings} onClose={()=>setShowHeatmap(false)}/>}
      {showAudit  &&<AuditLogModal onClose={()=>setShowAudit(false)}/>}

      {/* HEADER */}
      <header style={{background:T.pageBg,borderBottom:`1px solid ${T.border}`,
        padding:"13px 24px",display:"flex",alignItems:"center",justifyContent:"space-between",
        position:"sticky",top:0,zIndex:100}}>
        <Logo/>
        <div style={{display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
          {/* Live indicator */}
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            <div style={{position:"relative",width:8,height:8}}>
              <div style={{position:"absolute",inset:0,borderRadius:"50%",
                background:connected?T.green:T.amber,animation:"livePulse 2.2s infinite"}}/>
              <div style={{position:"absolute",inset:0,borderRadius:"50%",background:connected?T.green:T.amber}}/>
            </div>
            <span style={{fontSize:11,fontWeight:600,color:connected?T.green:T.amber,letterSpacing:"0.06em"}}>
              {connected?"API LIVE":"OFFLINE"}
            </span>
          </div>
          <div style={{width:1,height:16,background:T.border}}/>
          {/* Toolbar buttons */}
          <TxtBtn small onClick={()=>setShowWalkIn(true)} icon={<WalkInIcon size={14} color={T.green}/>} variant="ghost">Walk-in</TxtBtn>
          <TxtBtn small onClick={()=>setShowHeatmap(true)} icon={<BarChartIcon size={14} color={T.textSecond}/>} variant="ghost">Heatmap</TxtBtn>
          <TxtBtn small onClick={()=>setShowAudit(true)} icon={<ShieldIcon size={14} color={T.textSecond}/>} variant="ghost">Audit</TxtBtn>
          <TxtBtn small onClick={()=>load()} icon={<RefreshIcon size={14} color={T.textSecond}/>} variant="ghost">Refresh</TxtBtn>
          <div style={{width:1,height:16,background:T.border}}/>
          <TxtBtn small onClick={onLogout} icon={<LogOutIcon size={14} color={T.red}/>} variant="ghost">Sign Out</TxtBtn>
        </div>
      </header>

      <main style={{maxWidth:1160,margin:"0 auto",padding:"28px 20px"}}>

        {/* STAT CARDS */}
        <div style={{display:"flex",gap:12,marginBottom:28,flexWrap:"wrap"}}>
          <StatCard icon={<CalendarIcon size={17}/>}    label="Today (Active)"  value={counts.active}     filterKey="today"     activeFilter={filter} onToggle={setFilter}/>
          <StatCard icon={<CheckCircleIcon size={17}/>} label="Confirmed"        value={counts.confirmed} filterKey="confirmed" activeFilter={filter} onToggle={setFilter} statusKey="confirmed"/>
          <StatCard icon={<ClockIcon size={17}/>}       label="Pending"          value={counts.pending}   filterKey="pending"   activeFilter={filter} onToggle={setFilter} statusKey="pending"/>
          <StatCard icon={<UsersIcon size={17}/>}       label="Waitlist"         value={counts.waitlist}  filterKey="waitlist"  activeFilter={filter} onToggle={setFilter} statusKey="waitlist"/>
          <StatCard icon={<FlagIcon size={17}/>}        label="Completed"        value={counts.completed} filterKey="completed" activeFilter={filter}
            onToggle={k=>{setFilter(p=>p===k?"all":k);setTab("completed");}}
            accentOverride={T.teal}/>
        </div>

        {/* TABS + TOOLBAR */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",
          marginBottom:20,flexWrap:"wrap",gap:10}}>
          <div style={{display:"flex",gap:2,background:T.cardBg,
            border:`1px solid ${T.border}`,borderRadius:T.r10,padding:4}}>
            {[
              {id:"queue",    label:"Live Queue",   icon:<CalendarIcon size={15}/>},
              {id:"completed",label:"Completed",     icon:<FlagIcon size={15}/>},
            ].map(t=>{
              const active=tab===t.id;
              const [hov,setHov]=useState(false);
              return (
                <button key={t.id} onClick={()=>setTab(t.id)}
                  onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
                  style={{display:"flex",alignItems:"center",gap:7,padding:"9px 16px",
                    borderRadius:T.r8,border:"none",fontWeight:600,fontSize:13,fontFamily:T.font,
                    cursor:"pointer",transition:"all 0.14s",
                    background:active?T.elevated:hov?T.cardBgHov:"transparent",
                    color:active?T.textPrimary:T.textMuted}}>
                  <span style={{color:active?T.blue:hov?T.textSecond:T.textMuted}}>{t.icon}</span>
                  {t.label}
                  {t.id==="completed"&&counts.completed>0&&(
                    <span style={{background:T.tealBg,color:T.teal,border:`1px solid ${T.tealBorder}`,
                      padding:"1px 7px",borderRadius:20,fontSize:10,fontWeight:700}}>{counts.completed}</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Search + date print */}
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <div style={{position:"relative",width:260}}>
              <div style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",
                color:T.textMuted,pointerEvents:"none"}}><SearchIcon size={15}/></div>
              <input value={search} onChange={e=>setSearch(e.target.value)}
                placeholder="Search name, phone, service, date..."
                style={{width:"100%",background:T.cardBg,border:`1px solid ${T.border}`,
                  borderRadius:T.r8,padding:"9px 14px 9px 38px",color:T.textPrimary,
                  fontSize:13,fontFamily:T.font,outline:"none",boxSizing:"border-box"}}/>
            </div>
            <TxtBtn small onClick={()=>printDailySchedule(bookings,todayStr)}
              icon={<PrintIcon size={14} color={T.textSecond}/>} variant="ghost">
              Print Today
            </TxtBtn>
          </div>
        </div>

        {/* FILTER LABEL */}
        {filter!=="all"&&(
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16}}>
            <span style={{fontSize:12,color:T.textMuted}}>Showing:</span>
            <span style={{background:sm(filter==="today"?"confirmed":filter).bg,
              color:sm(filter==="today"?"confirmed":filter).text,
              border:`1px solid ${sm(filter==="today"?"confirmed":filter).border}`,
              padding:"2px 10px",borderRadius:20,fontWeight:700,fontSize:11,
              letterSpacing:"0.05em",textTransform:"uppercase"}}>
              {filter==="today"?"Today":filter}
            </span>
            <button onClick={()=>setFilter("all")} style={{background:"none",border:"none",
              color:T.textMuted,cursor:"pointer",fontSize:12,fontFamily:T.font,padding:0}}>
              Clear
            </button>
          </div>
        )}

        {/* QUEUE TAB */}
        {tab==="queue"&&(
          loading
            ? <div style={{display:"flex",flexDirection:"column",gap:12}}>
                {[1,2,3].map(i=><div key={i} style={{background:T.cardBg,border:`1px solid ${T.border}`,
                  borderRadius:T.r12,height:96,animation:"shimmer 1.6s ease-in-out infinite"}}/>)}
              </div>
            : Object.keys(byDate).length===0
            ? <div style={{background:T.cardBg,border:`1px solid ${T.border}`,borderRadius:T.r12,
                padding:"52px 24px",textAlign:"center",color:T.textMuted,fontSize:14}}>
                {search?"No bookings match your search.":"No active appointments in the queue."}
              </div>
            : Object.entries(byDate).map(([date,bkgs])=>(
                <DateGroup key={date} date={date} bookings={bkgs}
                  onUpdate={handleUpdate} onDelete={handleDelete}
                  onEdit={setEditB} onSMS={setSmsB} onNote={setNoteB}
                  allBookings={bookings}
                  onPrint={d=>printDailySchedule(bookings,d)}/>
              ))
        )}

        {/* COMPLETED TAB */}
        {tab==="completed"&&(
          <CompletedSection
            bookings={bookings.filter(b=>b.status==="completed").sort((a,b)=>
              `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`))}
            onUpdate={handleUpdate} onDelete={handleDelete}
            onEdit={setEditB} onSMS={setSmsB} onNote={setNoteB}
            allBookings={bookings}/>
        )}

      </main>
    </>
  );
}
