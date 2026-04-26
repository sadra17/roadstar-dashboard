// SettingsPage.jsx — with Error Boundary + debug output to find the real crash
import { useState, useEffect, useCallback, Component } from "react";
import { fetchSettings, updateSettings } from "./api.js";

function getT() {
  const dark = typeof localStorage === "undefined" || localStorage.getItem("rs_theme") !== "light";
  if (!dark) return {
    pageBg:"#f8fafc",cardBg:"#ffffff",elevated:"#f1f5f9",panelBg:"#ffffff",
    border:"#e2e8f0",borderVis:"#cbd5e1",blue:"#2563EB",blueBright:"#1d4ed8",
    blueSubtle:"#eff6ff",blueMuted:"#dbeafe",textPrimary:"#0f172a",
    textSecond:"#475569",textMuted:"#94a3b8",green:"#16a34a",greenBg:"#f0fdf4",
    greenBorder:"#bbf7d0",greenText:"#15803d",red:"#dc2626",redBg:"#fef2f2",
    redBorder:"#fecaca",redText:"#dc2626",amber:"#d97706",amberBg:"#fffbeb",
    amberBorder:"#fde68a",amberText:"#92400e",teal:"#0d9488",tealBg:"#f0fdfa",
    tealBorder:"#99f6e4",tealText:"#0f766e",font:"'Inter',-apple-system,sans-serif",
    r8:"8px",r10:"10px",r12:"12px",
  };
  return {
    pageBg:"#07090f",cardBg:"#0d1120",elevated:"#111827",panelBg:"#0f1422",
    border:"#1d2b40",borderVis:"#263550",blue:"#2563EB",blueBright:"#60A5FA",
    blueSubtle:"#0c1a35",blueMuted:"#172554",textPrimary:"#F0F4FF",
    textSecond:"#8896B0",textMuted:"#49576a",green:"#22C55E",greenBg:"#071a0f",
    greenBorder:"#14532D",greenText:"#86EFAC",red:"#EF4444",redBg:"#1a0606",
    redBorder:"#450a0a",redText:"#FCA5A5",amber:"#F59E0B",amberBg:"#1c1200",
    amberBorder:"#3d2800",amberText:"#FCD34D",teal:"#14B8A6",tealBg:"#042f2e",
    tealBorder:"#0f3d3a",tealText:"#5eead4",font:"'Inter',-apple-system,sans-serif",
    r8:"8px",r10:"10px",r12:"12px",
  };
}

// ── Error Boundary — catches React component rendering errors ─────────────────
class SectionErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error, info) { console.error("[Settings] Section crashed:", error, info); }
  render() {
    if (this.state.error) {
      const T = getT();
      return (
        <div style={{ padding:16, background:T.redBg, border:`1px solid ${T.redBorder}`,
          borderRadius:T.r10, color:T.redText, fontSize:13 }}>
          <strong>Section error:</strong> {this.state.error.message}
          <br/><small style={{opacity:0.7}}>Check browser console for details. Try refreshing the page.</small>
          <br/><button onClick={() => this.setState({error:null})}
            style={{marginTop:8,background:"transparent",border:`1px solid ${T.redBorder}`,
              borderRadius:T.r8,padding:"4px 10px",color:T.redText,fontSize:11,cursor:"pointer"}}>
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const DAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const TZS  = ["America/Toronto","America/Vancouver","America/New_York","America/Chicago",
               "America/Denver","America/Los_Angeles","America/Halifax","Europe/London"];
const SECTIONS = [
  {id:"business",  label:"Business info"},
  {id:"hours",     label:"Hours"},
  {id:"blackout",  label:"Blackout dates"},
  {id:"services",  label:"Services"},
  {id:"capacity",  label:"Capacity"},
  {id:"sms",       label:"SMS templates"},
  {id:"review",    label:"Google review"},
  {id:"reminders", label:"Reminders"},
  {id:"branding",  label:"Branding"},
];

// ── Pure primitive components (no state, no getT — just render props) ─────────
// These are defined outside the main component so React sees stable references
function Field({label, hint, children}) {
  const T = getT();
  return (
    <div style={{marginBottom:16}}>
      <div style={{fontSize:12,fontWeight:600,color:T.textSecond,marginBottom:hint?2:6}}>{label}</div>
      {hint && <div style={{fontSize:11,color:T.textMuted,marginBottom:5,lineHeight:1.4}}>{hint}</div>}
      {children}
    </div>
  );
}

function SectionTitle({children, sub}) {
  const T = getT();
  return (
    <div style={{marginBottom:20,paddingBottom:12,borderBottom:`1px solid ${T.border}`}}>
      <div style={{fontSize:15,fontWeight:700,color:T.textPrimary}}>{children}</div>
      {sub && <div style={{fontSize:12,color:T.textMuted,marginTop:4,lineHeight:1.5}}>{sub}</div>}
    </div>
  );
}

// ── BUSINESS SECTION ──────────────────────────────────────────────────────────
function BusinessSection({s, set}) {
  const T = getT();
  return (
    <>
      <SectionTitle sub="Shop name is used in all SMS messages as {shopName}.">Business info</SectionTitle>
      <Field label="Shop name" hint="Used as {shopName} in SMS">
        <input value={s.shopName || ""} onChange={e => set("shopName", e.target.value)}
          placeholder="Roadstar Tire"
          style={{width:"100%",background:T.pageBg,border:`1.5px solid ${T.border}`,borderRadius:T.r8,
            padding:"10px 12px",color:T.textPrimary,fontSize:13,fontFamily:T.font,outline:"none",boxSizing:"border-box"}}/>
      </Field>
      <Field label="Phone number">
        <input value={s.phone || ""} onChange={e => set("phone", e.target.value)}
          placeholder="+1 (416) 555-0000"
          style={{width:"100%",background:T.pageBg,border:`1.5px solid ${T.border}`,borderRadius:T.r8,
            padding:"10px 12px",color:T.textPrimary,fontSize:13,fontFamily:T.font,outline:"none",boxSizing:"border-box"}}/>
      </Field>
      <Field label="Address">
        <input value={s.address || ""} onChange={e => set("address", e.target.value)}
          placeholder="123 Main St, Toronto, ON"
          style={{width:"100%",background:T.pageBg,border:`1.5px solid ${T.border}`,borderRadius:T.r8,
            padding:"10px 12px",color:T.textPrimary,fontSize:13,fontFamily:T.font,outline:"none",boxSizing:"border-box"}}/>
      </Field>
      <Field label="Timezone" hint="Used for scheduling and Live at Bay">
        <select value={s.timezone || "America/Toronto"} onChange={e => set("timezone", e.target.value)}
          style={{width:"100%",background:T.pageBg,border:`1.5px solid ${T.border}`,borderRadius:T.r8,
            padding:"10px 12px",color:T.textPrimary,fontSize:13,fontFamily:T.font,outline:"none",boxSizing:"border-box"}}>
          {TZS.map(t => <option key={t} value={t} style={{background:T.cardBg}}>{t}</option>)}
        </select>
      </Field>
    </>
  );
}

// ── HOURS SECTION ─────────────────────────────────────────────────────────────
function HoursSection({s, set}) {
  const T = getT();
  return (
    <>
      <SectionTitle sub="Changes immediately affect the Shopify booking form.">Business hours</SectionTitle>
      <div style={{background:T.elevated,border:`1px solid ${T.border}`,borderRadius:T.r12,overflow:"hidden"}}>
        {DAYS.map((day, i) => {
          const h = s.hours || {};
          const dh = h[i] || h[String(i)] || {open:null, close:null};
          const closed = !dh.open || !dh.close;
          return (
            <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 16px",
              borderBottom:i<6?`1px solid ${T.border}`:"none",flexWrap:"wrap"}}>
              <div style={{width:88,fontSize:13,fontWeight:500,color:T.textPrimary,flexShrink:0}}>{day}</div>
              <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",userSelect:"none"}}>
                <input type="checkbox" checked={!closed}
                  onChange={() => {
                    if (closed) set(`hours.${i}`, {open:"09:00",close:"18:00"});
                    else        set(`hours.${i}`, {open:null,close:null});
                  }}
                  style={{width:16,height:16,cursor:"pointer",accentColor:T.blue}}/>
                <span style={{fontSize:13,color:closed?T.textMuted:T.textPrimary}}>{closed?"Closed":"Open"}</span>
              </label>
              {!closed && (
                <>
                  <input type="time" value={dh.open || "09:00"} onChange={e => set(`hours.${i}.open`, e.target.value)}
                    style={{background:T.pageBg,border:`1.5px solid ${T.border}`,borderRadius:T.r8,
                      padding:"7px 10px",color:T.textPrimary,fontSize:12,fontFamily:T.font,outline:"none",colorScheme:"dark"}}/>
                  <span style={{color:T.textMuted,fontSize:12}}>to</span>
                  <input type="time" value={dh.close || "18:00"} onChange={e => set(`hours.${i}.close`, e.target.value)}
                    style={{background:T.pageBg,border:`1.5px solid ${T.border}`,borderRadius:T.r8,
                      padding:"7px 10px",color:T.textPrimary,fontSize:12,fontFamily:T.font,outline:"none",colorScheme:"dark"}}/>
                </>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

// ── BLACKOUT SECTION ──────────────────────────────────────────────────────────
function BlackoutSection({s, set}) {
  const T = getT();
  const dates = s.blackoutDates || [];
  return (
    <>
      <SectionTitle sub="Block specific days — holidays, closures.">Blackout dates</SectionTitle>
      {dates.length === 0 && <div style={{fontSize:12,color:T.textMuted,marginBottom:14}}>No blackout dates set.</div>}
      <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:14}}>
        {dates.map((d, i) => (
          <div key={i} style={{display:"flex",gap:8,alignItems:"center"}}>
            <input type="date" value={d || ""} onChange={e => {const dd=[...dates];dd[i]=e.target.value;set("blackoutDates",dd);}}
              style={{background:T.pageBg,border:`1.5px solid ${T.border}`,borderRadius:T.r8,
                padding:"9px 12px",color:T.textPrimary,fontSize:13,fontFamily:T.font,outline:"none",colorScheme:"dark"}}/>
            <button onClick={() => set("blackoutDates", dates.filter((_,j) => j!==i))}
              style={{background:T.redBg,border:`1px solid ${T.redBorder}`,borderRadius:T.r8,
                padding:"9px 14px",color:T.redText,fontSize:12,fontFamily:T.font,cursor:"pointer"}}>Remove</button>
          </div>
        ))}
      </div>
      <button onClick={() => set("blackoutDates", [...dates, ""])}
        style={{background:"transparent",border:`1px solid ${T.border}`,borderRadius:T.r8,
          padding:"9px 16px",color:T.textSecond,fontSize:12,fontFamily:T.font,cursor:"pointer"}}>
        + Add date
      </button>
    </>
  );
}

// ── SERVICES SECTION ──────────────────────────────────────────────────────────
function ServicesSection({s, set}) {
  const T = getT();
  const svcs = s.services || [];
  return (
    <>
      <SectionTitle sub="Changes live on the Shopify booking form after saving.">Services</SectionTitle>
      <div style={{padding:"9px 12px",background:T.blueSubtle,border:`1px solid ${T.blueMuted}`,
        borderRadius:T.r8,fontSize:12,color:T.blueBright,lineHeight:1.6,marginBottom:14}}>
        Duration and bay type update the booking form immediately.
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {svcs.map((svc, i) => {
          // Support both camelCase (from toCamel) and snake_case
          const dur  = svc.serviceDuration  ?? svc.service_duration  ?? 30;
          const rec  = svc.equipmentRecoveryTime ?? svc.equipment_recovery_time ?? 0;
          const pool = svc.resourcePool     ?? svc.resource_pool     ?? "none";
          const active = svc.active !== false;
          return (
            <div key={i} style={{background:T.elevated,border:`1px solid ${active?T.borderVis:T.border}`,borderRadius:T.r12,padding:"14px"}}>
              <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center",marginBottom:10}}>
                <input value={svc.name || ""} onChange={e => {const sv=[...svcs];sv[i]={...sv[i],name:e.target.value};set("services",sv);}}
                  placeholder="Service name"
                  style={{flex:"1 1 140px",background:T.pageBg,border:`1.5px solid ${T.border}`,borderRadius:T.r8,
                    padding:"9px 12px",color:T.textPrimary,fontSize:14,fontWeight:600,fontFamily:T.font,outline:"none"}}/>
                <label style={{display:"flex",alignItems:"center",gap:6,cursor:"pointer"}}>
                  <input type="checkbox" checked={active}
                    onChange={() => {const sv=[...svcs];sv[i]={...sv[i],active:!active};set("services",sv);}}
                    style={{width:16,height:16,cursor:"pointer",accentColor:T.green}}/>
                  <span style={{fontSize:12,color:active?T.greenText:T.textMuted}}>{active?"Active":"Inactive"}</span>
                </label>
                <button onClick={() => set("services", svcs.filter((_,j) => j!==i))}
                  style={{background:T.redBg,border:`1px solid ${T.redBorder}`,borderRadius:T.r8,
                    padding:"6px 10px",color:T.redText,fontSize:11,fontFamily:T.font,cursor:"pointer"}}>Remove</button>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(100px,1fr))",gap:8}}>
                <div>
                  <div style={{fontSize:10,color:T.textMuted,marginBottom:4,textTransform:"uppercase",letterSpacing:"0.06em"}}>Duration (min)</div>
                  <input type="number" value={dur} onChange={e => {const n=Number(e.target.value);const sv=[...svcs];sv[i]={...sv[i],serviceDuration:n,service_duration:n};set("services",sv);}}
                    style={{width:"100%",background:T.pageBg,border:`1.5px solid ${T.border}`,borderRadius:T.r8,
                      padding:"9px 10px",color:T.textPrimary,fontSize:13,fontFamily:T.font,outline:"none",boxSizing:"border-box"}}/>
                </div>
                <div>
                  <div style={{fontSize:10,color:T.textMuted,marginBottom:4,textTransform:"uppercase",letterSpacing:"0.06em"}}>Recovery (min)</div>
                  <input type="number" value={rec} onChange={e => {const n=Number(e.target.value);const sv=[...svcs];sv[i]={...sv[i],equipmentRecoveryTime:n,equipment_recovery_time:n};set("services",sv);}}
                    style={{width:"100%",background:T.pageBg,border:`1.5px solid ${T.border}`,borderRadius:T.r8,
                      padding:"9px 10px",color:T.textPrimary,fontSize:13,fontFamily:T.font,outline:"none",boxSizing:"border-box"}}/>
                </div>
                <div>
                  <div style={{fontSize:10,color:T.textMuted,marginBottom:4,textTransform:"uppercase",letterSpacing:"0.06em"}}>Bay type</div>
                  <select value={pool} onChange={e => {const sv=[...svcs];sv[i]={...sv[i],resourcePool:e.target.value};set("services",sv);}}
                    style={{width:"100%",background:T.pageBg,border:`1.5px solid ${T.border}`,borderRadius:T.r8,
                      padding:"9px 10px",color:T.textPrimary,fontSize:13,fontFamily:T.font,outline:"none",boxSizing:"border-box"}}>
                    <option value="bay" style={{background:T.cardBg}}>Bay</option>
                    <option value="alignment" style={{background:T.cardBg}}>Alignment</option>
                    <option value="none" style={{background:T.cardBg}}>No bay</option>
                  </select>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <button onClick={() => set("services", [...svcs, {name:"New Service",serviceDuration:30,service_duration:30,equipmentRecoveryTime:0,equipment_recovery_time:0,resourcePool:"none",active:true}])}
        style={{marginTop:12,background:"transparent",border:`1px solid ${T.border}`,borderRadius:T.r8,
          padding:"9px 16px",color:T.textSecond,fontSize:12,fontFamily:T.font,cursor:"pointer"}}>
        + Add service
      </button>
    </>
  );
}

// ── CAPACITY SECTION ──────────────────────────────────────────────────────────
function CapacitySection({s, set}) {
  const T = getT();
  return (
    <>
      <SectionTitle sub="Controls simultaneous booking slots — live on the booking form.">Capacity</SectionTitle>
      <Field label="Normal bay count" hint="Each confirmed booking uses one bay slot">
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <input type="number" min="1" max="20" value={s.bayCount || 3}
            onChange={e => set("bayCount", Math.max(1, Number(e.target.value)))}
            style={{width:80,background:T.pageBg,border:`1.5px solid ${T.border}`,borderRadius:T.r8,
              padding:"10px 12px",color:T.textPrimary,fontSize:13,fontFamily:T.font,outline:"none"}}/>
          <span style={{fontSize:12,color:T.textMuted}}>{s.bayCount || 3} bay{(s.bayCount||3)!==1?"s":""}</span>
        </div>
      </Field>
      <Field label="Alignment lane">
        <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer"}}>
          <input type="checkbox" checked={s.alignmentLaneEnabled !== false}
            onChange={() => set("alignmentLaneEnabled", !(s.alignmentLaneEnabled !== false))}
            style={{width:16,height:16,cursor:"pointer",accentColor:T.blue}}/>
          <span style={{fontSize:13,color:T.textPrimary}}>
            {s.alignmentLaneEnabled !== false ? "Enabled — separate from normal bays" : "Disabled"}
          </span>
        </label>
      </Field>
      {s.alignmentLaneEnabled !== false && (
        <Field label="Alignment capacity" hint="Usually 1">
          <input type="number" min="1" value={s.alignmentCapacity || 1}
            onChange={e => set("alignmentCapacity", Math.max(1, Number(e.target.value)))}
            style={{width:80,background:T.pageBg,border:`1.5px solid ${T.border}`,borderRadius:T.r8,
              padding:"10px 12px",color:T.textPrimary,fontSize:13,fontFamily:T.font,outline:"none"}}/>
        </Field>
      )}
    </>
  );
}

// ── SMS SECTION ───────────────────────────────────────────────────────────────
function SMSSection({s, set}) {
  const T = getT();
  const TMPL = [
    {key:"confirmed",           label:"Appointment confirmed",   hint:"Sent when staff confirms"},
    {key:"declined",            label:"Declined / cancelled",    hint:"Sent when staff cancels"},
    {key:"waitlist",            label:"Waitlist spot opened",    hint:"Sent when a slot opens"},
    {key:"reminder",            label:"Reminder",                hint:"Sent before appointment"},
    {key:"completed_review",    label:"Completed + review link", hint:"Use {reviewLink}"},
    {key:"completed_no_review", label:"Completed — no review",   hint:"Simple thank-you"},
    {key:"no_show",             label:"No-show",                 hint:"Sent when marked no-show"},
  ];
  const tmpl = s.smsTemplates || {};
  return (
    <>
      <SectionTitle sub="Leave blank to use system defaults.">SMS templates</SectionTitle>
      <div style={{padding:"9px 12px",background:T.elevated,border:`1px solid ${T.border}`,borderRadius:T.r10,marginBottom:16,fontSize:12,color:T.textSecond,lineHeight:1.8}}>
        <strong style={{color:T.textPrimary}}>Variables: </strong>
        {["{firstName}","{shopName}","{date}","{time}","{service}","{reviewLink}"].map(v => (
          <code key={v} style={{display:"inline-block",background:T.pageBg,border:`1px solid ${T.border}`,
            padding:"1px 6px",borderRadius:4,marginRight:5,marginBottom:3,color:T.blueBright,fontFamily:"monospace",fontSize:11}}>{v}</code>
        ))}
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        {TMPL.map(({key, label, hint}) => {
          // Try both camelCase and snake_case keys for smsTemplates values
          const camelKey = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
          const val = tmpl[key] || tmpl[camelKey] || "";
          return (
            <div key={key} style={{background:T.elevated,border:`1px solid ${T.border}`,borderRadius:T.r12,padding:"14px"}}>
              <div style={{fontSize:13,fontWeight:600,color:T.textPrimary,marginBottom:2}}>{label}</div>
              <div style={{fontSize:11,color:T.textMuted,marginBottom:8}}>{hint}</div>
              <textarea value={val} rows={3} placeholder="Leave blank for system default"
                onChange={e => set(`smsTemplates.${key}`, e.target.value)}
                style={{width:"100%",background:T.pageBg,border:`1.5px solid ${T.border}`,borderRadius:T.r8,
                  padding:"10px 12px",color:T.textPrimary,fontSize:12,fontFamily:"monospace",outline:"none",
                  boxSizing:"border-box",resize:"vertical",lineHeight:1.65}}/>
              {val.length > 0 && (
                <div style={{display:"flex",justifyContent:"space-between",marginTop:5}}>
                  <span style={{fontSize:11,color:T.textMuted}}>{val.length} chars</span>
                  <button onClick={() => set(`smsTemplates.${key}`, "")}
                    style={{background:"none",border:"none",color:T.textMuted,fontSize:11,cursor:"pointer",fontFamily:T.font}}>Reset</button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

// ── REVIEW SECTION ────────────────────────────────────────────────────────────
function ReviewSection({s, set}) {
  const T = getT();
  return (
    <>
      <SectionTitle sub="Replaces {reviewLink} in the completion SMS.">Google review link</SectionTitle>
      <Field label="Review URL">
        <input value={s.googleReviewLink || ""} onChange={e => set("googleReviewLink", e.target.value)}
          placeholder="https://g.page/r/XXXX/review"
          style={{width:"100%",background:T.pageBg,border:`1.5px solid ${T.border}`,borderRadius:T.r8,
            padding:"10px 12px",color:T.textPrimary,fontSize:13,fontFamily:T.font,outline:"none",boxSizing:"border-box"}}/>
      </Field>
      {s.googleReviewLink && (
        <a href={s.googleReviewLink} target="_blank" rel="noopener noreferrer"
          style={{fontSize:11,color:T.tealText,display:"block",marginBottom:14,wordBreak:"break-all"}}>
          {s.googleReviewLink}
        </a>
      )}
      <div style={{fontSize:12,color:T.textSecond,lineHeight:1.6}}>
        Get your link: Google Business Profile → Get more reviews → copy the link.
      </div>
    </>
  );
}

// ── REMINDERS SECTION ─────────────────────────────────────────────────────────
function RemindersSection({s, set}) {
  const T = getT();
  const on = s.reminderEnabled !== false;
  return (
    <>
      <SectionTitle sub="Automatic SMS sent before appointments.">Reminders</SectionTitle>
      <Field label="Enable reminders">
        <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer"}}>
          <input type="checkbox" checked={on} onChange={() => set("reminderEnabled", !on)}
            style={{width:16,height:16,cursor:"pointer",accentColor:T.blue}}/>
          <span style={{fontSize:13,color:T.textPrimary}}>{on ? "On" : "Off"}</span>
        </label>
      </Field>
      {on && (
        <Field label="Minutes before" hint="Default: 30">
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <input type="number" min="5" value={s.reminderMinutes || 30}
              onChange={e => set("reminderMinutes", Math.max(5, Number(e.target.value)))}
              style={{width:80,background:T.pageBg,border:`1.5px solid ${T.border}`,borderRadius:T.r8,
                padding:"10px 12px",color:T.textPrimary,fontSize:13,fontFamily:T.font,outline:"none"}}/>
            <span style={{fontSize:12,color:T.textMuted}}>minutes before</span>
          </div>
        </Field>
      )}
    </>
  );
}

// ── BRANDING SECTION ──────────────────────────────────────────────────────────
function BrandingSection({s, set}) {
  const T = getT();
  return (
    <>
      <SectionTitle sub="Customizes the customer-facing booking form.">Branding</SectionTitle>
      <Field label="Logo URL" hint="PNG or SVG, shown at top of booking form">
        <input value={s.logoUrl || ""} onChange={e => set("logoUrl", e.target.value)}
          placeholder="https://shop.com/logo.png"
          style={{width:"100%",background:T.pageBg,border:`1.5px solid ${T.border}`,borderRadius:T.r8,
            padding:"10px 12px",color:T.textPrimary,fontSize:13,fontFamily:T.font,outline:"none",boxSizing:"border-box"}}/>
        {s.logoUrl && (
          <img src={s.logoUrl} alt="Logo" onError={e => e.target.style.display="none"}
            style={{height:36,marginTop:8,borderRadius:T.r8,background:T.elevated,border:`1px solid ${T.border}`,padding:4}}/>
        )}
      </Field>
      <Field label="Primary colour" hint="Button and accent colour on booking form">
        <div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
          <input type="color" value={s.primaryColor || "#2563EB"} onChange={e => set("primaryColor", e.target.value)}
            style={{width:44,height:36,borderRadius:T.r8,border:`1.5px solid ${T.border}`,background:"none",cursor:"pointer",padding:2}}/>
          <input value={s.primaryColor || "#2563EB"} onChange={e => set("primaryColor", e.target.value)}
            style={{width:120,background:T.pageBg,border:`1.5px solid ${T.border}`,borderRadius:T.r8,
              padding:"10px 12px",color:T.textPrimary,fontSize:13,fontFamily:T.font,outline:"none"}}/>
          <div style={{width:36,height:36,borderRadius:T.r8,background:s.primaryColor||"#2563EB",border:`1px solid ${T.border}`,flexShrink:0}}/>
        </div>
      </Field>
    </>
  );
}

// ── Section map ───────────────────────────────────────────────────────────────

// ── Main component ─────────────────────────────────────────────────────────────
export default function SettingsPage({onAlert}) {
  const T = getT();
  const [s,     setS]   = useState(null);
  const [load,  setLoad]= useState(true);
  const [sav,   setSav] = useState(false);
  const [saved, setSaved]= useState(false);
  const [err,   setErr] = useState("");
  const [dirty, setDirty]= useState(false);
  const [sec,   setSec] = useState("business");
  const [mob,   setMob] = useState(false);
  const [mobC,  setMobC]= useState(false);

  useEffect(() => {
    setMob(window.innerWidth < 768);
    const fn = () => setMob(window.innerWidth < 768);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);

  useEffect(() => {
    fetchSettings()
      .then(data => { setS(data); })
      .catch(e => setErr(e.message))
      .finally(() => setLoad(false));
  }, []);

  const set = useCallback((path, val) => {
    setS(prev => {
      if (!prev) return prev;
      const n = JSON.parse(JSON.stringify(prev));
      const keys = path.split(".");
      let o = n;
      for (let i = 0; i < keys.length - 1; i++) {
        if (o[keys[i]] == null || typeof o[keys[i]] !== "object") o[keys[i]] = {};
        o = o[keys[i]];
      }
      o[keys[keys.length-1]] = val;
      return n;
    });
    setDirty(true);
    setSaved(false);
  }, []);

  const save = async () => {
    setSav(true); setErr("");
    try {
      const updated = await updateSettings(s);
      setS(updated); setSaved(true); setDirty(false);
      onAlert?.("Settings saved — changes are live on the booking form.");
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setErr(e.message);
      onAlert?.(e.message, "error");
    } finally {
      setSav(false);
    }
  };

  if (load) return <div style={{padding:"40px 0",textAlign:"center",color:T.textMuted,fontSize:13}}>Loading settings…</div>;
  if (!s)   return <div style={{color:T.redText,fontSize:13,padding:16,background:T.redBg,border:`1px solid ${T.redBorder}`,borderRadius:T.r10}}>{err || "Could not load settings."}</div>;

  // Direct conditional rendering - most stable React approach
  const sectionProps = { s, set };
  let SectionComp = BusinessSection;
  if (sec === "hours")     SectionComp = HoursSection;
  if (sec === "blackout")  SectionComp = BlackoutSection;
  if (sec === "services")  SectionComp = ServicesSection;
  if (sec === "capacity")  SectionComp = CapacitySection;
  if (sec === "sms")       SectionComp = SMSSection;
  if (sec === "review")    SectionComp = ReviewSection;
  if (sec === "reminders") SectionComp = RemindersSection;
  if (sec === "branding")  SectionComp = BrandingSection;
  const secProps = { s, set };


  // Shared nav JSX (rendered directly, not as a component)
  const navJSX = (
    <div style={{background:T.cardBg,border:`1px solid ${T.border}`,borderRadius:T.r12,overflow:"hidden"}}>
      {SECTIONS.map(({id, label}) => {
        const a = sec === id;
        return (
          <button key={id}
            onClick={() => { setSec(id); if (mob) setMobC(true); }}
            style={{display:"flex",alignItems:"center",justifyContent:"space-between",width:"100%",
              padding:"12px 16px",background:a?T.elevated:"transparent",border:"none",
              borderLeft:`3px solid ${a?T.blue:"transparent"}`,color:a?T.textPrimary:T.textMuted,
              fontSize:13,fontFamily:T.font,cursor:"pointer",textAlign:"left",
              borderBottom:`1px solid ${T.border}`,transition:"all .12s"}}>
            <span style={{fontWeight:a?600:400}}>{label}</span>
            {mob && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={T.textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>}
          </button>
        );
      })}
    </div>
  );

  // Save bar JSX (rendered directly, not as a component)
  const saveJSX = (
    <div style={{paddingTop:16,marginTop:20,borderTop:`1px solid ${T.border}`,display:"flex",alignItems:"center",gap:12}}>
      <button onClick={save} disabled={sav}
        style={{padding:"10px 24px",borderRadius:T.r8,background:saved?T.greenBg:T.blue,
          border:`1px solid ${saved?T.greenBorder:T.blue}`,color:saved?T.greenText:"#fff",
          fontSize:13,fontWeight:600,fontFamily:T.font,cursor:sav?"not-allowed":"pointer",opacity:sav?0.6:1}}>
        {sav ? "Saving…" : saved ? "Saved" : "Save changes"}
      </button>
      {err && <span style={{fontSize:12,color:T.redText}}>{err}</span>}
      {!err && dirty && !sav && !saved && <span style={{fontSize:12,color:T.textMuted}}>Unsaved changes</span>}
    </div>
  );

  // Mobile layout
  if (mob) {
    if (!mobC) return (
      <div>
        <div style={{fontSize:18,fontWeight:700,color:T.textPrimary,marginBottom:16}}>Settings</div>
        {navJSX}
      </div>
    );
    return (
      <div>
        <button onClick={() => setMobC(false)}
          style={{display:"flex",alignItems:"center",gap:6,background:"transparent",border:"none",
            color:T.blue,fontSize:13,fontFamily:T.font,cursor:"pointer",padding:"0 0 14px",fontWeight:600}}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          Settings
        </button>
        <div style={{fontSize:15,fontWeight:700,color:T.textPrimary,marginBottom:16}}>
          {SECTIONS.find(x => x.id === sec)?.label}
        </div>
        <SectionErrorBoundary key={sec}><SectionComp s={s} set={set}/></SectionErrorBoundary>
        {saveJSX}
      </div>
    );
  }

  // Desktop layout — NO inner component definitions
  return (
    <div style={{display:"flex",gap:24,alignItems:"flex-start"}}>
      <div style={{width:192,flexShrink:0,position:"sticky",top:80}}>
        {navJSX}
        {dirty && (
          <div style={{marginTop:8,padding:"8px 12px",background:T.amberBg,border:`1px solid ${T.amberBorder}`,
            borderRadius:T.r8,fontSize:11,color:T.amberText,textAlign:"center"}}>
            Unsaved changes
          </div>
        )}
      </div>
      <div style={{flex:1,minWidth:0}}>
        <SectionErrorBoundary key={sec}><SectionComp s={s} set={set}/></SectionErrorBoundary>
        {saveJSX}
      </div>
    </div>
  );
}
