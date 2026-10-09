// pages/AuditLogPage.jsx
import { useState, useEffect, useRef } from "react";
import { fetchAuditLog } from "../api.js";
import { getT } from "../theme.js";
import { PageHeader, Spinner, Empty, Card, SearchIcon } from "../components.jsx";

// Long before/after values are shortened with an ellipsis; hover shows the full value
const clip40 = v => v == null ? v : (v.length > 40 ? v.slice(0, 39) + "…" : v);

export function AuditLogPage({ onAlert }) {
  const T = getT();
  const [logs,    setLogs]    = useState([]);
  const [total,   setTotal]   = useState(0);
  const [page,    setPage]    = useState(1);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ entity:"", action:"" });
  const PER_PAGE = 50;
  const goodPage = useRef(1); // last page that loaded — fall back to it if a fetch fails

  useEffect(() => {
    setLoading(true);
    const p = { page, limit:PER_PAGE };
    if (filters.entity) p.entity = filters.entity;
    if (filters.action) p.action = filters.action;
    fetchAuditLog(p)
      .then(d => {
        const t = d.total || 0, last = Math.max(1, Math.ceil(t / PER_PAGE));
        setTotal(t);
        // Past the end (log shrank, or a filter changed the count): go to the last page.
        if (page > last && !(d.logs || []).length) { setPage(last); return; }
        goodPage.current = page;
        setLogs(d.logs || []);
      })
      .catch(e => { onAlert?.(e.message,"error"); if (page !== goodPage.current) setPage(goodPage.current); })
      .finally(() => setLoading(false));
  }, [page, filters]);

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
  const goPage = n => { setPage(Math.min(Math.max(1, n), totalPages)); window.scrollTo(0, 0); };
  // "sms_sent" is an action (logged on entity "booking"), the rest are entities.
  const CHIPS = [
    { label:"All",      entity:"",        action:"" },
    { label:"booking",  entity:"booking", action:"" },
    { label:"setting",  entity:"setting", action:"" },
    { label:"user",     entity:"user",    action:"" },
    { label:"login",    entity:"login",   action:"" },
    { label:"sms_sent", entity:"",        action:"sms_sent" },
  ];

  const fmtTime = ts => new Date(ts).toLocaleString("en-CA",{month:"short",day:"numeric",hour:"numeric",minute:"2-digit"});
  const ACTION_COLOR = { created:T?.green||"#22C55E", deleted:T?.red||"#EF4444", updated:T?.blue||"#2563EB", status_changed:T?.amber||"#F59E0B", login_success:T?.teal||"#14B8A6", login_failed:T?.red||"#EF4444", sms_sent:T?.purple||"#8B5CF6" };

  return (
    <div>
      <PageHeader title="Audit Log" sub={`${total} total events`}/>
      <div style={{ display:"flex", gap:8, marginBottom:14, flexWrap:"wrap" }}>
        {CHIPS.map(c => {
          const on = filters.entity === c.entity && filters.action === c.action;
          return (
            <button key={c.label} onClick={() => { goodPage.current = 1; setFilters({ entity:c.entity, action:c.action }); setPage(1); window.scrollTo(0, 0); }}
              style={{ padding:"5px 12px", minHeight:36, borderRadius:20, border:`1px solid ${on?T.blue:T.border}`, background:on?T.blueSubtle:"transparent", color:on?T.blueBright:T.textMuted, fontSize:11, fontFamily:T.font, cursor:"pointer" }}>
              {c.label}
            </button>
          );
        })}
      </div>
      {loading ? <Spinner/> : logs.length === 0 ? (
        <Empty icon={null} title="No audit events" sub="Actions taken in the dashboard will appear here"/>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
          {logs.map(l => (
            <div key={l.id} style={{ background:T.cardBg, border:`1px solid ${T.border}`, borderRadius:T.r8, padding:"10px 14px", display:"flex", gap:12, alignItems:"flex-start" }}>
              <div style={{ width:10, height:10, borderRadius:"50%", background:ACTION_COLOR[l.action]||T.textMuted, flexShrink:0, marginTop:3 }}/>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:12, color:T.textPrimary, overflowWrap:"anywhere" }}>
                  <span style={{ fontWeight:600, color:ACTION_COLOR[l.action]||T.textSecond }}>{l.action}</span>
                  {" "}<span style={{ color:T.textMuted }}>{l.entity}</span>
                  {l.entityLabel && <span style={{ color:T.textSecond }}> — {l.entityLabel}</span>}
                </div>
                {l.field && <div style={{ fontSize:11, color:T.textMuted, marginTop:2, overflowWrap:"anywhere" }}>
                  {l.field}: <span title={JSON.stringify(l.beforeValue)} style={{ color:T.red }}>{clip40(JSON.stringify(l.beforeValue))}</span> → <span title={JSON.stringify(l.afterValue)} style={{ color:T.green }}>{clip40(JSON.stringify(l.afterValue))}</span>
                </div>}
                <div style={{ fontSize:10, color:T.textMuted, marginTop:2, overflowWrap:"anywhere" }}>{l.userName||l.userEmail||"system"} · {fmtTime(l.createdAt)}</div>
              </div>
            </div>
          ))}
          {totalPages > 1 && (
            <div style={{ display:"flex", justifyContent:"center", alignItems:"center", gap:8, padding:"14px 0", flexWrap:"wrap" }}>
              {page > 1 && <button onClick={() => goPage(page-1)} style={{ padding:"6px 14px", minHeight:40, borderRadius:T.r8, border:`1px solid ${T.border}`, background:T.elevated, color:T.textSecond, fontSize:12, cursor:"pointer", fontFamily:T.font }}>← Prev</button>}
              <span style={{ fontSize:12, color:T.textMuted, padding:"6px 0" }}>Page {page} of {totalPages} · {total} total</span>
              {page < totalPages && <button onClick={() => goPage(page+1)} style={{ padding:"6px 14px", minHeight:40, borderRadius:T.r8, border:`1px solid ${T.border}`, background:T.elevated, color:T.textSecond, fontSize:12, cursor:"pointer", fontFamily:T.font }}>Next →</button>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// pages/UsersPage.jsx
// ─────────────────────────────────────────────────────────────────────────────
import { fetchUsers, createUser, updateUser, resetPassword, getUserId, getUserEmail, getUserRole } from "../api.js";
import { Btn, IBtn, Modal, ModalTitle, Inp, Sel, Badge as BadgeComp, ConfirmModal, TrashIcon as TrashIconC } from "../components.jsx";
import { CheckIcon, XIcon, PenIcon, TrashIcon, PlusIcon, RestoreIcon } from "../components.jsx";

export function UsersPage({ onAlert }) {
  const T = getT();
  const [users,       setUsers]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [modal,       setModal]       = useState(null); // null | "create" | user object (edit)
  const [form,        setForm]        = useState({ name:"", email:"", password:"", role:"frontdesk" });
  const [busy,        setBusy]        = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null); // user object to confirm deactivate
  const [deleteBusy,   setDeleteBusy]   = useState(false);
  // The logged-in user can't deactivate themselves or change their own role.
  const myId = getUserId(), myEmail = getUserEmail();
  const isMe = u => !!u && typeof u === "object" && ((myId && u.id === myId) || (myEmail && u.email?.toLowerCase() === myEmail.toLowerCase()));
  // Only a super admin may hand out (or take away) the Super Admin role.
  const amSuper = getUserRole() === "superadmin";
  const ROLE_OPTS = [{value:"owner",label:"Owner"},{value:"frontdesk",label:"Front Desk"},{value:"mechanic",label:"Mechanic"},
    ...(amSuper ? [{value:"superadmin",label:"Super Admin"}] : [])];
  const roleLocked = u => isMe(u) || (!amSuper && u?.role === "superadmin");

  const load = () => {
    setLoading(true);
    fetchUsers().then(setUsers).catch(e => onAlert?.(e.message,"error")).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const handleSave = async () => {
    if (busy) return;
    if (!form.name?.trim()) { onAlert?.("Enter the user's name.", "error"); return; }
    if (modal === "create") {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((form.email || "").trim())) { onAlert?.("Enter a valid email address.", "error"); return; }
      if ((form.password || "").length < 8) { onAlert?.("Password must be at least 8 characters.", "error"); return; }
    }
    setBusy(true);
    try {
      if (modal === "create") {
        await createUser({ ...form, name:form.name.trim(), email:form.email.trim() });
        onAlert?.("User created");
      } else {
        // Only send what may change: never your own role/active flag, and the
        // role only when it was actually changed.
        const upd = { name:form.name.trim() };
        if (!isMe(modal)) upd.active = form.active;
        if (!roleLocked(modal) && form.role !== modal.role) upd.role = form.role;
        await updateUser(modal.id, upd);
        onAlert?.("User updated");
      }
      setModal(null); load();
    } catch (e) { onAlert?.(e.message,"error"); }
    finally { setBusy(false); }
  };

  const ROLE_LABELS = { superadmin:"Super Admin", owner:"Owner", frontdesk:"Front Desk", mechanic:"Mechanic" };
  const ROLE_COLORS = { superadmin:T.red, owner:T.blue, frontdesk:T.teal, mechanic:T.amber };

  return (
    <div>
      <PageHeader title="Users & Roles" sub="Manage staff access"
        actions={<Btn small icon={<PlusIcon size={13} color="#fff"/>} onClick={() => { setForm({name:"",email:"",password:"",role:"frontdesk"}); setModal("create"); }}>Add User</Btn>}
      />
      {loading ? <Spinner/> : (
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {users.map(u => (
            <div key={u.id} style={{ background:T.cardBg, border:`1px solid ${T.border}`, borderRadius:T.r10, padding:"12px 14px", display:"flex", alignItems:"center", gap:12, flexWrap:"wrap" }}>
              <div style={{ width:38, height:38, borderRadius:"50%", background:`${ROLE_COLORS[u.role]||T.blue}20`, border:`1px solid ${ROLE_COLORS[u.role]||T.blue}40`, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, fontSize:13, color:ROLE_COLORS[u.role]||T.blue, flexShrink:0 }}>
                {(u.name?.[0]||"?")}
              </div>
              <div style={{ flex:"1 1 150px", minWidth:0 }}>
                <div style={{ fontSize:13, fontWeight:700, color:u.active?T.textPrimary:T.textMuted, overflowWrap:"anywhere" }}>{u.name}{isMe(u) && <span style={{ fontWeight:500, color:T.textMuted }}> (you)</span>}</div>
                <div style={{ fontSize:11, color:T.textMuted, overflowWrap:"anywhere" }}>{u.email}</div>
                {u.lastLoginAt && <div style={{ fontSize:10, color:T.textMuted }}>Last login: {new Date(u.lastLoginAt).toLocaleDateString()}</div>}
              </div>
              {/* Badges + actions wrap below the name on narrow phones */}
              <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap", marginLeft:"auto" }}>
                <span style={{ fontSize:11, fontWeight:600, padding:"2px 8px", borderRadius:20, background:`${ROLE_COLORS[u.role]||T.blue}20`, color:ROLE_COLORS[u.role]||T.blue, border:`1px solid ${ROLE_COLORS[u.role]||T.blue}40`, whiteSpace:"nowrap" }}>
                  {ROLE_LABELS[u.role]||u.role}
                </span>
                {!u.active && <span style={{ fontSize:10, color:T.textMuted, background:T.elevated, padding:"2px 8px", borderRadius:20, border:`1px solid ${T.border}` }}>Inactive</span>}
                <div style={{ display:"flex", gap:4 }}>
                  <IBtn v="edit" title="Edit" onClick={() => { setForm({name:u.name,email:u.email,password:"",role:u.role,active:u.active!==false}); setModal(u); }}><PenIcon size={14}/></IBtn>
                  {!isMe(u) && (u.active !== false
                    ? <IBtn v="trash" title="Deactivate" onClick={() => setDeleteTarget(u)}><XIcon size={14}/></IBtn>
                    : <IBtn v="restore" title="Re-activate" onClick={async () => {
                        try { await updateUser(u.id, { active:true }); onAlert?.("User re-activated"); load(); }
                        catch (e) { onAlert?.(e.message,"error"); }
                      }}><RestoreIcon size={14}/></IBtn>)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <Modal onClose={() => setModal(null)}>
          <ModalTitle>{modal === "create" ? "Add User" : `Edit — ${modal.name}`}</ModalTitle>
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            <div><label style={{ fontSize:11, color:T.textMuted, display:"block", marginBottom:4, textTransform:"uppercase", letterSpacing:"0.06em", fontWeight:600 }}>Name</label><Inp value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} placeholder="Full name"/></div>
            {modal === "create" && <div><label style={{ fontSize:11, color:T.textMuted, display:"block", marginBottom:4, textTransform:"uppercase", letterSpacing:"0.06em", fontWeight:600 }}>Email</label><Inp type="email" value={form.email} onChange={e=>setForm(p=>({...p,email:e.target.value}))} placeholder="email@shop.com"/></div>}
            {modal === "create" && <div><label style={{ fontSize:11, color:T.textMuted, display:"block", marginBottom:4, textTransform:"uppercase", letterSpacing:"0.06em", fontWeight:600 }}>Password</label><Inp type="password" value={form.password} onChange={e=>setForm(p=>({...p,password:e.target.value}))} placeholder="Min 8 characters"/></div>}
            <div><label style={{ fontSize:11, color:T.textMuted, display:"block", marginBottom:4, textTransform:"uppercase", letterSpacing:"0.06em", fontWeight:600 }}>Role</label>
              {modal !== "create" && roleLocked(modal)
                ? <div style={{ fontSize:12, color:T.textMuted, padding:"4px 0" }}>{ROLE_LABELS[form.role]||form.role} — {isMe(modal) ? "you can't change your own role." : "only a Super Admin can change this role."}</div>
                : <Sel value={form.role} onChange={e=>setForm(p=>({...p,role:e.target.value}))} options={modal === "create" ? ROLE_OPTS.filter(o => o.value !== "superadmin") : ROLE_OPTS}/>}
            </div>
            {modal !== "create" && !isMe(modal) && (
              <label style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer", fontSize:13, color:T.textSecond }}>
                <input type="checkbox" checked={form.active!==false} onChange={e=>setForm(p=>({...p,active:e.target.checked}))} style={{ width:18, height:18, accentColor:T.green }}/>
                Account active
              </label>
            )}
          </div>
          <div style={{ display:"flex", gap:8, marginTop:16 }}>
            <Btn onClick={handleSave} disabled={busy} icon={<CheckIcon size={13} color="#fff"/>}>{busy?"Saving…":"Save"}</Btn>
            <Btn variant="ghost" onClick={() => setModal(null)}>Cancel</Btn>
          </div>
        </Modal>
      )}

      {/* Deactivate user confirmation — sets active:false (soft), never deletes */}
      {deleteTarget && (
        <ConfirmModal
          title={`Deactivate ${deleteTarget.name}?`}
          message={`This will disable ${deleteTarget.email}'s access immediately. You can re-activate them later by editing the account.`}
          confirmLabel="Yes, deactivate"
          confirmVariant="danger"
          icon={<XIcon size={22} color={T.red}/>}
          busy={deleteBusy}
          onConfirm={async () => {
            setDeleteBusy(true);
            try { await updateUser(deleteTarget.id, { active:false }); onAlert?.("User deactivated"); setDeleteTarget(null); load(); }
            catch (e) { onAlert?.(e.message,"error"); }
            finally { setDeleteBusy(false); }
          }}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// pages/AdminPage.jsx — Super Admin only
// ─────────────────────────────────────────────────────────────────────────────
import { fetchShops, createShop, updateShop } from "../api.js";
import { ShopIcon, ConfirmModal as ConfirmModal2 } from "../components.jsx";

export function AdminPage({ onAlert }) {
  const T = getT();
  const [shops,        setShops]        = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [modal,        setModal]        = useState(false);
  const [form,         setForm]         = useState({ shopId:"", name:"", ownerEmail:"", ownerName:"", ownerPassword:"", plan:"trial" });
  const [busy,         setBusy]         = useState(false);
  const [shopConfirm,  setShopConfirm]  = useState(null); // { shop, action:"pause"|"activate" }

  const load = () => {
    setLoading(true);
    fetchShops().then(setShops).catch(e => onAlert?.(e.message,"error")).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const handleCreate = async () => {
    setBusy(true);
    try { await createShop(form); onAlert?.(`Shop "${form.name}" created`); setModal(false); load(); }
    catch (e) { onAlert?.(e.message,"error"); }
    finally { setBusy(false); }
  };

  const PLAN_COLOR = { trial:T.amber, active:T.green, paused:T.red };

  return (
    <div>
      <PageHeader title="Shops" sub="Super Admin — all client shops"
        actions={<Btn small icon={<PlusIcon size={13} color="#fff"/>} onClick={() => setModal(true)}>New Shop</Btn>}
      />
      {loading ? <Spinner/> : shops.length === 0 ? (
        <Empty icon={null} title="No shops yet" sub="Create your first client shop to get started"/>
      ) : (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:12 }}>
          {shops.map(s => (
            <div key={s.shopId} style={{ background:T.cardBg, border:`1px solid ${T.border}`, borderRadius:T.r12, padding:"16px" }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:10 }}>
                <div style={{ fontSize:14, fontWeight:700, color:T.textPrimary }}>{s.name}</div>
                <span style={{ fontSize:11, fontWeight:600, padding:"2px 8px", borderRadius:20, background:`${PLAN_COLOR[s.plan]||T.blue}20`, color:PLAN_COLOR[s.plan]||T.blue, border:`1px solid ${PLAN_COLOR[s.plan]||T.blue}40`, textTransform:"uppercase" }}>{s.plan}</span>
              </div>
              <div style={{ fontSize:11, color:T.textMuted, marginBottom:4 }}>ID: <span style={{ color:T.blueBright, fontFamily:"monospace" }}>{s.shopId}</span></div>
              <div style={{ fontSize:11, color:T.textMuted, marginBottom:10 }}>{s.email}</div>
              <div style={{ fontSize:10, color:T.textMuted, padding:"8px 10px", background:T.elevated, borderRadius:T.r8, fontFamily:"monospace", wordBreak:"break-all" }}>
                ?shopId={s.shopId}
              </div>
              <div style={{ display:"flex", gap:6, marginTop:10 }}>
                {s.active ? (
                  <Btn small variant="danger" onClick={() => setShopConfirm({ shop:s, action:"pause" })}>Pause</Btn>
                ) : (
                  <Btn small variant="success" onClick={() => setShopConfirm({ shop:s, action:"activate" })}>Activate</Btn>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <Modal onClose={() => setModal(false)}>
          <ModalTitle sub="Creates shop + owner user + default settings">New Shop</ModalTitle>
          <div style={{ display:"flex", flexDirection:"column", gap:11 }}>
            {[["shopId","Shop ID (e.g. acme-tire)","text","roadstar-2"],["name","Shop Name","text","Acme Tire"],["ownerEmail","Owner Email","email","owner@acmetire.ca"],["ownerName","Owner Name","text","Jane Smith"],["ownerPassword","Owner Password","password",""]].map(([k,label,t,ph]) => (
              <div key={k}><label style={{ fontSize:11, color:T.textMuted, display:"block", marginBottom:4, textTransform:"uppercase", letterSpacing:"0.06em", fontWeight:600 }}>{label}</label>
                <Inp type={t} value={form[k]} onChange={e=>setForm(p=>({...p,[k]:e.target.value}))} placeholder={ph}/>
              </div>
            ))}
            <div><label style={{ fontSize:11, color:T.textMuted, display:"block", marginBottom:4, textTransform:"uppercase", letterSpacing:"0.06em", fontWeight:600 }}>Plan</label>
              <Sel value={form.plan} onChange={e=>setForm(p=>({...p,plan:e.target.value}))} options={["trial","active","paused"].map(v=>({value:v,label:v}))}/>
            </div>
          </div>
          <div style={{ display:"flex", gap:8, marginTop:16 }}>
            <Btn onClick={handleCreate} disabled={busy} icon={<CheckIcon size={13} color="#fff"/>}>{busy?"Creating…":"Create Shop"}</Btn>
            <Btn variant="ghost" onClick={() => setModal(false)}>Cancel</Btn>
          </div>
        </Modal>
      )}

      {shopConfirm && (
        <ConfirmModal2
          title={shopConfirm.action === "pause" ? `Pause ${shopConfirm.shop.name}?` : `Activate ${shopConfirm.shop.name}?`}
          message={shopConfirm.action === "pause"
            ? "This will prevent the shop owner from logging in and disable their booking form."
            : "This will restore the shop owner's access and re-enable their booking form."}
          confirmLabel={shopConfirm.action === "pause" ? "Yes, pause shop" : "Yes, activate shop"}
          confirmVariant={shopConfirm.action === "pause" ? "danger" : "success"}
          onConfirm={async () => {
            try {
              const updates = shopConfirm.action === "pause" ? { active:false, plan:"paused" } : { active:true, plan:"active" };
              await updateShop(shopConfirm.shop.shopId, updates);
              onAlert?.(shopConfirm.action === "pause" ? "Shop paused" : "Shop activated");
              setShopConfirm(null); load();
            } catch(e) { onAlert?.(e.message,"error"); }
          }}
          onCancel={() => setShopConfirm(null)}
        />
      )}
    </div>
  );
}
