// pages/LiveBayPage.jsx — Live Bay + Mechanic View
// Cars only appear "Live at Bay" after a mechanic presses Start (accepts the job).
// Pressing Finished records how long the customer was in the shop and hands the
// order to the front desk/owner to complete (with a price) — it does not auto-complete.
import { useState, useEffect, useCallback } from "react";
import { fetchLiveBay, baySnooze, extendBay, updateMechanic, bayStart, bayEnd, getToken, getUserRole } from "../api.js";
import { getT, displaySvc, effectiveOcc } from "../theme.js";
import { Badge, Btn, IBtn, Modal, ModalTitle, PageHeader, Spinner, Empty, Card, RefreshIcon, BayIcon, FlagIcon, ClockIcon, CheckIcon, PlusIcon, WrenchIcon, NoteIcon } from "../components.jsx";

export default function LiveBayPage({ onAlert }) {
  const T = getT();
  const role = getUserRole();
  const isMechanic = role === "mechanic";
  const canWriteNote = ["mechanic","owner","superadmin"].includes(role); // matches manage:mechanic

  const [data,    setData]    = useState({ active:[], ready:[], upcoming:[] });
  const [loading, setLoading] = useState(true);
  const [noteB,   setNoteB]   = useState(null);
  const [busy,    setBusy]    = useState({});

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try { const d = await fetchLiveBay(); setData(d || { active:[], ready:[], upcoming:[] }); }
    catch (e) { onAlert?.(e.message,"error"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); const iv = setInterval(() => load(true), 20000); return () => clearInterval(iv); }, [load]);

  const setBusy_ = (id, v) => setBusy(p => ({ ...p, [id]: v }));

  const handleStart = async (b) => {
    setBusy_(b.id, true);
    try { await bayStart(b.id); onAlert?.(`${b.firstName} is now live at bay`); load(true); }
    catch (e) { onAlert?.(e.message,"error"); }
    finally { setBusy_(b.id, false); }
  };

  // Mechanic presses Finished → records time in shop. Does NOT complete the
  // order — the front desk/owner completes it later with a price.
  const handleEnd = async (b) => {
    setBusy_(b.id, true);
    try {
      const res = await bayEnd(b.id);
      const mins = res?.durationMinutes ?? 0;
      onAlert?.(`${b.firstName} ${b.lastName} was in the shop for ${mins} min — sent to front desk to complete`);
      load(true);
    } catch (e) { onAlert?.(e.message,"error"); }
    finally { setBusy_(b.id, false); }
  };

  const handleExtend = async (id, minutes) => {
    setBusy_(id, true);
    try { await extendBay(id, minutes); onAlert?.(`+${minutes} min added`); load(true); }
    catch (e) { onAlert?.(e.message,"error"); }
    finally { setBusy_(id, false); }
  };

  const BAY_COLORS = {
    1: T.blue, 2: T.teal, 3: T.purple,
    alignment: T.amber,
    default: T.blue,
  };

  const getBayColor = (b) => BAY_COLORS[b.resourcePool==="alignment" ? "alignment" : (b.assignedBay || "default")] || T.blue;

  // Shared customer-info block (tire + customer note + mechanic note) so the
  // mechanic can read everything the front desk / customer left.
  const CustomerInfo = (b) => (
    <>
      {b.tireSize && <div style={{ fontSize:11, color:T.orange, marginBottom:6, display:"flex", alignItems:"center", gap:4 }}><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3.5"/><path d="M12 2.5v4M12 17.5v4M2.5 12h4M17.5 12h4"/></svg>{b.tireSize}{b.tireQuantity ? ` · ${b.tireQuantity} tires` : ""}</div>}
      {!b.tireSize && b.doesntKnowTireSize && <div style={{ fontSize:11, color:T.textMuted, marginBottom:6 }}>Tire size: doesn't know{b.tireQuantity ? ` · ${b.tireQuantity} tires` : ""}</div>}
      {!b.tireSize && !b.doesntKnowTireSize && b.tireQuantity ? <div style={{ fontSize:11, color:T.textMuted, marginBottom:6 }}>{b.tireQuantity} tires</div> : null}
      {b.notes && <div style={{ fontSize:11, color:T.textSecond, marginBottom:8, background:T.elevated, padding:"6px 9px", borderRadius:T.r8, display:"flex", alignItems:"flex-start", gap:5 }}><NoteIcon size={11} color={T.textMuted}/><span><b style={{color:T.textMuted}}>Customer note:</b> {b.notes}</span></div>}
      {b.mechanicNotes && <div style={{ fontSize:11, color:T.textSecond, marginBottom:8, background:T.elevated, padding:"6px 9px", borderRadius:T.r8, display:"flex", alignItems:"flex-start", gap:5 }}><WrenchIcon size={11} color={T.textMuted}/><span><b style={{color:T.textMuted}}>Mechanic note:</b> {b.mechanicNotes}</span></div>}
    </>
  );

  return (
    <div>
      <PageHeader
        title={isMechanic ? "Mechanic View" : "Live at Bay"}
        sub={isMechanic ? "Accept a job to start, end it when the car is done" : "Real-time bay status — auto-refreshes every 20 seconds"}
        actions={<Btn small variant="ghost" icon={<RefreshIcon size={13}/>} onClick={() => load()}>Refresh</Btn>}
      />

      {loading ? <Spinner/> : (
        <>
          {/* ── Ready to start: mechanic must accept (Start) before going live ── */}
          {data.ready && data.ready.length > 0 && (
            <div style={{ marginBottom:24 }}>
              <div style={{ fontSize:12, fontWeight:600, color:T.textMuted, letterSpacing:"0.07em", textTransform:"uppercase", marginBottom:10 }}>
                Ready to start — {data.ready.length} waiting
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))", gap:14 }}>
                {data.ready.map(b => (
                  <div key={b.id} style={{ background:T.cardBg, border:`1.5px dashed ${T.border}`, borderRadius:T.r12, padding:"16px" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                      <span style={{ fontSize:11, fontWeight:700, letterSpacing:"0.06em", textTransform:"uppercase", color:T.textMuted }}>Scheduled {b.time}</span>
                      <Badge status={b.status}/>
                    </div>
                    <div style={{ fontSize:16, fontWeight:700, color:T.textPrimary, marginBottom:2 }}>{b.firstName} {b.lastName}</div>
                    <div style={{ fontSize:12, fontWeight:600, color:T.blue, marginBottom:6, textTransform:"uppercase", letterSpacing:"0.04em" }}>{displaySvc(b)}</div>
                    {CustomerInfo(b)}
                    <Btn variant="primary" small style={{ width:"100%", justifyContent:"center", marginTop:4 }} icon={<PlusIcon size={13} color="#fff"/>} disabled={busy[b.id]} onClick={() => handleStart(b)}>
                      {busy[b.id] ? "Starting…" : "Start — Put in bay"}
                    </Btn>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Live at bay ── */}
          {data.active.length === 0 ? (
            (!data.ready || data.ready.length === 0) &&
              <Empty icon={null} title="No cars in a bay right now" sub="Press Start on a scheduled booking to put a car in a bay"/>
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
                      <div style={{ fontSize:11, color:T.textMuted, marginBottom:8 }}>In shop {b._elapsedMinutes ?? 0} min · {effectiveOcc(b)} min expected{b._extendedBy > 0 ? ` (+${b._extendedBy})` : ""}</div>
                      {CustomerInfo(b)}

                      {/* Alert */}
                      {(isOver || isSoon) && (
                        <div style={{ background:T.redBg, border:`1px solid ${T.redBorder}`, borderRadius:T.r8, padding:"8px 10px", marginBottom:10, fontSize:12, fontWeight:600, color:T.redText }}>
                          Is this done? — {b.firstName}
                        </div>
                      )}

                      {/* Actions */}
                      <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                        <Btn small variant="success" icon={<FlagIcon size={12} color={T.green}/>} onClick={() => handleEnd(b)} disabled={busy[b.id]}>{busy[b.id]?"…":"Finished"}</Btn>
                        <Btn small variant="amber" icon={<ClockIcon size={12} color={T.amber}/>} onClick={() => handleExtend(b.id, 10)} disabled={busy[b.id]}>+10 min</Btn>
                        {canWriteNote && <Btn small variant="ghost" icon={<WrenchIcon size={12}/>} onClick={() => setNoteB(b)}>Note</Btn>}
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
      {booking.notes && (
        <div style={{ fontSize:12, color:T.textSecond, marginBottom:12, background:T.elevated, padding:"8px 11px", borderRadius:T.r8 }}>
          <b style={{ color:T.textMuted }}>Customer note:</b> {booking.notes}
        </div>
      )}
      <textarea value={note} onChange={e => setNote(e.target.value)} rows={4} placeholder="Add a mechanic note…"
        style={{ width:"100%", background:T.pageBg, border:`1.5px solid ${T.border}`, borderRadius:T.r8, padding:"10px 12px", color:T.textPrimary, fontSize:13, fontFamily:T.font, outline:"none", boxSizing:"border-box", resize:"vertical" }}/>
      <div style={{ display:"flex", gap:8, marginTop:12 }}>
        <Btn onClick={async()=>{setBusy(true);try{await onSave(booking.id,note);}finally{setBusy(false);}}} disabled={busy} icon={<CheckIcon size={13} color="#fff"/>}>{busy?"Saving…":"Save Note"}</Btn>
        <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
      </div>
    </Modal>
  );
}
