// pages/BookingsPage.jsx
import { useState, useEffect, useCallback } from "react";
import { fetchBookings, fetchRecentlyDeleted, updateBooking, deleteBooking, restoreBooking, sendSMS, updatePayment, getUserRole } from "../api.js";
import { getT, getTheme, sm, displaySvc, effectiveOcc, fmtDate, todayStr, formatTireSize, money } from "../theme.js";
import { Badge, Btn, IBtn, Modal, ModalTitle, Inp, Sel, PageHeader, Spinner, Empty, Card, CompleteOrderModal, SearchIcon, RefreshIcon, CheckIcon, XIcon, FlagIcon, MsgIcon, TrashIcon, PenIcon, NoteIcon, RestoreIcon, PlusIcon, DownloadIcon, ClipboardCheckIcon } from "../components.jsx";
import InspectionModal from "../InspectionReport.jsx";


const DollarIcon = ({ size=14, color="currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" style={{display:"block",flexShrink:0}}>
    <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
  </svg>
);

const STATUSES = ["all","pending","confirmed","waitlist","completed","cancelled","no_show"];
// UX4: generate 15-min slots 7 AM – 8:45 PM so admins can reschedule to any reasonable time,
// even outside normal business hours (admin override). Avoids maintaining a manual list.
const TIME_SLOTS = (() => {
  const s = [];
  for (let h = 7; h < 21; h++) {
    for (let m = 0; m < 60; m += 15) {
      const ampm = h < 12 ? "AM" : "PM";
      const h12  = h === 0 ? 12 : h > 12 ? h - 12 : h;
      s.push(`${h12}:${String(m).padStart(2,"0")} ${ampm}`);
    }
  }
  return s;
})();

// "10:30 AM" -> minutes since midnight, so bookings sort by real time (not as text).
// Unparseable times sort last.
function timeToMinutes(t) {
  const m = /^\s*(\d{1,2}):(\d{2})\s*([AaPp][Mm])?\s*$/.exec(t || "");
  if (!m) return 24 * 60;
  let h = parseInt(m[1], 10) % 12;
  if (m[3] && m[3].toUpperCase() === "PM") h += 12;
  if (!m[3]) h = parseInt(m[1], 10); // 24h fallback
  return h * 60 + parseInt(m[2], 10);
}
const byDateTime = (a, b) => (a.date || "").localeCompare(b.date || "") || timeToMinutes(a.time) - timeToMinutes(b.time);

// Statuses that are final — they leave the Live Queue and live in the "Cancelled / No-show" tab.
const CLOSED = ["cancelled","no_show"];

// Readable error text. Validation (422) responses carry only errors[] with no top-level
// message, so the thrown text is just "API error 422" — explain it instead.
const errText = (e) => /^API error 422$/.test(e?.message || "")
  ? "Some details are invalid — check the phone, email, price and tire quantity, then try again."
  : (e?.message || "Something went wrong");

function BookingRow({ b, onUpdate, onDelete, onSMS, onEdit, onPayment, onAlert, onCancel, onConfirm, onInspect, readOnly }) {
  const T = getT(); const s = sm(b.status); const [busy, setBusy] = useState(false);
  const act = async (updates) => { setBusy(true); try { await onUpdate(b.id, updates); } catch (e) { onAlert?.(errText(e),"error"); } finally { setBusy(false); } };
  // Confirming texts the customer "CONFIRMED" — never offer it for an appointment that's already past
  const isPast = (b.date || "") < todayStr();
  return (
    <div style={{ background:T.cardBg, border:`1px solid ${T.border}`, borderLeft:`3px solid ${s.color}`, borderRadius:T.r10, padding:"12px 16px", display:"flex", flexWrap:"wrap", alignItems:"center", gap:10, opacity:busy?0.6:1 }}>
      <div style={{ flexShrink:0, textAlign:"center", width:80, boxSizing:"border-box", padding:"6px 8px", background:T.elevated, borderRadius:T.r8, border:`1px solid ${T.border}` }}>
        <div style={{ fontSize:13, fontWeight:700, color:T.textPrimary, lineHeight:1 }}>{b.time}</div>
        <div style={{ fontSize:10, color:T.textMuted, marginTop:1 }}>{b.date}</div>
      </div>
      <div style={{ flex:"1 1 min(240px, calc(100% - 90px))", minWidth:150, overflowWrap:"anywhere" }}>
        <div style={{ fontSize:13, fontWeight:700, color:T.textPrimary }}>{b.firstName} {b.lastName}</div>
        <div style={{ fontSize:11, color:T.textMuted, display:"flex", flexWrap:"wrap", columnGap:8 }}><span style={{ whiteSpace:"nowrap" }}>{b.phone}</span>{b.email && <span style={{ minWidth:0 }}>{b.email}</span>}</div>
        <div style={{ fontSize:11, fontWeight:600, color:s.color, textTransform:"uppercase", letterSpacing:"0.04em", marginTop:2 }}>{displaySvc(b)}</div>
        {b.tireSize && <div style={{ fontSize:10, color:T.orange, marginTop:1 }}>{b.tireSize}</div>}
        {b.mechanicNotes && <div style={{ fontSize:11, color:T.textMuted, marginTop:3, display:"flex", alignItems:"flex-start", gap:4 }}><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0,marginTop:1}}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>{b.mechanicNotes}</div>}
        {b.notes && <div style={{ fontSize:11, color:T.textMuted, marginTop:2 }}>{b.notes}</div>}
      </div>
      <div style={{textAlign:"right",flexShrink:0}}>
        <Badge status={b.status}/>
        {b.finalPrice!=null&&<div style={{fontSize:12,fontWeight:700,color:T.green,marginTop:4}}>{money(b.finalPrice)} <span style={{fontSize:10,color:T.textMuted,fontWeight:400}}>{b.paymentStatus||"unpaid"}</span></div>}
      </div>
      {/* Mechanics see bookings read-only — no action buttons */}
      {!readOnly && (
        <div style={{ display:"flex", flexWrap:"wrap", gap:3, flexShrink:0, maxWidth:"100%" }}>
          {!["completed",...CLOSED].includes(b.status) && b.status !== "confirmed" && !isPast && <IBtn v="accept" title="Confirm" onClick={() => onConfirm && onConfirm(b)} disabled={busy}><CheckIcon size={14}/></IBtn>}
          {!["completed",...CLOSED].includes(b.status) && <IBtn v="complete" title="Mark Complete" onClick={() => onEdit(b,"complete")} disabled={busy}><FlagIcon size={14}/></IBtn>}
          {!["completed",...CLOSED].includes(b.status) && <IBtn v="decline" title="Cancel" onClick={() => onCancel && onCancel(b)} disabled={busy}><XIcon size={14}/></IBtn>}
          <IBtn v="sms"   title="Send SMS" onClick={() => onSMS(b)}    disabled={busy}><MsgIcon size={14}/></IBtn>
          <IBtn v={b.inspection ? "complete" : "edit"} title={b.inspection ? "Inspection Report (saved)" : "Inspection Report"} onClick={() => onInspect(b)} disabled={busy}><ClipboardCheckIcon size={14}/></IBtn>
          <IBtn v="edit"  title="Edit"     onClick={() => onEdit(b)}     disabled={busy}><PenIcon size={14}/></IBtn>
          <IBtn v="sms"   title="Payment"  onClick={() => onPayment(b)}   disabled={busy}><DollarIcon size={14}/></IBtn>
          <IBtn v="trash" title="Delete"   onClick={() => onDelete(b.id)} disabled={busy}><TrashIcon size={14}/></IBtn>
        </div>
      )}
    </div>
  );
}

export default function BookingsPage({ onAlert }) {
  const T = getT();
  const isMechanic = getUserRole() === "mechanic";
  const [bookings,   setBookings]  = useState([]);
  const [deleted,    setDeleted]   = useState([]);
  const [loading,    setLoading]   = useState(true);
  const [tab,        setTab]       = useState("active"); // active | completed | cancelled | deleted
  const [status,     setStatus]    = useState("all");
  const [search,     setSearch]    = useState("");
  const [dateFilter, setDateFilter]= useState("");
  const [editB,      setEditB]     = useState(null);
  const [editMode,   setEditMode]  = useState("edit");
  const [deleteId,   setDeleteId]   = useState(null);
  const [confirmAct, setConfirmAct] = useState(null); // {id, type:'cancel'|'confirm'}
  const [smsB,       setSmsB]      = useState(null);
  const [inspectB,   setInspectB]  = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const f = {}; if (dateFilter) f.date = dateFilter; if (status !== "all") f.status = status;
      const [bk, del] = await Promise.all([fetchBookings(f), fetchRecentlyDeleted()]);
      setBookings(bk || []); setDeleted(del || []);
    } catch (e) { onAlert?.(e.message, "error"); } finally { setLoading(false); }
  }, [dateFilter, status]);

  useEffect(() => { load(); }, [load]);

  const handleUpdate = async (id, updates) => {
    const u = await updateBooking(id, updates);
    setBookings(p => p.map(b => b.id === id ? u : b));
    onAlert?.("Updated");
  };
  const handleDelete = async (id) => {
    await deleteBooking(id);
    setBookings(p => p.filter(b => b.id !== id));
    onAlert?.("Moved to Recently Deleted");
    load();
  };
  const handleRestore = async (id) => {
    try { await restoreBooking(id); onAlert?.("Booking restored"); load(); }
    catch (e) { onAlert?.(errText(e), "error"); }
  };

  let filtered = bookings;
  if (search) {
    const q = search.toLowerCase().trim();
    // Phones are stored in many formats (416-555-0141, (416) 555-0141, 416.555.0141) — compare digits only
    const qDigits = q.replace(/\D/g, "");
    filtered = filtered.filter(b => `${b.firstName} ${b.lastName}`.toLowerCase().includes(q)
      || (qDigits.length >= 3 && (b.phone||"").replace(/\D/g, "").includes(qDigits))
      || (b.phone||"").toLowerCase().includes(q)
      || (b.email||"").toLowerCase().includes(q));
  }
  // Live Queue: open bookings only, today/upcoming first in time order, then overdue ones (most recent first)
  const today     = todayStr();
  const open      = filtered.filter(b => !["completed",...CLOSED].includes(b.status));
  const active    = [
    ...open.filter(b => (b.date || "") >= today).sort(byDateTime),
    ...open.filter(b => (b.date || "") <  today).sort((a, b) => byDateTime(b, a)),
  ];
  // Cancelled / No-show: newest appointment first, so staff can review, restore or rebook
  const cancelled = filtered.filter(b => CLOSED.includes(b.status)).sort((a, b) => byDateTime(b, a));
  // Completed: most recently completed at the top
  const completed = filtered.filter(b => b.status === "completed")
    .sort((a, b) => new Date(b.completedAt || `${b.date}T00:00:00`) - new Date(a.completedAt || `${a.date}T00:00:00`));
  const shown     = tab === "active" ? active : tab === "completed" ? completed : tab === "cancelled" ? cancelled : deleted;
  // Picking a status in the filter jumps to the tab that actually lists it
  const pickStatus = (v) => {
    setStatus(v);
    if (v === "completed") setTab("completed");
    else if (CLOSED.includes(v)) setTab("cancelled");
    else if (v !== "all" && tab !== "deleted") setTab("active");
  };
  const dateScheme = getTheme() === "light" ? "light" : "dark";

  return (
    <div>
      <PageHeader title="Bookings" sub="All appointments across all dates"
        actions={
          <>
            <Btn small variant="ghost" icon={<RefreshIcon size={13}/>} onClick={load}>Refresh</Btn>
          </>
        }
      />

      {/* Filters */}
      <Card style={{ marginBottom:16, padding:"12px 16px" }}>
        <div style={{ display:"flex", gap:10, flexWrap:"wrap", alignItems:"center" }}>
          <div style={{ position:"relative", flex:"1 1 200px" }}>
            <div style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", color:T.textMuted }}><SearchIcon size={13}/></div>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search name, phone, email…"
              style={{ width:"100%", background:T.pageBg, border:`1px solid ${T.border}`, borderRadius:T.r8, padding:"8px 12px 8px 32px", color:T.textPrimary, fontSize:13, fontFamily:T.font, outline:"none", boxSizing:"border-box" }}/>
          </div>
          <input type="date" value={dateFilter} onChange={e=>setDateFilter(e.target.value)}
            style={{ background:T.pageBg, border:`1px solid ${T.border}`, borderRadius:T.r8, padding:"8px 12px", color:T.textPrimary, fontSize:13, fontFamily:T.font, outline:"none", colorScheme:dateScheme }}/>
          <select value={status} onChange={e=>pickStatus(e.target.value)}
            style={{ background:T.pageBg, border:`1px solid ${T.border}`, borderRadius:T.r8, padding:"8px 12px", color:T.textPrimary, fontSize:13, fontFamily:T.font, outline:"none" }}>
            {STATUSES.map(s => <option key={s} value={s} style={{background:T.cardBg}}>{s === "all" ? "All statuses" : s.charAt(0).toUpperCase()+s.slice(1).replace("_"," ")}</option>)}
          </select>
          {(dateFilter || status !== "all") && <Btn small variant="ghost" onClick={() => { setDateFilter(""); setStatus("all"); }}>Clear</Btn>}
        </div>
      </Card>

      {/* Tabs — mechanics only see active/completed, not deleted */}
      <div style={{ display:"flex", gap:2, background:T.cardBg, border:`1px solid ${T.border}`, borderRadius:T.r10, padding:4, marginBottom:16, width:"fit-content", maxWidth:"100%", flexWrap:"wrap", boxSizing:"border-box" }}>
        {[["active","Live Queue",active.length],["completed","Completed",completed.length],["cancelled","Cancelled / No-show",cancelled.length],...(isMechanic?[]:[ ["deleted","Recently Deleted",deleted.length] ])].map(([id,label,count]) => (
          <button key={id} onClick={()=>setTab(id)}
            style={{ display:"flex", alignItems:"center", gap:6, padding:"7px 14px", borderRadius:T.r8, border:"none", background:tab===id?T.elevated:"transparent", color:tab===id?T.textPrimary:T.textMuted, fontSize:13, fontWeight:tab===id?600:400, fontFamily:T.font, cursor:"pointer", whiteSpace:"nowrap" }}>
            {label}
            {count > 0 && <span style={{ fontSize:10, background:tab===id?T.blue:T.border, color:tab===id?"#fff":T.textMuted, padding:"1px 6px", borderRadius:20 }}>{count}</span>}
          </button>
        ))}
      </div>

      {loading ? <Spinner/> : shown.length === 0 ? (
        <Empty icon={null} title="No bookings" sub={tab==="deleted" ? "No recently deleted bookings" : "No bookings match your filters"}/>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
          {tab === "deleted"
            ? deleted.map(b => (
                <div key={b.id} style={{ background:T.cardBg, border:`1px solid ${T.border}`, borderRadius:T.r10, padding:"12px 16px", display:"flex", flexWrap:"wrap", alignItems:"center", gap:12, opacity:0.8 }}>
                  <div style={{ flex:"1 1 180px", minWidth:0, overflowWrap:"anywhere" }}>
                    <div style={{ fontSize:13, fontWeight:600, color:T.textSecond }}>{b.firstName} {b.lastName} — {b.date} {b.time}</div>
                    <div style={{ fontSize:11, color:T.textMuted }}>{displaySvc(b)}</div>
                  </div>
                  <Btn small variant="restore" icon={<RestoreIcon size={13}/>} onClick={() => handleRestore(b.id)}>Restore</Btn>
                </div>
              ))
            : shown.map(b => (
                <BookingRow key={b.id} b={b}
                  readOnly={isMechanic}
                  onUpdate={handleUpdate} onDelete={id=>setDeleteId(id)}
                  onSMS={setSmsB} onEdit={(b, mode="edit") => { setEditB(b); setEditMode(mode); }}
                  onPayment={b => { setEditB(b); setEditMode("payment"); }}
                  onAlert={onAlert}
                  onCancel={b=>setConfirmAct({id:b.id,type:"cancel",name:`${b.firstName} ${b.lastName}`})}
                  onConfirm={b=>setConfirmAct({id:b.id,type:"confirm",name:`${b.firstName} ${b.lastName}`})}
                  onInspect={setInspectB}
                />
              ))
          }
        </div>
      )}

      {/* Inspection report modal */}
      {inspectB && (
        <InspectionModal booking={inspectB} onClose={() => setInspectB(null)} onAlert={onAlert}
          onSaved={u => { setBookings(p => p.map(b => b.id === u.id ? u : b)); setInspectB(u); }}
        />
      )}

      {/* Edit modal */}
      {editB && editMode === "edit" && (
        <EditModal booking={editB} onClose={() => setEditB(null)}
          onSave={async (id, u) => {
            const orig = editB;
            const { price, paymentMethod, tireQuantity, ...fields } = u;
            const priceNum = price === "" || price == null ? null : parseFloat(price);
            if (priceNum != null && (isNaN(priceNum) || priceNum < 0)) { onAlert?.("Price must be 0 or more.", "error"); return; }
            const qty = tireQuantity === "" || tireQuantity == null ? null : parseInt(tireQuantity, 10);
            if (qty != null && (isNaN(qty) || qty < 1 || qty > 50)) { onAlert?.("Tire quantity must be between 1 and 50.", "error"); return; }
            // Send only what was actually changed: re-sending an unchanged status re-texts the
            // customer, an unchanged date/time re-runs the capacity check, and an unchanged
            // legacy-format phone (e.g. 416.555.0102) can fail validation.
            const bookingFields = {};
            for (const [k, v] of Object.entries(fields)) {
              if ((v ?? "") !== (orig[k] ?? "")) bookingFields[k] = v;
            }
            if (qty !== (orig.tireQuantity ?? null)) bookingFields.tireQuantity = qty;
            // Keep the modal open and say why if the save is rejected (e.g. slot full)
            if (Object.keys(bookingFields).length) {
              try { await handleUpdate(id, bookingFields); }
              catch (e) { onAlert?.(errText(e), "error"); return; }
            }
            // Price/method live on the payment endpoint — save them if changed.
            const payUpd = {};
            if (priceNum != null && priceNum !== orig.finalPrice) payUpd.finalPrice = priceNum;
            if (paymentMethod && paymentMethod !== orig.paymentMethod) payUpd.paymentMethod = paymentMethod;
            if (Object.keys(payUpd).length) {
              try {
                const updated = await updatePayment(id, payUpd);
                setBookings(p => p.map(x => x.id === id ? updated : x));
                if (!Object.keys(bookingFields).length) onAlert?.("Updated");
              } catch (e) { onAlert?.("Saved, but price didn't update: " + errText(e), "error"); }
            }
            setEditB(null);
          }}/>
      )}

      {/* Complete modal — forces price + payment method before confirming */}
      {editB && editMode === "complete" && (
        <CompleteOrderModal booking={editB} onClose={() => setEditB(null)}
          onConfirm={async (id, { finalPrice, paymentMethod, paymentStatus, completedSmsVariant }) => {
            try {
              await updatePayment(id, { finalPrice, paymentMethod, paymentStatus });
              await handleUpdate(id, { status:"completed", completedSmsVariant, sendSMS: completedSmsVariant !== "none" });
              setEditB(null);
            } catch (e) { onAlert?.(errText(e), "error"); }
          }}/>
      )}


      {/* Payment modal */}
      {editB && editMode === "payment" && (
        <PaymentModal booking={editB} onClose={() => setEditB(null)} onAlert={onAlert}
          onSave={async (id, u) => {
            try {
              const updated = await updatePayment(id, u);
              setBookings(p => p.map(b => b.id === id ? updated : b));
              onAlert?.("Payment saved");
              setEditB(null);
            }
            catch (e) { onAlert?.(errText(e), "error"); }
          }}/>
      )}

      {/* Cancel / Confirm action modal */}
      {confirmAct && (
        <Modal onClose={() => setConfirmAct(null)}>
          <div style={{textAlign:"center",padding:"8px 0 16px"}}>
            <div style={{fontSize:16,fontWeight:700,color:T.textPrimary,marginBottom:8}}>
              {confirmAct.type==="cancel" ? "Cancel this booking?" : "Confirm this booking?"}
            </div>
            <div style={{fontSize:13,color:T.textMuted,marginBottom:20,overflowWrap:"anywhere"}}>{confirmAct.name}</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:10,justifyContent:"center"}}>
              <Btn
                variant={confirmAct.type==="cancel"?"danger":"success"}
                onClick={async()=>{
                  try { await handleUpdate(confirmAct.id,{status:confirmAct.type==="cancel"?"cancelled":"confirmed"}); }
                  catch (e) { onAlert?.(errText(e), "error"); }
                  setConfirmAct(null);
                }}>
                {confirmAct.type==="cancel" ? "Yes, cancel" : "Yes, confirm"}
              </Btn>
              <Btn variant="ghost" onClick={()=>setConfirmAct(null)}>Go back</Btn>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete confirmation modal */}
      {deleteId && (
        <Modal onClose={() => setDeleteId(null)}>
          <div style={{textAlign:"center",padding:"8px 0 16px"}}>
            <div style={{width:48,height:48,borderRadius:"50%",background:T.redBg,border:`1px solid ${T.redBorder}`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px"}}>
              <TrashIcon size={22} color={T.red}/>
            </div>
            <div style={{fontSize:16,fontWeight:700,color:T.textPrimary,marginBottom:8}}>Delete this booking?</div>
            <div style={{fontSize:13,color:T.textMuted,marginBottom:20,lineHeight:1.5}}>
              This booking will be moved to Recently Deleted<br/>and can be restored within 30 days.
            </div>
            <div style={{display:"flex",flexWrap:"wrap",gap:10,justifyContent:"center"}}>
              <Btn variant="danger" onClick={async()=>{try{await handleDelete(deleteId);}catch(e){onAlert?.(errText(e),"error");}setDeleteId(null);}} icon={<TrashIcon size={13} color={T.red}/>}>Yes, delete</Btn>
              <Btn variant="ghost" onClick={()=>setDeleteId(null)}>Keep it</Btn>
            </div>
          </div>
        </Modal>
      )}

      {/* SMS modal */}
      {smsB && (
        <SMSModal booking={smsB} onClose={() => setSmsB(null)}
          onSend={async (b, t) => { try { await sendSMS(b.id, t); onAlert?.("SMS sent"); } catch (e) { onAlert?.(errText(e),"error"); } setSmsB(null); }}/>
      )}
    </div>
  );
}

function EditModal({ booking: b, onClose, onSave }) {
  const T = getT();
  const [form, setForm] = useState({
    firstName:b.firstName||"", lastName:b.lastName||"", phone:b.phone||"", email:b.email||"",
    status:b.status, date:b.date, time:b.time, notes:b.notes||"",
    tireSize:b.tireSize||"", tireQuantity:b.tireQuantity ?? "",
    price:b.finalPrice ?? "", paymentMethod:b.paymentMethod || "",
  });
  const [busy, setBusy] = useState(false);
  const set = (k,v) => setForm(p=>({...p,[k]:v}));
  const Lbl = ({ children }) => (
    <label style={{ fontSize:11, color:T.textMuted, display:"block", marginBottom:4, textTransform:"uppercase", letterSpacing:"0.06em", fontWeight:600 }}>{children}</label>
  );
  return (
    <Modal onClose={onClose} persistent>
      <ModalTitle sub={displaySvc(b)}>Edit Booking</ModalTitle>
      <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(150px, 1fr))", gap:10 }}>
          <div style={{ minWidth:0 }}><Lbl>First name</Lbl><Inp value={form.firstName} onChange={e=>set("firstName",e.target.value)} placeholder="John"/></div>
          <div style={{ minWidth:0 }}><Lbl>Last name</Lbl><Inp value={form.lastName} onChange={e=>set("lastName",e.target.value)} placeholder="Smith"/></div>
          <div style={{ minWidth:0 }}><Lbl>Phone</Lbl><Inp type="tel" value={form.phone} onChange={e=>set("phone",e.target.value)} placeholder="+1 (416) 555-0000"/></div>
          <div style={{ minWidth:0 }}><Lbl>Email</Lbl><Inp type="email" value={form.email} onChange={e=>set("email",e.target.value)} placeholder="optional"/></div>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr", gap:10, alignItems:"end" }}>
          <div><Lbl>Tire size</Lbl><Inp value={form.tireSize} onChange={e=>set("tireSize",formatTireSize(e.target.value, e.target.selectionStart === e.target.value.length))} placeholder="225/65R17" style={{ fontSize:16, fontWeight:600, letterSpacing:"0.02em" }}/></div>
          <div><Lbl>How many tires</Lbl><Inp type="number" value={form.tireQuantity} onChange={e=>set("tireQuantity",e.target.value)} placeholder="e.g. 4"/></div>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, alignItems:"end" }}>
          <div><Lbl>Price ($)</Lbl><Inp type="number" value={form.price} onChange={e=>set("price",e.target.value)} placeholder="0.00"/></div>
          <div><Lbl>Payment method</Lbl>
            <Sel value={form.paymentMethod} onChange={e=>set("paymentMethod",e.target.value)}
              options={[{value:"",label:"—"},{value:"cash",label:"Cash"},{value:"card",label:"Card"},{value:"cheque",label:"Cheque"},{value:"e-transfer",label:"e-Transfer"},{value:"other",label:"Other"}]}/>
          </div>
        </div>
        {/* Status / Date / Time: 3 across on wide modals, stacks on phones so nothing is squeezed */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(120px, 1fr))", gap:10, alignItems:"end" }}>
          <div style={{ minWidth:0 }}><Lbl>Status</Lbl>
            <Sel value={form.status} onChange={e=>set("status",e.target.value)} options={["pending","confirmed","waitlist","completed","cancelled","no_show"].map(s=>({value:s,label:s}))}/>
          </div>
          <div style={{ minWidth:0 }}><Lbl>Date</Lbl><Inp type="date" value={form.date} onChange={e=>set("date",e.target.value)} style={{ colorScheme:getTheme() === "light" ? "light" : "dark", minWidth:0 }}/></div>
          <div style={{ minWidth:0 }}><Lbl>Time</Lbl><Sel value={form.time} onChange={e=>set("time",e.target.value)} options={TIME_SLOTS.map(t=>({value:t,label:t}))}/></div>
        </div>
        <div><Lbl>Notes</Lbl>
          <textarea value={form.notes} onChange={e=>set("notes",e.target.value)} rows={2}
            style={{ width:"100%", background:T.pageBg, border:`1.5px solid ${T.border}`, borderRadius:T.r8, padding:"9px 12px", color:T.textPrimary, fontSize:13, fontFamily:T.font, outline:"none", boxSizing:"border-box", resize:"vertical" }}/>
        </div>
      </div>
      <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginTop:16 }}>
        <Btn onClick={async()=>{setBusy(true);try{await onSave(b.id,form);}finally{setBusy(false);}}} disabled={busy} icon={<CheckIcon size={13} color="#fff"/>}>{busy?"Saving…":"Save"}</Btn>
        <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
      </div>
    </Modal>
  );
}

function SMSModal({ booking: b, onClose, onSend }) {
  const T = getT(); const [type, setType] = useState("confirmed"); const [busy, setBusy] = useState(false);
  const TYPES = ["confirmed","declined","waitlist","reminder","completed_review","completed_no_review","no_show"];
  return (
    <Modal onClose={onClose}>
      <ModalTitle sub={`${b.firstName} ${b.lastName} · ${b.phone}`}>Send SMS</ModalTitle>
      <div style={{ display:"flex", flexDirection:"column", gap:6, marginBottom:16 }}>
        {TYPES.map(t => (
          <button key={t} onClick={() => setType(t)}
            style={{ padding:"9px 13px", borderRadius:T.r8, border:`1.5px solid ${type===t?T.blue:T.border}`, background:type===t?T.blueSubtle:T.elevated, color:type===t?T.blueBright:T.textSecond, fontSize:13, textAlign:"left", cursor:"pointer", fontFamily:T.font }}>
            {t.replace(/_/g," ")}
          </button>
        ))}
      </div>
      <Btn onClick={async()=>{setBusy(true);try{await onSend(b,type);}finally{setBusy(false);}}} disabled={busy} style={{ width:"100%", justifyContent:"center" }}>
        {busy?"Sending…":"Send SMS"}
      </Btn>
    </Modal>
  );
}

function PaymentModal({ booking: b, onClose, onSave, onAlert }) {
  const T = getT();
  const [form, setForm] = useState({
    finalPrice:    b.finalPrice    ?? "",
    paymentMethod: b.paymentMethod ?? "",
    paymentStatus: b.paymentStatus ?? "unpaid",
    paymentNotes:  b.paymentNotes  ?? "",
  });
  const [busy, setBusy] = useState(false);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const Lbl = ({ children }) => (
    <label style={{ display:"block", fontSize:11, fontWeight:600, letterSpacing:"0.07em", textTransform:"uppercase", color:T.textMuted, marginBottom:5 }}>{children}</label>
  );
  return (
    <Modal onClose={onClose}>
      <ModalTitle sub={`${b.firstName} ${b.lastName} — ${displaySvc(b)}`}>Payment & Pricing</ModalTitle>
      <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
        <div>
          <Lbl>Price charged ($)</Lbl>
          <Inp type="number" value={form.finalPrice} onChange={e=>set("finalPrice",e.target.value)} placeholder="0.00"/>
        </div>
        <div>
          <Lbl>Payment method</Lbl>
          <Sel value={form.paymentMethod} onChange={e=>set("paymentMethod",e.target.value)}
            options={[
              {value:"",        label:"— Select —"},
              {value:"cash",    label:"Cash"},
              {value:"card",    label:"Card"},
              {value:"cheque",  label:"Cheque"},
              {value:"e-transfer",label:"e-Transfer"},
              {value:"other",   label:"Other"},
            ]}/>
        </div>
        <div>
          <Lbl>Payment status</Lbl>
          <Sel value={form.paymentStatus} onChange={e=>set("paymentStatus",e.target.value)}
            options={[
              {value:"unpaid",   label:"Unpaid"},
              {value:"paid",     label:"Paid"},
              {value:"partial",  label:"Partial"},
              {value:"refunded", label:"Refunded"},
            ]}/>
        </div>
        <div>
          <Lbl>Notes</Lbl>
          <Inp value={form.paymentNotes} onChange={e=>set("paymentNotes",e.target.value)} placeholder="Optional payment note"/>
        </div>
      </div>
      <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginTop:16, paddingTop:14, borderTop:`1px solid ${T.border}` }}>
        <Btn onClick={async()=>{
          const priceNum = form.finalPrice !== "" && form.finalPrice != null ? parseFloat(form.finalPrice) : null;
          if (priceNum != null && (isNaN(priceNum) || priceNum < 0)) { onAlert?.("Price must be 0 or more.", "error"); return; }
          setBusy(true);try{
          // A price without a method is a valid quote/unpaid price. Leave blank fields out
          // unless they previously had a value — then send null so the value is cleared.
          const u = { paymentStatus: form.paymentStatus || "unpaid", paymentNotes: form.paymentNotes };
          if (priceNum != null) u.finalPrice = priceNum;
          else if (b.finalPrice != null) u.finalPrice = null;
          if (form.paymentMethod) u.paymentMethod = form.paymentMethod;
          else if (b.paymentMethod) u.paymentMethod = null;
          await onSave(b.id, u);
        }finally{setBusy(false);}}} disabled={busy} icon={<CheckIcon size={13} color="#fff"/>}>
          {busy ? "Saving…" : "Save Payment"}
        </Btn>
        <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
      </div>
    </Modal>
  );
}
