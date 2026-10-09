// pages/CustomersPage.jsx — no emoji, SVG icons
import { useState, useEffect, useCallback, useRef } from "react";
import { fetchCustomers, fetchCustomerByPhone, exportCustomersCSV } from "../api.js";
import { getT, displaySvc, money, localYmd } from "../theme.js";
import { Badge, Btn, Modal, ModalTitle, PageHeader, Spinner } from "../components.jsx";
import { SearchIcon, DownloadIcon, UsersIcon } from "../components.jsx";

const Ic = ({ size=16, color="currentColor", ch }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8}
    strokeLinecap="round" strokeLinejoin="round" style={{ display:"block", flexShrink:0 }}>{ch}</svg>
);
const PhoneIcon   = ({ size, color }) => <Ic size={size} color={color} ch={<><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.42 2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 9a16 16 0 0 0 6.09 6.09l1.36-1.35a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></>}/>;
const MailIcon    = ({ size, color }) => <Ic size={size} color={color} ch={<><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></>}/>;
const CalIcon     = ({ size, color }) => <Ic size={size} color={color} ch={<><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></>}/>;
const TireIcon    = ({ size, color }) => <Ic size={size} color={color} ch={<><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3.5"/><path d="M12 2.5v4M12 17.5v4M2.5 12h4M17.5 12h4"/></>}/>;
const StarIcon    = ({ size, color }) => <Ic size={size} color={color} ch={<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>}/>;

// A real past visit date, or null. Never-visited customers (only upcoming bookings)
// must not show a future "Last visit", and a malformed date must never render as
// "Invalid Date" — the upcoming booking is shown as "Next" instead.
const isYmd = s => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(new Date(s + "T00:00:00"));
const pastVisit = (s, today) => isYmd(s) && s <= today ? s : null;

function Stat({ label, value, color }) {
  const T = getT();
  return (
    <div style={{ background:T.elevated, border:`1px solid ${T.border}`, borderRadius:T.r8, padding:"10px 12px", minWidth:0 }}>
      <div style={{ fontSize:10, color:T.textMuted, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:4 }}>{label}</div>
      <div style={{ fontSize:"clamp(13px, 4vw, 18px)", fontWeight:800, color:color||T.textPrimary, letterSpacing:"-0.02em", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", fontVariantNumeric:"tabular-nums" }}>{value}</div>
    </div>
  );
}

function CustomerRow({ c, onClick }) {
  const T = getT();
  const [h, setH] = useState(false);
  const isLoyal = c.visitCount >= 3;
  const ell = { overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", minWidth:0 };
  return (
    <button className="rs-crm-row"
      onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      onClick={() => onClick(c)}
      style={{ display:"flex", alignItems:"center", gap:14, padding:"12px 16px", background:h ? T.elevated : T.cardBg, border:`1px solid ${h ? T.borderVis : T.border}`, borderRadius:T.r10, cursor:"pointer", width:"100%", textAlign:"left", transition:"all .12s" }}>

      {/* Avatar */}
      <div style={{ width:40, height:40, borderRadius:"50%", background:T.blueSubtle, border:`1px solid ${T.blue}30`, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, fontSize:13, color:T.blueBright, flexShrink:0, letterSpacing:"-0.02em" }}>
        {(c.firstName?.[0]||"").toUpperCase()}{(c.lastName?.[0]||"").toUpperCase()}
      </div>

      {/* Info */}
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:"flex", alignItems:"center", columnGap:8, rowGap:2, flexWrap:"wrap", marginBottom:2 }}>
          <span style={{ fontSize:13, fontWeight:700, color:T.textPrimary, minWidth:0, overflowWrap:"anywhere" }}>{c.firstName} {c.lastName}</span>
          {isLoyal && (
            <span style={{ display:"flex", alignItems:"center", gap:3, flexShrink:0, fontSize:10, fontWeight:600, color:T.amber, background:T.amberBg, border:`1px solid ${T.amberBorder}`, padding:"1px 7px", borderRadius:20 }}>
              <StarIcon size={9} color={T.amber}/> Loyal
            </span>
          )}
        </div>
        {c.otherNames?.length > 0 && (
          <div style={{ fontSize:10, color:T.textMuted, marginBottom:2, overflowWrap:"anywhere" }}>Also booked as {c.otherNames.join(", ")}</div>
        )}
        <div style={{ display:"flex", alignItems:"center", columnGap:12, rowGap:2, flexWrap:"wrap" }}>
          <span style={{ fontSize:11, color:T.textMuted, display:"flex", alignItems:"center", gap:4, maxWidth:"100%", minWidth:0 }}>
            <PhoneIcon size={10} color={T.textMuted}/><span style={ell}>{c.phone}</span>
          </span>
          {c.email && (
            <span style={{ fontSize:11, color:T.textMuted, display:"flex", alignItems:"center", gap:4, maxWidth:"100%", minWidth:0 }} title={c.email}>
              <MailIcon size={10} color={T.textMuted}/><span style={ell}>{c.email}</span>
            </span>
          )}
        </div>
        {c.tireSizes?.length > 0 && (
          <div style={{ display:"flex", alignItems:"center", gap:4, marginTop:3, fontSize:10, color:T.orange, minWidth:0 }}>
            <TireIcon size={10} color={T.orange}/><span style={ell}>{c.tireSizes.join(", ")}</span>
          </div>
        )}
      </div>

      {/* Stats (move under the name on phones so long names aren't squeezed — see rs-crm-row CSS) */}
      <div className="rs-crm-stats" style={{ textAlign:"right", flexShrink:0 }}>
        <div style={{ fontSize:13, fontWeight:700, color:T.textPrimary }}>{c.visitCount} visit{c.visitCount!==1?"s":""}</div>
        {c.totalSpent > 0 && <div style={{ fontSize:11, color:T.green }}>{money(c.totalSpent, 2)}</div>}
        <div style={{ fontSize:10, color:T.textMuted, marginTop:1 }}>Last visit: {c.lastVisit ? new Date(c.lastVisit + "T00:00:00").toLocaleDateString("en-CA", { month:"short", day:"numeric", year:"numeric" }) : "—"}</div>
        {isYmd(c.nextBooking?.date) && <div style={{ fontSize:10, color:T.green, marginTop:1, fontWeight:600 }}>Next: {new Date(c.nextBooking.date + "T00:00:00").toLocaleDateString("en-CA", { month:"short", day:"numeric" })} {c.nextBooking.time}</div>}
      </div>
    </button>
  );
}

function CustomerProfile({ customer: c }) {
  const T = getT();
  return (
    <div>
      {/* Contact */}
      <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginBottom:16 }}>
        <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:12, color:T.textSecond, background:T.elevated, border:`1px solid ${T.border}`, padding:"6px 10px", borderRadius:T.r8, maxWidth:"100%", minWidth:0, boxSizing:"border-box" }}>
          <PhoneIcon size={12} color={T.textMuted}/><span style={{ minWidth:0, overflowWrap:"anywhere" }}>{c.phone}</span>
        </div>
        {c.email && (
          <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:12, color:T.textSecond, background:T.elevated, border:`1px solid ${T.border}`, padding:"6px 10px", borderRadius:T.r8, maxWidth:"100%", minWidth:0, boxSizing:"border-box" }}>
            <MailIcon size={12} color={T.textMuted}/><span style={{ minWidth:0, overflowWrap:"anywhere" }}>{c.email}</span>
          </div>
        )}
      </div>

      {/* Stats grid */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(min(100%,105px),1fr))", gap:8, marginBottom:16 }}>
        <Stat label="Total visits"  value={c.visitCount}      color={T.blue}/>
        <Stat label="Completed"     value={c.completedCount}  color={T.green}/>
        <Stat label="No-shows"      value={c.noShowCount||0}  color={T.red}/>
        <Stat label="Total spent"   value={c.totalSpent > 0 ? money(c.totalSpent, 2) : "—"} color={T.teal}/>
      </div>

      {/* Tire sizes */}
      {c.tireSizes?.length > 0 && (
        <div style={{ marginBottom:14, padding:"10px 12px", background:T.elevated, border:`1px solid ${T.border}`, borderRadius:T.r8 }}>
          <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:4 }}>
            <TireIcon size={12} color={T.orange}/>
            <span style={{ fontSize:10, color:T.textMuted, textTransform:"uppercase", letterSpacing:"0.06em", fontWeight:600 }}>Tire Sizes</span>
          </div>
          <div style={{ fontSize:13, color:T.orange, fontWeight:500, overflowWrap:"anywhere" }}>{c.tireSizes.join(" · ")}</div>
        </div>
      )}

      {/* Booking history */}
      {c.bookings?.length > 0 && (
        <div>
          <div style={{ fontSize:11, fontWeight:600, color:T.textMuted, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:8 }}>Visit History</div>
          <div style={{ display:"flex", flexDirection:"column", gap:5, maxHeight:320, overflowY:"auto" }}>
            {c.bookings.map(b => (
              <div key={b.id||b._id} style={{ background:T.elevated, border:`1px solid ${T.border}`, borderRadius:T.r8, padding:"9px 12px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:12, fontWeight:600, color:T.textPrimary, marginBottom:2, overflowWrap:"anywhere" }}>{displaySvc(b)}</div>
                  <div style={{ fontSize:10, color:T.textMuted, display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}>
                    <CalIcon size={10} color={T.textMuted}/>{b.date} at {b.time}
                    {b.tireSize && <><TireIcon size={10} color={T.textMuted}/>{b.tireSize}</>}
                  </div>
                </div>
                <div style={{ textAlign:"right", flexShrink:0, marginLeft:10 }}>
                  <Badge status={b.status}/>
                  {b.finalPrice && <div style={{ fontSize:10, color:T.green, marginTop:4 }}>{money(b.finalPrice)}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function CustomersPage({ onAlert }) {
  const T = getT();
  const [customers, setCustomers] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState("");
  const [error,     setError]     = useState("");
  const reqId = useRef(0);
  const [selected,  setSelected]  = useState(null);
  const [profile,   setProfile]   = useState(null);
  const [loadingP,  setLoadingP]  = useState(false);

  // Filters & sort (remembered on this device)
  const saved = (() => { try { return JSON.parse(localStorage.getItem("rs_crm_view") || "{}"); } catch { return {}; } })();
  const [visited, setVisited] = useState(saved.visited || "any");
  const [kind,    setKind]    = useState(saved.kind || "all");
  const [sort,    setSort]    = useState(saved.sort || "recent");
  useEffect(() => { try { localStorage.setItem("rs_crm_view", JSON.stringify({ visited, kind, sort })); } catch {} }, [visited, kind, sort]);

  const load = useCallback(async () => {
    const id = ++reqId.current; // ignore answers to older searches that arrive late
    setLoading(true); setError("");
    try {
      const list = await fetchCustomers(search);
      if (id === reqId.current) setCustomers(list || []);
    } catch (e) {
      if (id !== reqId.current) return;
      // Never leave the previous (unfiltered) list on screen as if it were the results
      setCustomers([]); setError(e.message || "Could not load customers");
      onAlert?.(e.message, "error");
    } finally { if (id === reqId.current) setLoading(false); }
  }, [search]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  const openProfile = async (c) => {
    setSelected(c); setLoadingP(true); setProfile(null);
    try { setProfile(await fetchCustomerByPhone(c.phone)); }
    catch { setProfile(c); }
    finally { setLoadingP(false); }
  };

  const today = localYmd();
  const daysAgo = n => { const d = new Date(); d.setDate(d.getDate() - n); return localYmd(d); };
  const VISITED = [
    ["any","Any time"], ["7","Past week"], ["30","Past 30 days"], ["90","Past 3 months"], ["365","Past year"],
    ["lapsed90","No visit in 3+ months"], ["lapsed180","No visit in 6+ months"],
  ];
  const KINDS = [["all","All"], ["upcoming","Upcoming booking"], ["loyal","Loyal (3+)"], ["new","First-timers"], ["noshow","No-shows"]];
  const SORTS = [["recent","Most recent visit"], ["oldest","Oldest visit"], ["visits","Most visits"], ["spent","Top spenders"], ["name","Name A–Z"], ["newest","Newest customers"]];
  const shown = customers.map(c => ({ ...c, lastVisit: pastVisit(c.lastVisit, today) })).filter(c => {
    const last = c.lastVisit || "";
    // "No visit in N months" = has visited before, just not lately
    if (visited === "lapsed90")  { if (!last || !(last < daysAgo(90)))  return false; }
    else if (visited === "lapsed180") { if (!last || !(last < daysAgo(180))) return false; }
    else if (visited !== "any") { if (!(last >= daysAgo(Number(visited)) && last <= today)) return false; }
    if (kind === "upcoming" && !c.nextBooking) return false;
    if (kind === "loyal" && c.visitCount < 3) return false;
    if (kind === "new" && c.visitCount !== 1) return false;
    if (kind === "noshow" && !c.noShowCount) return false;
    return true;
  }).sort((a, b) => {
    // Customers who have never visited go after everyone with a real visit
    const byVisit = dir => (!a.lastVisit) - (!b.lastVisit) || dir * (a.lastVisit || "").localeCompare(b.lastVisit || "");
    if (sort === "oldest") return byVisit(1);
    if (sort === "visits") return b.visitCount - a.visitCount || (b.lastVisit || "").localeCompare(a.lastVisit || "");
    if (sort === "spent")  return b.totalSpent - a.totalSpent;
    if (sort === "name")   return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
    if (sort === "newest") return (b.firstVisit || "").localeCompare(a.firstVisit || "");
    return byVisit(-1);
  });
  const filtering = visited !== "any" || kind !== "all";

  // Which ends of the chip row are scrolled out of view (for the fade hint)
  const chipsRef = useRef(null);
  const [chipEdges, setChipEdges] = useState({ l: false, r: false });
  const checkChips = useCallback(() => {
    const el = chipsRef.current; if (!el) return;
    const l = el.scrollLeft > 1, r = el.scrollLeft + el.clientWidth < el.scrollWidth - 1;
    setChipEdges(e => e.l === l && e.r === r ? e : { l, r });
  }, []);
  useEffect(() => { checkChips(); window.addEventListener("resize", checkChips); return () => window.removeEventListener("resize", checkChips); }, [checkChips]);
  const chipFade = !chipEdges.l && !chipEdges.r ? "none"
    : `linear-gradient(to right, ${chipEdges.l ? "transparent, #000 28px" : "#000"}, ${chipEdges.r ? "#000 calc(100% - 28px), transparent" : "#000"})`;
  // Controls are at least 36px tall so they're comfortable to tap on phones
  const chip = (active) => ({ minHeight:36, padding:"8px 13px", flexShrink:0, borderRadius:20, border:`1px solid ${active ? T.blue : T.border}`, background: active ? T.blueSubtle : "transparent", color: active ? T.blueBright : T.textSecond, fontSize:12, fontWeight: active ? 700 : 500, fontFamily:T.font, cursor:"pointer", whiteSpace:"nowrap" });
  const select = { flex:"1 1 200px", minWidth:0, minHeight:38, maxWidth:320, background:T.cardBg, border:`1px solid ${T.border}`, borderRadius:T.r8, padding:"8px 10px", color:T.textPrimary, fontSize:12, fontFamily:T.font, outline:"none", cursor:"pointer" };

  return (
    <div>
      <style>{`@media (max-width: 480px) {
        .rs-crm-row { flex-wrap: wrap; row-gap: 8px !important; }
        .rs-crm-stats { flex-basis: 100%; text-align: left !important; padding-left: 54px; display: flex; flex-wrap: wrap; align-items: baseline; column-gap: 10px; }
        .rs-crm-stats > div { margin-top: 0 !important; }
      }`}</style>
      <PageHeader
        title="Customers"
        sub={filtering ? `${shown.length.toLocaleString()} of ${customers.length.toLocaleString()} customers` : `${customers.length.toLocaleString()} customer${customers.length!==1?"s":""} total`}
        actions={
          <Btn small variant="ghost" icon={<DownloadIcon size={13}/>} style={{ minHeight:36 }}
            onClick={async () => { try { await exportCustomersCSV(); onAlert?.("CSV downloaded"); } catch(e) { onAlert?.(e.message,"error"); } }}>
            Export CSV
          </Btn>
        }
      />

      {/* Search */}
      <div style={{ position:"relative", marginBottom:16 }}>
        <div style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", color:T.textMuted, pointerEvents:"none" }}>
          <SearchIcon size={14}/>
        </div>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, phone, or email…"
          style={{ width:"100%", background:T.cardBg, border:`1px solid ${T.border}`, borderRadius:T.r10, padding:"10px 14px 10px 38px", color:T.textPrimary, fontSize:13, fontFamily:T.font, outline:"none", boxSizing:"border-box" }}
          onFocus={e => e.target.style.borderColor=T.blue}
          onBlur={e => e.target.style.borderColor=T.border}
        />
      </div>

      {/* Filters */}
      <div style={{ display:"flex", gap:8, flexWrap:"wrap", alignItems:"center", marginBottom:10 }}>
        <select value={visited} onChange={e => setVisited(e.target.value)} style={select} aria-label="Last visit">
          {VISITED.map(([v,l]) => <option key={v} value={v} style={{ background:T.cardBg }}>Last visit: {l}</option>)}
        </select>
        <select value={sort} onChange={e => setSort(e.target.value)} style={select} aria-label="Sort">
          {SORTS.map(([v,l]) => <option key={v} value={v} style={{ background:T.cardBg }}>Sort: {l}</option>)}
        </select>
        {filtering && <button onClick={() => { setVisited("any"); setKind("all"); }} style={{ ...chip(false), border:"none", color:T.blue }}>Clear filters</button>}
      </div>
      <div ref={chipsRef} onScroll={checkChips} style={{ display:"flex", gap:6, overflowX:"auto", paddingBottom:4, marginBottom:14, WebkitOverflowScrolling:"touch",
        // Fade the edge(s) that have more chips past them so it's clear the row scrolls
        ...(chipFade !== "none" && { WebkitMaskImage: chipFade, maskImage: chipFade }) }}>
        {KINDS.map(([v,l]) => <button key={v} onClick={() => setKind(v)} style={chip(kind === v)}>{l}</button>)}
      </div>

      {loading ? <Spinner/> : error ? (
        <div style={{ padding:"48px 16px", textAlign:"center" }}>
          <div style={{ fontSize:14, fontWeight:600, color:T.textPrimary, marginBottom:6 }}>{search ? "Search failed" : "Could not load customers"}</div>
          <div style={{ fontSize:12, color:T.textMuted, marginBottom:14 }}>{error}</div>
          <Btn small variant="ghost" onClick={load}>Try again</Btn>
        </div>
      ) : shown.length === 0 && customers.length > 0 ? (
        <div style={{ padding:"48px 0", textAlign:"center", fontSize:13, color:T.textMuted }}>
          No customers match these filters. <button onClick={() => { setVisited("any"); setKind("all"); }} style={{ background:"none", border:"none", color:T.blue, fontWeight:700, cursor:"pointer", fontFamily:T.font, fontSize:13 }}>Clear filters</button>
        </div>
      ) : customers.length === 0 ? (
        <div style={{ padding:"64px 0", textAlign:"center" }}>
          <div style={{ width:48, height:48, borderRadius:"50%", background:T.elevated, border:`1px solid ${T.border}`, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px" }}>
            <UsersIcon size={20} color={T.textMuted}/>
          </div>
          <div style={{ fontSize:14, fontWeight:600, color:T.textPrimary, marginBottom:6 }}>
            {search ? "No customers match your search" : "No customers yet"}
          </div>
          <div style={{ fontSize:12, color:T.textMuted }}>
            {search ? "Try a different name, phone, or email" : "Customers appear here once they make a booking"}
          </div>
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
          {shown.map(c => <CustomerRow key={c.phone} c={c} onClick={openProfile}/>)}
        </div>
      )}

      {selected && (
        <Modal onClose={() => { setSelected(null); setProfile(null); }} wide>
          <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16, paddingRight:40 }}>
            <div style={{ width:44, height:44, borderRadius:"50%", background:T.blueSubtle, border:`1.5px solid ${T.blue}40`, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, fontSize:14, color:T.blueBright, flexShrink:0 }}>
              {(selected.firstName?.[0]||"").toUpperCase()}{(selected.lastName?.[0]||"").toUpperCase()}
            </div>
            <div style={{ minWidth:0 }}>
              <div style={{ fontSize:15, fontWeight:700, color:T.textPrimary, overflowWrap:"anywhere" }}>{selected.firstName} {selected.lastName}</div>
              <div style={{ fontSize:12, color:T.textMuted }}>Customer Profile</div>
            </div>
          </div>
          {loadingP ? <Spinner/> : <CustomerProfile customer={profile || selected}/>}
        </Modal>
      )}
    </div>
  );
}
