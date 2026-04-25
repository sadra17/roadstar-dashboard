// SettingsPage.jsx  v9-final
// Root cause of blank sections: lib/db.js toCamel() converts JSONB nested keys
// service_duration → serviceDuration, equipment_recovery_time → equipmentRecoveryTime
// This file reads camelCase AND writes both camelCase+snake_case for compatibility
import { useState, useEffect, useCallback } from "react";
import { fetchSettings, updateSettings } from "./api.js";

function getT() {
  const dark = typeof localStorage==="undefined"||localStorage.getItem("rs_theme")!=="light";
  return dark ? {
    pageBg:"#07090f",cardBg:"#0d1120",elevated:"#111827",panelBg:"#0f1422",
    border:"#1d2b40",borderVis:"#263550",blue:"#2563EB",blueBright:"#60A5FA",
    blueSubtle:"#0c1a35",blueMuted:"#172554",textPrimary:"#F0F4FF",
    textSecond:"#8896B0",textMuted:"#49576a",green:"#22C55E",greenBg:"#071a0f",
    greenBorder:"#14532D",greenText:"#86EFAC",red:"#EF4444",redBg:"#1a0606",
    redBorder:"#450a0a",redText:"#FCA5A5",amber:"#F59E0B",amberBg:"#1c1200",
    amberBorder:"#3d2800",amberText:"#FCD34D",teal:"#14B8A6",tealBg:"#042f2e",
    tealBorder:"#0f3d3a",tealText:"#5eead4",font:"'Inter',-apple-system,sans-serif",
    r8:"8px",r10:"10px",r12:"12px",
  } : {
    pageBg:"#f0f2f5",cardBg:"#ffffff",elevated:"#f8f9fc",panelBg:"#ffffff",
    border:"#e2e8f0",borderVis:"#cbd5e1",blue:"#2563EB",blueBright:"#1d4ed8",
    blueSubtle:"#eff6ff",blueMuted:"#dbeafe",textPrimary:"#0f172a",
    textSecond:"#475569",textMuted:"#94a3b8",green:"#16a34a",greenBg:"#f0fdf4",
    greenBorder:"#bbf7d0",greenText:"#15803d",red:"#dc2626",redBg:"#fef2f2",
    redBorder:"#fecaca",redText:"#dc2626",amber:"#d97706",amberBg:"#fffbeb",
    amberBorder:"#fde68a",amberText:"#b45309",teal:"#0d9488",tealBg:"#f0fdfa",
    tealBorder:"#99f6e4",tealText:"#0f766e",font:"'Inter',-apple-system,sans-serif",
    r8:"8px",r10:"10px",r12:"12px",
  };
}

const DAYS=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const TZS=["America/Toronto","America/Vancouver","America/New_York","America/Chicago","America/Denver","America/Los_Angeles","America/Halifax","Europe/London"];
const SECTIONS=[
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

// Primitives
function Inp({value,onChange,placeholder,type="text",sx={}}) {
  const T=getT(); const [f,setF]=useState(false);
  return <input type={type} value={value??""} onChange={onChange} placeholder={placeholder}
    onFocus={()=>setF(true)} onBlur={()=>setF(false)}
    style={{width:"100%",background:T.pageBg,border:`1.5px solid ${f?T.blue:T.border}`,
      borderRadius:T.r8,padding:"10px 12px",color:T.textPrimary,fontSize:13,
      fontFamily:T.font,outline:"none",boxSizing:"border-box",transition:"border-color .14s",...sx}}/>;
}
function Sel({value,onChange,options}) {
  const T=getT(); const [f,setF]=useState(false);
  return <select value={value??""} onChange={onChange} onFocus={()=>setF(true)} onBlur={()=>setF(false)}
    style={{width:"100%",background:T.pageBg,border:`1.5px solid ${f?T.blue:T.border}`,
      borderRadius:T.r8,padding:"10px 12px",color:T.textPrimary,fontSize:13,
      fontFamily:T.font,outline:"none",boxSizing:"border-box",cursor:"pointer"}}>
    {options.map(o=><option key={o.value??o} value={o.value??o} style={{background:T.cardBg}}>{o.label??o}</option>)}
  </select>;
}
function Textarea({value,onChange,placeholder,rows=3}) {
  const T=getT(); const [f,setF]=useState(false);
  return <textarea value={value??""} onChange={onChange} placeholder={placeholder} rows={rows}
    onFocus={()=>setF(true)} onBlur={()=>setF(false)}
    style={{width:"100%",background:T.pageBg,border:`1.5px solid ${f?T.blue:T.border}`,
      borderRadius:T.r8,padding:"10px 12px",color:T.textPrimary,fontSize:12,
      fontFamily:"monospace",outline:"none",boxSizing:"border-box",resize:"vertical",lineHeight:1.65}}/>;
}
function Toggle({checked,onChange,label}) {
  const T=getT();
  return <label style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer"}}>
    <div onClick={onChange} style={{width:40,height:22,borderRadius:20,position:"relative",flexShrink:0,
      background:checked?T.green:T.elevated,border:`1.5px solid ${checked?T.greenBorder:T.border}`,cursor:"pointer",transition:"background .2s"}}>
      <div style={{position:"absolute",top:2,left:checked?18:2,width:14,height:14,borderRadius:"50%",
        background:checked?T.greenText:T.textMuted,transition:"left .2s"}}/>
    </div>
    <span style={{fontSize:13,color:checked?T.greenText:T.textMuted}}>{label}</span>
  </label>;
}
function H({children,sub}) {
  const T=getT();
  return <div style={{marginBottom:18,paddingBottom:10,borderBottom:`1px solid ${T.border}`}}>
    <div style={{fontSize:15,fontWeight:700,color:T.textPrimary}}>{children}</div>
    {sub&&<div style={{fontSize:12,color:T.textMuted,marginTop:3,lineHeight:1.5}}>{sub}</div>}
  </div>;
}
function R({label,hint,children}) {
  const T=getT();
  return <div style={{marginBottom:14}}>
    <div style={{fontSize:12,fontWeight:600,color:T.textSecond,marginBottom:hint?2:5}}>{label}</div>
    {hint&&<div style={{fontSize:11,color:T.textMuted,marginBottom:5,lineHeight:1.4}}>{hint}</div>}
    {children}
  </div>;
}
function Note({children}) {
  const T=getT();
  return <div style={{padding:"9px 12px",background:T.blueSubtle,border:`1px solid ${T.blueMuted}`,
    borderRadius:T.r8,fontSize:12,color:T.blueBright,lineHeight:1.6,marginBottom:14}}>{children}</div>;
}

export default function SettingsPage({onAlert}) {
  const T=getT();
  const [s,    setS]   =useState(null);
  const [load, setLoad]=useState(true);
  const [sav,  setSav] =useState(false);
  const [saved,setSaved]=useState(false);
  const [err,  setErr] =useState("");
  const [dirty,setD]   =useState(false);
  const [sec,  setSec] =useState("business");
  const [mob,  setMob] =useState(()=>typeof window!=="undefined"&&window.innerWidth<768);
  const [mobC, setMobC]=useState(false);

  useEffect(()=>{
    const fn=()=>setMob(window.innerWidth<768);
    window.addEventListener("resize",fn); return ()=>window.removeEventListener("resize",fn);
  },[]);

  useEffect(()=>{
    fetchSettings().then(setS).catch(e=>setErr(e.message)).finally(()=>setLoad(false));
  },[]);

  const set=useCallback((path,val)=>{
    setS(prev=>{
      if(!prev) return prev;
      const n=JSON.parse(JSON.stringify(prev));
      const keys=path.split(".");
      let o=n;
      for(let i=0;i<keys.length-1;i++){
        if(o[keys[i]]==null||typeof o[keys[i]]!=="object") o[keys[i]]={};
        o=o[keys[i]];
      }
      o[keys[keys.length-1]]=val;
      return n;
    });
    setD(true); setSaved(false);
  },[]);

  const save=async()=>{
    setSav(true); setErr("");
    try{
      const u=await updateSettings(s);
      setS(u); setSaved(true); setD(false);
      onAlert?.("Settings saved — changes are live on the booking form.");
      setTimeout(()=>setSaved(false),3000);
    }catch(e){setErr(e.message);onAlert?.(e.message,"error");}
    finally{setSav(false);}
  };

  if(load) return <div style={{padding:"40px 0",textAlign:"center",color:T.textMuted,fontSize:13}}>Loading settings…</div>;
  if(!s)   return <div style={{color:T.redText,fontSize:13,padding:16}}>{err||"Could not load settings."}</div>;

  function renderSection() {
    try {
      if(sec==="business") return <>
        <H sub="Shop name is used in all SMS messages as {shopName}.">Business info</H>
        <R label="Shop name" hint="Used as {shopName} in SMS"><Inp value={s.shopName} onChange={e=>set("shopName",e.target.value)} placeholder="Roadstar Tire"/></R>
        <R label="Phone number"><Inp value={s.phone} onChange={e=>set("phone",e.target.value)} placeholder="+1 (416) 555-0000"/></R>
        <R label="Address"><Inp value={s.address} onChange={e=>set("address",e.target.value)} placeholder="123 Main St, Toronto, ON"/></R>
        <R label="Timezone" hint="Used for scheduling and Live at Bay"><Sel value={s.timezone} onChange={e=>set("timezone",e.target.value)} options={TZS.map(t=>({value:t,label:t}))}/></R>
      </>;

      if(sec==="hours") return <>
        <H sub="Changes immediately affect the Shopify booking form.">Business hours</H>
        <div style={{background:T.elevated,border:`1px solid ${T.border}`,borderRadius:T.r12,overflow:"hidden"}}>
          {DAYS.map((day,i)=>{
            const dh=(s.hours?.[i])||(s.hours?.[String(i)])||{open:null,close:null};
            const closed=!dh.open||!dh.close;
            return <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"11px 14px",
              borderBottom:i<6?`1px solid ${T.border}`:"none",flexWrap:"wrap"}}>
              <div style={{width:80,fontSize:13,fontWeight:500,color:T.textPrimary,flexShrink:0}}>{day}</div>
              <Toggle checked={!closed} onChange={()=>{
                if(closed) set(`hours.${i}`,{open:"09:00",close:"18:00"});
                else       set(`hours.${i}`,{open:null,close:null});
              }} label={closed?"Closed":"Open"}/>
              {!closed&&<>
                <input type="time" value={dh.open||"09:00"} onChange={e=>set(`hours.${i}.open`,e.target.value)}
                  style={{background:T.pageBg,border:`1.5px solid ${T.border}`,borderRadius:T.r8,padding:"7px 10px",color:T.textPrimary,fontSize:12,fontFamily:T.font,outline:"none",colorScheme:"dark"}}/>
                <span style={{color:T.textMuted,fontSize:12}}>to</span>
                <input type="time" value={dh.close||"18:00"} onChange={e=>set(`hours.${i}.close`,e.target.value)}
                  style={{background:T.pageBg,border:`1.5px solid ${T.border}`,borderRadius:T.r8,padding:"7px 10px",color:T.textPrimary,fontSize:12,fontFamily:T.font,outline:"none",colorScheme:"dark"}}/>
              </>}
            </div>;
          })}
        </div>
      </>;

      if(sec==="blackout") {
        const dates=s.blackoutDates||[];
        return <>
          <H sub="Block specific days — holidays or closures.">Blackout dates</H>
          {!dates.length&&<div style={{fontSize:12,color:T.textMuted,marginBottom:12}}>No blackout dates set.</div>}
          <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:14}}>
            {dates.map((d,i)=><div key={i} style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
              <input type="date" value={d||""} onChange={e=>{const dd=[...dates];dd[i]=e.target.value;set("blackoutDates",dd);}}
                style={{background:T.pageBg,border:`1.5px solid ${T.border}`,borderRadius:T.r8,padding:"9px 12px",color:T.textPrimary,fontSize:13,fontFamily:T.font,outline:"none",colorScheme:"dark"}}/>
              <button onClick={()=>set("blackoutDates",dates.filter((_,j)=>j!==i))}
                style={{background:T.redBg,border:`1px solid ${T.redBorder}`,borderRadius:T.r8,padding:"9px 14px",color:T.redText,fontSize:12,fontFamily:T.font,cursor:"pointer"}}>Remove</button>
            </div>)}
          </div>
          <button onClick={()=>set("blackoutDates",[...dates,""])}
            style={{background:"transparent",border:`1px solid ${T.border}`,borderRadius:T.r8,padding:"9px 16px",color:T.textSecond,fontSize:12,fontFamily:T.font,cursor:"pointer"}}>
            + Add blackout date
          </button>
        </>;
      }

      if(sec==="services") {
        // toCamel converts service_duration→serviceDuration, equipment_recovery_time→equipmentRecoveryTime
        // Read both camelCase and snake_case to support both old and new data
        const svcs=s.services||[];
        return <>
          <H sub="Changes live on Shopify booking form after saving.">Services</H>
          <Note>Duration, bay type, and active state update the booking form immediately.</Note>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {svcs.map((svc,i)=>{
              const dur=svc.serviceDuration??svc.service_duration??30;
              const rec=svc.equipmentRecoveryTime??svc.equipment_recovery_time??0;
              const pool=svc.resourcePool??svc.resource_pool??"none";
              return <div key={i} style={{background:T.elevated,border:`1px solid ${svc.active!==false?T.borderVis:T.border}`,borderRadius:T.r12,padding:"14px"}}>
                <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center",marginBottom:10}}>
                  <Inp value={svc.name} onChange={e=>{const sv=[...svcs];sv[i]={...sv[i],name:e.target.value};set("services",sv);}}
                    placeholder="Service name" sx={{flex:"1 1 140px",fontSize:14,fontWeight:600}}/>
                  <Toggle checked={svc.active!==false}
                    onChange={()=>{const sv=[...svcs];sv[i]={...sv[i],active:!(svc.active!==false)};set("services",sv);}}
                    label={svc.active!==false?"Active":"Inactive"}/>
                  <button onClick={()=>set("services",svcs.filter((_,j)=>j!==i))}
                    style={{background:T.redBg,border:`1px solid ${T.redBorder}`,borderRadius:T.r8,padding:"6px 10px",color:T.redText,fontSize:11,fontFamily:T.font,cursor:"pointer"}}>
                    Remove
                  </button>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(110px,1fr))",gap:8}}>
                  <div>
                    <div style={{fontSize:10,color:T.textMuted,marginBottom:4,textTransform:"uppercase",letterSpacing:"0.06em"}}>Duration (min)</div>
                    <Inp type="number" value={dur} onChange={e=>{const n=Number(e.target.value);const sv=[...svcs];sv[i]={...sv[i],serviceDuration:n,service_duration:n};set("services",sv);}}/>
                  </div>
                  <div>
                    <div style={{fontSize:10,color:T.textMuted,marginBottom:4,textTransform:"uppercase",letterSpacing:"0.06em"}}>Recovery (min)</div>
                    <Inp type="number" value={rec} onChange={e=>{const n=Number(e.target.value);const sv=[...svcs];sv[i]={...sv[i],equipmentRecoveryTime:n,equipment_recovery_time:n};set("services",sv);}}/>
                  </div>
                  <div>
                    <div style={{fontSize:10,color:T.textMuted,marginBottom:4,textTransform:"uppercase",letterSpacing:"0.06em"}}>Bay type</div>
                    <Sel value={pool} onChange={e=>{const sv=[...svcs];sv[i]={...sv[i],resourcePool:e.target.value};set("services",sv);}}
                      options={[{value:"bay",label:"Bay"},{value:"alignment",label:"Alignment"},{value:"none",label:"No bay"}]}/>
                  </div>
                </div>
              </div>;
            })}
          </div>
          <button onClick={()=>set("services",[...svcs,{name:"New Service",serviceDuration:30,service_duration:30,equipmentRecoveryTime:0,equipment_recovery_time:0,resourcePool:"none",active:true}])}
            style={{marginTop:12,background:"transparent",border:`1px solid ${T.border}`,borderRadius:T.r8,padding:"9px 16px",color:T.textSecond,fontSize:12,fontFamily:T.font,cursor:"pointer"}}>
            + Add service
          </button>
        </>;
      }

      if(sec==="capacity") return <>
        <H sub="Controls simultaneous booking slots — live on the booking form.">Capacity</H>
        <R label="Normal bay count" hint="Each confirmed booking uses one bay slot">
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <Inp type="number" value={s.bayCount||3} onChange={e=>set("bayCount",Math.max(1,Number(e.target.value)))} sx={{width:80}}/>
            <span style={{fontSize:12,color:T.textMuted}}>{s.bayCount||3} bay{(s.bayCount||3)!==1?"s":""}</span>
          </div>
        </R>
        <R label="Alignment lane">
          <Toggle checked={s.alignmentLaneEnabled!==false}
            onChange={()=>set("alignmentLaneEnabled",!(s.alignmentLaneEnabled!==false))}
            label={s.alignmentLaneEnabled!==false?"Enabled — separate capacity from normal bays":"Disabled"}/>
        </R>
        {s.alignmentLaneEnabled!==false&&<R label="Alignment capacity" hint="Usually 1">
          <Inp type="number" value={s.alignmentCapacity||1} onChange={e=>set("alignmentCapacity",Math.max(1,Number(e.target.value)))} sx={{width:80}}/>
        </R>}
      </>;

      if(sec==="sms") {
        const TMPL=[
          {key:"confirmed",label:"Appointment confirmed",hint:"Sent when staff confirms"},
          {key:"declined",label:"Declined / cancelled",hint:"Sent when staff cancels"},
          {key:"waitlist",label:"Waitlist spot opened",hint:"Sent when a slot opens"},
          {key:"reminder",label:"Reminder",hint:"Sent before appointment"},
          {key:"completed_review",label:"Completed + review link",hint:"Use {reviewLink}"},
          {key:"completed_no_review",label:"Completed — no review",hint:"Simple thank-you"},
          {key:"no_show",label:"No-show",hint:"Sent when marked no-show"},
        ];
        return <>
          <H sub="Leave blank to use system defaults.">SMS templates</H>
          <div style={{padding:"10px 14px",background:T.elevated,border:`1px solid ${T.border}`,borderRadius:T.r10,marginBottom:16,fontSize:12,color:T.textSecond,lineHeight:1.8}}>
            <strong style={{color:T.textPrimary}}>Variables: </strong>
            {["{firstName}","{shopName}","{date}","{time}","{service}","{reviewLink}"].map(v=>(
              <code key={v} style={{display:"inline-block",background:T.pageBg,border:`1px solid ${T.border}`,padding:"1px 6px",borderRadius:4,marginRight:5,marginBottom:3,color:T.blueBright,fontFamily:"monospace",fontSize:11}}>{v}</code>
            ))}
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            {TMPL.map(({key,label,hint})=><div key={key} style={{background:T.elevated,border:`1px solid ${T.border}`,borderRadius:T.r12,padding:"14px"}}>
              <div style={{fontSize:13,fontWeight:600,color:T.textPrimary,marginBottom:2}}>{label}</div>
              <div style={{fontSize:11,color:T.textMuted,marginBottom:8}}>{hint}</div>
              <Textarea value={s.smsTemplates?.[key]||""} onChange={e=>set(`smsTemplates.${key}`,e.target.value)} placeholder="Leave blank for system default"/>
              {!!(s.smsTemplates?.[key]||"").length&&<div style={{display:"flex",justifyContent:"space-between",marginTop:5}}>
                <span style={{fontSize:11,color:T.textMuted}}>{(s.smsTemplates?.[key]||"").length} chars</span>
                <button onClick={()=>set(`smsTemplates.${key}`,"")} style={{background:"none",border:"none",color:T.textMuted,fontSize:11,cursor:"pointer",fontFamily:T.font}}>Reset</button>
              </div>}
            </div>)}
          </div>
        </>;
      }

      if(sec==="review") return <>
        <H sub="Replaces {reviewLink} in the completion SMS.">Google review link</H>
        <R label="Review URL"><Inp value={s.googleReviewLink||""} onChange={e=>set("googleReviewLink",e.target.value)} placeholder="https://g.page/r/XXXX/review"/></R>
        {s.googleReviewLink&&<a href={s.googleReviewLink} target="_blank" rel="noopener noreferrer"
          style={{fontSize:11,color:T.tealText,display:"block",marginBottom:12,wordBreak:"break-all"}}>{s.googleReviewLink}</a>}
        <div style={{fontSize:12,color:T.textSecond,lineHeight:1.6}}>Get your link: Google Business Profile → Get more reviews → copy the link shown.</div>
      </>;

      if(sec==="reminders") return <>
        <H sub="Automatic SMS sent before appointments.">Reminders</H>
        <R label="Enable reminders">
          <Toggle checked={s.reminderEnabled!==false} onChange={()=>set("reminderEnabled",!(s.reminderEnabled!==false))} label={s.reminderEnabled!==false?"On":"Off"}/>
        </R>
        {s.reminderEnabled!==false&&<R label="Minutes before" hint="Default: 30">
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <Inp type="number" value={s.reminderMinutes||30} onChange={e=>set("reminderMinutes",Math.max(5,Number(e.target.value)))} sx={{width:80}}/>
            <span style={{fontSize:12,color:T.textMuted}}>minutes before</span>
          </div>
        </R>}
      </>;

      if(sec==="branding") return <>
        <H sub="Customizes the customer-facing booking form.">Branding</H>
        <R label="Logo URL" hint="PNG or SVG, displayed at top of booking form">
          <Inp value={s.logoUrl||""} onChange={e=>set("logoUrl",e.target.value)} placeholder="https://shop.com/logo.png"/>
          {s.logoUrl&&<img src={s.logoUrl} alt="Logo" onError={e=>e.target.style.display="none"}
            style={{height:36,marginTop:8,borderRadius:T.r8,background:T.elevated,border:`1px solid ${T.border}`,padding:4}}/>}
        </R>
        <R label="Primary colour" hint="Button and accent colour">
          <div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
            <input type="color" value={s.primaryColor||"#2563EB"} onChange={e=>set("primaryColor",e.target.value)}
              style={{width:44,height:36,borderRadius:T.r8,border:`1.5px solid ${T.border}`,background:"none",cursor:"pointer",padding:2}}/>
            <Inp value={s.primaryColor||"#2563EB"} onChange={e=>set("primaryColor",e.target.value)} sx={{width:120}}/>
            <div style={{width:36,height:36,borderRadius:T.r8,background:s.primaryColor||"#2563EB",border:`1px solid ${T.border}`,flexShrink:0}}/>
          </div>
        </R>
      </>;

      return <div style={{color:T.textMuted,fontSize:13}}>Select a section.</div>;
    } catch(e) {
      console.error("[Settings] Section error:", sec, e);
      return <div style={{color:T.redText,fontSize:13,padding:16,background:T.redBg,border:`1px solid ${T.redBorder}`,borderRadius:T.r10}}>
        Error rendering this section: {e.message}
      </div>;
    }
  }

  // ── Save bar ────────────────────────────────────────────────────────────────
  const SaveBar = ()=><div style={{paddingTop:16,marginTop:18,borderTop:`1px solid ${T.border}`,display:"flex",alignItems:"center",gap:12}}>
    <button onClick={save} disabled={sav}
      style={{padding:"10px 24px",borderRadius:T.r8,background:saved?T.greenBg:T.blue,
        border:`1px solid ${saved?T.greenBorder:T.blue}`,color:saved?T.greenText:"#fff",
        fontSize:13,fontWeight:600,fontFamily:T.font,cursor:sav?"not-allowed":"pointer",opacity:sav?0.6:1}}>
      {sav?"Saving…":saved?"Saved":"Save changes"}
    </button>
    {err&&<span style={{fontSize:12,color:T.redText}}>{err}</span>}
    {!err&&dirty&&!sav&&!saved&&<span style={{fontSize:12,color:T.textMuted}}>Unsaved changes</span>}
  </div>;

  // ── Nav list ─────────────────────────────────────────────────────────────────
  const NavList=()=><div style={{background:T.cardBg,border:`1px solid ${T.border}`,borderRadius:T.r12,overflow:"hidden"}}>
    {SECTIONS.map(({id,label})=>{
      const a=sec===id;
      return <button key={id} onClick={()=>{setSec(id);if(mob)setMobC(true);}}
        style={{display:"flex",alignItems:"center",justifyContent:"space-between",width:"100%",padding:"11px 14px",
          background:a?T.elevated:"transparent",border:"none",borderLeft:`3px solid ${a?T.blue:"transparent"}`,
          color:a?T.textPrimary:T.textMuted,fontSize:13,fontFamily:T.font,cursor:"pointer",
          textAlign:"left",transition:"all .12s",borderBottom:`1px solid ${T.border}`}}>
        <span style={{fontWeight:a?600:400}}>{label}</span>
        {mob&&<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={T.textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>}
      </button>;
    })}
  </div>;

  // ── Mobile layout ───────────────────────────────────────────────────────────
  if(mob) {
    if(!mobC) return <div>
      <div style={{fontSize:18,fontWeight:700,color:T.textPrimary,marginBottom:16}}>Settings</div>
      <NavList/>
    </div>;
    return <div>
      <button onClick={()=>setMobC(false)} style={{display:"flex",alignItems:"center",gap:6,
        background:"transparent",border:"none",color:T.blue,fontSize:13,fontFamily:T.font,
        cursor:"pointer",padding:"0 0 14px",fontWeight:600}}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        Settings
      </button>
      <div style={{fontSize:15,fontWeight:700,color:T.textPrimary,marginBottom:14}}>{SECTIONS.find(x=>x.id===sec)?.label}</div>
      {renderSection()}
      <SaveBar/>
    </div>;
  }

  // ── Desktop layout ──────────────────────────────────────────────────────────
  return <div style={{display:"flex",gap:22,alignItems:"flex-start"}}>
    <div style={{width:190,flexShrink:0,position:"sticky",top:80}}>
      <NavList/>
      {dirty&&<div style={{marginTop:8,padding:"8px 12px",background:T.amberBg,border:`1px solid ${T.amberBorder}`,
        borderRadius:T.r8,fontSize:11,color:T.amberText,textAlign:"center"}}>Unsaved changes</div>}
    </div>
    <div style={{flex:1,minWidth:0}}>
      {renderSection()}
      <SaveBar/>
    </div>
  </div>;
}
