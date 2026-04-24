// pages/TodayPage.jsx — Today's bookings + Live at Bay
import { useState, useEffect, useCallback } from "react";
import { fetchBookings, fetchLiveBay, updateBooking, deleteBooking, sendSMS, baySnooze, extendBay, getToken } from "../api.js";
import { getT, sm, displaySvc, effectiveOcc, fmtDate, todayStr } from "../theme.js";
import { Badge, Btn, IBtn, Modal, ModalTitle, StatCard, PageHeader, Spinner, Empty, CheckIcon, XIcon, FlagIcon, MsgIcon, TrashIcon, PenIcon, NoteIcon, BayIcon, RefreshIcon, ClockIcon, WalkInIcon, PlusIcon } from "../components.jsx";

const API_BASE = import.meta.env.VITE_API_URL || "https://roadstar-api.onrender.com/api";

function LiveBayCard({ b, onComplete, onSnooze, onExtend }) {
  const T = getT();
  const isOver   = b.minutesRemaining <= 0;
  const isSoon   = b.minutesRemaining > 0 && b.minutesRemaining <= 5;
  const accentColor = b.resourcePool === "alignment" ? T.amber : [T.blue, T.teal, T.purple][((b.assignedBay||1)-1) % 3];
  const bayLabel = b.resourcePool === "alignment" ? "Alignment" : `Bay ${b.assignedBay||"?"}`;

  return (
    <div style={{ background:T.cardBg, border:`1.5px solid ${isOver?T.red:accentColor}40`, borderRadius:T.r12, padding:"14px 16px", boxShadow:isOver?`0 0 12px ${T.red}30`:"none" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
        <span style={{ fontSize:10, fontWeight:700, letterSpacing:"0.07em", textTransform:"uppercase", color:accentColor, background:`${accentColor}18`, padding:"2px 8px", borderRadius:20, border:`1px solid ${accentColor}40` }}>{bayLabel}</span>
        {isOver
          ? <span style={{ fontSize:11, color:T.red, fontWeight:700 }}>⏰ Overdue</span>
          : <span style={{ fontSize:11, color:T.green }}>{b.minutesRemaining} min left</span>}
      </div>
      <div style={{ fontSize:15, fontWeight:700, color:T.textPrimary, marginBottom:2 }}>{b.firstName} {b.lastName}</div>
      <div style={{ fontSize:12, color:T.textMuted, marginBottom:10 }}>{displaySvc(b)} · {effectiveOcc(b)} min total</div>
      {(isOver || isSoon) && (
        <div style={{ background:T.redBg, border:`1px solid ${T.redBorder}`, borderRadius:T.r8, padding:"8px 10px", marginBottom:10, fontSize:12, fontWeight:600, color:T.redText }}>
          Is this done? — {b.firstName}
        </div>
      )}
      <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
        <Btn small variant="teal" icon={<FlagIcon size={13} color={T.teal}/>} onClick={() => onComplete(b)}>Done</Btn>
        <Btn small variant="amber" icon={<ClockIcon size={13} color={T.amber}/>} onClick={() => onExtend(b.id, 10)}>+10 min</Btn>
        {(isOver || isSoon) && <Btn small variant="ghost" onClick={() => onSnooze(b.id)}>Snooze</Btn>}
      </div>
    </div>
  );
}

export default function TodayPage({ onAlert }) {
  const T = getT();
  const today = todayStr();
  const [bookings,   setBookings]   = useState([]);
  const [liveBay,    setLiveBay]    = useState({ active:[], upcoming:[] });
  const [loading,    setLoading]    = useState(true);
  const [completeB,  setCompleteB]  = useState(null);
  const [busyId,     setBusyId]     = useState(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [bk, lb] = await Promise.all([fetchBookings({ date: today }), fetchLiveBay()]);
      setBookings(bk || []);
      setLiveBay(lb || { active:[], upcoming:[] });
    } catch (e) { onAlert?.(e.message, "error"); }
    finally { setLoading(false); }
  }, [today]);

  useEffect(() => { load(); const iv = setInterval(() => load(true), 30000); return () => clearInterval(iv); }, [load]);

  const act = async (id, updates) => {
    setBusyId(id);
    try { const u = await updateBooking(id, updates); setBookings(p => p.map(b => b.id === id ? u : b)); onAlert?.("Updated"); }
    catch (e) { onAlert?.(e.message, "error"); }
    finally { setBusyId(null); }
  };

  const handleComplete = async (booking, variant) => {
    await act(booking.id, { status:"completed", completedSmsVariant:variant, sendSMS:variant!=="none" });
    setCompleteB(null);
    load(true);
  };

  const active  = bookings.filter(b => !["completed","cancelled"].includes(b.status));
  const counts  = {
    total:     active.length,
    confirmed: bookings.filter(b => b.status === "confirmed").length,
    pending:   bookings.filter(b => b.status === "pending").length,
    completed: bookings.filter(b => b.status === "completed").length,
  };

  return (
    <div>
      <PageHeader
        title={`Today — ${new Date().toLocaleDateString("en-CA",{weekday:"long",month:"long",day:"numeric"})}`}
        sub="Today's appointments and live bay status"
        actions={<Btn small variant="ghost" icon={<RefreshIcon size={13}/>} onClick={() => load()}>Refresh</Btn>}
      />

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))", gap:10, marginBottom:24 }}>
        <StatCard label="Today Active" value={counts.total}     accent={T.blue}   icon="📅"/>
        <StatCard label="Confirmed"    value={counts.confirmed} accent={T.green}  icon="✓"/>
        <StatCard label="Pending"      value={counts.pending}   accent={T.amber}  icon="⏳"/>
        <StatCard label="Completed"    value={counts.completed} accent={T.teal}   icon="🏁"/>
      </div>

      {/* Live at Bay */}
      {liveBay.active.length > 0 && (
        <div style={{ marginBottom:28 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
            <BayIcon size={15} color={T.green}/>
            <span style={{ fontSize:14, fontWeight:700, color:T.textPrimary }}>Live at Bay</span>
            <span style={{ fontSize:11, color:T.textMuted, background:T.elevated, padding:"2px 8px", borderRadius:20, border:`1px solid ${T.border}` }}>{liveBay.active.length} active</span>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:10 }}>
            {liveBay.active.map(b => (
              <LiveBayCard key={b.id} b={b}
                onComplete={b => setCompleteB(b)}
                onSnooze={id => baySnooze(id).then(() => load(true))}
                onExtend={(id, m) => extendBay(id, m).then(() => { onAlert?.(`+${m} min added`); load(true); })}
              />
            ))}
          </div>
        </div>
      )}

      {/* Today's booking list */}
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
        <span style={{ fontSize:14, fontWeight:700, color:T.textPrimary }}>Today's Queue</span>
        <span style={{ fontSize:11, color:T.textMuted, background:T.elevated, padding:"2px 8px", borderRadius:20, border:`1px solid ${T.border}` }}>{active.length} appointments</span>
      </div>

      {loading ? <Spinner/> : active.length === 0 ? (
        <Empty icon="📅" title="No active appointments today" sub="Bookings will appear here once they are created"/>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {[...active].sort((a,b) => a.time.localeCompare(b.time)).map(b => (
            <TodayCard key={b.id} b={b} busyId={busyId} onAct={act} onComplete={setCompleteB} onAlert={onAlert} onRefresh={() => load(true)}/>
          ))}
        </div>
      )}

      {/* Complete modal */}
      {completeB && (
        <Modal onClose={() => setCompleteB(null)}>
          <ModalTitle>Mark as Completed</ModalTitle>
          <p style={{ fontSize:13, color:T.textSecond, marginBottom:16 }}>{completeB.firstName} {completeB.lastName} — {displaySvc(completeB)}</p>
          {[
            { v:"with_review",    label:"Complete + Send Review SMS",   cl:T.amber },
            { v:"without_review", label:"Complete + Thank-you SMS",     cl:T.teal  },
            { v:"none",           label:"Complete — No SMS",            cl:T.textMuted },
          ].map(({ v, label, cl }) => (
            <Btn key={v} onClick={() => handleComplete(completeB, v)} style={{ width:"100%", justifyContent:"center", marginBottom:8, color:cl }}>{label}</Btn>
          ))}
        </Modal>
      )}
    </div>
  );
}

function TodayCard({ b, busyId, onAct, onComplete, onAlert, onRefresh }) {
  const T = getT(); const s = sm(b.status);
  const busy = busyId === b.id;
  return (
    <div style={{ background:T.cardBg, borderLeft:`4px solid ${s.accent||s.color}`, border:`1px solid ${T.border}`, borderRadius:T.r12, padding:"14px 18px", display:"flex", flexWrap:"wrap", alignItems:"center", gap:12, opacity:busy?0.7:1 }}>
      <div style={{ flexShrink:0, minWidth:62, padding:"8px 10px", background:T.elevated, border:`1px solid ${T.border}`, borderRadius:T.r10, textAlign:"center" }}>
        <div style={{ fontSize:14, fontWeight:800, color:T.textPrimary, lineHeight:1 }}>{b.time}</div>
        <div style={{ fontSize:10, color:T.textMuted, marginTop:2 }}>{effectiveOcc(b)}m</div>
      </div>
      <div style={{ flex:1, minWidth:150 }}>
        <div style={{ fontSize:14, fontWeight:700, color:T.textPrimary, marginBottom:2 }}>{b.firstName} {b.lastName}</div>
        <div style={{ fontSize:12, fontWeight:600, color:s.color, marginBottom:2, textTransform:"uppercase", letterSpacing:"0.04em" }}>{displaySvc(b)}</div>
        <div style={{ fontSize:11, color:T.textMuted }}>{b.phone} {b.tireSize && <span style={{ color:T.orange, marginLeft:8 }}>{b.tireSize}</span>}</div>
      </div>
      <Badge status={b.status}/>
      <div style={{ display:"flex", gap:4 }}>
        {b.status !== "confirmed" && b.status !== "completed" && b.status !== "cancelled" && (
          <IBtn v="accept" title="Confirm" onClick={() => onAct(b.id,{status:"confirmed"})} disabled={busy}><CheckIcon size={15}/></IBtn>
        )}
        {b.status !== "completed" && b.status !== "cancelled" && (
          <IBtn v="complete" title="Complete" onClick={() => onComplete(b)} disabled={busy}><FlagIcon size={15}/></IBtn>
        )}
        {b.status !== "cancelled" && b.status !== "completed" && (
          <IBtn v="decline" title="Cancel" onClick={() => onAct(b.id,{status:"cancelled"})} disabled={busy}><XIcon size={15}/></IBtn>
        )}
      </div>
    </div>
  );
}
