// InspectionReport.jsx
// Wheel & Tire Inspection Report modal — opened from a booking row in the
// dashboard. Four accordion sections of checkable items, vehicle/plate/mileage
// header fields, a notes box, and an optional "email to customer" action.
//
// Item ids are camelCase to match the backend (they survive the API's
// snake/camel conversion of the JSONB inspection column).
import { useState } from "react";
import { getT } from "./theme.js";
import { Modal, ModalTitle, Btn, Inp } from "./components.jsx";
import { saveInspection, emailInspection } from "./api.js";

export const INSPECTION_SECTIONS = [
  { title: "Wheel / Rim Condition", items: [
    ["previousCosmeticRimDamage","Previous cosmetic rim damage"],
    ["wheelBent","Wheel bent"],
    ["wheelCracked","Wheel cracked"],
    ["wheelCorrosion","Wheel corrosion"],
    ["wheelPreviouslyRepaired","Wheel previously repaired"],
    ["wheelSeizedToHub","Wheel seized to hub"],
    ["centerBoreHubDamage","Center bore / hub damage"],
    ["hubRingMissing","Hub ring missing"],
    ["hubRingSeized","Hub ring seized"],
  ]},
  { title: "Lug Nuts / Bolts / Studs", items: [
    ["rustedLugNutsBolts","Rusted lug nuts / bolts"],
    ["swollenLugNuts","Swollen lug nuts"],
    ["roundedDamagedLugNuts","Rounded / damaged lug nuts"],
    ["previouslyOverTorqued","Previously over-torqued"],
    ["previouslyUnderTorqued","Previously under-torqued"],
    ["crossThreadedLugNutBolt","Cross-threaded lug nut / bolt"],
    ["damagedThreads","Damaged threads"],
    ["brokenWheelStud","Broken wheel stud"],
    ["strippedWheelStud","Stripped wheel stud"],
    ["studLengthInsufficient","Stud length insufficient"],
    ["missingLugNutBolt","Missing lug nut / bolt"],
    ["wheelLockDamagedMissingKey","Wheel lock damaged / missing key"],
  ]},
  { title: "Tires / Valves / TPMS", items: [
    ["unevenTreadWear","Uneven tread wear"],
    ["lowTreadDepth","Low tread depth"],
    ["sidewallDamage","Sidewall damage"],
    ["puncturePreviousRepair","Puncture / previous repair"],
    ["dryRotCracking","Dry rot / cracking"],
    ["incorrectTirePressure","Incorrect tire pressure"],
    ["mismatchedTires","Mismatched tires"],
    ["beadDamageObserved","Bead damage observed"],
    ["valveStemCracked","Valve stem cracked"],
    ["tpmsSensorDamaged","TPMS sensor damaged"],
  ]},
  { title: "Hub / Mounting Surface", items: [
    ["heavyRustOnHubFace","Heavy rust on hub face"],
    ["hubPreventsProperWheelSeating","Hub prevents proper wheel seating"],
    ["rotorHatExcessiveCorrosion","Rotor hat excessive corrosion"],
    ["mountingSurfaceRequiresCleaning","Mounting surface requires cleaning"],
  ]},
];

export default function InspectionModal({ booking, onClose, onSaved, onAlert }) {
  const T = getT();
  const insp = booking.inspection || {};

  const [form, setForm] = useState({
    vehicle:    insp.vehicle    || "",
    plate:      insp.plate      || "",
    mileage:    insp.mileage    || "",
    roNumber:   insp.roNumber   || "",
    technician: insp.technician || "",
    notes:      insp.notes      || "",
  });
  const [checked, setChecked] = useState(new Set(Array.isArray(insp.checked) ? insp.checked : []));
  const [open,    setOpen]    = useState({ 0: true }); // first section open by default
  const [emailTo, setEmailTo] = useState(booking.email || "");
  const [busy,    setBusy]    = useState(false);
  const [err,     setErr]     = useState("");

  const sf = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const toggleItem = id => setChecked(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });
  const toggleSection = i => setOpen(p => ({ ...p, [i]: !p[i] }));

  const payload = () => ({ ...form, checked: [...checked] });

  const doSave = async () => {
    const updated = await saveInspection(booking.id, payload());
    onSaved?.(updated);
    return updated;
  };

  const handleSave = async () => {
    setBusy(true); setErr("");
    try { await doSave(); onAlert?.("Inspection saved"); onClose(); }
    catch (e) { setErr(e.message || "Failed to save"); }
    finally { setBusy(false); }
  };

  const handleEmail = async () => {
    if (!emailTo.trim()) { setErr("Enter an email address to send the report"); return; }
    setBusy(true); setErr("");
    try {
      await doSave();                       // report must be saved before emailing
      await emailInspection(booking.id, emailTo.trim());
      onAlert?.(`Inspection report sent to ${emailTo.trim()}`);
      onClose();
    } catch (e) { setErr(e.message || "Failed to send email"); }
    finally { setBusy(false); }
  };

  const totalFlagged = checked.size;
  const Lbl = ({ children }) => (
    <label style={{ display:"block", fontSize:11, fontWeight:600, letterSpacing:"0.07em", textTransform:"uppercase", color:T.textMuted, marginBottom:5 }}>{children}</label>
  );

  return (
    <Modal onClose={onClose} wide persistent>
      <ModalTitle sub={`${booking.firstName} ${booking.lastName} · ${booking.phone} · ${booking.date}`}>
        Wheel &amp; Tire Inspection Report
      </ModalTitle>

      {err && <div style={{ background:T.redBg, border:`1px solid ${T.redBorder}`, borderRadius:T.r8, padding:"9px 12px", fontSize:12, color:T.redText, marginBottom:12 }}>{err}</div>}

      {/* Header fields */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(140px, 1fr))", gap:12, marginBottom:16 }}>
        <div><Lbl>Vehicle</Lbl><Inp value={form.vehicle} onChange={e=>sf("vehicle",e.target.value)} placeholder="e.g. Ford Escape"/></div>
        <div><Lbl>Plate</Lbl><Inp value={form.plate} onChange={e=>sf("plate",e.target.value)} placeholder="Plate #"/></div>
        <div><Lbl>Mileage</Lbl><Inp value={form.mileage} onChange={e=>sf("mileage",e.target.value)} placeholder="km"/></div>
        <div><Lbl>RO #</Lbl><Inp value={form.roNumber} onChange={e=>sf("roNumber",e.target.value)} placeholder="Repair order #"/></div>
        <div style={{ gridColumn:"1 / -1" }}><Lbl>Technician</Lbl><Inp value={form.technician} onChange={e=>sf("technician",e.target.value)} placeholder="Technician name"/></div>
      </div>

      {/* Accordion sections */}
      <div style={{ borderTop:`1px solid ${T.border}` }}>
        {INSPECTION_SECTIONS.map((sec, i) => {
          const flagged = sec.items.filter(([id]) => checked.has(id)).length;
          const isOpen = !!open[i];
          return (
            <div key={sec.title} style={{ borderBottom:`1px solid ${T.border}` }}>
              <button onClick={() => toggleSection(i)}
                style={{ width:"100%", display:"flex", alignItems:"center", justifyContent:"space-between", gap:8, padding:"12px 2px", background:"transparent", border:"none", cursor:"pointer", color:T.textPrimary }}>
                <span style={{ display:"flex", alignItems:"center", gap:8, fontSize:13, fontWeight:700, textAlign:"left", minWidth:0 }}>
                  <span style={{ color:T.textMuted, fontSize:11, width:12, display:"inline-block", transform:isOpen?"rotate(90deg)":"none", transition:"transform .12s" }}>▶</span>
                  {sec.title}
                </span>
                {flagged > 0 && <span style={{ fontSize:11, fontWeight:700, color:T.red, background:T.redBg, border:`1px solid ${T.redBorder}`, borderRadius:20, padding:"1px 9px", whiteSpace:"nowrap", flexShrink:0 }}>{flagged} flagged</span>}
              </button>
              {isOpen && (
                <div style={{ paddingBottom:10 }}>
                  {sec.items.map(([id, label]) => {
                    const on = checked.has(id);
                    return (
                      <label key={id}
                        style={{ display:"flex", alignItems:"center", gap:10, padding:"7px 10px", marginBottom:4, borderRadius:T.r8, cursor:"pointer",
                          background:on ? T.redBg : T.pageBg, border:`1px solid ${on ? T.redBorder : T.border}` }}>
                        <input type="checkbox" checked={on} onChange={() => toggleItem(id)}
                          style={{ width:16, height:16, flexShrink:0, accentColor:T.red, cursor:"pointer" }}/>
                        <span style={{ fontSize:13, color:on ? T.textPrimary : T.textSecond, fontWeight:on?600:400 }}>{label}</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Notes */}
      <div style={{ marginTop:16 }}>
        <Lbl>Recommendations / Notes</Lbl>
        <textarea value={form.notes} onChange={e=>sf("notes",e.target.value)} rows={3}
          placeholder="e.g. Need wheel alignment"
          style={{ width:"100%", background:T.pageBg, border:`1.5px solid ${T.border}`, borderRadius:T.r8, padding:"9px 12px", color:T.textPrimary, fontSize:13, fontFamily:T.font, outline:"none", boxSizing:"border-box", resize:"vertical" }}/>
      </div>

      <div style={{ fontSize:11, color:T.textMuted, marginTop:10, lineHeight:1.5 }}>
        {totalFlagged} item{totalFlagged===1?"":"s"} flagged.
        {insp.updatedAt && <> · Last saved {new Date(insp.updatedAt).toLocaleString()}</>}
        {insp.emailedAt && <> · Emailed {new Date(insp.emailedAt).toLocaleDateString()}</>}
      </div>

      {/* Optional email to customer */}
      <div style={{ marginTop:16, paddingTop:14, borderTop:`1px solid ${T.border}` }}>
        <Lbl>Email report to customer (optional)</Lbl>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
          <div style={{ flex:"1 1 220px", minWidth:0 }}><Inp type="email" value={emailTo} onChange={e=>setEmailTo(e.target.value)} placeholder="customer@email.com"/></div>
          <Btn variant="ghost" onClick={handleEmail} disabled={busy || !emailTo.trim()}>Save &amp; Email</Btn>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginTop:18, paddingTop:14, borderTop:`1px solid ${T.border}` }}>
        <Btn onClick={handleSave} disabled={busy}>{busy?"Saving…":"Save Inspection"}</Btn>
        <Btn variant="ghost" onClick={onClose} disabled={busy}>Cancel</Btn>
      </div>
    </Modal>
  );
}
