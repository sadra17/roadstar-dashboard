// ─────────────────────────────────────────────────────────────────────────────
// SettingsPage.jsx  v8
// Full settings page. Imported into RoadstarDashboard when Settings tab active.
// Sections: Business Info · Hours · Blackout Dates · Services · Capacity ·
//           SMS Templates · Google Review · Reminders · Branding
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback } from "react";
import { fetchSettings, updateSettings } from "./api.js";

const T = {
  pageBg:"#07090f", cardBg:"#0d1120", elevated:"#171e30",
  border:"#1d2b40", borderVis:"#263550",
  blue:"#2563EB", blueLight:"#3B82F6", blueBright:"#60A5FA",
  textPrimary:"#F0F4FF", textSecond:"#8896B0", textMuted:"#49576a",
  green:"#22C55E", greenBg:"#071a0f", greenBorder:"#14532D", greenText:"#86EFAC",
  red:"#EF4444", redBg:"#1a0606", redBorder:"#450a0a", redText:"#FCA5A5",
  amber:"#F59E0B", amberBg:"#1c1200", amberBorder:"#3d2800", amberText:"#FCD34D",
  orange:"#F97316", orangeBg:"#1c0d02", orangeBorder:"#4a2008", orangeText:"#FDB88A",
  teal:"#14B8A6", tealBg:"#042f2e", tealBorder:"#0f3d3a", tealText:"#5eead4",
  font:"'Inter',-apple-system,sans-serif",
  r8:"8px", r10:"10px", r12:"12px",
};

const DAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const RESOURCE_POOLS = ["bay","alignment","none"];
const TIMEZONES = ["America/Toronto","America/Vancouver","America/New_York","America/Chicago","America/Denver","America/Los_Angeles","America/Halifax"];

// ── Primitives ────────────────────────────────────────────────────────────────
function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.09em", textTransform: "uppercase", color: T.textMuted, marginBottom: 12, paddingBottom: 8, borderBottom: `1px solid ${T.border}` }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function FRow({ label, hint, children }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 14, flexWrap: "wrap" }}>
      <div style={{ minWidth: 180, paddingTop: 2 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: T.textPrimary }}>{label}</div>
        {hint && <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2, lineHeight: 1.5 }}>{hint}</div>}
      </div>
      <div style={{ flex: 1, minWidth: 200 }}>{children}</div>
    </div>
  );
}

function Inp({ value, onChange, placeholder, type="text", disabled=false, style={} }) {
  const [f, setF] = useState(false);
  return (
    <input type={type} value={value||""} onChange={onChange} placeholder={placeholder} disabled={disabled}
      onFocus={()=>setF(true)} onBlur={()=>setF(false)}
      style={{ width:"100%", background:T.pageBg, border:`1.5px solid ${f?T.blue:T.border}`, borderRadius:T.r8,
        padding:"10px 12px", color:T.textPrimary, fontSize:13, fontFamily:T.font, outline:"none",
        boxSizing:"border-box", opacity:disabled?0.5:1, transition:"border-color .14s", ...style }}/>
  );
}

function Sel({ value, onChange, options, style={} }) {
  const [f, setF] = useState(false);
  return (
    <select value={value||""} onChange={onChange} onFocus={()=>setF(true)} onBlur={()=>setF(false)}
      style={{ width:"100%", background:T.pageBg, border:`1.5px solid ${f?T.blue:T.border}`, borderRadius:T.r8,
        padding:"10px 12px", color:T.textPrimary, fontSize:13, fontFamily:T.font, outline:"none",
        boxSizing:"border-box", cursor:"pointer", ...style }}>
      {options.map(o=><option key={o.value??o} value={o.value??o} style={{background:"#0d1120"}}>{o.label??o}</option>)}
    </select>
  );
}

function Textarea({ value, onChange, placeholder, rows=3 }) {
  const [f, setF] = useState(false);
  return (
    <textarea value={value||""} onChange={onChange} placeholder={placeholder} rows={rows}
      onFocus={()=>setF(true)} onBlur={()=>setF(false)}
      style={{ width:"100%", background:T.pageBg, border:`1.5px solid ${f?T.blue:T.border}`, borderRadius:T.r8,
        padding:"10px 12px", color:T.textPrimary, fontSize:12, fontFamily:"'Fira Mono',monospace", outline:"none",
        boxSizing:"border-box", resize:"vertical", lineHeight:1.6 }}/>
  );
}

function Toggle({ checked, onChange, label }) {
  return (
    <label style={{ display:"flex", alignItems:"center", gap:10, cursor:"pointer", userSelect:"none" }}>
      <div onClick={onChange} style={{
        width:40, height:22, borderRadius:20, position:"relative", flexShrink:0, transition:"background .2s",
        background: checked ? T.green : T.elevated, border:`1.5px solid ${checked ? T.greenBorder : T.border}`,
        cursor:"pointer",
      }}>
        <div style={{
          position:"absolute", top:2, left: checked ? 18 : 2, width:14, height:14, borderRadius:"50%",
          background: checked ? T.greenText : T.textMuted, transition:"left .2s",
        }}/>
      </div>
      <span style={{ fontSize:13, color: checked ? T.greenText : T.textMuted }}>{label}</span>
    </label>
  );
}

function SaveBtn({ saving, saved, onClick }) {
  return (
    <button onClick={onClick} disabled={saving}
      style={{ padding:"10px 24px", borderRadius:T.r8, background:saved?T.greenBg:T.blue,
        border:`1px solid ${saved?T.greenBorder:T.blue}`, color:saved?T.greenText:"#fff",
        fontSize:13, fontWeight:600, fontFamily:T.font, cursor:saving?"not-allowed":"pointer",
        opacity:saving?0.6:1, transition:"all .2s" }}>
      {saving ? "Saving…" : saved ? "✓ Saved" : "Save Changes"}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export default function SettingsPage({ onAlert }) {
  const [settings, setSettings] = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(false);
  const [error,    setError]    = useState("");

  const load = useCallback(async () => {
    try {
      const s = await fetchSettings();
      setSettings(s);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const set = (path, value) => {
    setSettings(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      const keys = path.split(".");
      let obj = next;
      for (let i = 0; i < keys.length - 1; i++) {
        if (!obj[keys[i]]) obj[keys[i]] = {};
        obj = obj[keys[i]];
      }
      obj[keys[keys.length - 1]] = value;
      return next;
    });
    setSaved(false);
  };

  const save = async () => {
    setSaving(true); setError("");
    try {
      const updated = await updateSettings(settings);
      setSettings(updated);
      setSaved(true);
      onAlert?.("Settings saved successfully.", "info");
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setError(e.message);
      onAlert?.(e.message, "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ padding:"40px 0", textAlign:"center", color:T.textMuted, fontSize:13 }}>Loading settings…</div>;
  if (!settings) return <div style={{ color:T.redText, fontSize:13 }}>{error || "Could not load settings."}</div>;

  const s = settings;

  return (
    <div style={{ maxWidth: 780, padding: "4px 0 60px" }}>

      {error && (
        <div style={{ background:T.redBg, border:`1px solid ${T.redBorder}`, borderRadius:T.r8, padding:"10px 14px", fontSize:13, color:T.redText, marginBottom:16 }}>
          {error}
        </div>
      )}

      {/* ── BUSINESS INFO ─────────────────────────────────────────────────── */}
      <Section title="Business info">
        <FRow label="Shop name" hint="Appears in SMS messages as {shopName}">
          <Inp value={s.shopName} onChange={e=>set("shopName",e.target.value)} placeholder="Roadstar Tire"/>
        </FRow>
        <FRow label="Phone number" hint="Displayed on booking confirmation">
          <Inp value={s.phone} onChange={e=>set("phone",e.target.value)} placeholder="+1 (416) 555-0000"/>
        </FRow>
        <FRow label="Address">
          <Inp value={s.address} onChange={e=>set("address",e.target.value)} placeholder="123 Main St, Toronto, ON"/>
        </FRow>
        <FRow label="Timezone" hint="Used for scheduling, reminders, and Live at Bay">
          <Sel value={s.timezone} onChange={e=>set("timezone",e.target.value)} options={TIMEZONES.map(t=>({value:t,label:t}))}/>
        </FRow>
      </Section>

      {/* ── BUSINESS HOURS ────────────────────────────────────────────────── */}
      <Section title="Business hours">
        <div style={{ background:T.elevated, border:`1px solid ${T.border}`, borderRadius:T.r12, overflow:"hidden" }}>
          {DAYS.map((day, i) => {
            const dh = s.hours?.[i] || { open: null, close: null };
            const isClosed = !dh.open || !dh.close;
            return (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 16px",
                borderBottom: i < 6 ? `1px solid ${T.border}` : "none", flexWrap:"wrap" }}>
                <div style={{ width:90, fontSize:13, fontWeight:500, color:T.textPrimary }}>{day}</div>
                <Toggle checked={!isClosed} onChange={() => {
                  if (isClosed) set(`hours.${i}`, { open:"09:00", close:"18:00" });
                  else          set(`hours.${i}`, { open:null, close:null });
                }} label={isClosed ? "Closed" : "Open"}/>
                {!isClosed && (
                  <>
                    <input type="time" value={dh.open||"09:00"} onChange={e=>set(`hours.${i}.open`,e.target.value)}
                      style={{ background:T.pageBg, border:`1.5px solid ${T.border}`, borderRadius:T.r8, padding:"7px 10px",
                        color:T.textPrimary, fontSize:12, fontFamily:T.font, outline:"none", colorScheme:"dark" }}/>
                    <span style={{ color:T.textMuted, fontSize:12 }}>to</span>
                    <input type="time" value={dh.close||"18:00"} onChange={e=>set(`hours.${i}.close`,e.target.value)}
                      style={{ background:T.pageBg, border:`1.5px solid ${T.border}`, borderRadius:T.r8, padding:"7px 10px",
                        color:T.textPrimary, fontSize:12, fontFamily:T.font, outline:"none", colorScheme:"dark" }}/>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </Section>

      {/* ── BLACKOUT DATES ───────────────────────────────────────────────── */}
      <Section title="Blackout dates">
        <div style={{ fontSize:12, color:T.textMuted, marginBottom:10, lineHeight:1.6 }}>
          Shop will appear closed on these dates. Customers cannot book. Format: YYYY-MM-DD.
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {(s.blackoutDates||[]).map((d, i) => (
            <div key={i} style={{ display:"flex", gap:8, alignItems:"center" }}>
              <input type="date" value={d} onChange={e=>{
                const dates=[...(s.blackoutDates||[])];
                dates[i]=e.target.value;
                set("blackoutDates",dates);
              }} style={{ background:T.pageBg, border:`1.5px solid ${T.border}`, borderRadius:T.r8,
                padding:"8px 12px", color:T.textPrimary, fontSize:13, fontFamily:T.font, outline:"none", colorScheme:"dark" }}/>
              <button onClick={()=>set("blackoutDates",(s.blackoutDates||[]).filter((_,j)=>j!==i))}
                style={{ background:T.redBg, border:`1px solid ${T.redBorder}`, borderRadius:T.r8,
                  padding:"8px 12px", color:T.redText, fontSize:12, fontFamily:T.font, cursor:"pointer" }}>
                Remove
              </button>
            </div>
          ))}
          <button onClick={()=>set("blackoutDates",[...(s.blackoutDates||[]),""])}
            style={{ alignSelf:"flex-start", background:"transparent", border:`1px solid ${T.border}`,
              borderRadius:T.r8, padding:"8px 14px", color:T.textSecond, fontSize:12, fontFamily:T.font, cursor:"pointer" }}>
            + Add date
          </button>
        </div>
      </Section>

      {/* ── SERVICES ─────────────────────────────────────────────────────── */}
      <Section title="Services">
        <div style={{ fontSize:12, color:T.textMuted, marginBottom:12, lineHeight:1.6 }}>
          Each service defines its duration, recovery time, and which resource pool it uses.
          Active = visible to customers. Inactive = hidden from booking form but keeps existing bookings.
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {(s.services||[]).map((svc, i) => (
            <div key={i} style={{ background:T.elevated, border:`1px solid ${T.border}`, borderRadius:T.r12, padding:"14px 16px" }}>
              <div style={{ display:"flex", gap:10, flexWrap:"wrap", alignItems:"center", marginBottom:10 }}>
                <Inp value={svc.name} onChange={e=>{const sv=[...s.services];sv[i]={...sv[i],name:e.target.value};set("services",sv);}}
                  placeholder="Service name" style={{ flex:"1 1 160px", minWidth:140 }}/>
                <Toggle checked={svc.active!==false} onChange={()=>{const sv=[...s.services];sv[i]={...sv[i],active:!(svc.active!==false)};set("services",sv);}}
                  label={svc.active!==false?"Active":"Inactive"}/>
                <button onClick={()=>set("services",(s.services||[]).filter((_,j)=>j!==i))}
                  style={{ background:T.redBg, border:`1px solid ${T.redBorder}`, borderRadius:T.r8,
                    padding:"6px 10px", color:T.redText, fontSize:11, fontFamily:T.font, cursor:"pointer" }}>
                  Remove
                </button>
              </div>
              <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
                <div style={{ flex:"1 1 120px" }}>
                  <div style={{ fontSize:10, color:T.textMuted, marginBottom:4, textTransform:"uppercase", letterSpacing:"0.06em" }}>Duration (min)</div>
                  <Inp type="number" value={svc.service_duration} onChange={e=>{const sv=[...s.services];sv[i]={...sv[i],service_duration:Number(e.target.value)};set("services",sv);}}/>
                </div>
                <div style={{ flex:"1 1 120px" }}>
                  <div style={{ fontSize:10, color:T.textMuted, marginBottom:4, textTransform:"uppercase", letterSpacing:"0.06em" }}>Recovery (min)</div>
                  <Inp type="number" value={svc.equipment_recovery_time||0} onChange={e=>{const sv=[...s.services];sv[i]={...sv[i],equipment_recovery_time:Number(e.target.value)};set("services",sv);}}/>
                </div>
                <div style={{ flex:"1 1 140px" }}>
                  <div style={{ fontSize:10, color:T.textMuted, marginBottom:4, textTransform:"uppercase", letterSpacing:"0.06em" }}>Resource pool</div>
                  <Sel value={svc.resourcePool||"none"} onChange={e=>{const sv=[...s.services];sv[i]={...sv[i],resourcePool:e.target.value};set("services",sv);}}
                    options={RESOURCE_POOLS.map(p=>({ value:p, label:p==="bay"?"Bay (normal)":p==="alignment"?"Alignment lane":"No bay required" }))}/>
                </div>
              </div>
            </div>
          ))}
          <button onClick={()=>set("services",[...(s.services||[]),{ name:"New Service", service_duration:30, equipment_recovery_time:0, resourcePool:"none", active:true }])}
            style={{ alignSelf:"flex-start", background:"transparent", border:`1px solid ${T.border}`, borderRadius:T.r8,
              padding:"8px 14px", color:T.textSecond, fontSize:12, fontFamily:T.font, cursor:"pointer" }}>
            + Add service
          </button>
        </div>
      </Section>

      {/* ── CAPACITY ─────────────────────────────────────────────────────── */}
      <Section title="Capacity">
        <FRow label="Normal bay count" hint="How many cars can be in bays at once (default 3)">
          <Inp type="number" value={s.bayCount||3} onChange={e=>set("bayCount",Number(e.target.value))} style={{ width:100 }}/>
        </FRow>
        <FRow label="Alignment lane">
          <Toggle checked={s.alignmentLaneEnabled!==false} onChange={()=>set("alignmentLaneEnabled",!(s.alignmentLaneEnabled!==false))}
            label={s.alignmentLaneEnabled!==false?"Enabled (separate lane)":"Disabled"}/>
        </FRow>
        {s.alignmentLaneEnabled!==false && (
          <FRow label="Alignment capacity" hint="How many cars in the alignment lane at once (usually 1)">
            <Inp type="number" value={s.alignmentCapacity||1} onChange={e=>set("alignmentCapacity",Number(e.target.value))} style={{ width:100 }}/>
          </FRow>
        )}
      </Section>

      {/* ── SMS TEMPLATES ────────────────────────────────────────────────── */}
      <Section title="SMS templates">
        <div style={{ background:T.amberBg, border:`1px solid ${T.amberBorder}`, borderRadius:T.r8, padding:"10px 14px", marginBottom:14, fontSize:12, color:T.amberText, lineHeight:1.7 }}>
          Available variables: <code style={{ background:"rgba(255,255,255,.08)", padding:"1px 5px", borderRadius:3 }}>{"{firstName}"}</code>{" "}
          <code style={{ background:"rgba(255,255,255,.08)", padding:"1px 5px", borderRadius:3 }}>{"{shopName}"}</code>{" "}
          <code style={{ background:"rgba(255,255,255,.08)", padding:"1px 5px", borderRadius:3 }}>{"{date}"}</code>{" "}
          <code style={{ background:"rgba(255,255,255,.08)", padding:"1px 5px", borderRadius:3 }}>{"{time}"}</code>{" "}
          <code style={{ background:"rgba(255,255,255,.08)", padding:"1px 5px", borderRadius:3 }}>{"{service}"}</code>{" "}
          <code style={{ background:"rgba(255,255,255,.08)", padding:"1px 5px", borderRadius:3 }}>{"{reviewLink}"}</code>
        </div>
        {[
          { key:"confirmed",           label:"Confirmed",              hint:"Sent when staff confirms appointment" },
          { key:"declined",            label:"Declined / Cancelled",   hint:"Sent when appointment is cancelled" },
          { key:"waitlist",            label:"Waitlist",               hint:"Sent when a spot opens" },
          { key:"reminder",            label:"Reminder",               hint:"Sent 30 min before appointment" },
          { key:"completed_review",    label:"Completed + Review",     hint:"Review link must end with \\n{reviewLink}" },
          { key:"completed_no_review", label:"Completed — No Review",  hint:"Simple thank-you" },
          { key:"no_show",             label:"No-show",                hint:"Sent when marked as no-show" },
        ].map(({ key, label, hint }) => (
          <div key={key} style={{ marginBottom:18 }}>
            <div style={{ fontSize:12, fontWeight:600, color:T.textPrimary, marginBottom:3 }}>{label}</div>
            <div style={{ fontSize:11, color:T.textMuted, marginBottom:6 }}>{hint}</div>
            <Textarea value={s.smsTemplates?.[key]||""} rows={3}
              onChange={e=>set(`smsTemplates.${key}`,e.target.value)}
              placeholder={`Default template for "${label}"`}/>
          </div>
        ))}
      </Section>

      {/* ── GOOGLE REVIEW ────────────────────────────────────────────────── */}
      <Section title="Google review link">
        <FRow label="Review URL" hint="Paste your Google review link. Used in {reviewLink} in the completed_review SMS.">
          <Inp value={s.googleReviewLink} onChange={e=>set("googleReviewLink",e.target.value)}
            placeholder="https://g.page/r/CYPKn0GrR0t3EBM/review"/>
        </FRow>
        {s.googleReviewLink && (
          <div style={{ fontSize:11, color:T.tealText, marginTop:-6, marginBottom:10, paddingLeft:196 }}>
            Preview: <a href={s.googleReviewLink} target="_blank" rel="noopener noreferrer" style={{ color:T.tealText }}>{s.googleReviewLink}</a>
          </div>
        )}
      </Section>

      {/* ── REMINDERS ────────────────────────────────────────────────────── */}
      <Section title="Appointment reminders">
        <FRow label="Enable reminders">
          <Toggle checked={s.reminderEnabled!==false} onChange={()=>set("reminderEnabled",!(s.reminderEnabled!==false))}
            label={s.reminderEnabled!==false?"Reminders on":"Reminders off"}/>
        </FRow>
        {s.reminderEnabled!==false && (
          <FRow label="Minutes before" hint="Send reminder this many minutes before appointment (default 30)">
            <Inp type="number" value={s.reminderMinutes||30} onChange={e=>set("reminderMinutes",Number(e.target.value))} style={{ width:100 }}/>
          </FRow>
        )}
      </Section>

      {/* ── BRANDING ─────────────────────────────────────────────────────── */}
      <Section title="Branding">
        <FRow label="Logo URL" hint="Full URL to a PNG or SVG logo. Shown in the booking form header.">
          <Inp value={s.logoUrl} onChange={e=>set("logoUrl",e.target.value)} placeholder="https://your-shop.com/logo.png"/>
        </FRow>
        <FRow label="Primary colour" hint="Used as the accent colour in the booking form.">
          <div style={{ display:"flex", gap:10, alignItems:"center" }}>
            <input type="color" value={s.primaryColor||"#2563EB"} onChange={e=>set("primaryColor",e.target.value)}
              style={{ width:44, height:36, borderRadius:T.r8, border:`1.5px solid ${T.border}`, background:"none", cursor:"pointer", padding:2 }}/>
            <Inp value={s.primaryColor||"#2563EB"} onChange={e=>set("primaryColor",e.target.value)} style={{ width:120 }}/>
          </div>
        </FRow>
      </Section>

      {/* ── SAVE ─────────────────────────────────────────────────────────── */}
      <div style={{ borderTop:`1px solid ${T.border}`, paddingTop:20, display:"flex", alignItems:"center", gap:14 }}>
        <SaveBtn saving={saving} saved={saved} onClick={save}/>
        <span style={{ fontSize:12, color:T.textMuted }}>Changes apply immediately after saving.</span>
      </div>

    </div>
  );
}
