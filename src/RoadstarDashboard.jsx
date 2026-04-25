// RoadstarDashboard.jsx  v9 — premium design, no emoji
import { useState, useEffect, useCallback, useRef } from "react";
import { getT, getTheme, toggleTheme, DARK, LIGHT } from "./theme.js";
import { getUserRole, getUserName } from "./api.js";
import SettingsPage   from "./SettingsPage.jsx";
import TodayPage      from "./pages/TodayPage.jsx";
import BookingsPage   from "./pages/BookingsPage.jsx";
import LiveBayPage    from "./pages/LiveBayPage.jsx";
import CustomersPage  from "./pages/CustomersPage.jsx";
import AnalyticsPage  from "./pages/AnalyticsPage.jsx";
import { AuditLogPage, UsersPage, AdminPage } from "./pages/OtherPages.jsx";

const SV = ({ s=16, c="currentColor", d }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c}
    strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"
    style={{ display:"block", flexShrink:0 }}>{d}</svg>
);

const icons = {
  today:     ({s,c}) => <SV s={s} c={c} d={<><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></>}/>,
  bookings:  ({s,c}) => <SV s={s} c={c} d={<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></>}/>,
  livebay:   ({s,c}) => <SV s={s} c={c} d={<><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><line x1="12" y1="12" x2="12" y2="16"/><line x1="10" y1="14" x2="14" y2="14"/></>}/>,
  customers: ({s,c}) => <SV s={s} c={c} d={<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></>}/>,
  analytics: ({s,c}) => <SV s={s} c={c} d={<><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></>}/>,
  settings:  ({s,c}) => <SV s={s} c={c} d={<><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></>}/>,
  audit:     ({s,c}) => <SV s={s} c={c} d={<><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></>}/>,
  users:     ({s,c}) => <SV s={s} c={c} d={<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></>}/>,
  admin:     ({s,c}) => <SV s={s} c={c} d={<><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></>}/>,
};

const NAV_ITEMS = [
  { id:"today",     label:"Today"       },
  { id:"bookings",  label:"Bookings"    },
  { id:"livebay",   label:"Live at Bay" },
  { id:"customers", label:"CRM"         },
  { id:"analytics", label:"Analytics"   },
  { id:"settings",  label:"Settings"    },
  { id:"audit",     label:"Audit Log"   },
  { id:"users",     label:"Users"       },
  { id:"admin",     label:"Shops"       },
];

const ROLE_PAGES = {
  superadmin: ["today","bookings","livebay","customers","analytics","settings","audit","users","admin"],
  owner:      ["today","bookings","livebay","customers","analytics","settings","audit","users"],
  frontdesk:  ["today","bookings","livebay","customers"],
  mechanic:   ["today","livebay"],
};

function CheckSVG({ s, c }) { return <SV s={s} c={c} d={<path d="M20 6 9 17l-5-5"/>}/>; }
function XSvg({ s, c })     { return <SV s={s} c={c} d={<path d="M18 6 6 18M6 6l12 12"/>}/>; }
function SunSVG({ s, c })   { return <SV s={s} c={c} d={<><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/></>}/>; }
function MoonSVG({ s, c })  { return <SV s={s} c={c} d={<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>}/>; }
function OutSVG({ s, c })   { return <SV s={s} c={c} d={<><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></>}/>; }
function MenuSVG({ s, c })  { return <SV s={s} c={c} d={<><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></>}/>; }

// ── Sidebar ───────────────────────────────────────────────────────────────────
function Sidebar({ T, theme, page, nav, name, role, onNav, onTheme, onLogout }) {
  const NavItem = ({ id, label }) => {
    const active = page === id;
    const [h, setH] = useState(false);
    const Icon = icons[id];
    return (
      <button
        onClick={() => onNav(id)}
        onMouseEnter={() => setH(true)}
        onMouseLeave={() => setH(false)}
        style={{
          display:"flex", alignItems:"center", gap:9, width:"100%",
          padding:"8px 10px", border:"none", borderRadius:T.r8,
          cursor:"pointer", textAlign:"left", position:"relative",
          fontFamily:T.font, transition:"background .1s",
          background: active
            ? theme === "dark" ? "rgba(37,99,235,.15)" : "rgba(37,99,235,.1)"
            : h ? T.elevated : "transparent",
          color: active ? T.textPrimary : h ? T.textPrimary : T.textSecond,
          marginBottom: 1,
        }}>
        {active && <span style={{ position:"absolute", left:0, top:"18%", bottom:"18%", width:2.5, borderRadius:2, background:T.blue }}/>}
        {Icon && <Icon s={14} c={active ? T.blue : h ? T.textPrimary : T.textMuted}/>}
        <span style={{ fontSize:13, fontWeight:active ? 600 : 400 }}>{label}</span>
      </button>
    );
  };

  return (
    <div style={{ width:220, background:T.sideBg, borderRight:`1px solid ${T.border}`, display:"flex", flexDirection:"column", height:"100vh", position:"sticky", top:0, flexShrink:0, overflowY:"auto" }}>

      {/* Logo */}
      <div style={{ padding:"16px 14px 14px", borderBottom:`1px solid ${T.border}`, flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:30, height:30, borderRadius:7, background:"#2563EB", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, boxShadow:"0 2px 10px rgba(37,99,235,.4)" }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3.5"/>
              <path d="M12 2.5v4M12 17.5v4M2.5 12h4M17.5 12h4"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize:12, fontWeight:800, color:T.textPrimary, letterSpacing:"0.07em" }}>ROADSTAR</div>
            <div style={{ fontSize:9, color:T.textMuted, letterSpacing:"0.04em", marginTop:1, textTransform:"uppercase" }}>Tire Admin</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex:1, padding:"10px 8px", overflowY:"auto" }}>
        {nav.map(n => <NavItem key={n.id} id={n.id} label={n.label}/>)}
      </nav>

      {/* Bottom */}
      <div style={{ padding:"10px 8px 14px", borderTop:`1px solid ${T.border}`, flexShrink:0 }}>
        {/* User */}
        <div style={{ display:"flex", alignItems:"center", gap:9, padding:"8px 10px", background:T.elevated, border:`1px solid ${T.border}`, borderRadius:T.r8, marginBottom:8 }}>
          <div style={{ width:26, height:26, borderRadius:6, background:T.blueSubtle, border:`1px solid ${T.blue}40`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, color:T.blue, flexShrink:0 }}>
            {(name[0]||"A").toUpperCase()}
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:12, fontWeight:600, color:T.textPrimary, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{name}</div>
            <div style={{ fontSize:10, color:T.textMuted, textTransform:"capitalize" }}>{role}</div>
          </div>
        </div>

        {/* Controls row */}
        <div style={{ display:"flex", gap:5 }}>
          {[
            { label:theme==="dark"?"Light":"Dark", Icon:theme==="dark"?SunSVG:MoonSVG, onClick:onTheme, hoverColor:T.amber },
            { label:"Sign out", Icon:OutSVG, onClick:onLogout, hoverColor:T.red },
          ].map(({ label, Icon, onClick, hoverColor }) => (
            <button key={label} onClick={onClick}
              style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:5, padding:"6px 0", border:`1px solid ${T.border}`, borderRadius:T.r8, background:"transparent", color:T.textMuted, fontSize:11, cursor:"pointer", fontFamily:T.font }}
              onMouseEnter={e => { e.currentTarget.style.borderColor=hoverColor; e.currentTarget.style.color=hoverColor; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor=T.border; e.currentTarget.style.color=T.textMuted; }}>
              <Icon s={12}/> {label}
            </button>
          ))}
        </div>

        <div style={{ fontSize:9, color:T.textMuted, textAlign:"center", marginTop:10, opacity:0.45, letterSpacing:"0.05em" }}>
          Built by Social Aura
        </div>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function RoadstarDashboard({ onLogout }) {
  const [theme,  setTheme]  = useState(getTheme());
  const [page,   setPage]   = useState("today");
  const [drawer, setDrawer] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const alertId = useRef(0);
  const T = theme === "dark" ? DARK : LIGHT;

  const role    = getUserRole() || "owner";
  const name    = getUserName() || "Admin";
  const allowed = ROLE_PAGES[role] || ROLE_PAGES.owner;
  const nav     = NAV_ITEMS.filter(n => allowed.includes(n.id));

  useEffect(() => {
    if (!allowed.includes(page)) setPage(nav[0]?.id || "today");
  }, [role]);

  useEffect(() => {
    document.body.style.cssText = `margin:0;background:${T.pageBg};font-family:${T.font};overflow-x:hidden`;
    const s = document.createElement("style");
    s.id = "rs-g";
    s.textContent = [
      "@keyframes spin{to{transform:rotate(360deg)}}",
      "@keyframes rsSlide{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}",
      "*{box-sizing:border-box}",
      "::-webkit-scrollbar{width:5px;height:5px}",
      `::-webkit-scrollbar-track{background:transparent}`,
      `::-webkit-scrollbar-thumb{background:${T.border};border-radius:4px}`,
    ].join("");
    document.getElementById("rs-g")?.remove();
    document.head.appendChild(s);
  }, [theme]);

  const pushAlert = useCallback((msg, type="info") => {
    const id = ++alertId.current;
    setAlerts(p => [...p, { id, msg, type:type==="error"?"error":"ok" }]);
    setTimeout(() => setAlerts(p => p.filter(a => a.id !== id)), 4500);
  }, []);

  const doTheme = () => {
    const next = toggleTheme(); setTheme(next);
    document.body.style.background = next==="dark" ? DARK.pageBg : LIGHT.pageBg;
  };

  const PAGES = {
    today:     <TodayPage     key={theme} onAlert={pushAlert}/>,
    bookings:  <BookingsPage  key={theme} onAlert={pushAlert}/>,
    livebay:   <LiveBayPage   key={theme} onAlert={pushAlert}/>,
    customers: <CustomersPage key={theme} onAlert={pushAlert}/>,
    analytics: <AnalyticsPage key={theme} onAlert={pushAlert}/>,
    settings:  <SettingsPage  key={theme} onAlert={pushAlert}/>,
    audit:     <AuditLogPage  key={theme} onAlert={pushAlert}/>,
    users:     <UsersPage     key={theme} onAlert={pushAlert}/>,
    admin:     <AdminPage     key={theme} onAlert={pushAlert}/>,
  };

  const sidebarProps = { T, theme, page, nav, name, role, onNav:id=>{setPage(id);setDrawer(false);}, onTheme:doTheme, onLogout };

  return (
    <div style={{ display:"flex", minHeight:"100vh", background:T.pageBg }}>

      {/* Desktop sidebar */}
      <Sidebar {...sidebarProps}/>

      {/* Content */}
      <div style={{ flex:1, minWidth:0, display:"flex", flexDirection:"column" }}>
        {/* Mobile topbar */}
        <div style={{ display:"none", height:50, background:T.sideBg, borderBottom:`1px solid ${T.border}`, alignItems:"center", gap:12, padding:"0 16px", position:"sticky", top:0, zIndex:50, flexShrink:0 }} id="rs-topbar">
          <button onClick={() => setDrawer(true)} style={{ width:32, height:32, display:"flex", alignItems:"center", justifyContent:"center", background:T.elevated, border:`1px solid ${T.border}`, borderRadius:T.r8, cursor:"pointer" }}>
            <MenuSVG s={15} c={T.textPrimary}/>
          </button>
          <span style={{ fontSize:13, fontWeight:700, color:T.textPrimary }}>
            {nav.find(n=>n.id===page)?.label||"Dashboard"}
          </span>
        </div>

        <main style={{ flex:1, padding:"28px 32px", maxWidth:1160, width:"100%" }}>
          {PAGES[page] || PAGES.today}
        </main>
      </div>

      {/* Mobile drawer */}
      {drawer && (
        <div style={{ position:"fixed", inset:0, zIndex:999 }}>
          <div onClick={() => setDrawer(false)} style={{ position:"absolute", inset:0, background:"rgba(0,0,0,.6)" }}/>
          <div style={{ position:"absolute", left:0, top:0, bottom:0, zIndex:1 }}>
            <Sidebar {...sidebarProps}/>
          </div>
        </div>
      )}

      <style>{`@media(max-width:768px){#rs-topbar{display:flex!important}}`}</style>

      {/* Toasts */}
      {alerts.length > 0 && (
        <div style={{ position:"fixed", bottom:20, right:20, zIndex:9999, display:"flex", flexDirection:"column", gap:8, maxWidth:340 }}>
          {alerts.map(a => (
            <div key={a.id} style={{
              display:"flex", alignItems:"center", gap:10,
              padding:"11px 12px 11px 14px",
              background: a.type==="error" ? T.redBg    : T.cardBg,
              border:    `1px solid ${a.type==="error" ? T.redBorder : T.greenBorder}`,
              borderLeft:`3px solid ${a.type==="error" ? T.red      : T.green}`,
              borderRadius:T.r10,
              color:      a.type==="error" ? T.redText  : T.textPrimary,
              fontSize:13, boxShadow:"0 4px 20px rgba(0,0,0,.35)",
              animation:"rsSlide .2s ease",
            }}>
              <span style={{ flexShrink:0, opacity:.8 }}>
                {a.type==="error"
                  ? <XSvg s={13} c={T.red}/>
                  : <CheckSVG s={13} c={T.green}/>}
              </span>
              <span style={{ flex:1, lineHeight:1.4 }}>{a.msg}</span>
              <button onClick={() => setAlerts(p => p.filter(x => x.id !== a.id))}
                style={{ background:"none", border:"none", cursor:"pointer", color:T.textMuted, padding:0, display:"flex", flexShrink:0 }}>
                <XSvg s={13}/>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
