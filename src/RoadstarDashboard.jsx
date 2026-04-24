// RoadstarDashboard.jsx  v9 — multi-page shell
import { useState, useEffect, useCallback, useRef } from "react";
import { getT, getTheme, toggleTheme, DARK, LIGHT } from "./theme.js";
import { getUserRole, getUserName } from "./api.js";
import SettingsPage from "./SettingsPage.jsx";
import TodayPage from "./pages/TodayPage.jsx";
import BookingsPage from "./pages/BookingsPage.jsx";
import LiveBayPage from "./pages/LiveBayPage.jsx";
import CustomersPage from "./pages/CustomersPage.jsx";
import AnalyticsPage from "./pages/AnalyticsPage.jsx";
import { AuditLogPage, UsersPage, AdminPage } from "./pages/OtherPages.jsx";

// ── Icons (inline SVG, no import needed) ─────────────────────────────────────
const Ic = ({ s = 18, c = "currentColor", ch }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={2}
    strokeLinecap="round" strokeLinejoin="round" style={{ display:"block", flexShrink:0 }}>
    {ch}
  </svg>
);
const CalI   = ({ s,c }) => <Ic s={s} c={c} ch={<><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></>}/>;
const BkI    = ({ s,c }) => <Ic s={s} c={c} ch={<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></>}/>;
const BayI   = ({ s,c }) => <Ic s={s} c={c} ch={<><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><line x1="12" y1="12" x2="12" y2="16"/><line x1="10" y1="14" x2="14" y2="14"/></>}/>;
const UsrI   = ({ s,c }) => <Ic s={s} c={c} ch={<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></>}/>;
const ChI    = ({ s,c }) => <Ic s={s} c={c} ch={<><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></>}/>;
const SetI   = ({ s,c }) => <Ic s={s} c={c} ch={<><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></>}/>;
const LogI   = ({ s,c }) => <Ic s={s} c={c} ch={<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></>}/>;
const ShpI   = ({ s,c }) => <Ic s={s} c={c} ch={<><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></>}/>;
const MnuI   = ({ s,c }) => <Ic s={s} c={c} ch={<><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></>}/>;
const SunI   = ({ s,c }) => <Ic s={s} c={c} ch={<><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/></>}/>;
const MooI   = ({ s,c }) => <Ic s={s} c={c} ch={<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>}/>;
const OutI   = ({ s,c }) => <Ic s={s} c={c} ch={<><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></>}/>;
const WrkI   = ({ s,c }) => <Ic s={s} c={c} ch={<><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></>}/>;
const XIcon  = ({ s,c }) => <Ic s={s} c={c} ch={<path d="M18 6 6 18M6 6l12 12"/>}/>;

// ── Nav config ────────────────────────────────────────────────────────────────
function getNavItems(role) {
  const all = [
    { id:"today",     label:"Today",         Icon:CalI,  roles:["superadmin","owner","frontdesk","mechanic"] },
    { id:"bookings",  label:"Bookings",       Icon:BkI,   roles:["superadmin","owner","frontdesk"] },
    { id:"livebay",   label:"Live at Bay",    Icon:BayI,  roles:["superadmin","owner","frontdesk","mechanic"] },
    { id:"customers", label:"Customers",      Icon:UsrI,  roles:["superadmin","owner","frontdesk"] },
    { id:"analytics", label:"Analytics",      Icon:ChI,   roles:["superadmin","owner"] },
    { id:"settings",  label:"Settings",       Icon:SetI,  roles:["superadmin","owner"] },
    { id:"audit",     label:"Audit Log",      Icon:LogI,  roles:["superadmin","owner"] },
    { id:"users",     label:"Users & Roles",  Icon:UsrI,  roles:["superadmin","owner"] },
    { id:"admin",     label:"Shops",          Icon:ShpI,  roles:["superadmin"] },
  ];
  return all.filter(n => n.roles.includes(role));
}

// ── Alert toast ───────────────────────────────────────────────────────────────
function AlertToast({ alerts, onDismiss }) {
  const T = getT();
  if (!alerts.length) return null;
  return (
    <div style={{ position:"fixed", bottom:20, right:20, zIndex:9999, display:"flex", flexDirection:"column", gap:8 }}>
      {alerts.map(a => (
        <div key={a.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px", background:a.type==="error"?T.redBg:T.greenBg, border:`1px solid ${a.type==="error"?T.redBorder:T.greenBorder}`, borderRadius:T.r10, color:a.type==="error"?T.redText:T.greenText, fontSize:13, fontWeight:500, maxWidth:320, boxShadow:T.shadowLg }}>
          <span style={{ flex:1 }}>{a.msg}</span>
          <button onClick={() => onDismiss(a.id)} style={{ background:"none", border:"none", color:"inherit", cursor:"pointer", padding:0, opacity:0.7 }}><XIcon s={14}/></button>
        </div>
      ))}
    </div>
  );
}

// ── Main dashboard ─────────────────────────────────────────────────────────────
export default function RoadstarDashboard({ onLogout }) {
  const [theme,   setTheme]   = useState(getTheme());
  const [page,    setPage]    = useState("today");
  const [drawer,  setDrawer]  = useState(false);
  const [alerts,  setAlerts]  = useState([]);
  const alertId = useRef(0);

  const role = getUserRole() || "owner";
  const name = getUserName() || "Admin";
  const nav  = getNavItems(role);

  // If current page not allowed for role, go to first allowed
  useEffect(() => {
    if (!nav.find(n => n.id === page)) setPage(nav[0]?.id || "today");
  }, [role]);

  // Force re-render when theme changes
  const T = theme === "dark" ? DARK : LIGHT;

  const pushAlert = useCallback((msg, type = "info") => {
    const id = ++alertId.current;
    setAlerts(p => [...p, { id, msg, type: type === "error" ? "error" : "ok" }]);
    setTimeout(() => setAlerts(p => p.filter(a => a.id !== id)), 4000);
  }, []);

  const handleTheme = () => {
    const next = toggleTheme();
    setTheme(next);
    document.body.style.background = next === "dark" ? DARK.pageBg : LIGHT.pageBg;
  };

  const navigate = (id) => { setPage(id); setDrawer(false); };

  // ── Global styles ─────────────────────────────────────────────────────────
  useEffect(() => {
    document.body.style.background   = T.pageBg;
    document.body.style.margin       = "0";
    document.body.style.fontFamily   = T.font;
    document.body.style.overflowX    = "hidden";
    const style = document.createElement("style");
    style.id = "rs-global";
    style.textContent = `@keyframes spin{to{transform:rotate(360deg)}} * {box-sizing:border-box;} ::-webkit-scrollbar{width:6px;height:6px} ::-webkit-scrollbar-track{background:${T.pageBg}} ::-webkit-scrollbar-thumb{background:${T.border};border-radius:3px}`;
    const old = document.getElementById("rs-global");
    if (old) old.remove();
    document.head.appendChild(style);
  }, [theme]);

  const SIDEBAR_W = 216;

  // ── Sidebar item ──────────────────────────────────────────────────────────
  const NavItem = ({ id, label, Icon }) => {
    const active = page === id;
    const [h, setH] = useState(false);
    return (
      <button onClick={() => navigate(id)}
        onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
        style={{ display:"flex", alignItems:"center", gap:10, width:"100%", padding:"9px 14px", border:"none", borderRadius:T.r8, background:active ? (theme==="dark" ? "#1a2540" : T.blueSubtle) : h ? T.elevated : "transparent", cursor:"pointer", textAlign:"left", color:active ? T.blueBright : h ? T.textPrimary : T.textSecond, borderLeft:`3px solid ${active ? T.blue : "transparent"}`, transition:"all .12s", marginBottom:2 }}>
        <Icon s={15} c={active ? T.blue : h ? T.textPrimary : T.textMuted}/>
        <span style={{ fontSize:13, fontWeight:active ? 600 : 400, fontFamily:T.font }}>{label}</span>
      </button>
    );
  };

  // ── Sidebar ───────────────────────────────────────────────────────────────
  const Sidebar = ({ mobile = false }) => (
    <div style={{ width:mobile?280:SIDEBAR_W, height:mobile?"100%":"100vh", background:T.sideBg, borderRight:`1px solid ${T.border}`, display:"flex", flexDirection:"column", position:mobile?"relative":"sticky", top:0, flexShrink:0, overflowY:"auto" }}>
      {/* Logo */}
      <div style={{ padding:"20px 16px 16px", borderBottom:`1px solid ${T.border}` }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:34, height:34, borderRadius:"50%", background:T.blueSubtle, border:`1.5px solid ${T.blue}40`, display:"flex", alignItems:"center", justifyContent:"center" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={T.blueBright} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3.5"/><path d="M12 2.5v4M12 17.5v4M2.5 12h4M17.5 12h4"/></svg>
          </div>
          <div>
            <div style={{ fontSize:13, fontWeight:800, color:T.textPrimary, letterSpacing:"0.03em" }}>ROADSTAR</div>
            <div style={{ fontSize:10, color:T.textMuted, letterSpacing:"0.08em" }}>TIRE ADMIN</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex:1, padding:"12px 8px" }}>
        {nav.map(n => <NavItem key={n.id} {...n}/>)}
      </nav>

      {/* Bottom: user + theme + logout */}
      <div style={{ padding:"12px 10px", borderTop:`1px solid ${T.border}` }}>
        {/* User */}
        <div style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 10px", marginBottom:6, background:T.elevated, borderRadius:T.r8 }}>
          <div style={{ width:28, height:28, borderRadius:"50%", background:T.blueSubtle, border:`1px solid ${T.blue}30`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, color:T.blueBright, flexShrink:0 }}>
            {name[0]?.toUpperCase()||"A"}
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:12, fontWeight:600, color:T.textPrimary, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{name}</div>
            <div style={{ fontSize:10, color:T.textMuted, textTransform:"capitalize" }}>{role}</div>
          </div>
        </div>
        {/* Theme toggle */}
        <button onClick={handleTheme}
          style={{ display:"flex", alignItems:"center", gap:8, width:"100%", padding:"7px 10px", border:`1px solid ${T.border}`, borderRadius:T.r8, background:"transparent", color:T.textSecond, fontSize:12, cursor:"pointer", fontFamily:T.font, marginBottom:4 }}>
          {theme==="dark" ? <SunI s={13} c={T.amber}/> : <MooI s={13} c={T.blue}/>}
          {theme==="dark" ? "Light mode" : "Dark mode"}
        </button>
        {/* Logout */}
        <button onClick={onLogout}
          style={{ display:"flex", alignItems:"center", gap:8, width:"100%", padding:"7px 10px", border:`1px solid ${T.border}`, borderRadius:T.r8, background:"transparent", color:T.red, fontSize:12, cursor:"pointer", fontFamily:T.font }}>
          <OutI s={13} c={T.red}/> Sign out
        </button>
        <div style={{ fontSize:9, color:T.textMuted, textAlign:"center", marginTop:10 }}>Built by Social Aura</div>
      </div>
    </div>
  );

  // ── Page content router ────────────────────────────────────────────────────
  const PAGE_MAP = {
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

  // ── Mobile top bar ─────────────────────────────────────────────────────────
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  return (
    <div style={{ display:"flex", minHeight:"100vh", background:T.pageBg, fontFamily:T.font }}>

      {/* Desktop sidebar */}
      <div style={{ display:"none" }} className="rs-sidebar-desktop">
        <Sidebar/>
      </div>

      {/* Always-visible desktop sidebar (no CSS class tricks needed — use flex) */}
      <div style={{ flexShrink:0 }}>
        <div style={{ display:"flex" }}>
          {/* Sidebar — visible on md+ (we handle mobile with drawer below) */}
          <div id="rs-sidebar" style={{ display:"flex" }}>
            <Sidebar/>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", minWidth:0, overflowX:"hidden" }}>
        {/* Mobile top bar */}
        <div style={{ display:"none" }} id="rs-topbar">
          <div style={{ height:56, background:T.sideBg, borderBottom:`1px solid ${T.border}`, display:"flex", alignItems:"center", gap:12, padding:"0 16px", flexShrink:0 }}>
            <button onClick={() => setDrawer(true)} style={{ background:T.elevated, border:`1px solid ${T.border}`, borderRadius:T.r8, width:36, height:36, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", color:T.textPrimary }}>
              <MnuI s={16} c={T.textPrimary}/>
            </button>
            <div style={{ fontSize:13, fontWeight:700, color:T.textPrimary, flex:1 }}>
              {nav.find(n => n.id === page)?.label || "Dashboard"}
            </div>
          </div>
        </div>

        {/* Page */}
        <div style={{ flex:1, padding:"28px 32px", maxWidth:1200, width:"100%" }}>
          {PAGE_MAP[page] || <TodayPage onAlert={pushAlert}/>}
        </div>
      </div>

      {/* Mobile drawer overlay */}
      {drawer && (
        <div onClick={() => setDrawer(false)}
          style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.75)", zIndex:999, display:"flex" }}>
          <div onClick={e => e.stopPropagation()} style={{ width:280, height:"100%", boxShadow:"4px 0 32px rgba(0,0,0,.7)" }}>
            <div style={{ position:"absolute", top:12, right:-44, zIndex:1001 }}>
              <button onClick={() => setDrawer(false)} style={{ width:36, height:36, borderRadius:"50%", background:T.elevated, border:`1px solid ${T.border}`, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", color:T.textMuted }}>
                <XIcon s={15} c={T.textMuted}/>
              </button>
            </div>
            <Sidebar mobile/>
          </div>
        </div>
      )}

      {/* Mobile responsive style injection */}
      <style>{`
        @media (max-width: 767px) {
          #rs-sidebar { display: none !important; }
          #rs-topbar  { display: flex !important; }
          #rs-topbar > div { display: flex !important; }
          .rs-page-content { padding: 16px 14px !important; }
        }
      `}</style>

      <AlertToast alerts={alerts} onDismiss={id => setAlerts(p => p.filter(a => a.id !== id))}/>
    </div>
  );
}
