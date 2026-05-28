// RoadstarDashboard.jsx  v9 — mobile-first, zero horizontal scroll
import { useState, useEffect, useCallback, useRef } from "react";
import { getT, getTheme, toggleTheme, DARK, LIGHT, todayStr } from "./theme.js";
import { getUserRole, getUserName, fetchBookings } from "./api.js";

const SHOP_LABEL = (import.meta.env.VITE_SHOP_NAME || "Roadstar Tire").toUpperCase();
import SettingsPage from "./SettingsPage.jsx";
import TodayPage from "./pages/TodayPage.jsx";
import BookingsPage from "./pages/BookingsPage.jsx";
import LiveBayPage from "./pages/LiveBayPage.jsx";
import CustomersPage from "./pages/CustomersPage.jsx";
import AnalyticsPage from "./pages/AnalyticsPage.jsx";
import { AuditLogPage, UsersPage, AdminPage } from "./pages/OtherPages.jsx";

// ── Inline icons ───────────────────────────────────────────────────────────────
const Ic = ({ s=18, c="currentColor", ch }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={2}
    strokeLinecap="round" strokeLinejoin="round" style={{ display:"block", flexShrink:0 }}>{ch}</svg>
);
const CalI  = p => <Ic {...p} ch={<><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></>}/>;
const BkI   = p => <Ic {...p} ch={<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></>}/>;
const BayI  = p => <Ic {...p} ch={<><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><line x1="12" y1="12" x2="12" y2="16"/><line x1="10" y1="14" x2="14" y2="14"/></>}/>;
const UsrI  = p => <Ic {...p} ch={<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></>}/>;
const ChI   = p => <Ic {...p} ch={<><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></>}/>;
const SetI  = p => <Ic {...p} ch={<><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></>}/>;
const LogI  = p => <Ic {...p} ch={<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></>}/>;
const ShpI  = p => <Ic {...p} ch={<><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></>}/>;
const MnuI  = p => <Ic {...p} ch={<><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></>}/>;
const SunI  = p => <Ic {...p} ch={<><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/></>}/>;
const MooI  = p => <Ic {...p} ch={<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>}/>;
const OutI  = p => <Ic {...p} ch={<><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></>}/>;
const XIcon  = p => <Ic {...p} ch={<path d="M18 6 6 18M6 6l12 12"/>}/>;
const BellI  = p => <Ic {...p} ch={<><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></>}/>;
const BellOffI=p => <Ic {...p} ch={<><path d="m13.73 21a2 2 0 0 1-3.46 0"/><path d="M18.63 13A17.9 17.9 0 0 1 18 8"/><path d="M6.26 6.26A5.86 5.86 0 0 0 6 8c0 7-3 9-3 9h14"/><path d="M18 8a6 6 0 0 0-9.33-5"/><line x1="2" y1="2" x2="22" y2="22"/></>}/>;

function getNavItems(role) {
  const all = [
    { id:"today",     label:"Today",        Icon:CalI,  roles:["superadmin","owner","frontdesk","mechanic"] },
    { id:"bookings",  label:"Bookings",      Icon:BkI,   roles:["superadmin","owner","frontdesk","mechanic"] },
    { id:"livebay",   label:"Live at Bay",   Icon:BayI,  roles:["superadmin","owner","frontdesk","mechanic"] },
    { id:"customers", label:"CRM",           Icon:UsrI,  roles:["superadmin","owner","frontdesk"] },
    { id:"analytics", label:"Analytics",     Icon:ChI,   roles:["superadmin","owner"] },
    { id:"settings",  label:"Settings",      Icon:SetI,  roles:["superadmin","owner"] },
    { id:"audit",     label:"Audit Log",     Icon:LogI,  roles:["superadmin","owner"] },
    { id:"users",     label:"Users",         Icon:UsrI,  roles:["superadmin","owner"] },
    { id:"admin",     label:"Shops",         Icon:ShpI,  roles:["superadmin"] },
  ];
  return all.filter(n => n.roles.includes(role));
}

// ── Alert toast ────────────────────────────────────────────────────────────────
function AlertToast({ alerts, onDismiss }) {
  const T = getT();
  if (!alerts.length) return null;
  return (
    <div style={{ position:"fixed", bottom:20, right:16, zIndex:9999, display:"flex", flexDirection:"column", gap:8, maxWidth:"calc(100vw - 32px)" }}>
      {alerts.map(a => (
        <div key={a.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px",
          background:a.type==="error"?T.redBg:T.greenBg, border:`1px solid ${a.type==="error"?T.redBorder:T.greenBorder}`,
          borderRadius:T.r10, color:a.type==="error"?T.redText:T.greenText, fontSize:13, fontWeight:500,
          boxShadow:"0 4px 20px rgba(0,0,0,.4)" }}>
          <span style={{flex:1}}>{a.msg}</span>
          <button onClick={() => onDismiss(a.id)} style={{ background:"none", border:"none", color:"inherit", cursor:"pointer", padding:0, opacity:0.7 }}>
            <XIcon s={14}/>
          </button>
        </div>
      ))}
    </div>
  );
}

// ── Main dashboard ─────────────────────────────────────────────────────────────
export default function RoadstarDashboard({ onLogout }) {
  const [theme,          setTheme]          = useState(getTheme());
  const [page,           setPage]           = useState("today");
  const [drawer,         setDrawer]         = useState(false);
  const [alerts,         setAlerts]         = useState([]);
  const [pendingCount,   setPendingCount]   = useState(0);
  const [newBanners,     setNewBanners]     = useState([]); // { id, booking }
  const [soundMuted,     setSoundMuted]     = useState(() => localStorage.getItem("rs_muted") === "1");
  const alertId       = useRef(0);
  const bannerId      = useRef(0);
  const knownPending  = useRef(null); // null = first load (don't alert)
  const soundMutedRef = useRef(soundMuted);
  useEffect(() => { soundMutedRef.current = soundMuted; }, [soundMuted]);

  // ── Unlock Web Audio on first tap/click (browser autoplay policy) ─────────
  useEffect(() => {
    const unlock = () => {
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        ctx.resume().then(() => ctx.close());
      } catch {}
    };
    document.addEventListener("click",      unlock, { once: true });
    document.addEventListener("touchstart", unlock, { once: true });
  }, []);

  // ── Play loud chime ────────────────────────────────────────────────────────
  const playChime = useCallback(() => {
    if (soundMutedRef.current) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      ctx.resume().then(() => {
        const beep = (freq, t0, dur) => {
          const osc = ctx.createOscillator();
          const g   = ctx.createGain();
          osc.connect(g); g.connect(ctx.destination);
          osc.type = "sine"; osc.frequency.value = freq;
          g.gain.setValueAtTime(0, t0);
          g.gain.linearRampToValueAtTime(1.0, t0 + 0.012);
          g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
          osc.start(t0); osc.stop(t0 + dur + 0.05);
        };
        const n = ctx.currentTime;
        beep(660,  n + 0.00, 0.14); beep(880,  n + 0.18, 0.14); beep(1100, n + 0.36, 0.28);
        beep(660,  n + 0.72, 0.14); beep(880,  n + 0.90, 0.14); beep(1100, n + 1.08, 0.28);
        setTimeout(() => { try { ctx.close(); } catch {} }, 2500);
      });
    } catch {}
  }, []);

  // ── Global polling — detects new pending bookings on ANY page ─────────────
  useEffect(() => {
    const today = todayStr();
    const poll = async () => {
      try {
        const bk   = await fetchBookings({ date: today });
        const list = bk || [];
        const pending = list.filter(b => b.status === "pending");
        setPendingCount(pending.length);
        if (knownPending.current !== null) {
          const brandNew = pending.filter(b => !knownPending.current.has(b.id));
          if (brandNew.length > 0) {
            playChime();
            brandNew.forEach(b => {
              const bid = ++bannerId.current;
              setNewBanners(q => [...q, { id: bid, booking: b }]);
              // Auto-dismiss after 12 s
              setTimeout(() => setNewBanners(q => q.filter(x => x.id !== bid)), 12000);
            });
          }
        }
        knownPending.current = new Set(pending.map(b => b.id));
      } catch {}
    };
    poll();
    const iv = setInterval(poll, 30000);
    return () => clearInterval(iv);
  }, [playChime]);

  const role = getUserRole() || "owner";
  const name = getUserName() || "Admin";
  const nav  = getNavItems(role);

  const T = theme === "light" ? LIGHT : DARK;

  useEffect(() => {
    if (!nav.find(n => n.id === page)) setPage(nav[0]?.id || "today");
  }, [role]);

  const pushAlert = useCallback((msg, type = "ok") => {
    const id = ++alertId.current;
    setAlerts(p => [...p, { id, msg, type }]);
    setTimeout(() => setAlerts(p => p.filter(a => a.id !== id)), 4000);
  }, []);

  const toggleMute = () => {
    const next = !soundMuted;
    setSoundMuted(next);
    localStorage.setItem("rs_muted", next ? "1" : "0");
  };

  const handleTheme = () => {
    const next = toggleTheme();
    setTheme(next);
    document.body.style.background = next === "light" ? LIGHT.pageBg : DARK.pageBg;
  };

  const navigate = (id) => { setPage(id); setDrawer(false); };

  // Apply global styles
  useEffect(() => {
    document.body.style.background = T.pageBg;
    document.body.style.margin     = "0";
    document.body.style.overflowX  = "hidden";
    const style = document.createElement("style");
    style.id = "rs-global";
    style.textContent = `
      @keyframes spin { to { transform: rotate(360deg); } }
      * { box-sizing: border-box; }
      ::-webkit-scrollbar { width: 5px; height: 5px; }
      ::-webkit-scrollbar-track { background: ${T.pageBg}; }
      ::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 3px; }
    `;
    document.getElementById("rs-global")?.remove();
    document.head.appendChild(style);
  }, [theme]);

  const SIDEBAR_W = 220;

  // ── Nav item ──────────────────────────────────────────────────────────────
  function NavItem({ id, label, Icon }) {
    const active = page === id;
    const [h, setH] = useState(false);
    const showBadge = id === "today" && pendingCount > 0;
    return (
      <button onClick={() => navigate(id)}
        onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
        style={{ display:"flex", alignItems:"center", gap:10, width:"100%", padding:"10px 14px",
          border:"none", borderRadius:T.r8, borderLeft:`3px solid ${active?T.blue:"transparent"}`,
          background:active ? (theme==="dark"?"#1a2540":T.blueSubtle) : h ? T.elevated : "transparent",
          cursor:"pointer", textAlign:"left", color:active?T.blueBright:h?T.textPrimary:T.textSecond,
          transition:"all .12s", marginBottom:2 }}>
        <Icon s={15} c={active?T.blue:h?T.textPrimary:T.textMuted}/>
        <span style={{ fontSize:13, fontWeight:active?600:400, fontFamily:T.font, flex:1 }}>{label}</span>
        {showBadge && (
          <span style={{ fontSize:10, fontWeight:700, background:T.amber, color:"#000",
            padding:"1px 6px", borderRadius:20, minWidth:18, textAlign:"center", flexShrink:0 }}>
            {pendingCount}
          </span>
        )}
      </button>
    );
  }

  // ── New Booking Banner ─────────────────────────────────────────────────────
  function NewBookingBanner() {
    if (!newBanners.length) return null;
    return (
      <div style={{ position:"fixed", top:16, right:16, zIndex:9998, display:"flex",
        flexDirection:"column", gap:8, maxWidth:340, pointerEvents:"none" }}>
        {newBanners.map(({ id, booking: b }) => (
          <div key={id} style={{ display:"flex", alignItems:"stretch", gap:0,
            background: theme==="dark" ? "#0f1e35" : "#eef6ff",
            border:`1px solid ${T.blue}50`, borderLeft:`4px solid ${T.blue}`,
            borderRadius:T.r10, boxShadow:"0 6px 32px rgba(0,0,0,.45)",
            animation:"rs-slide-in .22s ease-out", pointerEvents:"auto", overflow:"hidden" }}>
            {/* Left content */}
            <div style={{ flex:1, padding:"11px 12px", minWidth:0 }}>
              <div style={{ display:"flex", alignItems:"center", gap:5, marginBottom:4 }}>
                <BellI s={12} c={T.blue}/>
                <span style={{ fontSize:10, fontWeight:800, color:T.blue,
                  textTransform:"uppercase", letterSpacing:"0.07em" }}>New Booking</span>
              </div>
              <div style={{ fontSize:13, fontWeight:700, color:T.textPrimary,
                overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                {b.customerName || b.customer_name || "New Customer"}
              </div>
              <div style={{ fontSize:11, color:T.textSecond, marginTop:2,
                overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                {[b.service, b.time].filter(Boolean).join(" · ") || "Pending approval"}
              </div>
            </div>
            {/* Right buttons */}
            <div style={{ display:"flex", flexDirection:"column", borderLeft:`1px solid ${T.border}`, flexShrink:0 }}>
              <button onClick={() => { navigate("today"); setNewBanners(q => q.filter(x => x.id !== id)); }}
                style={{ flex:1, padding:"0 14px", background:T.blue, color:"#fff",
                  border:"none", cursor:"pointer", fontSize:11, fontWeight:700,
                  borderBottom:`1px solid rgba(255,255,255,.15)` }}>
                View
              </button>
              <button onClick={() => setNewBanners(q => q.filter(x => x.id !== id))}
                style={{ flex:1, padding:"0 14px", background:"transparent", color:T.textMuted,
                  border:"none", cursor:"pointer", fontSize:11 }}>
                Dismiss
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // ── Sidebar content ────────────────────────────────────────────────────────
  function SidebarContent() {
    return (
      <div style={{ display:"flex", flexDirection:"column", height:"100%", background:T.sideBg || T.cardBg }}>
        {/* Logo */}
        <div style={{ padding:"20px 16px 16px", borderBottom:`1px solid ${T.border}`, flexShrink:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:34, height:34, borderRadius:"50%", background:T.blueSubtle, border:`1.5px solid ${T.blue}40`,
              display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={T.blueBright} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3.5"/>
                <path d="M12 2.5v4M12 17.5v4M2.5 12h4M17.5 12h4"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize:13, fontWeight:800, color:T.textPrimary, letterSpacing:"0.04em" }}>{SHOP_LABEL}</div>
              <div style={{ fontSize:10, color:T.textMuted, letterSpacing:"0.1em" }}>ADMIN DASHBOARD</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex:1, padding:"12px 8px", overflowY:"auto" }}>
          {nav.map(n => <NavItem key={n.id} {...n}/>)}
        </nav>

        {/* Bottom */}
        <div style={{ padding:"12px 10px", borderTop:`1px solid ${T.border}`, flexShrink:0 }}>
          {/* User pill */}
          <div style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 10px", marginBottom:6,
            background:T.elevated, borderRadius:T.r8 }}>
            <div style={{ width:28, height:28, borderRadius:"50%", background:T.blueSubtle, border:`1px solid ${T.blue}30`,
              display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, fontSize:11, color:T.blueBright, flexShrink:0 }}>
              {name[0]?.toUpperCase() || "A"}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:12, fontWeight:600, color:T.textPrimary, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{name}</div>
              <div style={{ fontSize:10, color:T.textMuted, textTransform:"capitalize" }}>{role}</div>
            </div>
          </div>
          {/* Theme */}
          <button onClick={handleTheme} style={{ display:"flex", alignItems:"center", gap:8, width:"100%", padding:"7px 10px",
            border:`1px solid ${T.border}`, borderRadius:T.r8, background:"transparent", color:T.textSecond,
            fontSize:12, cursor:"pointer", fontFamily:T.font, marginBottom:4 }}>
            {theme==="dark" ? <SunI s={13} c={T.amber}/> : <MooI s={13} c={T.blue}/>}
            {theme==="dark" ? "Light mode" : "Dark mode"}
          </button>
          {/* Mute alerts */}
          <button onClick={toggleMute} style={{ display:"flex", alignItems:"center", gap:8, width:"100%", padding:"7px 10px",
            border:`1px solid ${T.border}`, borderRadius:T.r8, background:"transparent",
            color: soundMuted ? T.textMuted : T.textSecond,
            fontSize:12, cursor:"pointer", fontFamily:T.font, marginBottom:4 }}>
            {soundMuted ? <BellOffI s={13} c={T.textMuted}/> : <BellI s={13} c={T.blue}/>}
            {soundMuted ? "Unmute alerts" : "Mute alerts"}
          </button>
          {/* Logout */}
          <button onClick={onLogout} style={{ display:"flex", alignItems:"center", gap:8, width:"100%", padding:"7px 10px",
            border:`1px solid ${T.border}`, borderRadius:T.r8, background:"transparent", color:T.red,
            fontSize:12, cursor:"pointer", fontFamily:T.font }}>
            <OutI s={13} c={T.red}/> Sign out
          </button>
          <div style={{ fontSize:9, color:T.textMuted, textAlign:"center", marginTop:10 }}>Built by Social Aura</div>
        </div>
      </div>
    );
  }

  // ── Page map ──────────────────────────────────────────────────────────────
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

  const currentLabel = nav.find(n => n.id === page)?.label || "Dashboard";

  return (
    <div style={{ display:"flex", minHeight:"100vh", background:T.pageBg, fontFamily:T.font, overflowX:"hidden", position:"relative" }}>

      {/* ── Desktop sidebar ── */}
      <div style={{ width:SIDEBAR_W, flexShrink:0, height:"100vh", position:"sticky", top:0, overflowY:"auto", borderRight:`1px solid ${T.border}` }}
        className="rs-sidebar-desk">
        <SidebarContent/>
      </div>

      {/* ── Mobile drawer overlay ── */}
      {drawer && (
        <div onClick={() => setDrawer(false)}
          style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.75)", zIndex:2000, display:"none" }}
          className="rs-drawer-overlay">
          <div onClick={e => e.stopPropagation()}
            style={{ width:280, height:"100%", background:T.cardBg, borderRight:`1px solid ${T.border}` }}>
            <SidebarContent/>
          </div>
        </div>
      )}

      {/* ── Main area ── */}
      <div style={{ flex:1, minWidth:0, display:"flex", flexDirection:"column" }}>

        {/* Mobile top bar */}
        <div style={{ display:"none", alignItems:"center", gap:12, padding:"0 16px", height:54,
          background:T.cardBg, borderBottom:`1px solid ${T.border}`, flexShrink:0, position:"sticky", top:0, zIndex:100 }}
          className="rs-topbar">
          <button onClick={() => setDrawer(true)}
            style={{ background:T.elevated, border:`1px solid ${T.border}`, borderRadius:T.r8,
              width:36, height:36, display:"flex", alignItems:"center", justifyContent:"center",
              cursor:"pointer", color:T.textPrimary, flexShrink:0 }}>
            <MnuI s={16} c={T.textPrimary}/>
          </button>
          <div style={{ fontSize:14, fontWeight:700, color:T.textPrimary, flex:1 }}>{currentLabel}</div>
          <button onClick={handleTheme}
            style={{ background:T.elevated, border:`1px solid ${T.border}`, borderRadius:T.r8,
              width:36, height:36, display:"flex", alignItems:"center", justifyContent:"center",
              cursor:"pointer", flexShrink:0 }}>
            {theme==="dark" ? <SunI s={14} c={T.amber}/> : <MooI s={14} c={T.blue}/>}
          </button>
        </div>

        {/* Page content */}
        <div style={{ flex:1, padding:"28px 28px 40px", minWidth:0, overflowX:"hidden" }} className="rs-page-content">
          {PAGE_MAP[page] || <TodayPage onAlert={pushAlert}/>}
        </div>
      </div>

      {/* ── Responsive styles ── */}
      <style>{`
        @media (max-width: 767px) {
          .rs-sidebar-desk { display: none !important; }
          .rs-topbar { display: flex !important; }
          .rs-drawer-overlay { display: flex !important; }
          .rs-page-content { padding: 16px 14px 32px !important; }
        }
        @media (min-width: 768px) {
          .rs-topbar { display: none !important; }
          .rs-drawer-overlay { display: none !important; }
        }
        @keyframes rs-slide-in {
          from { opacity: 0; transform: translateX(60px) scale(.95); }
          to   { opacity: 1; transform: translateX(0)    scale(1);   }
        }
      `}</style>

      <NewBookingBanner/>
      <AlertToast alerts={alerts} onDismiss={id => setAlerts(p => p.filter(a => a.id !== id))}/>
    </div>
  );
}
