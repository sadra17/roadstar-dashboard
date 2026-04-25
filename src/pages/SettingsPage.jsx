// SettingsPage.jsx  v9 — fixed T scope, lazy section rendering, mobile layout
import { useState, useEffect, useCallback } from "react";
import { fetchSettings, updateSettings } from "./api.js";

function getT() {
  const theme = typeof localStorage !== "undefined" ? localStorage.getItem("rs_theme") || "dark" : "dark";
  if (theme === "light") return {
    pageBg:"#f0f2f5",cardBg:"#ffffff",elevated:"#f8f9fc",panelBg:"#ffffff",
    border:"#e2e8f0",borderVis:"#cbd5e1",
    blue:"#2563EB",blueLight:"#1d4ed8",blueBright:"#1d4ed8",blueSubtle:"#eff6ff",blueMuted:"#dbeafe",
    textPrimary:"#0f172a",textSecond:"#475569",textMuted:"#94a3b8",
    green:"#16a34a",greenBg:"#f0fdf4",greenBorder:"#bbf7d0",greenText:"#15803d",
    red:"#dc2626",redBg:"#fef2f2",redBorder:"#fecaca",redText:"#dc2626",
    amber:"#d97706",amberBg:"#fffbeb",amberBorder:"#fde68a",amberText:"#b45309",
    teal:"#0d9488",tealBg:"#f0fdfa",tealBorder:"#99f6e4",tealText:"#0f766e",
    font:"'Inter',-apple-system,sans-serif",r8:"8px",r10:"10px",r12:"12px",
  };
  return {
    pageBg:"#07090f",cardBg:"#0d1120",elevated:"#111827",panelBg:"#0f1422",
    border:"#1d2b40",borderVis:"#263550",
    blue:"#2563EB",blueLight:"#3B82F6",blueBright:"#60A5FA",blueSubtle:"#0c1a35",blueMuted:"#172554",
    textPrimary:"#F0F4FF",textSecond:"#8896B0",textMuted:"#49576a",
    green:"#22C55E",greenBg:"#071a0f",greenBorder:"#14532D",greenText:"#86EFAC",
    red:"#EF4444",redBg:"#1a0606",redBorder:"#450a0a",redText:"#FCA5A5",
    amber:"#F59E0B",amberBg:"#1c1200",amberBorder:"#3d2800",amberText:"#FCD34D",
    teal:"#14B8A6",tealBg:"#042f2e",tealBorder:"#0f3d3a",tealText:"#5eead4",
    font:"'Inter',-apple-system,sans-serif",r8:"8px",r10:"10px",r12:"12px",
  };
}

const DAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const TZS  = ["America/Toronto","America/Vancouver","America/New_York","America/Chicago","America/Denver","America/Los_Angeles","America/Halifax","Europe/London","Europe/Paris","Asia/Dubai"];

const _Ic = ({s=14,color="currentColor",ch}) =>
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" style={{display:"block",flexShrink:0}}>{ch}</svg>;

const SIcon = {
  business: p => <_Ic {...p} ch={<><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></>}/>,
  hours:    p => <_Ic {...p} ch={<><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></>}/>,
  blackout: p => <_Ic {...p} ch={<><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></>}/>,
  services: p => <_Ic {...p} ch={<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>}/>,
  capacity: p => <_Ic {...p} ch={<><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><line x1="12" y1="12" x2="12" y2="16"/><line x1="10" y1="14" x2="14" y2="14"/></>}/>,
  sms:      p => <_Ic {...p} ch={<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>}/>,
  review:   p => <_Ic {...p} ch={<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>}/>,
  reminders:p => <_Ic {...p} ch={<><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></>}/>,
  branding: p => <_Ic {...p} ch={<><circle cx="13.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="10.5" r="2.5"/><circle cx="8.5" cy="7.5" r="2.5"/><circle cx="6.5" cy="12.5" r="2.5"/><path d="M12 20c5-2.5 5-7.5 0-10C7 12.5 7 17.5 12 20z"/></>}/>,
};

const SECTIONS = [
  {id:"business", label:"Business info"},
  {id:"hours",    label:"Hours"},
  {id:"blackout", label:"Blackout dates"},
  {id:"services", label:"Services"},
  {id:"capacity", label:"Capacity"},
  {id:"sms",      label:"SMS templates"},
  {id:"review",   label:"Google review"},
  {id:"reminders",label:"Reminders"},
  {id:"branding", label:"Branding"},
];

// ── Primitives — each calls getT() at render time ─────────────────────────────
function Inp({value, onChange, placeholder, type="text", disabled=false, style={}}) {
  const T = getT();
  const [f, setF] = useState(false);
  return (
    <input type={type} value={value ?? ""} onChange={onChange} placeholder={placeholder} disabled={disabled}
      onFocus={() => setF(true)} onBlur={() => setF(false)}
      style={{ width:"100%", background:T.pageBg, border:`1.5px solid ${f?T.blue:T.border}`, borderRadius:T.r8,
        padding:"10px 12px", color:T.textPrimary, fontSize:13, fontFamily:T.font, outline:"none",
        boxSizing:"border-box", opacity:disabled?0.5:1, transition:"border-color .14s", ...style }}/>
  );
}

function Sel({value, onChange, options, style={}}) {
  const T = getT();
  const [f, setF] = useState(false);
  return (
    <select value={value ?? ""} onChange={onChange} onFocus={() => setF(true)} onBlur={() => setF(false)}
      style={{ width:"100%", background:T.pageBg, border:`1.5px solid ${f?T.blue:T.border}`, borderRadius:T.r8,
        padding:"10px 12px", color:T.textPrimary, fontSize:13, fontFamily:T.font, outline:"none",
        boxSizing:"border-box", cursor:"pointer", ...style }}>
      {options.map(o => <option key={o.value ?? o} value={o.value ?? o} style={{background:T.cardBg}}>{o.label ?? o}</option>)}
    </select>
  );
}

function Textarea({value, onChange, placeholder, rows=3}) {
  const T = getT(); // ← was missing, causing blank sections
  const [f, setF] = useState(false);
  return (
    <textarea value={value ?? ""} onChange={onChange} placeholder={placeholder} rows={rows}
      onFocus={() => setF(true)} onBlur={() => setF(false)}
      style={{ width:"100%", background:T.pageBg, border:`1.5px solid ${f?T.blue:T.border}`, borderRadius:T.r8,
        padding:"10px 12px", color:T.textPrimary, fontSize:12, fontFamily:"'Fira Mono',monospace", outline:"none",
        boxSizing:"border-box", resize:"vertical", lineHeight:1.65 }}/>
  );
}

function Toggle({checked, onChange, label}) {
  const T = getT();
  return (
    <label style={{ display:"flex", alignItems:"center", gap:10, cursor:"pointer", userSelect:"none" }}>
      <div onClick={onChange} style={{ width:40, height:22, borderRadius:20, position:"relative", flexShrink:0,
        background:checked?T.green:T.elevated, border:`1.5px solid ${checked?T.greenBorder:T.border}`, cursor:"pointer", transition:"background .2s" }}>
        <div style={{ position:"absolute", top:2, left:checked?18:2, width:14, height:14, borderRadius:"50%",
          background:checked?T.greenText:T.textMuted, transition:"left .2s" }}/>
      </div>
      <span style={{ fontSize:13, color:checked?T.greenText:T.textMuted }}>{label}</span>
    </label>
  );
}

function FRow({label, hint, children}) {
  const T = getT();
  return (
    <div style={{ display:"flex", alignItems:"flex-start", gap:16, marginBottom:16, flexWrap:"wrap" }}>
      <div style={{ minWidth:160, paddingTop:2 }}>
        <div style={{ fontSize:13, fontWeight:500, color:T.textPrimary }}>{label}</div>
        {hint && <div style={{ fontSize:11, color:T.textMuted, marginTop:2, lineHeight:1.5 }}>{hint}</div>}
      </div>
      <div style={{ flex:1, minWidth:180 }}>{children}</div>
    </div>
  );
}

function STitle({children, sub}) {
  const T = getT();
  return (
    <div style={{ marginBottom:20, paddingBottom:10, borderBottom:`1px solid ${T.border}` }}>
      <div style={{ fontSize:15, fontWeight:700, color:T.textPrimary }}>{children}</div>
      {sub && <div style={{ fontSize:12, color:T.textMuted, marginTop:4, lineHeight:1.5 }}>{sub}</div>}
    </div>
  );
}

function Note({children, color="elevated"}) {
  const T = getT();
  const bg = {elevated:T.elevated, blue:T.blueSubtle, amber:T.amberBg}[color] || T.elevated;
  const bd = {elevated:T.border,   blue:T.blueMuted,  amber:T.amberBorder}[color] || T.border;
  const cl = {elevated:T.textSecond,blue:T.blueBright,amber:T.amberText}[color] || T.textSecond;
  return (
    <div style={{ padding:"10px 14px", background:bg, border:`1px solid ${bd}`, borderRadius:T.r10,
      fontSize:12, color:cl, lineHeight:1.7, marginBottom:16 }}>{children}</div>
  );
}

// ── Section components — all call getT() at top ───────────────────────────────
function SBusiness({s, set}) {
  const T = getT();
  return (
    <>
      <STitle sub="Shop name is used in all SMS messages as {shopName}.">Business info</STitle>
      <FRow label="Shop name" hint="Used as {shopName} in SMS">
        <Inp value={s.shopName} onChange={e => set("shopName", e.target.value)} placeholder="Roadstar Tire"/>
      </FRow>
      <FRow label="Phone number">
        <Inp value={s.phone} onChange={e => set("phone", e.target.value)} placeholder="+1 (416) 555-0000"/>
      </FRow>
      <FRow label="Address">
        <Inp value={s.address} onChange={e => set("address", e.target.value)} placeholder="123 Main St, Toronto, ON"/>
      </FRow>
      <FRow label="Timezone" hint="Used for scheduling, reminders, and Live at Bay">
        <Sel value={s.timezone} onChange={e => set("timezone", e.target.value)} options={TZS.map(t => ({value:t,label:t}))}/>
      </FRow>
    </>
  );
}

function SHours({s, set}) {
  const T = getT();
  return (
    <>
      <STitle sub="Changes here immediately affect the Shopify booking form.">Business hours</STitle>
      <div style={{ background:T.elevated, border:`1px solid ${T.border}`, borderRadius:T.r12, overflow:"hidden", marginBottom:12 }}>
        {DAYS.map((day, i) => {
          const dh = s.hours?.[i] || {open:null, close:null};
          const closed = !dh.open || !dh.close;
          return (
            <div key={i} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 18px",
              borderBottom:i<6?`1px solid ${T.border}`:"none", flexWrap:"wrap" }}>
              <div style={{ width:96, fontSize:13, fontWeight:500, color:T.textPrimary }}>{day}</div>
              <Toggle checked={!closed} onChange={() => {
                if (closed) set(`hours.${i}`, {open:"09:00", close:"18:00"});
                else        set(`hours.${i}`, {open:null,    close:null});
              }} label={closed ? "Closed" : "Open"}/>
              {!closed && <>
                <input type="time" value={dh.open || "09:00"} onChange={e => set(`hours.${i}.open`, e.target.value)}
                  style={{ background:T.pageBg, border:`1.5px solid ${T.border}`, borderRadius:T.r8, padding:"7px 10px",
                    color:T.textPrimary, fontSize:12, fontFamily:T.font, outline:"none", colorScheme:"dark" }}/>
                <span style={{ color:T.textMuted, fontSize:12 }}>to</span>
                <input type="time" value={dh.close || "18:00"} onChange={e => set(`hours.${i}.close`, e.target.value)}
                  style={{ background:T.pageBg, border:`1.5px solid ${T.border}`, borderRadius:T.r8, padding:"7px 10px",
                    color:T.textPrimary, fontSize:12, fontFamily:T.font, outline:"none", colorScheme:"dark" }}/>
              </>}
            </div>
          );
        })}
      </div>
    </>
  );
}

function SBlackout({s, set}) {
  const T = getT();
  const dates = s.blackoutDates || [];
  return (
    <>
      <STitle sub="Block entire days — holidays, closures, or any day you're not accepting bookings.">Blackout dates</STitle>
      {dates.length === 0 && (
        <div style={{ fontSize:12, color:T.textMuted, padding:"12px 0", marginBottom:8 }}>No blackout dates set.</div>
      )}
      <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:14 }}>
        {dates.map((d, i) => (
          <div key={i} style={{ display:"flex", gap:8, alignItems:"center" }}>
            <input type="date" value={d} onChange={e => { const dd=[...dates]; dd[i]=e.target.value; set("blackoutDates",dd); }}
              style={{ background:T.pageBg, border:`1.5px solid ${T.border}`, borderRadius:T.r8, padding:"9px 12px",
                color:T.textPrimary, fontSize:13, fontFamily:T.font, outline:"none", colorScheme:"dark" }}/>
            <button onClick={() => set("blackoutDates", dates.filter((_,j) => j!==i))}
              style={{ background:T.redBg, border:`1px solid ${T.redBorder}`, borderRadius:T.r8,
                padding:"9px 14px", color:T.redText, fontSize:12, fontFamily:T.font, cursor:"pointer" }}>
              Remove
            </button>
          </div>
        ))}
      </div>
      <button onClick={() => set("blackoutDates", [...dates, ""])}
        style={{ background:"transparent", border:`1px solid ${T.border}`, borderRadius:T.r8,
          padding:"9px 16px", color:T.textSecond, fontSize:12, fontFamily:T.font, cursor:"pointer" }}>
        + Add blackout date
      </button>
    </>
  );
}

function SServices({s, set}) {
  const T = getT();
  const svcs = s.services || [];
  return (
    <>
      <STitle sub="Changes immediately update the Shopify booking form — no code changes needed.">Services</STitle>
      <Note color="blue">Duration, bay type, and active state are reflected live on the booking form after saving.</Note>
      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        {svcs.map((svc, i) => (
          <div key={i} style={{ background:T.elevated, border:`1px solid ${svc.active!==false?T.borderVis:T.border}`, borderRadius:T.r12, padding:"16px" }}>
            <div style={{ display:"flex", gap:10, flexWrap:"wrap", alignItems:"center", marginBottom:12 }}>
              <Inp value={svc.name} onChange={e => { const sv=[...svcs]; sv[i]={...sv[i],name:e.target.value}; set("services",sv); }}
                placeholder="Service name" style={{ flex:"1 1 160px", minWidth:120, fontSize:14, fontWeight:600 }}/>
              <Toggle checked={svc.active !== false}
                onChange={() => { const sv=[...svcs]; sv[i]={...sv[i],active:!(svc.active!==false)}; set("services",sv); }}
                label={svc.active !== false ? "Active" : "Inactive"}/>
              <button onClick={() => set("services", svcs.filter((_,j) => j!==i))}
                style={{ background:T.redBg, border:`1px solid ${T.redBorder}`, borderRadius:T.r8,
                  padding:"6px 11px", color:T.redText, fontSize:11, fontFamily:T.font, cursor:"pointer" }}>
                Remove
              </button>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))", gap:10 }}>
              <div>
                <div style={{ fontSize:10, color:T.textMuted, marginBottom:4, textTransform:"uppercase", letterSpacing:"0.06em" }}>Duration (min)</div>
                <Inp type="number" value={svc.service_duration}
                  onChange={e => { const sv=[...svcs]; sv[i]={...sv[i],service_duration:Number(e.target.value)}; set("services",sv); }}/>
              </div>
              <div>
                <div style={{ fontSize:10, color:T.textMuted, marginBottom:4, textTransform:"uppercase", letterSpacing:"0.06em" }}>Recovery (min)</div>
                <Inp type="number" value={svc.equipment_recovery_time || 0}
                  onChange={e => { const sv=[...svcs]; sv[i]={...sv[i],equipment_recovery_time:Number(e.target.value)}; set("services",sv); }}/>
              </div>
              <div>
                <div style={{ fontSize:10, color:T.textMuted, marginBottom:4, textTransform:"uppercase", letterSpacing:"0.06em" }}>Resource pool</div>
                <Sel value={svc.resourcePool || "none"}
                  onChange={e => { const sv=[...svcs]; sv[i]={...sv[i],resourcePool:e.target.value}; set("services",sv); }}
                  options={[{value:"bay",label:"Bay"},{value:"alignment",label:"Alignment lane"},{value:"none",label:"No bay"}]}/>
              </div>
            </div>
          </div>
        ))}
      </div>
      <button onClick={() => set("services", [...svcs, {name:"New Service",service_duration:30,equipment_recovery_time:0,resourcePool:"none",active:true}])}
        style={{ marginTop:12, background:"transparent", border:`1px solid ${T.border}`, borderRadius:T.r8,
          padding:"9px 16px", color:T.textSecond, fontSize:12, fontFamily:T.font, cursor:"pointer" }}>
        + Add service
      </button>
    </>
  );
}

function SCapacity({s, set}) {
  const T = getT();
  return (
    <>
      <STitle sub="Controls how many cars can be booked simultaneously.">Capacity</STitle>
      <Note color="amber">Changes are live immediately on the booking form after saving.</Note>
      <FRow label="Normal bay count" hint="Confirmed bookings consume one bay slot each.">
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <Inp type="number" value={s.bayCount || 3} onChange={e => set("bayCount", Math.max(1, Number(e.target.value)))} style={{width:90}}/>
          <span style={{ fontSize:12, color:T.textMuted }}>{s.bayCount || 3} bay{(s.bayCount||3)!==1?"s":""}</span>
        </div>
      </FRow>
      <FRow label="Alignment lane">
        <Toggle checked={s.alignmentLaneEnabled !== false}
          onChange={() => set("alignmentLaneEnabled", !(s.alignmentLaneEnabled!==false))}
          label={s.alignmentLaneEnabled !== false ? "Enabled — separate from normal bays" : "Disabled"}/>
      </FRow>
      {s.alignmentLaneEnabled !== false && (
        <FRow label="Alignment capacity" hint="Usually 1.">
          <Inp type="number" value={s.alignmentCapacity || 1} onChange={e => set("alignmentCapacity", Math.max(1, Number(e.target.value)))} style={{width:90}}/>
        </FRow>
      )}
    </>
  );
}

function SSMS({s, set}) {
  const T = getT();
  const TMPL = [
    {key:"confirmed",            label:"Appointment confirmed",    hint:"Sent when staff confirms"},
    {key:"declined",             label:"Declined / cancelled",     hint:"Sent when staff cancels"},
    {key:"waitlist",             label:"Waitlist spot opened",     hint:"Sent when a spot opens"},
    {key:"reminder",             label:"Reminder",                 hint:"Sent automatically before appointment"},
    {key:"completed_review",     label:"Completed + review link",  hint:"Use {reviewLink} variable"},
    {key:"completed_no_review",  label:"Completed — no review",    hint:"Simple thank-you"},
    {key:"no_show",              label:"No-show",                  hint:"Sent when marked as no-show"},
  ];
  return (
    <>
      <STitle sub="Leave blank to use system defaults. Variables are replaced with real values when sent.">SMS templates</STitle>
      <div style={{ padding:"10px 14px", background:T.elevated, border:`1px solid ${T.border}`, borderRadius:T.r10, marginBottom:20, fontSize:12, color:T.textSecond, lineHeight:1.8 }}>
        <div style={{ fontWeight:600, color:T.textPrimary, marginBottom:6 }}>Available variables</div>
        {["{firstName}","{shopName}","{date}","{time}","{service}","{reviewLink}"].map(v => (
          <code key={v} style={{ display:"inline-block", background:T.pageBg, border:`1px solid ${T.border}`,
            padding:"1px 7px", borderRadius:4, marginRight:6, marginBottom:4, color:T.blueBright, fontFamily:"monospace", fontSize:11 }}>{v}</code>
        ))}
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
        {TMPL.map(({key, label, hint}) => (
          <div key={key} style={{ background:T.elevated, border:`1px solid ${T.border}`, borderRadius:T.r12, padding:"16px" }}>
            <div style={{ fontSize:13, fontWeight:600, color:T.textPrimary, marginBottom:2 }}>{label}</div>
            <div style={{ fontSize:11, color:T.textMuted, marginBottom:10 }}>{hint}</div>
            <Textarea value={s.smsTemplates?.[key] || ""} rows={3}
              onChange={e => set(`smsTemplates.${key}`, e.target.value)}
              placeholder="Leave blank to use system default"/>
            {(s.smsTemplates?.[key] || "").length > 0 && (
              <div style={{ display:"flex", justifyContent:"space-between", marginTop:6 }}>
                <span style={{ fontSize:11, color:T.textMuted }}>{(s.smsTemplates?.[key] || "").length} chars</span>
                <button onClick={() => set(`smsTemplates.${key}`, "")}
                  style={{ background:"none", border:"none", color:T.textMuted, fontSize:11, cursor:"pointer", fontFamily:T.font }}>
                  Reset to default
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}

function SReview({s, set}) {
  const T = getT();
  return (
    <>
      <STitle sub="Paste your Google Business review link. Replaces {reviewLink} in completion SMS.">Google review link</STitle>
      <FRow label="Review URL">
        <Inp value={s.googleReviewLink} onChange={e => set("googleReviewLink", e.target.value)}
          placeholder="https://g.page/r/XXXX/review"/>
      </FRow>
      {s.googleReviewLink && (
        <div style={{ fontSize:11, color:T.tealText, marginBottom:16, wordBreak:"break-all" }}>
          <a href={s.googleReviewLink} target="_blank" rel="noopener noreferrer" style={{color:T.tealText}}>{s.googleReviewLink}</a>
        </div>
      )}
      <Note>To get your link: Google Business Profile → Get more reviews → copy the link.</Note>
    </>
  );
}

function SReminders({s, set}) {
  const T = getT();
  return (
    <>
      <STitle sub="Automatic SMS reminders sent to customers before their appointment.">Reminders</STitle>
      <FRow label="Enable reminders">
        <Toggle checked={s.reminderEnabled !== false}
          onChange={() => set("reminderEnabled", !(s.reminderEnabled!==false))}
          label={s.reminderEnabled !== false ? "Reminders on" : "Reminders off"}/>
      </FRow>
      {s.reminderEnabled !== false && (
        <FRow label="Minutes before" hint="Default: 30 minutes before the appointment">
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <Inp type="number" value={s.reminderMinutes || 30}
              onChange={e => set("reminderMinutes", Math.max(5, Number(e.target.value)))} style={{width:90}}/>
            <span style={{ fontSize:12, color:T.textMuted }}>minutes before</span>
          </div>
        </FRow>
      )}
    </>
  );
}

function SBranding({s, set}) {
  const T = getT();
  return (
    <>
      <STitle sub="Visual customization for the customer-facing booking form.">Branding</STitle>
      <FRow label="Logo URL" hint="Displayed at the top of the booking form.">
        <Inp value={s.logoUrl} onChange={e => set("logoUrl", e.target.value)} placeholder="https://your-shop.com/logo.png"/>
        {s.logoUrl && (
          <div style={{ marginTop:8 }}>
            <img src={s.logoUrl} alt="Logo" onError={e => e.target.style.display="none"}
              style={{ height:36, borderRadius:T.r8, background:T.elevated, border:`1px solid ${T.border}`, padding:4 }}/>
          </div>
        )}
      </FRow>
      <FRow label="Primary colour" hint="Button and accent colour on the booking form.">
        <div style={{ display:"flex", gap:12, alignItems:"center", flexWrap:"wrap" }}>
          <input type="color" value={s.primaryColor || "#2563EB"} onChange={e => set("primaryColor", e.target.value)}
            style={{ width:44, height:36, borderRadius:T.r8, border:`1.5px solid ${T.border}`, background:"none", cursor:"pointer", padding:2 }}/>
          <Inp value={s.primaryColor || "#2563EB"} onChange={e => set("primaryColor", e.target.value)} style={{width:130}}/>
          <div style={{ width:36, height:36, borderRadius:T.r8, background:s.primaryColor||"#2563EB", border:`1px solid ${T.border}`, flexShrink:0 }}/>
        </div>
      </FRow>
    </>
  );
}

// ── Section map — lazy (only renders current section) ─────────────────────────
const SECTION_COMPONENTS = {
  business: SBusiness,
  hours:    SHours,
  blackout: SBlackout,
  services: SServices,
  capacity: SCapacity,
  sms:      SSMS,
  review:   SReview,
  reminders:SReminders,
  branding: SBranding,
};

// ── Root ──────────────────────────────────────────────────────────────────────
export default function SettingsPage({onAlert}) {
  const T = getT();
  const [settings, setSettings] = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(false);
  const [error,    setError]    = useState("");
  const [dirty,    setDirty]    = useState(false);
  const [section,  setSection]  = useState("business");
  // Mobile: show section list or section content
  const [mobileShowContent, setMobileShowContent] = useState(false);

  const load = useCallback(async () => {
    try { const s = await fetchSettings(); setSettings(s); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const set = useCallback((path, value) => {
    setSettings(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      const keys = path.split(".");
      let obj = next;
      for (let i = 0; i < keys.length - 1; i++) {
        if (obj[keys[i]] === undefined || obj[keys[i]] === null || typeof obj[keys[i]] !== "object") {
          obj[keys[i]] = {};
        }
        obj = obj[keys[i]];
      }
      obj[keys[keys.length - 1]] = value;
      return next;
    });
    setDirty(true);
    setSaved(false);
  }, []);

  const save = async () => {
    setSaving(true); setError("");
    try {
      const updated = await updateSettings(settings);
      setSettings(updated); setSaved(true); setDirty(false);
      onAlert?.("Settings saved. Changes are live immediately.");
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setError(e.message);
      onAlert?.(e.message, "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{padding:"40px 0",textAlign:"center",color:T.textMuted,fontSize:13}}>Loading settings…</div>;
  if (!settings) return <div style={{color:T.redText,fontSize:13,padding:16}}>{error || "Could not load settings."}</div>;

  const p = { s: settings, set };
  const ActiveSection = SECTION_COMPONENTS[section];

  const handleSelectSection = (id) => {
    setSection(id);
    setMobileShowContent(true);
  };

  // ── Sidebar list ─────────────────────────────────────────────────────────
  const SidebarNav = () => (
    <div style={{ background:T.cardBg, border:`1px solid ${T.border}`, borderRadius:T.r12, overflow:"hidden" }}>
      {SECTIONS.map(({ id, label }) => {
        const a = section === id;
        return (
          <button key={id} onClick={() => handleSelectSection(id)}
            style={{ display:"flex", alignItems:"center", gap:10, width:"100%", padding:"12px 14px",
              background:a ? T.elevated : "transparent", border:"none",
              borderLeft:`3px solid ${a ? T.blue : "transparent"}`,
              color:a ? T.textPrimary : T.textMuted, fontSize:13, fontFamily:T.font, cursor:"pointer",
              textAlign:"left", transition:"all .12s", borderBottom:`1px solid ${T.border}` }}>
            <span style={{flexShrink:0}}>{SIcon[id] ? SIcon[id]({s:14, color:a?T.blue:T.textMuted}) : null}</span>
            <span style={{fontWeight:a?600:400,flex:1}}>{label}</span>
            {/* Mobile chevron */}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T.textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:"none"}} className="rs-chevron">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
        );
      })}
    </div>
  );

  // ── Save bar ──────────────────────────────────────────────────────────────
  const SaveBar = () => (
    <div style={{ position:"sticky", bottom:0, background:T.panelBg, borderTop:`1px solid ${T.border}`,
      padding:"14px 0", marginTop:24, display:"flex", alignItems:"center", gap:14 }}>
      <button onClick={save} disabled={saving}
        style={{ padding:"10px 28px", borderRadius:T.r8, background:saved?T.greenBg:T.blue,
          border:`1px solid ${saved?T.greenBorder:T.blue}`, color:saved?T.greenText:"#fff",
          fontSize:13, fontWeight:600, fontFamily:T.font, cursor:saving?"not-allowed":"pointer",
          opacity:saving?0.6:1, transition:"all .2s" }}>
        {saving ? "Saving…" : saved ? "Saved" : "Save changes"}
      </button>
      {error && <span style={{fontSize:12, color:T.redText}}>{error}</span>}
      {!error && dirty && !saving && !saved && <span style={{fontSize:12, color:T.textMuted}}>Unsaved changes</span>}
    </div>
  );

  return (
    <>
      {/* ── Desktop layout (≥768px) ── */}
      <div className="rs-settings-desktop" style={{ display:"flex", gap:0, minHeight:500, alignItems:"flex-start" }}>
        {/* Sidebar */}
        <div style={{ width:200, flexShrink:0, marginRight:24, position:"sticky", top:80 }}>
          <SidebarNav/>
          {dirty && (
            <div style={{ marginTop:10, padding:"8px 12px", background:T.amberBg, border:`1px solid ${T.amberBorder}`,
              borderRadius:T.r8, fontSize:11, color:T.amberText, textAlign:"center" }}>
              Unsaved changes
            </div>
          )}
        </div>
        {/* Content */}
        <div style={{ flex:1, minWidth:0 }}>
          {ActiveSection && <ActiveSection {...p}/>}
          <SaveBar/>
        </div>
      </div>

      {/* ── Mobile layout (<768px) ── */}
      <div className="rs-settings-mobile">
        {!mobileShowContent ? (
          // Show section list
          <div>
            <SidebarNav/>
          </div>
        ) : (
          // Show section content with back button
          <div>
            <button onClick={() => setMobileShowContent(false)}
              style={{ display:"flex", alignItems:"center", gap:8, background:"transparent", border:"none",
                color:T.blue, fontSize:13, fontFamily:T.font, cursor:"pointer", padding:"0 0 16px 0", fontWeight:600 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
              Back to Settings
            </button>
            {ActiveSection && <ActiveSection {...p}/>}
            <SaveBar/>
          </div>
        )}
      </div>

      <style>{`
        .rs-settings-mobile { display: none; }
        @media (max-width: 767px) {
          .rs-settings-desktop { display: none !important; }
          .rs-settings-mobile  { display: block; }
        }
      `}</style>
    </>
  );
}
