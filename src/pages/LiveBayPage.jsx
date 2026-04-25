// pages/LiveBayPage.jsx — Live Bay + Mechanic View
import { useState, useEffect, useCallback } from "react";
import { fetchLiveBay, updateBooking, baySnooze, extendBay, updateMechanic, getToken, getUserRole } from "../api.js";
import { getT, displaySvc, effectiveOcc } from "../theme.js";
import { Badge, Btn, IBtn, Modal, ModalTitle, PageHeader, Spinner, Empty, Card, RefreshIcon, BayIcon, FlagIcon, ClockIcon, CheckIcon, PlusIcon, WrenchIcon } from "../components.jsx";

export default function LiveBayPage({ onAlert }) {
  const T = getT();
  const role = getUserRole();
  const isMechanic = role === "mechanic";

  const [data,    setData]    = useState({ active:[], upcoming:[] });
  const [loading, setLoading] = useState(true);
  const [noteB,   setNoteB]   = useState(null);
  const [completeB, setCompleteB] = useState(null);
  const [busy,    setBusy]    = useState({});

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try { const d = await fetchLiveBay(); setData(d || { active:[], upcoming:[] }); }
    catch (e) { onAlert?.(e.message,"error"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); const iv = setInterval(() => load(true), 20000); return () => clearInterval(iv); }, [load]);

  const setBusy_ = (id, v) => setBusy(p => ({ ...p, [id]: v }));

  const handleExtend = async (id, minutes) => {
    setBusy_(id, true);
    try { await extendBay(id, minutes); onAlert?.(`+${minutes} min added`); load(true); }
    catch (e) { onAlert?.(e.message,"error"); }
    finally { setBusy_(id, false); }
  };

  const handleComplete = async (booking, variant) => {
    setBusy_(booking.id, true);
    try {
      await updateBooking(booking.id, { status:"completed", completedSmsVariant:variant, sendSMS:variant!=="none" });
      onAlert?.("Marked complete");
      setCompleteB(null);
      load(true);
    } catch (e) { onAlert?.(e.message,"error"); }
    finally { setBusy_(booking.id, false); }
  };

  const BAY_COLORS = {
    1: T.blue, 2: T.teal, 3: T.purple,
    alignment: T.amber,
    default: T.blue,
  };

  const getBayColor = (b) => BAY_COLORS[b.resourcePool==="alignment" ? "alignment" : (b.assignedBay || "default")] || T.blue;

  return (
    <div>
      <PageHeader
        title={isMechanic ? "Mechanic View" : "Live at Bay"}
        sub={isMechanic ? "Your active jobs and upcoming queue" : "Real-time bay status — auto-refreshes every 20 seconds"}
        actions={<Btn small variant="ghost" icon={<RefreshIcon size={13}/>} onClick={() => load()}>Refresh</Btn>}
      />

      {loading ? <Spinner/> : (
        <>
          {data.active.length === 0 ? (
            <Empty icon={null} title="No cars in a bay right now" sub="Confirmed bookings will appear here when their appointment time arrives"/>
          ) : (
            <>
              <div style={{ fontSize:12, color:T.textMuted, marginBottom:12 }}>
                {data.active.length} car{data.active.length !== 1 ? "s" : ""} currently in service
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))", gap:14, marginBottom:24 }}>
                {data.active.map(b => {
                  const color    = getBayColor(b);
                  const isOver   = b.minutesRemaining <= 0;
                  const isSoon   = b.minutesRemaining > 0 && b.minutesRemaining <= 5;
                  const bayLabel = b.resourcePool === "alignment" ? "Alignment Lane" : `Bay ${b.assignedBay || "?"}`;
                  const pct      = Math.max(0, Math.min(100, (b._resolvedDuration - b.minutesRemaining) / b._resolvedDuration * 100));
                  return (
                    <div key={b.id} style={{ background:T.cardBg, border:`2px solid ${isOver ? T.red : `${color}50`}`, borderRadius:T.r12, padding:"16px", boxShadow:isOver?`0 0 16px ${T.red}30`:"none" }}>
                      {/* Bay header */}
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
                        <span style={{ fontSize:11, fontWeight:700, letterSpacing:"0.07em", textTransform:"uppercase", color, background:`${color}18`, padding:"3px 9px", borderRadius:20 }}>{bayLabel}</span>
                        <span style={{ fontSize:12, fontWeight:700, color:isOver?T.red:isSoon?T.amber:T.green }}>
                          {isOver ? "Overdue" : `${b.minutesRemaining} min left`}
                        </span>
                      </div>

                      {/* Progress bar */}
                      <div style={{ height:4, background:T.border, borderRadius:2, marginBottom:12, overflow:"hidden" }}>
                        <div style={{ height:"100%", width:`${pct}%`, background:isOver?T.red:color, borderRadius:2, transition:"width .5s" }}/>
                      </div>

                      {/* Customer info */}
                      <div style={{ fontSize:16, fontWeight:700, color:T.textPrimary, marginBottom:2 }}>{b.firstName} {b.lastName}</div>
                      <div style={{ fontSize:12, fontWeight:600, color, marginBottom:4, textTransform:"uppercase", letterSpacing:"0.04em" }}>{displaySvc(b)}</div>
                      <div style={{ fontSize:11, color:T.textMuted, marginBottom:b.tireSize?4:10 }}>{b.time} · {effectiveOcc(b)} min total{b._extendedBy > 0 ? ` (+${b._extendedBy} extended)` : ""}</div>
                      {b.tireSize && <div style={{ fontSize:11, color:T.orange, marginBottom:10, display:"flex", alignItems:"center", gap:4 }}><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3.5"/><path d="M12 2.5v4M12 17.5v4M2.5 12h4M17.5 12h4"/></svg>{b.tireSize}</div>}
                      {b.mechanicNotes && <div style={{ fontSize:11, color:T.textSecond, marginBottom:10, background:T.elevated, padding:"6px 9px", borderRadius:T.r8, display:"flex", alignItems:"flex-start", gap:5 }}><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0,marginTop:1,opacity:0.6}}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>{b.mechanicNotes}</div>}

                      {/* Alert */}
                      {(isOver || isSoon) && (
                        <div style={{ background:T.redBg, border:`1px solid ${T.redBorder}`, borderRadius:T.r8, padding:"8px 10px", marginBottom:10, fontSize:12, fontWeight:600, color:T.redText }}>
                          Is this done? — {b.firstName}
                        </div>
                      )}

                      {/* Actions */}
                      <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                        <Btn small variant="teal" icon={<FlagIcon size={12} color={T.teal}/>} onClick={() => setCompleteB(b)} disabled={busy[b.id]}>Done</Btn>
                        <Btn small variant="amber" icon={<ClockIcon size={12} color={T.amber}/>} onClick={() => handleExtend(b.id, 10)} disabled={busy[b.id]}>+10 min</Btn>
                        <Btn small variant="ghost" icon={<WrenchIcon size={12}/>} onClick={() => setNoteB(b)}>Note</Btn>
                        {(isOver || isSoon) && (
                          <Btn small variant="ghost" onClick={() => baySnooze(b.id).then(() => load(true))}>Snooze</Btn>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* Upcoming */}
          {data.upcoming.length > 0 && (
            <div>
              <div style={{ fontSize:12, fontWeight:600, color:T.textMuted, letterSpacing:"0.07em", textTransform:"uppercase", marginBottom:10 }}>Up next today</div>
              <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                {data.upcoming.map(b => (
                  <div key={b.id} style={{ background:T.cardBg, border:`1px solid ${T.border}`, borderRadius:T.r10, padding:"10px 14px", display:"flex", alignItems:"center", gap:12 }}>
                    <div style={{ fontSize:13, fontWeight:700, color:T.textPrimary, minWidth:70 }}>{b.time}</div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13, fontWeight:600, color:T.textPrimary }}>{b.firstName} {b.lastName}</div>
                      <div style={{ fontSize:11, color:T.textMuted }}>{displaySvc(b)} · {effectiveOcc(b)} min</div>
                    </div>
                    <Badge status={b.status}/>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Mechanic note modal */}
      {noteB && (
        <MechanicNoteModal booking={noteB} onClose={() => setNoteB(null)}
          onSave={async (id, note) => {
            try { await updateMechanic(id, { mechanicNotes: note }); onAlert?.("Note saved"); setNoteB(null); load(true); }
            catch (e) { onAlert?.(e.message,"error"); }
          }}
        />
      )}

      {/* Complete modal */}
      {completeB && (
        <Modal onClose={() => setCompleteB(null)}>
          <ModalTitle>Mark as Completed</ModalTitle>
          <p style={{ fontSize:13, color:T.textSecond, marginBottom:16 }}>{completeB.firstName} {completeB.lastName} — {displaySvc(completeB)}</p>
          {[["with_review","Complete + Review SMS"],["without_review","Complete + Thank-you SMS"],["none","Complete — No SMS"]].map(([v,label]) => (
            <Btn key={v} style={{ width:"100%", justifyContent:"center", marginBottom:8 }}
              onClick={() => handleComplete(completeB, v)}>
              {label}
            </Btn>
          ))}
        </Modal>
      )}
    </div>
  );
}

function MechanicNoteModal({ booking, onClose, onSave }) {
  const T = getT();
  const [note, setNote] = useState(booking.mechanicNotes || "");
  const [busy, setBusy] = useState(false);
  return (
    <Modal onClose={onClose}>
      <ModalTitle sub={`${booking.firstName} ${booking.lastName} — ${booking.service}`}>Mechanic Note</ModalTitle>
      <textarea value={note} onChange={e => setNote(e.target.value)} rows={4} placeholder="Add a mechanic note…"
        style={{ width:"100%", background:T.pageBg, border:`1.5px solid ${T.border}`, borderRadius:T.r8, padding:"10px 12px", color:T.textPrimary, fontSize:13, fontFamily:T.font, outline:"none", boxSizing:"border-box", resize:"vertical" }}/>
      <div style={{ display:"flex", gap:8, marginTop:12 }}>
        <Btn onClick={async()=>{setBusy(true);try{await onSave(booking.id,note);}finally{setBusy(false);}}} disabled={busy} icon={<CheckIcon size={13} color="#fff"/>}>{busy?"Saving…":"Save Note"}</Btn>
        <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
      </div>
    </Modal>
  );
}
