// pages/CustomersPage.jsx — no emoji, SVG icons
import { useState, useEffect, useCallback } from "react";
import { fetchCustomers, fetchCustomerByPhone, exportCustomersCSV } from "../api.js";
import { getT, displaySvc } from "../theme.js";
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

function Stat({ label, value, color }) {
  const T = getT();
  return (
    <div style={{ background:T.elevated, border:`1px solid ${T.border}`, borderRadius:T.r8, padding:"10px 13px" }}>
      <div style={{ fontSize:10, color:T.textMuted, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:4 }}>{label}</div>
      <div style={{ fontSize:18, fontWeight:800, color:color||T.textPrimary, letterSpacing:"-0.02em" }}>{value}</div>
    </div>
  );
}

function CustomerRow({ c, onClick }) {
  const T = getT();
  const [h, setH] = useState(false);
  const isLoyal = c.visitCount >= 3;
  return (
    <button
      onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      onClick={() => onClick(c)}
      style={{ display:"flex", alignItems:"center", gap:14, padding:"12px 16px", background:h ? T.elevated : T.cardBg, border:`1px solid ${h ? T.borderVis : T.border}`, borderRadius:T.r10, cursor:"pointer", width:"100%", textAlign:"left", transition:"all .12s" }}>

      {/* Avatar */}
      <div style={{ width:40, height:40, borderRadius:"50%", background:T.blueSubtle, border:`1px solid ${T.blue}30`, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, fontSize:13, color:T.blueBright, flexShrink:0, letterSpacing:"-0.02em" }}>
        {(c.firstName?.[0]||"").toUpperCase()}{(c.lastName?.[0]||"").toUpperCase()}
      </div>

      {/* Info */}
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:2 }}>
          <span style={{ fontSize:13, fontWeight:700, color:T.textPrimary }}>{c.firstName} {c.lastName}</span>
          {isLoyal && (
            <span style={{ display:"flex", alignItems:"center", gap:3, fontSize:10, fontWeight:600, color:T.amber, background:T.amberBg, border:`1px solid ${T.amberBorder}`, padding:"1px 7px", borderRadius:20 }}>
              <StarIcon size={9} color={T.amber}/> Loyal
            </span>
          )}
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:12, flexWrap:"wrap" }}>
          <span style={{ fontSize:11, color:T.textMuted, display:"flex", alignItems:"center", gap:4 }}>
            <PhoneIcon size={10} color={T.textMuted}/>{c.phone}
          </span>
          {c.email && (
            <span style={{ fontSize:11, color:T.textMuted, display:"flex", alignItems:"center", gap:4 }}>
              <MailIcon size={10} color={T.textMuted}/>{c.email}
            </span>
          )}
        </div>
        {c.tireSizes?.length > 0 && (
          <div style={{ display:"flex", alignItems:"center", gap:4, marginTop:3, fontSize:10, color:T.orange }}>
            <TireIcon size={10} color={T.orange}/>{c.tireSizes.join(", ")}
          </div>
        )}
      </div>

      {/* Stats */}
      <div style={{ textAlign:"right", flexShrink:0 }}>
        <div style={{ fontSize:13, fontWeight:700, color:T.textPrimary }}>{c.visitCount} visit{c.visitCount!==1?"s":""}</div>
        {c.totalSpent > 0 && <div style={{ fontSize:11, color:T.green }}>${c.totalSpent.toFixed(2)}</div>}
        <div style={{ fontSize:10, color:T.textMuted, marginTop:1 }}>Last: {c.lastVisit}</div>
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
        <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:12, color:T.textSecond, background:T.elevated, border:`1px solid ${T.border}`, padding:"6px 10px", borderRadius:T.r8 }}>
          <PhoneIcon size={12} color={T.textMuted}/>{c.phone}
        </div>
        {c.email && (
          <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:12, color:T.textSecond, background:T.elevated, border:`1px solid ${T.border}`, padding:"6px 10px", borderRadius:T.r8 }}>
            <MailIcon size={12} color={T.textMuted}/>{c.email}
          </div>
        )}
      </div>

      {/* Stats grid */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(100px,1fr))", gap:8, marginBottom:16 }}>
        <Stat label="Total visits"  value={c.visitCount}      color={T.blue}/>
        <Stat label="Completed"     value={c.completedCount}  color={T.green}/>
        <Stat label="No-shows"      value={c.noShowCount||0}  color={T.red}/>
        <Stat label="Total spent"   value={c.totalSpent > 0 ? `$${c.totalSpent.toFixed(2)}` : "—"} color={T.teal}/>
      </div>

      {/* Tire sizes */}
      {c.tireSizes?.length > 0 && (
        <div style={{ marginBottom:14, padding:"10px 12px", background:T.elevated, border:`1px solid ${T.border}`, borderRadius:T.r8 }}>
          <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:4 }}>
            <TireIcon size={12} color={T.orange}/>
            <span style={{ fontSize:10, color:T.textMuted, textTransform:"uppercase", letterSpacing:"0.06em", fontWeight:600 }}>Tire Sizes</span>
          </div>
          <div style={{ fontSize:13, color:T.orange, fontWeight:500 }}>{c.tireSizes.join(" · ")}</div>
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
                  <div style={{ fontSize:12, fontWeight:600, color:T.textPrimary, marginBottom:2 }}>{displaySvc(b)}</div>
                  <div style={{ fontSize:10, color:T.textMuted, display:"flex", alignItems:"center", gap:6 }}>
                    <CalIcon size={10} color={T.textMuted}/>{b.date} at {b.time}
                    {b.tireSize && <><TireIcon size={10} color={T.textMuted}/>{b.tireSize}</>}
                  </div>
                </div>
                <div style={{ textAlign:"right", flexShrink:0, marginLeft:10 }}>
                  <Badge status={b.status}/>
                  {b.finalPrice && <div style={{ fontSize:10, color:T.green, marginTop:4 }}>${b.finalPrice}</div>}
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
  const [selected,  setSelected]  = useState(null);
  const [profile,   setProfile]   = useState(null);
  const [loadingP,  setLoadingP]  = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { setCustomers(await fetchCustomers(search)); }
    catch (e) { onAlert?.(e.message, "error"); }
    finally { setLoading(false); }
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

  return (
    <div>
      <PageHeader
        title="Customers"
        sub={`${customers.length.toLocaleString()} customer${customers.length!==1?"s":""} total`}
        actions={
          <Btn small variant="ghost" icon={<DownloadIcon size={13}/>}
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

      {loading ? <Spinner/> : customers.length === 0 ? (
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
          {customers.map(c => <CustomerRow key={c.phone} c={c} onClick={openProfile}/>)}
        </div>
      )}

      {selected && (
        <Modal onClose={() => { setSelected(null); setProfile(null); }} wide>
          <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16 }}>
            <div style={{ width:44, height:44, borderRadius:"50%", background:T.blueSubtle, border:`1.5px solid ${T.blue}40`, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, fontSize:14, color:T.blueBright, flexShrink:0 }}>
              {(selected.firstName?.[0]||"").toUpperCase()}{(selected.lastName?.[0]||"").toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize:15, fontWeight:700, color:T.textPrimary }}>{selected.firstName} {selected.lastName}</div>
              <div style={{ fontSize:12, color:T.textMuted }}>Customer Profile</div>
            </div>
          </div>
          {loadingP ? <Spinner/> : <CustomerProfile customer={profile || selected}/>}
        </Modal>
      )}
    </div>
  );
}
