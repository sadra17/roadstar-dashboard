// pages/AnalyticsPage.jsx — Shopify-style analytics: any date range (presets, custom,
// or all time since the first booking), compared with the previous period.
import { useState, useEffect, useRef } from "react";
import { fetchAnalyticsOverview } from "../api.js";
import { getT, getTheme, money, localYmd } from "../theme.js";
import { PageHeader, Spinner } from "../components.jsx";

// ── Date helpers (local calendar dates, "YYYY-MM-DD") ─────────────────────────
const parse = s => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
const addDays = (s, n) => { const d = parse(s); d.setDate(d.getDate() + n); return localYmd(d); };
const isYmd = s => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(parse(s));
const fmt = (s, withYear = true) => !isYmd(s) ? "—" : parse(s).toLocaleDateString("en-CA", { month: "short", day: "numeric", ...(withYear ? { year: "numeric" } : {}) });
const fmtRange = (from, to) => from === to ? fmt(from) : `${fmt(from, !isYmd(from) || !isYmd(to) || parse(from).getFullYear() !== parse(to).getFullYear())} – ${fmt(to)}`;
const endOfMonth = s => { const d = parse(s); return localYmd(new Date(d.getFullYear(), d.getMonth() + 1, 0)); };
// Same day n months away, clamped to that month's length (Mar 31 − 1 month → Feb 28)
const shiftMonths = (s, n) => { const d = parse(s); const last = new Date(d.getFullYear(), d.getMonth() + n + 1, 0); return localYmd(new Date(last.getFullYear(), last.getMonth(), Math.min(d.getDate(), last.getDate()))); };
const daysBetween = (a, b) => Math.round((parse(b) - parse(a)) / 86400000);

// Period to compare with, Shopify-style: whole months/years compare with the same
// calendar span before (Sep → Aug 1–31, 2025 → 2024); month/quarter/year-to-date
// compare with the same days of the previous period; anything else with the
// equal-length period immediately before.
function previousRange(from, to, preset) {
  const step = { month: 1, quarter: 3, ytd: 12 }[preset];
  if (step) return { from: shiftMonths(from, -step), to: shiftMonths(to, -step) };
  if (from.endsWith("-01") && to === endOfMonth(to)) {
    const f = parse(from), t = parse(to);
    const months = (t.getFullYear() - f.getFullYear()) * 12 + t.getMonth() - f.getMonth() + 1;
    const pFrom = shiftMonths(from, -months);
    return { from: pFrom, to: addDays(from, -1) };
  }
  const days = daysBetween(from, to) + 1;
  return { from: addDays(from, -days), to: addDays(from, -1) };
}

function presets(today) {
  const t = parse(today), y = t.getFullYear(), m = t.getMonth();
  const q = Math.floor(m / 3) * 3;
  return [
    { id: "today",     label: "Today",          from: today, to: today },
    { id: "yesterday", label: "Yesterday",      from: addDays(today, -1), to: addDays(today, -1) },
    { id: "7",         label: "Last 7 days",    from: addDays(today, -6), to: today },
    { id: "30",        label: "Last 30 days",   from: addDays(today, -29), to: today },
    { id: "90",        label: "Last 90 days",   from: addDays(today, -89), to: today },
    { id: "365",       label: "Last 365 days",  from: addDays(today, -364), to: today },
    { id: "month",     label: "This month",     from: localYmd(new Date(y, m, 1)), to: today },
    { id: "lastmonth", label: "Last month",     from: localYmd(new Date(y, m - 1, 1)), to: localYmd(new Date(y, m, 0)) },
    { id: "quarter",   label: "This quarter",   from: localYmd(new Date(y, q, 1)), to: today },
    { id: "ytd",       label: "Year to date",   from: `${y}-01-01`, to: today },
    { id: "lastyear",  label: "Last year",      from: `${y - 1}-01-01`, to: `${y - 1}-12-31` },
    { id: "all",       label: "All time (since we opened)", from: "all", to: today },
  ];
}

// ── Date range picker ─────────────────────────────────────────────────────────
function DateRangePicker({ value, onChange, firstDate }) {
  const T = getT();
  const today = localYmd();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  const ref = useRef(null);
  const btnRef = useRef(null);
  const [pos, setPos] = useState(null);
  useEffect(() => { if (open) setDraft(value); }, [open]);
  useEffect(() => {
    if (!open) return;
    const close = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);
  // Place the panel against the viewport (not the button) so it never spills off
  // either edge on phones: right-aligned to the button where it fits, otherwise
  // clamped to a 16px gutter, and scrollable when the screen is short (landscape).
  useEffect(() => {
    if (!open) return;
    const place = () => {
      const r = btnRef.current?.getBoundingClientRect(); if (!r) return;
      const vw = document.documentElement.clientWidth, vh = window.innerHeight;
      // Short screens (phone in landscape): a wider panel with the presets in two
      // columns, so the whole picker — Apply included — fits without scrolling
      const short = vh < 520 && vw >= 560;
      // Stay inside the page area (not over the sidebar on tablets)
      const minL = Math.max(0, btnRef.current.closest(".rs-page-content")?.getBoundingClientRect().left || 0) + 16;
      const width = Math.min(short ? 640 : 520, vw - 16 - minL);
      const left = Math.max(minL, Math.min(r.right - width, vw - 16 - width));
      // Too little room below the button (phone in landscape) → use the whole screen height
      const top = vh - r.bottom - 18 >= 260 ? r.bottom + 6 : 12;
      setPos({ left, top, width, short, maxHeight: vh - top - 12 });
    };
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => { window.removeEventListener("resize", place); window.removeEventListener("scroll", place, true); };
  }, [open]);

  const list = presets(today);
  const label = value.preset ? list.find(p => p.id === value.preset)?.label : "Custom";
  const shownFrom = value.from === "all" ? (firstDate || today) : value.from;
  const draftFrom = draft.from === "all" ? (firstDate || today) : draft.from;
  const input = { background:T.pageBg, border:`1.5px solid ${T.border}`, borderRadius:T.r8, padding:"8px 10px", color:T.textPrimary, fontSize:13, fontFamily:T.font, outline:"none", colorScheme:getTheme() === "light" ? "light" : "dark", width:"100%", boxSizing:"border-box" };

  return (
    <div ref={ref} style={{ position:"relative" }}>
      <button ref={btnRef} onClick={() => setOpen(o => !o)}
        style={{ display:"flex", alignItems:"center", gap:8, background:T.cardBg, border:`1px solid ${open ? T.blue : T.border}`, borderRadius:T.r8, padding:"8px 12px", color:T.textPrimary, fontSize:13, fontWeight:600, fontFamily:T.font, cursor:"pointer", whiteSpace:"nowrap" }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
        <span>{label}</span>
        <span style={{ color:T.textMuted, fontWeight:500 }} className="rs-hide-xs">· {fmtRange(shownFrom, value.to)}</span>
      </button>
      {open && pos && (
        <div style={{ position:"fixed", left:pos.left, top:pos.top, width:pos.width, maxHeight:pos.maxHeight, zIndex:150 /* above the sticky top bar (100) */, background:T.cardBg, border:`1px solid ${T.borderVis}`, borderRadius:T.r12, boxShadow:"0 16px 40px rgba(0,0,0,.45)", display:"flex", flexWrap:"wrap", overflowX:"hidden", overflowY:"auto", overscrollBehavior:"contain", boxSizing:"border-box" }}>
          {/* Presets: one column beside the custom range on wide panels, two columns on phones; never cut short */}
          <div style={{ flex:"1 1 180px", display:"grid", gridTemplateColumns: pos.short ? "1fr 1fr" : "repeat(auto-fill, minmax(124px, 1fr))", alignContent:"start", gap:2, padding:6,
            // Side by side → divider on the right; stacked (narrow panel) → divider underneath
            ...(pos.width >= 434 ? { borderRight:`1px solid ${T.border}` } : { borderBottom:`1px solid ${T.border}` }) }}>
            {list.map(p => {
              const active = draft.preset === p.id;
              return (
                <button key={p.id} onClick={() => setDraft({ preset: p.id, from: p.from, to: p.to })}
                  style={{ display:"block", width:"100%", minHeight:36, textAlign:"left", padding:"8px 10px", borderRadius:T.r8, border:"none", background: active ? T.blueSubtle : "transparent", color: active ? T.blueBright : T.textSecond, fontSize:13, fontWeight: active ? 700 : 500, fontFamily:T.font, cursor:"pointer" }}>
                  {p.label}
                </button>
              );
            })}
          </div>
          <div style={{ flex:"1 1 240px", padding:14, display:"flex", flexDirection:"column", gap:10 }}>
            <div style={{ fontSize:11, fontWeight:700, letterSpacing:"0.06em", textTransform:"uppercase", color:T.textMuted }}>Custom range</div>
            <label style={{ fontSize:11, color:T.textMuted }}>Start date
              <input type="date" value={draftFrom} max={draft.to} min={firstDate || undefined}
                onChange={e => e.target.value && setDraft(d => ({ preset: null, from: e.target.value, to: d.to < e.target.value ? e.target.value : d.to }))} style={{ ...input, marginTop:4 }}/>
            </label>
            <label style={{ fontSize:11, color:T.textMuted }}>End date
              <input type="date" value={draft.to} min={draftFrom}
                onChange={e => e.target.value && setDraft(d => ({ preset: null, from: draftFrom > e.target.value ? e.target.value : draftFrom, to: e.target.value }))} style={{ ...input, marginTop:4 }}/>
            </label>
            <div style={{ fontSize:12, color:T.textSecond, padding:"6px 0" }}>{fmtRange(draftFrom, draft.to)}</div>
            {/* Cancel/Apply stay pinned to the panel's bottom edge when the panel has to scroll (short phones) */}
            <div style={{ display:"flex", gap:8, position:"sticky", bottom:0, margin:"auto -14px -14px", padding:14, paddingTop:10, background:T.cardBg, borderBottomLeftRadius:T.r12, borderBottomRightRadius:T.r12 }}>
              <button onClick={() => setOpen(false)} style={{ flex:1, padding:"9px", borderRadius:T.r8, border:`1px solid ${T.border}`, background:"transparent", color:T.textSecond, fontSize:13, fontFamily:T.font, cursor:"pointer" }}>Cancel</button>
              <button onClick={() => { onChange(draft); setOpen(false); }} style={{ flex:1, padding:"9px", borderRadius:T.r8, border:"none", background:T.blue, color:"#fff", fontSize:13, fontWeight:700, fontFamily:T.font, cursor:"pointer" }}>Apply</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── KPI card with change vs previous period ──────────────────────────────────
function Kpi({ label, value, cur, prev, format = v => v, lowerIsBetter = false, sub }) {
  const T = getT();
  let delta = null;
  if (prev != null) {
    if (prev === 0 && cur === 0) delta = { text: "—", color: T.textMuted };
    else if (prev === 0) delta = { text: "New", color: T.textMuted };
    else {
      const pct = ((cur - prev) / Math.abs(prev)) * 100;
      const good = lowerIsBetter ? pct < 0 : pct > 0;
      delta = { text: `${pct > 0 ? "↑" : pct < 0 ? "↓" : ""}${Math.abs(pct).toFixed(pct !== 0 && Math.abs(pct) < 10 ? 1 : 0)}%`, color: pct === 0 ? T.textMuted : good ? T.green : T.red };
    }
  }
  return (
    <div style={{ background:T.cardBg, border:`1px solid ${T.border}`, borderRadius:T.r12, padding:"14px 16px", minWidth:0 }}>
      <div style={{ fontSize:11, fontWeight:600, color:T.textMuted, marginBottom:6, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{label}</div>
      <div style={{ display:"flex", alignItems:"baseline", gap:8, flexWrap:"wrap" }}>
        <span style={{ fontSize:22, fontWeight:800, color:T.textPrimary, letterSpacing:"-0.02em", fontVariantNumeric:"tabular-nums" }}>{value}</span>
        {delta && <span style={{ fontSize:12, fontWeight:700, color:delta.color }} title={prev != null ? `Previous period: ${format(prev)}` : ""}>{delta.text}</span>}
      </div>
      {sub && <div style={{ fontSize:11, color:T.textMuted, marginTop:4 }}>{sub}</div>}
    </div>
  );
}

// ── Revenue over time (current vs previous period) ───────────────────────────
function RevenueChart({ series, prevSeries, unit }) {
  const T = getT();
  const [hover, setHover] = useState(null);
  // Draw at the card's real pixel width so axis text stays 10px on every screen
  // (a fixed 700-wide viewBox shrank labels to ~4px on phones and blew them up on desktop)
  const boxRef = useRef(null);
  const [W, setW] = useState(700);
  useEffect(() => {
    const el = boxRef.current; if (!el) return;
    const measure = () => { const w = Math.round(el.clientWidth); if (w > 0) setW(w); };
    measure();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(measure) : null;
    ro ? ro.observe(el) : window.addEventListener("resize", measure);
    return () => { ro ? ro.disconnect() : window.removeEventListener("resize", measure); };
  }, [series?.length]);
  const pts = series || [];
  if (!pts.length) return <div style={{ fontSize:12, color:T.textMuted, padding:"30px 0", textAlign:"center" }}>No data for this period</div>;
  const H = Math.round(Math.min(240, Math.max(160, W * 0.32)));
  const prev = prevSeries || [];
  const dataMax = Math.max(0, ...pts.map(p => p.revenue), ...prev.map(p => p.revenue));
  // Round the top of the scale up to an even step so the middle gridline is a whole
  // dollar amount too (max $1 → $2 / $1 / $0, not $1 / $1 / $0)
  const nice = (() => { const m = Math.max(1, dataMax); const e = Math.pow(10, Math.floor(Math.log10(m))); let n = Math.ceil(m / e) * e; if (n % 2 && n < 10) n += e; return n; })();
  const ticks = dataMax > 0 ? [0, 0.5, 1] : [0]; // no revenue → just the $0 baseline
  const tickText = f => money(nice * f, Number.isInteger(nice * f) ? 0 : 2);
  // Left gutter wide enough for the longest $ label ("$100,000") so it never runs past the card edge
  const P = { l: 10 + Math.max(...ticks.map(f => tickText(f).length)) * 6, r: 12, t: 10, b: 26 };
  const x = i => P.l + (pts.length === 1 ? (W - P.l - P.r) / 2 : i * (W - P.l - P.r) / (pts.length - 1));
  const y = v => P.t + (H - P.t - P.b) * (1 - v / nice);
  const line = arr => arr.slice(0, pts.length).map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.revenue).toFixed(1)}`).join(" ");
  const area = `${line(pts)} L${x(pts.length - 1)},${y(0)} L${x(0)},${y(0)} Z`;
  const label = d => unit === "month" ? parse(d).toLocaleDateString("en-CA", { month: "short", year: "2-digit" }) : fmt(d, false);
  const every = Math.max(1, Math.ceil(pts.length / Math.max(2, Math.min(7, Math.floor((W - P.l) / 70)))));
  const h = hover != null ? pts[hover] : null;
  return (
    <div ref={boxRef} style={{ position:"relative" }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width:"100%", height:"auto", display:"block", overflow:"hidden" }}
        onMouseLeave={() => setHover(null)}
        onMouseMove={e => { const r = e.currentTarget.getBoundingClientRect(); const px = (e.clientX - r.left) / r.width * W; setHover(Math.max(0, Math.min(pts.length - 1, Math.round((px - P.l) / ((W - P.l - P.r) / Math.max(1, pts.length - 1)))))); }}
        onTouchStart={e => { const r = e.currentTarget.getBoundingClientRect(); const px = (e.touches[0].clientX - r.left) / r.width * W; setHover(Math.max(0, Math.min(pts.length - 1, Math.round((px - P.l) / ((W - P.l - P.r) / Math.max(1, pts.length - 1)))))); }}>
        {ticks.map(f => (
          <g key={f}>
            <line x1={P.l} x2={W - P.r} y1={y(nice * f)} y2={y(nice * f)} stroke={T.border} strokeDasharray={f ? "3 4" : ""}/>
            <text x={P.l - 6} y={y(nice * f) + 4} textAnchor="end" fontSize="10" fill={T.textMuted}>{tickText(f)}</text>
          </g>
        ))}
        {prev.length > 0 && <path d={line(prev)} fill="none" stroke={T.textMuted} strokeWidth="1.5" strokeDasharray="4 4" opacity="0.7"/>}
        <path d={area} fill={T.blue} opacity="0.12"/>
        <path d={line(pts)} fill="none" stroke={T.blue} strokeWidth="2.2"/>
        {pts.map((p, i) => i % every === 0 && <text key={i} x={x(i)} y={H - 6} textAnchor={x(i) > W - P.r - 24 ? "end" : "middle"} fontSize="10" fill={T.textMuted}>{label(p.date)}</text>)}
        {h && <>
          <line x1={x(hover)} x2={x(hover)} y1={P.t} y2={y(0)} stroke={T.textMuted} strokeWidth="1"/>
          <circle cx={x(hover)} cy={y(h.revenue)} r="4" fill={T.blue}/>
        </>}
      </svg>
      {h && (
        // left = translate = the point's % across the chart keeps the box inside the card at both ends
        <div style={{ position:"absolute", top:0, left:`${x(hover) / W * 100}%`, transform:`translateX(-${x(hover) / W * 100}%)`, background:T.elevated, border:`1px solid ${T.borderVis}`, borderRadius:T.r8, padding:"7px 10px", fontSize:11, color:T.textSecond, pointerEvents:"none", whiteSpace:"nowrap", boxShadow:"0 6px 18px rgba(0,0,0,.35)" }}>
          <div style={{ fontWeight:700, color:T.textPrimary }}>{unit === "week" ? `Week of ${fmt(h.date)}` : unit === "month" ? label(h.date) : fmt(h.date)}</div>
          <div>{money(h.revenue, 2)} · {h.bookings} booking{h.bookings !== 1 ? "s" : ""}</div>
          {prev[hover] && <div style={{ color:T.textMuted }}>Previous: {money(prev[hover].revenue, 2)}</div>}
        </div>
      )}
    </div>
  );
}

function Card({ title, right, children }) {
  const T = getT();
  return (
    <div style={{ background:T.cardBg, border:`1px solid ${T.border}`, borderRadius:T.r12, padding:"16px 18px", minWidth:0 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", gap:8, marginBottom:12, flexWrap:"wrap" }}>
        <div style={{ fontSize:13, fontWeight:700, color:T.textPrimary }}>{title}</div>
        {right && <div style={{ fontSize:11, color:T.textMuted }}>{right}</div>}
      </div>
      {children}
    </div>
  );
}

function Bar({ label, value, max, color, right }) {
  const T = getT();
  const pct = max > 0 ? Math.max(value > 0 ? 2 : 0, Math.round(value / max * 100)) : 0;
  return (
    <div style={{ marginBottom:10 }}>
      <div style={{ display:"flex", justifyContent:"space-between", gap:8, fontSize:12, marginBottom:4 }}>
        <span style={{ color:T.textSecond, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{label}</span>
        <span style={{ color:T.textPrimary, fontWeight:600, whiteSpace:"nowrap", fontVariantNumeric:"tabular-nums" }}>{right}</span>
      </div>
      <div style={{ height:6, background:T.elevated, borderRadius:3, overflow:"hidden" }}>
        <div style={{ height:"100%", width:`${pct}%`, background:color, borderRadius:3, transition:"width .4s" }}/>
      </div>
    </div>
  );
}

const loadRange = () => {
  try { const v = JSON.parse(localStorage.getItem("rs_analytics_range") || "null"); if (v?.from && v?.to) return v; } catch {}
  return null;
};

export default function AnalyticsPage({ onAlert }) {
  const T = getT();
  const today = localYmd();
  const [range, setRange] = useState(() => {
    const saved = loadRange();
    // Re-evaluate presets against today so "Last 30 days" stays current
    if (saved?.preset) { const p = presets(today).find(x => x.id === saved.preset); if (p) return { preset: p.id, from: p.from, to: p.to }; }
    return saved || { preset: "30", from: addDays(today, -29), to: today };
  });
  const [compare, setCompare] = useState(true);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reload, setReload] = useState(0);
  // Only ever trust a real YYYY-MM-DD first-booking date (never show "Invalid Date")
  const [firstDate, setFirstDate] = useState(null);

  // Loads the range and, when comparing, the previous period we pick here
  // (calendar-aligned for months/quarters/years — see previousRange) with its own
  // series, bucketed the same way, for the KPI deltas and the dashed line.
  useEffect(() => {
    try { localStorage.setItem("rs_analytics_range", JSON.stringify(range)); } catch {}
    let cancelled = false;
    setLoading(true); setError(null);
    // Nothing exists before "all time", so there's no previous period to compare with
    const loadPrev = pr => compare && range.from !== "all"
      ? fetchAnalyticsOverview({ from: pr.from, to: pr.to, compare: "0" }).then(d => ({ range: pr, current: d.current, points: d.series?.points || [] })).catch(() => null)
      : Promise.resolve(null);
    // "All time" only knows its start once the server answers; other ranges load both at once
    const known = isYmd(range.from) && isYmd(range.to) && range.from <= range.to;
    const cur = fetchAnalyticsOverview({ from: range.from, to: range.to, compare: "0" });
    const prev = known ? loadPrev(previousRange(range.from, range.to, range.preset)) : null;
    cur.then(async d => {
        if (!isYmd(d?.range?.from) || !isYmd(d?.range?.to)) throw new Error("Analytics returned an invalid date range");
        const pv = await (prev || loadPrev(previousRange(d.range.from, d.range.to, range.preset)));
        if (cancelled) return;
        if (isYmd(d.firstDate)) setFirstDate(d.firstDate);
        setData({ ...d, previousRange: pv?.range || null, previous: pv?.current || null, prevPoints: pv?.points || [] });
      })
      .catch(e => {
        if (cancelled) return;
        // Don't leave the old range's numbers on screen under the new range's label
        setData(null); setError(e.message || "Could not load analytics");
        onAlert?.(e.message, "error");
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [range.from, range.to, range.preset, compare, reload]);

  const c = data?.current, p = compare ? data?.previous : null;
  const prevSeries = compare ? data?.prevPoints || [] : [];
  const pct = v => `${(v || 0).toFixed(1)}%`;
  const rangeLabel = data ? fmtRange(data.range.from, data.range.to) : "";

  return (
    <div>
      <style>{`@media (max-width: 520px) { .rs-hide-xs { display: none; } }`}</style>
      <PageHeader title="Analytics" sub={data ? `${rangeLabel}${p && data.previousRange ? ` · compared with ${fmtRange(data.previousRange.from, data.previousRange.to)}` : ""}` : "Revenue and booking performance"}
        actions={<div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap", justifyContent:"flex-end" }}>
          <label style={{ display:"flex", alignItems:"center", gap:6, fontSize:12, color:T.textSecond, cursor:"pointer", whiteSpace:"nowrap" }}>
            <input type="checkbox" checked={compare} onChange={e => setCompare(e.target.checked)} style={{ accentColor:T.blue }}/> Compare
          </label>
          <DateRangePicker value={range} onChange={setRange} firstDate={firstDate}/>
        </div>}
      />

      {loading && !data ? <Spinner/> : error ? (
        <div style={{ padding:"40px 16px", textAlign:"center", background:T.cardBg, border:`1px solid ${T.border}`, borderRadius:T.r12 }}>
          <div style={{ fontSize:14, fontWeight:700, color:T.textPrimary, marginBottom:6 }}>Couldn't load analytics for this range</div>
          <div style={{ fontSize:12, color:T.textMuted, marginBottom:14 }}>{error}</div>
          <button onClick={() => setReload(n => n + 1)} style={{ padding:"9px 16px", minHeight:36, borderRadius:T.r8, border:"none", background:T.blue, color:"#fff", fontSize:13, fontWeight:700, fontFamily:T.font, cursor:"pointer" }}>Try again</button>
        </div>
      ) : !c ? null : (
        <div style={{ opacity: loading ? 0.55 : 1, transition:"opacity .15s" }}>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))", gap:10, marginBottom:14 }}>
            <Kpi label="Total revenue" value={money(c.revenue, 2)} cur={c.revenue} prev={p?.revenue} format={v => money(v, 2)} sub={`${c.paidCount} paid booking${c.paidCount !== 1 ? "s" : ""}`}/>
            <Kpi label="Bookings" value={c.bookings} cur={c.bookings} prev={p?.bookings} sub={`${c.online} online · ${c.walkin} walk-in`}/>
            <Kpi label="Average ticket" value={money(c.avgTicket, 2)} cur={c.avgTicket} prev={p?.avgTicket} format={v => money(v, 2)}/>
            <Kpi label="Completed" value={c.completed} cur={c.completed} prev={p?.completed}/>
            <Kpi label="Customers" value={c.customers} cur={c.customers} prev={p?.customers} sub={`${c.newCustomers} new · ${c.returningCustomers} returning`}/>
            <Kpi label="No-show rate" value={pct(c.noShowRate)} cur={c.noShowRate} prev={p?.noShowRate} format={pct} lowerIsBetter sub={`${c.noShows} no-show${c.noShows !== 1 ? "s" : ""}`}/>
            <Kpi label="Cancellation rate" value={pct(c.cancelRate)} cur={c.cancelRate} prev={p?.cancelRate} format={pct} lowerIsBetter sub={`${c.cancelled} cancelled`}/>
          </div>

          <div style={{ marginBottom:14 }}>
            <Card title="Revenue over time" right={<span>
              <span style={{ color:T.blue }}>━</span> {rangeLabel}{prevSeries.length > 0 && <> &nbsp;<span style={{ color:T.textMuted }}>╌</span> previous period</>}
              {data.series?.unit !== "day" && <> · by {data.series.unit}</>}
            </span>}>
              <RevenueChart series={data.series?.points} prevSeries={prevSeries} unit={data.series?.unit}/>
            </Card>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))", gap:14, marginBottom:14 }}>
            <Card title="Sales by service" right={`${data.services.length} service${data.services.length !== 1 ? "s" : ""}`}>
              {data.services.length === 0 ? <div style={{ fontSize:12, color:T.textMuted }}>No bookings in this period</div> : (() => {
                const max = Math.max(...data.services.map(s => s.revenue), 1);
                return data.services.map(s => <Bar key={s.service} label={`${s.service} · ${s.count} booking${s.count !== 1 ? "s" : ""}`} value={s.revenue} max={max} color={T.green} right={money(s.revenue, 2)}/>);
              })()}
            </Card>
            <Card title="Payment methods">
              {data.payments.length === 0 ? <div style={{ fontSize:12, color:T.textMuted }}>No payments recorded in this period</div> : (() => {
                const max = Math.max(...data.payments.map(m => m.total), 1);
                return data.payments.map(m => <Bar key={m.method} label={`${m.method[0].toUpperCase()}${m.method.slice(1)} · ${m.count}`} value={m.total} max={max} color={T.purple} right={money(m.total, 2)}/>);
              })()}
            </Card>
          </div>

          {c.unpaidCompleted > 0 && (
            <div style={{ padding:"10px 14px", background:T.amberBg, border:`1px solid ${T.amberBorder}`, borderRadius:T.r8, fontSize:12, color:T.amberText }}>
              {c.unpaidCompleted} completed booking{c.unpaidCompleted !== 1 ? "s" : ""} in this period {c.unpaidCompleted !== 1 ? "have" : "has"} no payment recorded, so {c.unpaidCompleted !== 1 ? "they aren't" : "it isn't"} counted in revenue.
            </div>
          )}
          {range.from === "all" && isYmd(data.firstDate) && (
            <div style={{ fontSize:11, color:T.textMuted, marginTop:10 }}>All time = since the first booking on {fmt(data.firstDate)}.</div>
          )}
        </div>
      )}
    </div>
  );
}
