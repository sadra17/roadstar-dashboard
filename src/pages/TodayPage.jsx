// pages/TodayPage.jsx — no emoji, SVG icons throughout
import { useState, useEffect, useCallback } from "react";
import { fetchBookings, fetchLiveBay, updateBooking, updatePayment, baySnooze, extendBay, bayStart, bayEnd, getUserRole, fetchSettings, updateMechanic } from "../api.js";
import { getT, sm, displaySvc, effectiveOcc, todayStr } from "../theme.js";
import { Badge, Btn, IBtn, Modal, ModalTitle, Sel, Inp, StatCard, PageHeader, Spinner, CheckIcon, XIcon, FlagIcon, ClockIcon, BayIcon, RefreshIcon, PlusIcon, ConfirmModal, CompleteOrderModal, TrashIcon, WrenchIcon } from "../components.jsx";

// A car is "Live at Bay" once a mechanic presses Start, and "Done" once they
// press Finished (until the front desk completes it with a price).
const bayState = (b) => {
  if (["completed","cancelled"].includes(b.status)) return null;
  if (b.bayStartedAt && !b.bayEndedAt) return "live";
  if (b.bayEndedAt) return "done";
  return null;
};

// Walk-in uses POST /api/book directly (same as Shopify form)
async function createWalkIn(form) {
  const BASE = import.meta.env.VITE_API_URL || "https://roadstar-api.onrender.com/api";
  const token = localStorage.getItem("roadstar_token") || "";
  let shopId = "";
  try { shopId = JSON.parse(atob(token.split(".")[1])).shopId || ""; } catch {}
  const res = await fetch(`${BASE}/book`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
    body: JSON.stringify({ ...form, shopId }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to create booking");
  return data;
}


const Ic = ({ size=16, color="currentColor", ch }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8}
    strokeLinecap="round" strokeLinejoin="round" style={{ display:"block", flexShrink:0 }}>{ch}</svg>
);
const AlertIcon   = ({ size, color }) => <Ic size={size} color={color} ch={<><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>}/>;
const ArrowRIcon  = ({ size, color }) => <Ic size={size} color={color} ch={<><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></>}/>;
const BarChartIcon= ({ size, color }) => <Ic size={size} color={color} ch={<><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></>}/>;
const CheckCircle = ({ size, color }) => <Ic size={size} color={color} ch={<><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></>}/>;
const UserIcon    = ({ size, color }) => <Ic size={size} color={color} ch={<><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>}/>;
const TireIcon    = ({ size, color }) => <Ic size={size} color={color} ch={<><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3.5"/><path d="M12 2.5v4M12 17.5v4M2.5 12h4M17.5 12h4"/></>}/>;

function LiveCard({ b, onFinish, onSnooze, onExtend }) {
  const T = getT();
  const [busy, setBusy] = useState(false);
  const isOver  = b.minutesRemaining <= 0;
  const isSoon  = b.minutesRemaining > 0 && b.minutesRemaining <= 5;
  const isAlign = b.resourcePool === "alignment";

  const accentColor = isAlign ? T.amber : [T.blue, T.teal, T.purple][((b.assignedBay||1)-1) % 3];
  const bayLabel    = isAlign ? "Alignment" : `Bay ${b.assignedBay || "?"}`;
  const pct         = b._resolvedDuration > 0 ? Math.max(0, Math.min(100, ((b._resolvedDuration - b.minutesRemaining) / b._resolvedDuration) * 100)) : 0;

  return (
    <div style={{ background:T.cardBg, border:`1px solid ${isOver ? T.red : T.border}`, borderTop:`3px solid ${isOver ? T.red : accentColor}`, borderRadius:T.r12, padding:"16px" }}>
      {/* Bay + time */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
        <span style={{ fontSize:10, fontWeight:700, letterSpacing:"0.07em", textTransform:"uppercase", color:accentColor }}>
          {bayLabel}
        </span>
        <span style={{ fontSize:12, fontWeight:700, color:isOver ? T.red : isSoon ? T.amber : T.green }}>
          {isOver ? "Overdue" : `${b.minutesRemaining}m left`}
        </span>
      </div>

      {/* Progress */}
      <div style={{ height:3, background:T.border, borderRadius:2, marginBottom:12, overflow:"hidden" }}>
        <div style={{ height:"100%", width:`${pct}%`, background:isOver ? T.red : accentColor, borderRadius:2, transition:"width .5s" }}/>
      </div>

      <div style={{ fontSize:14, fontWeight:700, color:T.textPrimary, marginBottom:2 }}>{b.firstName} {b.lastName}</div>
      <div style={{ fontSize:11, fontWeight:600, color:accentColor, textTransform:"uppercase", letterSpacing:"0.04em", marginBottom:8 }}>{displaySvc(b)}</div>
      {b._elapsedMinutes != null && <div style={{ fontSize:11, color:T.textMuted, marginBottom:8 }}>In shop {b._elapsedMinutes} min</div>}

      {b.tireSize && (
        <div style={{ display:"flex", alignItems:"center", gap:5, fontSize:11, color:T.textMuted, marginBottom:8 }}>
          <TireIcon size={11} color={T.textMuted}/>
          {b.tireSize}
        </div>
      )}

      {(isOver || isSoon) && (
        <div style={{ display:"flex", alignItems:"center", gap:7, background:T.redBg, border:`1px solid ${T.redBorder}`, borderRadius:T.r8, padding:"7px 10px", marginBottom:10 }}>
          <AlertIcon size={13} color={T.red}/>
          <span style={{ fontSize:12, fontWeight:600, color:T.redText }}>Is this done?</span>
        </div>
      )}

      <div style={{ display:"flex", gap:5 }}>
        <Btn small variant="success" icon={<FlagIcon size={12} color={T.green}/>} disabled={busy}
          onClick={async () => { setBusy(true); try { await onFinish(b); } finally { setBusy(false); } }}>{busy ? "…" : "Finished"}</Btn>
        <Btn small variant="amber" icon={<ClockIcon size={12} color={T.amber}/>} onClick={() => onExtend(b.id, 10)}>+10</Btn>
        {(isOver || isSoon) && <Btn small variant="ghost" onClick={() => onSnooze(b.id)}>Snooze</Btn>}
      </div>
    </div>
  );
}

function BayPill({ kind }) {
  const T = getT();
  const c = kind === "live" ? T.green : T.amber;
  const label = kind === "live" ? "Live at Bay" : "Done — needs payment";
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:5, fontSize:11, fontWeight:700, letterSpacing:"0.05em", textTransform:"uppercase", padding:"3px 9px", borderRadius:20, background:`${c}18`, color:c, border:`1px solid ${c}55`, whiteSpace:"nowrap" }}>
      <span style={{ width:5, height:5, borderRadius:"50%", background:c, boxShadow:`0 0 4px ${c}80` }}/>
      {label}
    </span>
  );
}

function QueueRow({ b, onConfirm, onCancel, onComplete, onStart, onFinish, onNote, readOnly }) {
  const T = getT();
  const s = sm(b.status);
  const bay = bayState(b);
  const [busy, setBusy] = useState(false);
  const act = async (fn) => { setBusy(true); try { await fn(); } finally { setBusy(false); } };
  // Ready to start = confirmed, needs a bay, not already in/through a bay.
  const canStart = !bay && b.status === "confirmed" && b.resourcePool !== "none";
  return (
    <div style={{ background:T.cardBg, borderLeft:`3px solid ${s.color}`, border:`1px solid ${T.border}`, borderRadius:T.r10, opacity:busy?0.6:1 }}>
      <div style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 16px" }}>
        {/* Time block */}
        <div style={{ flexShrink:0, minWidth:60, textAlign:"center", padding:"7px 10px", background:T.elevated, borderRadius:T.r8, border:`1px solid ${T.border}` }}>
          <div style={{ fontSize:13, fontWeight:800, color:T.textPrimary, letterSpacing:"-0.02em" }}>{b.time}</div>
          <div style={{ fontSize:9, color:T.textMuted, marginTop:1, fontVariantNumeric:"tabular-nums" }}>{effectiveOcc(b)}m</div>
        </div>
        {/* Info */}
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:13, fontWeight:700, color:T.textPrimary, marginBottom:1 }}>{b.firstName} {b.lastName}</div>
          <div style={{ fontSize:11, fontWeight:600, color:s.color, textTransform:"uppercase", letterSpacing:"0.04em", marginBottom:b.tireSize?2:0 }}>{displaySvc(b)}</div>
          {b.tireSize && <div style={{ fontSize:10, color:T.textMuted, display:"flex", alignItems:"center", gap:4 }}><TireIcon size={10} color={T.textMuted}/>{b.tireSize}</div>}
          {b.phone && <div style={{ fontSize:10, color:T.textMuted, marginTop:1 }}>{b.phone}</div>}
        </div>
        {bay ? <BayPill kind={bay}/> : <Badge status={b.status}/>}
        <div style={{ display:"flex", gap:3, alignItems:"center" }}>
          {/* Start / Finished — available to everyone, including mechanics */}
          {canStart && onStart && (
            <Btn small variant="primary" icon={<BayIcon size={12} color="#fff"/>} disabled={busy}
              onClick={() => act(() => onStart(b))}>Start</Btn>
          )}
          {bay === "live" && onFinish && (
            <Btn small variant="success" icon={<FlagIcon size={12} color={T.green}/>} disabled={busy}
              onClick={() => act(() => onFinish(b))}>Finished</Btn>
          )}
          {/* Mechanic: note button only — no booking actions */}
          {readOnly && onNote && (
            <IBtn v="ghost" title="Mechanic note" onClick={() => onNote(b)}><WrenchIcon size={14}/></IBtn>
          )}
          {/* Frontdesk / Owner: full booking actions */}
          {!readOnly && (
            <>
              {!["confirmed","completed","cancelled"].includes(b.status) && (
                <IBtn v="accept" title="Confirm" onClick={() => act(() => onConfirm(b.id))} disabled={busy}><CheckIcon size={14}/></IBtn>
              )}
              {!["completed","cancelled"].includes(b.status) && (
                <IBtn v="complete" title="Mark Complete" onClick={() => onComplete(b)} disabled={busy}><FlagIcon size={14}/></IBtn>
              )}
              {!["cancelled","completed"].includes(b.status) && (
                <IBtn v="decline" title="Cancel" onClick={() => onCancel(b)} disabled={busy}><XIcon size={14}/></IBtn>
              )}
            </>
          )}
        </div>
      </div>
      {/* Mechanic notes — visible to all roles if set */}
      {b.mechanicNotes && (
        <div style={{ margin:"0 16px 10px", padding:"7px 10px", background:T.elevated, borderRadius:T.r8,
          display:"flex", alignItems:"flex-start", gap:6, border:`1px solid ${T.border}` }}>
          <WrenchIcon size={11} color={T.textMuted} style={{ flexShrink:0, marginTop:1 }}/>
          <span style={{ fontSize:11, color:T.textSecond, lineHeight:1.5 }}>{b.mechanicNotes}</span>
        </div>
      )}
    </div>
  );
}


// ── Walk-in booking modal ─────────────────────────────────────────────────────
// Fallback service list — only used if shop settings haven’t loaded yet
const DEFAULT_SERVICES = ["Tire Change + Installation","Flat Tire Repair","Tire Rotation","Wheel Alignment","Tire Purchase","Other"];

// Mechanic note modal (used on Today page for mechanics)
function MechanicNoteModal({ booking, onClose, onSave }) {
  const T = getT();
  const [note, setNote] = useState(booking.mechanicNotes || "");
  const [busy, setBusy] = useState(false);
  return (
    <Modal onClose={onClose}>
      <ModalTitle sub={`${booking.firstName} ${booking.lastName} — ${booking.service}`}>Mechanic Note</ModalTitle>
      <textarea value={note} onChange={e => setNote(e.target.value)} rows={4}
        placeholder="Add a note about this job…"
        style={{ width:"100%", background:getT().pageBg, border:`1.5px solid ${getT().border}`,
          borderRadius:getT().r8, padding:"10px 12px", color:getT().textPrimary,
          fontSize:13, fontFamily:getT().font, outline:"none", boxSizing:"border-box", resize:"vertical" }}/>
      <div style={{ display:"flex", gap:8, marginTop:12 }}>
        <Btn onClick={async () => { setBusy(true); try { await onSave(booking.id, note); } finally { setBusy(false); } }}
          disabled={busy} icon={<CheckIcon size={13} color="#fff"/>}>{busy ? "Saving…" : "Save Note"}</Btn>
        <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
      </div>
    </Modal>
  );
}

function WalkInModal({ onClose, onSave, services }) {
  const T = getT();
  const svcList = services?.length ? services : DEFAULT_SERVICES;
  const todayIso = new Date().toISOString().slice(0, 10);

  const [form, setForm] = useState({
    firstName:"", lastName:"", phone:"", email:"",
    service:svcList[0], date:todayIso, time:"",
    tireSize:"", status:"confirmed",
  });
  const [slots,        setSlots]        = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [busy,         setBusy]         = useState(false);
  const [err,          setErr]          = useState("");
  const sf = (k, v) => setForm(p => ({ ...p, [k]: v }));

  // Fetch available (non-full) time slots from the real availability endpoint
  // whenever the date or service changes — this also prevents submitting a taken slot
  useEffect(() => {
    if (!form.date || !form.service) return;
    let cancelled = false;
    setSlotsLoading(true);
    setSlots([]);
    const BASE = import.meta.env.VITE_API_URL || "https://roadstar-api.onrender.com/api";
    const token = localStorage.getItem("roadstar_token") || "";
    let shopId = "";
    try { shopId = JSON.parse(atob(token.split(".")[1])).shopId || ""; } catch {}
    fetch(`${BASE}/availability?date=${encodeURIComponent(form.date)}&service=${encodeURIComponent(form.service)}&shopId=${encodeURIComponent(shopId)}`)
      .then(r => r.json())
      .then(d => {
        if (cancelled) return;
        const avail = d.available || [];
        setSlots(avail);
        // Auto-pick the first slot at or after now (for today), otherwise first slot
        const isToday = form.date === new Date().toISOString().slice(0, 10);
        const nowMins = isToday ? (new Date().getHours() * 60 + new Date().getMinutes()) : 0;
        const picked = avail.find(t => {
          const [tp, period] = [t.slice(0, t.lastIndexOf(" ")), t.slice(t.lastIndexOf(" ") + 1)];
          const [h, m] = tp.split(":").map(Number);
          const h24 = period === "PM" && h !== 12 ? h + 12 : (period === "AM" && h === 12 ? 0 : h);
          return h24 * 60 + m >= nowMins;
        }) || avail[0] || "";
        setForm(p => ({ ...p, time: picked }));
      })
      .catch(() => { if (!cancelled) setSlots([]); })
      .finally(() => { if (!cancelled) setSlotsLoading(false); });
    return () => { cancelled = true; };
  }, [form.date, form.service]);

  const Lbl = ({ children }) => (
    <label style={{ display:"block", fontSize:11, fontWeight:600, letterSpacing:"0.07em", textTransform:"uppercase", color:T.textMuted, marginBottom:5 }}>{children}</label>
  );

  const handleSave = async () => {
    if (!form.firstName.trim() || !form.lastName.trim() || !form.phone.trim()) {
      setErr("First name, last name and phone are required"); return;
    }
    if (!form.time) { setErr("Please select an available time slot"); return; }
    setBusy(true); setErr("");
    try {
      await onSave(form);
    } catch(e) { setErr(e.message || "Failed to create booking"); }
    finally { setBusy(false); }
  };

  return (
    <Modal onClose={onClose} wide>
      <ModalTitle sub="Creates a confirmed booking directly — no Shopify form needed">Walk-in / Manual Booking</ModalTitle>
      {err && <div style={{ background:T.redBg, border:`1px solid ${T.redBorder}`, borderRadius:T.r8, padding:"9px 12px", fontSize:12, color:T.redText, marginBottom:12 }}>{err}</div>}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>
        <div><Lbl>First name *</Lbl><Inp value={form.firstName} onChange={e=>sf("firstName",e.target.value)} placeholder="John"/></div>
        <div><Lbl>Last name *</Lbl><Inp value={form.lastName} onChange={e=>sf("lastName",e.target.value)} placeholder="Smith"/></div>
        <div><Lbl>Phone *</Lbl><Inp type="tel" value={form.phone} onChange={e=>sf("phone",e.target.value)} placeholder="+1 (416) 555-0000"/></div>
        <div><Lbl>Email</Lbl><Inp type="email" value={form.email} onChange={e=>sf("email",e.target.value)} placeholder="optional"/></div>
      </div>
      <div style={{ marginBottom:12 }}>
        <Lbl>Service</Lbl>
        <Sel value={form.service} onChange={e=>sf("service",e.target.value)} options={svcList.map(s=>({value:s,label:s}))}/>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12, marginBottom:12 }}>
        <div><Lbl>Date</Lbl><Inp type="date" value={form.date} onChange={e=>sf("date",e.target.value)} style={{colorScheme:"dark"}}/></div>
        <div>
          <Lbl>Time {slotsLoading && <span style={{ fontWeight:400, textTransform:"none", letterSpacing:0 }}>— loading…</span>}</Lbl>
          {slotsLoading ? (
            <div style={{ padding:"9px 12px", background:T.elevated, border:`1.5px solid ${T.border}`, borderRadius:T.r8, fontSize:12, color:T.textMuted }}>
              Checking availability…
            </div>
          ) : slots.length === 0 ? (
            <div style={{ padding:"9px 12px", background:T.elevated, border:`1.5px solid ${T.redBorder}`, borderRadius:T.r8, fontSize:12, color:T.amber }}>
              No available slots for this date/service
            </div>
          ) : (
            <Sel value={form.time} onChange={e=>sf("time",e.target.value)} options={slots.map(t=>({value:t,label:t}))}/>
          )}
        </div>
        <div><Lbl>Tire size</Lbl><Inp value={form.tireSize} onChange={e=>sf("tireSize",e.target.value)} placeholder="225/65R17"/></div>
      </div>
      <div style={{ marginBottom:16 }}>
        <Lbl>Initial status</Lbl>
        <Sel value={form.status} onChange={e=>sf("status",e.target.value)} options={[{value:"confirmed",label:"Confirmed"},{value:"pending",label:"Pending"}]}/>
      </div>
      <div style={{ display:"flex", gap:8, paddingTop:14, borderTop:`1px solid ${T.border}` }}>
        <Btn onClick={handleSave} disabled={busy || slotsLoading || slots.length === 0} icon={<CheckIcon size={13} color="#fff"/>}>{busy?"Creating…":"Create Booking"}</Btn>
        <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
      </div>
    </Modal>
  );
}

export default function TodayPage({ onAlert }) {
  const T = getT();
  const today = todayStr();
  const isMechanic = getUserRole() === "mechanic";
  const [bookings,  setBookings]  = useState([]);
  const [liveBay,   setLiveBay]   = useState({ active:[], upcoming:[] });
  const [loading,   setLoading]   = useState(true);
  const [completeB,  setCompleteB]  = useState(null);
  const [showWalkIn, setShowWalkIn] = useState(false);
  const [cancelB,    setCancelB]    = useState(null); // booking to confirm cancel
  const [noteB,      setNoteB]      = useState(null); // mechanic note target
  const [services,   setServices]   = useState([]);   // live services from settings

  // Fetch live services once on mount (no permission gate — all roles can read settings)
  useEffect(() => {
    fetchSettings()
      .then(s => {
        const live = (s.services || []).filter(x => x.active !== false).map(x => x.name);
        if (live.length > 0) setServices(live);
      })
      .catch(() => {}); // silently fall back to DEFAULT_SERVICES inside WalkInModal
  }, []);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [bk, lb] = await Promise.all([fetchBookings({ date:today }), fetchLiveBay()]);
      setBookings(bk || []);
      setLiveBay(lb || { active:[], upcoming:[] });
    } catch (e) { onAlert?.(e.message, "error"); }
    finally { setLoading(false); }
  }, [today]);

  useEffect(() => {
    load();
    const iv = setInterval(() => load(true), 30000);
    return () => clearInterval(iv);
  }, [load]);

  const act = async (id, updates) => {
    const u = await updateBooking(id, updates);
    setBookings(p => p.map(b => b.id === id ? u : b));
  };

  // Anyone (mechanic included) can put a confirmed car into a bay from here.
  const handleStart = async (booking) => {
    try {
      await bayStart(booking.id);
      onAlert?.(`${booking.firstName} ${booking.lastName} is now live at bay`);
      load(true);
    } catch (e) { onAlert?.(e.message, "error"); }
  };

  // Mechanic / staff press "Finished" on a live bay car → records time in shop,
  // does NOT complete it. The front desk completes it afterwards with a price.
  const handleFinish = async (booking) => {
    try {
      const res = await bayEnd(booking.id);
      onAlert?.(`${booking.firstName} ${booking.lastName} — in shop ${res?.durationMinutes ?? 0} min. Ready for front desk to complete.`);
      load(true);
    } catch (e) { onAlert?.(e.message, "error"); }
  };

  // Owner / front desk complete the order — price + payment method are required
  // (enforced by CompleteOrderModal), then optionally send an SMS.
  const handleComplete = async (id, payload) => {
    const { finalPrice, paymentMethod, paymentStatus, completedSmsVariant } = payload;
    await updatePayment(id, { finalPrice, paymentMethod, paymentStatus });
    await act(id, { status:"completed", completedSmsVariant, sendSMS: completedSmsVariant !== "none" });
    setCompleteB(null);
    load(true);
  };

  const active    = bookings.filter(b => !["completed","cancelled"].includes(b.status));
  const completed = bookings.filter(b => b.status === "completed");

  const counts = {
    active:    active.length,
    confirmed: bookings.filter(b => b.status === "confirmed").length,
    pending:   bookings.filter(b => b.status === "pending").length,
    completed: completed.length,
  };

  const dateDisplay = new Date().toLocaleDateString("en-CA", { weekday:"long", month:"long", day:"numeric", year:"numeric" });

  return (
    <div>
      <PageHeader
        title="Today"
        sub={dateDisplay}
        actions={<>
          {!isMechanic && <Btn small icon={<PlusIcon size={13} color="#fff"/>} onClick={() => setShowWalkIn(true)}>Walk-in</Btn>}
          <Btn small variant="ghost" icon={<RefreshIcon size={13}/>} onClick={() => load()}>Refresh</Btn>
        </>}
      />

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))", gap:10, marginBottom:24 }}>
        <StatCard label="Active" value={counts.active}    accent={T.blue}   icon={<ArrowRIcon  size={14} color={T.blue}/>}/>
        <StatCard label="Confirmed" value={counts.confirmed} accent={T.green} icon={<CheckCircle size={14} color={T.green}/>}/>
        <StatCard label="Pending"   value={counts.pending}   accent={T.amber} icon={<ClockIcon   size={14} color={T.amber}/>}/>
        <StatCard label="Completed" value={counts.completed} accent={T.teal}  icon={<FlagIcon    size={14} color={T.teal}/>}/>
      </div>

      {/* Live at Bay */}
      {liveBay.active.length > 0 && (
        <div style={{ marginBottom:28 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
            <BayIcon size={14} color={T.green}/>
            <span style={{ fontSize:13, fontWeight:700, color:T.textPrimary }}>Live at Bay</span>
            <span style={{ fontSize:11, color:T.textMuted, background:T.elevated, padding:"2px 8px", borderRadius:20, border:`1px solid ${T.border}` }}>
              {liveBay.active.length} active
            </span>
            <div style={{ marginLeft:"auto", width:7, height:7, borderRadius:"50%", background:T.green, boxShadow:`0 0 6px ${T.green}` }}/>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))", gap:10 }}>
            {liveBay.active.map(b => (
              <LiveCard key={b.id} b={b}
                onFinish={handleFinish}
                onSnooze={id => baySnooze(id).then(() => load(true)).catch(e => onAlert?.(e.message,"error"))}
                onExtend={(id, m) => extendBay(id, m).then(() => { onAlert?.(`+${m} min added`); load(true); }).catch(e => onAlert?.(e.message,"error"))}
              />
            ))}
          </div>
        </div>
      )}

      {/* Queue */}
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
        <span style={{ fontSize:13, fontWeight:700, color:T.textPrimary }}>Today's Queue</span>
        <span style={{ fontSize:11, color:T.textMuted, background:T.elevated, padding:"2px 8px", borderRadius:20, border:`1px solid ${T.border}` }}>
          {active.length} appointment{active.length!==1?"s":""}
        </span>
      </div>

      {loading ? <Spinner/> : active.length === 0 ? (
        <div style={{ padding:"64px 0", textAlign:"center" }}>
          <div style={{ width:48, height:48, borderRadius:"50%", background:T.elevated, border:`1px solid ${T.border}`, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px" }}>
            <CheckCircle size={20} color={T.textMuted}/>
          </div>
          <div style={{ fontSize:14, fontWeight:600, color:T.textPrimary, marginBottom:6 }}>All clear for today</div>
          <div style={{ fontSize:12, color:T.textMuted }}>No active appointments — new bookings will appear here</div>
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
          {[...active].sort((a,b) => a.time.localeCompare(b.time)).map(b => (
            <QueueRow key={b.id} b={b}
              readOnly={isMechanic}
              onNote={isMechanic ? setNoteB : null}
              onStart={handleStart}
              onFinish={handleFinish}
              onConfirm={id => act(id, { status:"confirmed" }).then(() => onAlert?.("Confirmed"))}
              onCancel={b => setCancelB(b)}
              onComplete={setCompleteB}
            />
          ))}
        </div>
      )}

      {/* Walk-in modal — services come from live shop settings */}
      {showWalkIn && (
        <WalkInModal
          services={services}
          onClose={() => setShowWalkIn(false)}
          onSave={async (form) => {
            await createWalkIn(form);
            onAlert?.("Walk-in booking created");
            setShowWalkIn(false);
            load();
          }}
        />
      )}

      {/* Mechanic note modal */}
      {noteB && (
        <MechanicNoteModal
          booking={noteB}
          onClose={() => setNoteB(null)}
          onSave={async (id, note) => {
            await updateMechanic(id, { mechanicNotes: note });
            onAlert?.("Note saved");
            setNoteB(null);
            load(true);
          }}
        />
      )}

      {/* Complete order modal — forces price + payment method before confirming */}
      {completeB && (
        <CompleteOrderModal booking={completeB} onClose={() => setCompleteB(null)} onConfirm={handleComplete}/>
      )}

      {/* Cancel booking confirmation */}
      {cancelB && (
        <ConfirmModal
          title={`Cancel ${cancelB.firstName}'s booking?`}
          message={`${cancelB.service} on ${cancelB.date} at ${cancelB.time} will be cancelled. An SMS will NOT be sent automatically.`}
          confirmLabel="Yes, cancel booking"
          confirmVariant="danger"
          icon={<XIcon size={22} color={T.red}/>}
          onConfirm={async () => {
            await act(cancelB.id, { status:"cancelled" });
            onAlert?.("Booking cancelled");
            setCancelB(null);
          }}
          onCancel={() => setCancelB(null)}
        />
      )}
    </div>
  );
}
