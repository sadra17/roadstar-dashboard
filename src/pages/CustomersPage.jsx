// pages/CustomersPage.jsx
import { useState, useEffect, useCallback } from "react";
import { fetchCustomers, fetchCustomerByPhone, exportCustomersCSV } from "../api.js";
import { getT, displaySvc } from "../theme.js";
import { Badge, Btn, Modal, ModalTitle, PageHeader, Spinner, Empty, Card, SearchIcon, DownloadIcon, UsersIcon } from "../components.jsx";

function CustomerRow({ c, onClick }) {
  const T = getT(); const [h, setH] = useState(false);
  return (
    <button onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)} onClick={() => onClick(c)}
      style={{ display:"flex", alignItems:"center", gap:14, padding:"12px 16px", background:h?T.elevated:T.cardBg, border:`1px solid ${h?T.borderVis:T.border}`, borderRadius:T.r10, cursor:"pointer", width:"100%", textAlign:"left", transition:"all .12s" }}>
      <div style={{ width:40, height:40, borderRadius:"50%", background:T.blueSubtle, border:`1px solid ${T.blue}40`, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, fontSize:13, color:T.blueBright, flexShrink:0 }}>
        {(c.firstName?.[0]||"?")}{ (c.lastName?.[0]||"")}
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:13, fontWeight:700, color:T.textPrimary, display:"flex", alignItems:"center", gap:8 }}>
          {c.firstName} {c.lastName}
          {c.visitCount >= 3 && <span style={{ fontSize:10, padding:"1px 6px", borderRadius:20, background:T.orangeBg, color:T.orange, border:`1px solid ${T.orangeBorder}`, fontWeight:700 }}>★ Loyal</span>}
        </div>
        <div style={{ fontSize:11, color:T.textMuted }}>{c.phone}{c.email && <span style={{ marginLeft:8 }}>{c.email}</span>}</div>
        {c.tireSizes?.length > 0 && <div style={{ fontSize:10, color:T.orange, marginTop:2 }}>{c.tireSizes.join(", ")}</div>}
      </div>
      <div style={{ textAlign:"right", flexShrink:0 }}>
        <div style={{ fontSize:13, fontWeight:700, color:T.textPrimary }}>{c.visitCount} visit{c.visitCount!==1?"s":""}</div>
        {c.totalSpent > 0 && <div style={{ fontSize:11, color:T.green }}>${c.totalSpent.toFixed(2)}</div>}
        <div style={{ fontSize:10, color:T.textMuted }}>Last: {c.lastVisit}</div>
      </div>
    </button>
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
    catch (e) { onAlert?.(e.message,"error"); }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t); }, [load]);

  const openProfile = async (c) => {
    setSelected(c); setLoadingP(true); setProfile(null);
    try { setProfile(await fetchCustomerByPhone(c.phone)); }
    catch (e) { setProfile(c); }
    finally { setLoadingP(false); }
  };

  return (
    <div>
      <PageHeader title="Customers" sub={`${customers.length} customers total`}
        actions={
          <Btn small variant="ghost" icon={<DownloadIcon size={13}/>}
            onClick={async () => { try { await exportCustomersCSV(); onAlert?.("CSV downloaded"); } catch(e) { onAlert?.(e.message,"error"); } }}>
            Export CSV
          </Btn>
        }
      />

      <div style={{ position:"relative", marginBottom:16 }}>
        <div style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", color:T.textMuted }}><SearchIcon size={14}/></div>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, phone, or email…"
          style={{ width:"100%", background:T.cardBg, border:`1px solid ${T.border}`, borderRadius:T.r10, padding:"10px 14px 10px 38px", color:T.textPrimary, fontSize:13, fontFamily:T.font, outline:"none", boxSizing:"border-box" }}/>
      </div>

      {loading ? <Spinner/> : customers.length === 0 ? (
        <Empty icon="👥" title="No customers found" sub="Customers appear here once they make a booking"/>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
          {customers.map(c => <CustomerRow key={c.phone} c={c} onClick={openProfile}/>)}
        </div>
      )}

      {selected && (
        <Modal onClose={() => { setSelected(null); setProfile(null); }} wide>
          <ModalTitle sub={`${selected.phone}${selected.email ? " · " + selected.email : ""}`}>
            {selected.firstName} {selected.lastName}
          </ModalTitle>
          {loadingP ? <Spinner/> : (
            <CustomerProfile customer={profile || selected}/>
          )}
        </Modal>
      )}
    </div>
  );
}

function CustomerProfile({ customer: c }) {
  const T = getT();
  return (
    <div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))", gap:8, marginBottom:16 }}>
        {[["Total Visits",c.visitCount,T.blue],["Completed",c.completedCount,T.green],["No-shows",c.noShowCount||0,T.red],["Total Spent",c.totalSpent>0?`$${c.totalSpent.toFixed(2)}`:"—",T.teal]].map(([l,v,a]) => (
          <div key={l} style={{ background:T.elevated, borderRadius:T.r8, padding:"10px 12px", border:`1px solid ${T.border}` }}>
            <div style={{ fontSize:10, color:T.textMuted, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:4 }}>{l}</div>
            <div style={{ fontSize:18, fontWeight:700, color:a }}>{v}</div>
          </div>
        ))}
      </div>
      {c.tireSizes?.length > 0 && (
        <div style={{ marginBottom:14, padding:"10px 12px", background:T.elevated, borderRadius:T.r8, border:`1px solid ${T.border}` }}>
          <div style={{ fontSize:10, color:T.textMuted, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:4 }}>Tire Sizes</div>
          <div style={{ fontSize:13, color:T.orange }}>{c.tireSizes.join(", ")}</div>
        </div>
      )}
      {c.bookings?.length > 0 && (
        <div>
          <div style={{ fontSize:11, fontWeight:600, color:T.textMuted, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:8 }}>Booking History</div>
          <div style={{ display:"flex", flexDirection:"column", gap:6, maxHeight:320, overflowY:"auto" }}>
            {c.bookings.map(b => (
              <div key={b.id||b._id} style={{ background:T.elevated, border:`1px solid ${T.border}`, borderRadius:T.r8, padding:"9px 12px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div>
                  <div style={{ fontSize:13, fontWeight:600, color:T.textPrimary }}>{displaySvc(b)}</div>
                  <div style={{ fontSize:11, color:T.textMuted }}>{b.date} at {b.time}</div>
                  {b.tireSize && <div style={{ fontSize:10, color:T.orange }}>{b.tireSize}</div>}
                </div>
                <div style={{ textAlign:"right" }}>
                  <Badge status={b.status}/>
                  {b.finalPrice && <div style={{ fontSize:11, color:T.green, marginTop:4 }}>${b.finalPrice}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
