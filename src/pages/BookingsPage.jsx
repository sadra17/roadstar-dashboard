// pages/BookingsPage.jsx
import { useState, useEffect, useCallback } from "react";
import { fetchBookings, fetchRecentlyDeleted, updateBooking, deleteBooking, restoreBooking, sendSMS, updatePayment } from "../api.js";
import { getT, sm, displaySvc, effectiveOcc, fmtDate, todayStr } from "../theme.js";
import { Badge, Btn, IBtn, Modal, ModalTitle, Inp, Sel, PageHeader, Spinner, Empty, Card, SearchIcon, RefreshIcon, CheckIcon, XIcon, FlagIcon, MsgIcon, TrashIcon, PenIcon, NoteIcon, RestoreIcon, PlusIcon, DownloadIcon } from "../components.jsx";


const DollarIcon = ({ size=14, color="currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" style={{display:"block",flexShrink:0}}>
    <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
  </svg>
);

const STATUSES = ["all","pending","confirmed","waitlist","completed","cancelled","no_show"];
const TIME_SLOTS = ["9:00 AM","9:15 AM","9:30 AM","9:45 AM","10:00 AM","10:15 AM","10:30 AM","10:45 AM","11:00 AM","11:15 AM","11:30 AM","11:45 AM","12:00 PM","12:15 PM","12:30 PM","12:45 PM","1:00 PM","1:15 PM","1:30 PM","1:45 PM","2:00 PM","2:15 PM","2:30 PM","2:45 PM","3:00 PM","3:15 PM","3:30 PM","3:45 PM","4:00 PM","4:15 PM","4:30 PM","4:45 PM","5:00 PM","5:15 PM","5:30 PM","5:45 PM"];

function BookingRow({ b, onUpdate, onDelete, onSMS, onEdit, onPayment, onAlert }) {
  const T = getT(); const s = sm(b.status); const [busy, setBusy] = useState(false);
  const act = async (updates) => { setBusy(true); try { await onUpdate(b.id, updates); } catch (e) { onAlert?.(e.message,"error"); } finally { setBusy(false); } };
  return (
    <div style={{ background:T.cardBg, borderLeft:`3px solid ${s.color}`, border:`1px solid ${T.border}`, borderRadius:T.r10, padding:"12px 16px", display:"flex", flexWrap:"wrap", alignItems:"center", gap:10, opacity:busy?0.6:1 }}>
      <div style={{ flexShrink:0, textAlign:"center", minWidth:58, padding:"6px 8px", background:T.elevated, borderRadius:T.r8, border:`1px solid ${T.border}` }}>
        <div style={{ fontSize:13, fontWeight:700, color:T.textPrimary, lineHeight:1 }}>{b.time}</div>
        <div style={{ fontSize:10, color:T.textMuted, marginTop:1 }}>{b.date}</div>
      </div>
      <div style={{ flex:1, minWidth:140 }}>
        <div style={{ fontSize:13, fontWeight:700, color:T.textPrimary }}>{b.firstName} {b.lastName}</div>
        <div style={{ fontSize:11, color:T.textMuted }}>{b.phone}{b.email && <span style={{ marginLeft:8 }}>{b.email}</span>}</div>
        <div style={{ fontSize:11, fontWeight:600, color:s.color, textTransform:"uppercase", letterSpacing:"0.04em", marginTop:2 }}>{displaySvc(b)}</div>
        {b.tireSize && <div style={{ fontSize:10, color:T.orange, marginTop:1 }}>{b.tireSize}</div>}
        {b.notes && <div style={{ fontSize:11, color:T.textMuted, marginTop:3, display:"flex", alignItems:"flex-start", gap:4 }}><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0,marginTop:1}}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/></svg>{b.notes}</div>}

      </div>
      <div style={{textAlign:"right",flexShrink:0}}>
        <Badge status={b.status}/>
        {b.finalPrice!=null&&<div style={{fontSize:12,fontWeight:700,color:T.green,marginTop:4}}>${b.finalPrice} <span style={{fontSize:10,color:T.textMuted,fontWeight:400}}>{b.paymentStatus||"unpaid"}</span></div>}
      </div>
      <div style={{ display:"flex", gap:3, flexShrink:0 }}>
        {!["completed","cancelled"].includes(b.status) && b.status !== "confirmed" && <IBtn v="accept" title="Confirm" onClick={() => act({status:"confirmed"})} disabled={busy}><CheckIcon size={14}/></IBtn>}
        {!["completed","cancelled"].includes(b.status) && <IBtn v="complete" title="Mark Complete" onClick={() => onEdit(b,"complete")} disabled={busy}><FlagIcon size={14}/></IBtn>}
        {!["cancelled","completed"].includes(b.status) && <IBtn v="decline" title="Cancel" onClick={() => act({status:"cancelled"})} disabled={busy}><XIcon size={14}/></IBtn>}
        <IBtn v="sms"   title="Send SMS" onClick={() => onSMS(b)}    disabled={busy}><MsgIcon size={14}/></IBtn>
        <IBtn v="edit"  title="Edit"     onClick={() => onEdit(b)}     disabled={busy}><PenIcon size={14}/></IBtn>
        <IBtn v="sms"   title="Payment"  onClick={() => onPayment(b)}   disabled={busy}><DollarIcon size={14}/></IBtn>
        <IBtn v="trash" title="Delete"   onClick={() => onDelete(b.id)} disabled={busy}><TrashIcon size={14}/></IBtn>
      </div>
    </div>
  );
}

export default function BookingsPage({ onAlert }) {
  const T = getT();
  const [bookings,   setBookings]  = useState([]);
  const [deleted,    setDeleted]   = useState([]);
  const [loading,    setLoading]   = useState(true);
  const [tab,        setTab]       = useState("active"); // active | completed | deleted
  const [status,     setStatus]    = useState("all");
  const [search,     setSearch]    = useState("");
  const [dateFilter, setDateFilter]= useState("");
  const [editB,      setEditB]     = useState(null);
  const [editMode,   setEditMode]  = useState("edit");
  const [deleteId,   setDeleteId]   = useState(null);
  const [smsB,       setSmsB]      = useState(null);

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
    await restoreBooking(id);
    onAlert?.("Booking restored");
    load();
  };

  let filtered = bookings;
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(b => `${b.firstName} ${b.lastName}`.toLowerCase().includes(q) || b.phone.includes(q) || (b.email||"").toLowerCase().includes(q));
  }
  const active    = filtered.filter(b => !["completed","cancelled"].includes(b.status));
  const completed = filtered.filter(b => b.status === "completed");
  const shown     = tab === "active" ? active : tab === "completed" ? completed : deleted;

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
            style={{ background:T.pageBg, border:`1px solid ${T.border}`, borderRadius:T.r8, padding:"8px 12px", color:T.textPrimary, fontSize:13, fontFamily:T.font, outline:"none", colorScheme:"dark" }}/>
          <select value={status} onChange={e=>setStatus(e.target.value)}
            style={{ background:T.pageBg, border:`1px solid ${T.border}`, borderRadius:T.r8, padding:"8px 12px", color:T.textPrimary, fontSize:13, fontFamily:T.font, outline:"none" }}>
            {STATUSES.map(s => <option key={s} value={s} style={{background:T.cardBg}}>{s === "all" ? "All statuses" : s.charAt(0).toUpperCase()+s.slice(1).replace("_"," ")}</option>)}
          </select>
          {(dateFilter || status !== "all") && <Btn small variant="ghost" onClick={() => { setDateFilter(""); setStatus("all"); }}>Clear</Btn>}
        </div>
      </Card>

      {/* Tabs */}
      <div style={{ display:"flex", gap:2, background:T.cardBg, border:`1px solid ${T.border}`, borderRadius:T.r10, padding:4, marginBottom:16, width:"fit-content" }}>
        {[["active","Live Queue",active.length],["completed","Completed",completed.length],["deleted","Recently Deleted",deleted.length]].map(([id,label,count]) => (
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
                <div key={b.id} style={{ background:T.cardBg, border:`1px solid ${T.border}`, borderRadius:T.r10, padding:"12px 16px", display:"flex", alignItems:"center", gap:12, opacity:0.8 }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:600, color:T.textSecond }}>{b.firstName} {b.lastName} — {b.date} {b.time}</div>
                    <div style={{ fontSize:11, color:T.textMuted }}>{displaySvc(b)}</div>
                  </div>
                  <Btn small variant="restore" icon={<RestoreIcon size={13}/>} onClick={() => handleRestore(b.id)}>Restore</Btn>
                </div>
              ))
            : shown.map(b => (
                <BookingRow key={b.id} b={b}
                  onUpdate={handleUpdate} onDelete={id=>setDeleteId(id)}
                  onSMS={setSmsB} onEdit={(b, mode="edit") => { setEditB(b); setEditMode(mode); }}
                  onPayment={b => { setEditB(b); setEditMode("payment"); }}
                  onAlert={onAlert}
                />
              ))
          }
        </div>
      )}

      {/* Edit modal */}
      {editB && editMode === "edit" && (
        <EditModal booking={editB} onClose={() => setEditB(null)}
          onSave={async (id, u) => { await handleUpdate(id, u); setEditB(null); }}/>
      )}

      {/* Complete modal */}
      {editB && editMode === "complete" && (
        <Modal onClose={() => setEditB(null)}>
          <ModalTitle>Mark as Completed — {editB.firstName}</ModalTitle>
          {[["with_review","Complete + Review SMS"],["without_review","Complete + Thank-you SMS"],["none","Complete — No SMS"]].map(([v,label]) => (
            <Btn key={v} style={{ width:"100%", justifyContent:"center", marginBottom:8 }}
              onClick={async () => { await handleUpdate(editB.id,{status:"completed",completedSmsVariant:v,sendSMS:v!=="none"}); setEditB(null); }}>
              {label}
            </Btn>
          ))}
        </Modal>
      )}


      {/* Payment modal */}
      {editB && editMode === "payment" && (
        <PaymentModal booking={editB} onClose={() => setEditB(null)}
          onSave={async (id, u) => {
            try { await updatePayment(id, u); await handleUpdate(id, {}); onAlert?.("Payment updated"); setEditB(null); }
            catch (e) { onAlert?.(e.message, "error"); }
          }}/>
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
            <div style={{display:"flex",gap:10,justifyContent:"center"}}>
              <Btn variant="danger" onClick={async()=>{await handleDelete(deleteId);setDeleteId(null);}} icon={<TrashIcon size={13} color={T.red}/>}>Yes, delete</Btn>
              <Btn variant="ghost" onClick={()=>setDeleteId(null)}>Keep it</Btn>
            </div>
          </div>
        </Modal>
      )}

      {/* SMS modal */}
      {smsB && (
        <SMSModal booking={smsB} onClose={() => setSmsB(null)}
          onSend={async (b, t) => { try { await sendSMS(b.id, t); onAlert?.("SMS sent"); } catch (e) { onAlert?.(e.message,"error"); } setSmsB(null); }}/>
      )}
    </div>
  );
}

function EditModal({ booking: b, onClose, onSave }) {
  const T = getT();
  const [form, setForm] = useState({ status:b.status, date:b.date, time:b.time, notes:b.notes||"", tireSize:b.tireSize||"", doesntKnowTireSize:b.doesntKnowTireSize||false });
  const [busy, setBusy] = useState(false);
  const set = (k,v) => setForm(p=>({...p,[k]:v}));
  return (
    <Modal onClose={onClose}>
      <ModalTitle>Edit Appointment</ModalTitle>
      <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
        <div><label style={{ fontSize:11, color:T.textMuted, display:"block", marginBottom:4, textTransform:"uppercase", letterSpacing:"0.06em", fontWeight:600 }}>Status</label>
          <Sel value={form.status} onChange={e=>set("status",e.target.value)} options={["pending","confirmed","waitlist","completed","cancelled","no_show"].map(s=>({value:s,label:s}))}/>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
          <div><label style={{ fontSize:11, color:T.textMuted, display:"block", marginBottom:4, textTransform:"uppercase", letterSpacing:"0.06em", fontWeight:600 }}>Date</label>
            <Inp type="date" value={form.date} onChange={e=>set("date",e.target.value)} style={{ colorScheme:"dark" }}/>
          </div>
          <div><label style={{ fontSize:11, color:T.textMuted, display:"block", marginBottom:4, textTransform:"uppercase", letterSpacing:"0.06em", fontWeight:600 }}>Time</label>
            <Sel value={form.time} onChange={e=>set("time",e.target.value)} options={TIME_SLOTS.map(t=>({value:t,label:t}))}/>
          </div>
        </div>
        <div><label style={{ fontSize:11, color:T.textMuted, display:"block", marginBottom:4, textTransform:"uppercase", letterSpacing:"0.06em", fontWeight:600 }}>Notes</label>
          <textarea value={form.notes} onChange={e=>set("notes",e.target.value)} rows={2}
            style={{ width:"100%", background:T.pageBg, border:`1.5px solid ${T.border}`, borderRadius:T.r8, padding:"9px 12px", color:T.textPrimary, fontSize:13, fontFamily:T.font, outline:"none", boxSizing:"border-box", resize:"vertical" }}/>
        </div>
      </div>
      <div style={{ display:"flex", gap:8, marginTop:16 }}>
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

function PaymentModal({ booking: b, onClose, onSave }) {
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
      <div style={{ display:"flex", gap:8, marginTop:16, paddingTop:14, borderTop:`1px solid ${T.border}` }}>
        <Btn onClick={async()=>{setBusy(true);try{await onSave(b.id,{
          finalPrice:    form.finalPrice    !== "" ? parseFloat(form.finalPrice)    : null,
          paymentMethod: form.paymentMethod || null,
          paymentStatus: form.paymentStatus || null,
          paymentNotes:  form.paymentNotes,
        });}finally{setBusy(false);}}} disabled={busy} icon={<CheckIcon size={13} color="#fff"/>}>
          {busy ? "Saving…" : "Save Payment"}
        </Btn>
        <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
      </div>
    </Modal>
  );
}
