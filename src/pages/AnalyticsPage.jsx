// pages/AnalyticsPage.jsx — no emoji, SVG icons
import { useState, useEffect } from "react";
import { fetchAnalyticsSummary, fetchAnalyticsByDay, fetchAnalyticsByService, fetchAnalyticsByPayment } from "../api.js";
import { getT, money } from "../theme.js";
import { PageHeader, Spinner, StatCard } from "../components.jsx";

const Ic = ({ size=16, color="currentColor", ch }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8}
    strokeLinecap="round" strokeLinejoin="round" style={{ display:"block", flexShrink:0 }}>{ch}</svg>
);
const TrendIcon  = ({ size, color }) => <Ic size={size} color={color} ch={<><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></>}/>;
const UsersIcon  = ({ size, color }) => <Ic size={size} color={color} ch={<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></>}/>;
const DollarIcon = ({ size, color }) => <Ic size={size} color={color} ch={<><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></>}/>;
const NoIcon     = ({ size, color }) => <Ic size={size} color={color} ch={<><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></>}/>;
const FlagIcon2  = ({ size, color }) => <Ic size={size} color={color} ch={<><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></>}/>;

function HBar({ label, value, max, color, suffix="" }) {
  const T = getT();
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
      {/* Label shrinks on phones (max 40% of the row) so the bar and its value keep room */}
      <div title={label} style={{ flex:"0 1 130px", maxWidth:"40%", minWidth:0, fontSize:11, color:T.textSecond, textOverflow:"ellipsis", overflow:"hidden", whiteSpace:"nowrap", textAlign:"right" }}>{label}</div>
      <div style={{ flex:1, minWidth:60, height:24, background:T.elevated, borderRadius:T.r6, overflow:"hidden", position:"relative" }}>
        <div style={{ height:"100%", width:`${pct}%`, background:color, opacity:0.75, borderRadius:T.r6, minWidth:pct>0?4:0, transition:"width .4s ease" }}/>
        {value > 0 && (
          <span style={{ position:"absolute", right:8, top:"50%", transform:"translateY(-50%)", fontSize:11, fontWeight:600, color:T.textPrimary }}>
            {typeof value === "number" && suffix === "$" ? money(value, 0) : `${value}${suffix}`}
          </span>
        )}
      </div>
    </div>
  );
}

// Local calendar dates (not UTC): after 8 PM Toronto time the UTC date is already tomorrow.
const ymd = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const parseYmd = s => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

// Turn the API's days-with-bookings into one bar per day (up to 31 days), per week
// (up to ~4 months) or per month, covering the whole selected period, zeros included.
function buildBuckets(days, from, to) {
  const byDate = {};
  for (const d of days || []) if (d?.date) byDate[d.date] = d;
  const start = parseYmd(from), end = parseYmd(to);
  const span = Math.round((end - start) / 86400000) + 1;
  const unit = span <= 31 ? "day" : span <= 120 ? "week" : "month";
  const buckets = [];
  let cur = null;
  for (const d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const key = ymd(d);
    const bucketKey = unit === "day" ? key : unit === "month" ? key.slice(0, 7)
      : `w${Math.floor(Math.round((d - start) / 86400000) / 7)}`;
    if (!cur || cur.key !== bucketKey) {
      cur = { key: bucketKey, from: key, to: key, bookings: 0, revenue: 0 };
      buckets.push(cur);
    }
    cur.to = key;
    const row = byDate[key];
    if (row) { cur.bookings += row.bookings || 0; cur.revenue += row.revenue || 0; }
  }
  for (const b of buckets) {
    const f = parseYmd(b.from);
    b.label = unit === "month" ? `${MONTHS[f.getMonth()]}${f.getMonth() === 0 || b === buckets[0] ? ` '${String(f.getFullYear()).slice(2)}` : ""}`
      : `${MONTHS[f.getMonth()]} ${f.getDate()}`;
    b.range = b.from === b.to ? b.from : `${b.from} – ${b.to}`;
    b.revenue = Math.round(b.revenue * 100) / 100;
  }
  return { unit, buckets };
}

function RevenueChart({ days, from, to }) {
  const T = getT();
  if (!days?.length || !from || !to) return <div style={{ fontSize:12, color:T.textMuted, padding:"20px 0", textAlign:"center" }}>No revenue data for this period</div>;
  const { buckets } = buildBuckets(days, from, to);
  const maxRev = Math.max(...buckets.map(d => d.revenue || 0), 1);
  // Label every Nth bar so labels never overlap (about 6 at most); a label needs
  // N bars of room to its right, so the last one never runs off the edge
  const every  = Math.max(1, Math.ceil(buckets.length / 6));
  return (
    <div style={{ overflowX:"auto", paddingBottom:4 }}>
      <div style={{ minWidth: Math.max(200, buckets.length * 8) }}>
        <div style={{ display:"flex", alignItems:"flex-end", gap:buckets.length > 20 ? 2 : 3, height:100, borderBottom:`1px solid ${T.border}` }}>
          {buckets.map(d => {
            const h    = Math.max(2, Math.round((d.revenue || 0) / maxRev * 96));
            const isOk = (d.revenue || 0) > 0;
            return (
              <div key={d.key} style={{ flex:1, minWidth:0, display:"flex", alignItems:"flex-end", height:"100%" }}
                title={`${d.range}: ${d.bookings} booking${d.bookings!==1?"s":""} · ${money(d.revenue||0, 2)}`}>
                <div style={{ width:"100%", height:h, background:isOk ? T.blue : T.border, borderRadius:`${T.r6} ${T.r6} 0 0`, opacity:0.7 }}/>
              </div>
            );
          })}
        </div>
        {/* Labels sit in their own row below the bars */}
        <div style={{ display:"flex", gap:buckets.length > 20 ? 2 : 3, marginTop:6, height:14 }}>
          {buckets.map((d, i) => (
            <div key={d.key} style={{ flex:1, minWidth:0, position:"relative" }}>
              {i % every === 0 && buckets.length - i >= Math.min(every, buckets.length) && (
                <div style={{ position:"absolute", left:0, top:0, fontSize:10, color:T.textMuted, whiteSpace:"nowrap" }}>{d.label}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AnalyticsPage({ onAlert }) {
  const T = getT();
  const [period,   setPeriod]   = useState("30");
  const [summary,  setSummary]  = useState(null);
  const [days,     setDays]     = useState([]);
  const [services, setServices] = useState([]);
  const [payment,  setPayment]  = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [range,    setRange]    = useState(null);

  useEffect(() => {
    // Local dates, so "Today" stays today after 8 PM (UTC is already tomorrow)
    const today = ymd();
    const from  = period === "0" ? today : (() => {
      const d = new Date(); d.setDate(d.getDate() - parseInt(period)); return ymd(d);
    })();
    const params = { from, to: today };
    let stale = false;
    setLoading(true);
    Promise.all([
      fetchAnalyticsSummary(params),
      fetchAnalyticsByDay(params),
      fetchAnalyticsByService(params),
      fetchAnalyticsByPayment(params),
    ]).then(([s, d, sv, p]) => {
      if (stale) return;
      setSummary(s); setDays(d || []); setServices(sv || []); setPayment(p); setRange(params);
    }).catch(e => { if (!stale) onAlert?.(e.message, "error"); })
      .finally(() => { if (!stale) setLoading(false); });
    return () => { stale = true; };
  }, [period]);

  const chartUnit = range ? buildBuckets([], range.from, range.to).unit : "day";

  const PERIOD_OPTIONS = [
    { value:"0",   label:"Today" },
    { value:"7",   label:"Last 7 days" },
    { value:"30",  label:"Last 30 days" },
    { value:"90",  label:"Last 90 days" },
    { value:"365", label:"Last year" },
  ];

  return (
    <div>
      <PageHeader
        title="Analytics"
        sub="Booking performance and revenue insights"
        actions={
          <select value={period} onChange={e => setPeriod(e.target.value)}
            style={{ background:T.cardBg, border:`1px solid ${T.border}`, borderRadius:T.r8, padding:"7px 12px", color:T.textPrimary, fontSize:12, fontFamily:T.font, outline:"none", cursor:"pointer" }}>
            {PERIOD_OPTIONS.map(o => <option key={o.value} value={o.value} style={{ background:T.cardBg }}>{o.label}</option>)}
          </select>
        }
      />

      {loading ? <Spinner/> : (
        <>
          {/* Summary stats */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))", gap:10, marginBottom:24 }}>
            <StatCard label="Total bookings" value={summary?.totals?.all || 0}         accent={T.blue}   icon={<UsersIcon  size={14} color={T.blue}/>}/>
            <StatCard label="Confirmed"      value={summary?.totals?.confirmed || 0}   accent={T.green}  icon={<FlagIcon2  size={14} color={T.green}/>}/>
            <StatCard label="Completed"      value={summary?.totals?.completed || 0}   accent={T.teal}   icon={<TrendIcon  size={14} color={T.teal}/>}/>
            <StatCard label="No-shows"       value={summary?.totals?.no_show || 0}     accent={T.red}    icon={<NoIcon     size={14} color={T.red}/>}/>
            <StatCard label="Revenue"        value={money(summary?.revenue?.total||0, 0)}        accent={T.amber}  icon={<DollarIcon size={14} color={T.amber}/>}/>
            <StatCard label="Avg ticket"     value={money(summary?.revenue?.avgTicket||0, 0)}    accent={T.purple} icon={<DollarIcon size={14} color={T.purple}/>}/>
          </div>

          {/* Revenue chart */}
          <div style={{ background:T.cardBg, border:`1px solid ${T.border}`, borderRadius:T.r12, padding:"18px 20px", marginBottom:14 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:"4px 12px", marginBottom:14 }}>
              <div style={{ fontSize:13, fontWeight:600, color:T.textPrimary }}>{chartUnit === "month" ? "Monthly" : chartUnit === "week" ? "Weekly" : "Daily"} revenue</div>
              <div style={{ fontSize:11, color:T.textMuted, textAlign:"right" }}>
                {money(summary?.revenue?.total||0, 2)} total · {summary?.revenue?.paidCount||0} paid
              </div>
            </div>
            <RevenueChart days={days} from={range?.from} to={range?.to}/>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(min(100%,300px),1fr))", gap:14, marginBottom:14 }}>
            {/* Bookings by service */}
            <div style={{ background:T.cardBg, border:`1px solid ${T.border}`, borderRadius:T.r12, padding:"18px 20px" }}>
              <div style={{ fontSize:13, fontWeight:600, color:T.textPrimary, marginBottom:14 }}>Bookings by service</div>
              {services.length === 0 ? (
                <div style={{ fontSize:12, color:T.textMuted }}>No data for this period</div>
              ) : (() => {
                const max = Math.max(...services.map(s => s.count||0), 1);
                return services.map(s => <HBar key={s.service} label={s.service} value={s.count||0} max={max} color={T.blue}/>);
              })()}
            </div>

            {/* Revenue by service */}
            <div style={{ background:T.cardBg, border:`1px solid ${T.border}`, borderRadius:T.r12, padding:"18px 20px" }}>
              <div style={{ fontSize:13, fontWeight:600, color:T.textPrimary, marginBottom:14 }}>Revenue by service</div>
              {services.length === 0 ? (
                <div style={{ fontSize:12, color:T.textMuted }}>No data for this period</div>
              ) : (() => {
                const max = Math.max(...services.map(s => s.revenue||0), 1);
                return services.filter(s => (s.revenue||0) > 0).map(s => <HBar key={s.service} label={s.service} value={s.revenue||0} max={max} color={T.green} suffix="$"/>);
              })()}
            </div>
          </div>

          {/* Payment breakdown */}
          {payment && (
            <div style={{ background:T.cardBg, border:`1px solid ${T.border}`, borderRadius:T.r12, padding:"18px 20px" }}>
              <div style={{ fontSize:13, fontWeight:600, color:T.textPrimary, marginBottom:14 }}>Payment methods</div>
              {!payment.byMethod?.length ? (
                <div style={{ fontSize:12, color:T.textMuted }}>No payments recorded in this period</div>
              ) : (
                <>
                  {(() => {
                    const max = Math.max(...(payment.byMethod||[]).map(m => m.total||0), 1);
                    return (payment.byMethod||[]).map(m => (
                      <HBar key={m.method} label={m.method||"unknown"} value={m.total||0} max={max} color={T.teal} suffix="$"/>
                    ));
                  })()}
                </>
              )}
              {/* Shown whether or not any payments were recorded in the period */}
              {payment.unpaidCompleted > 0 && (
                <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:12, padding:"9px 12px", background:T.amberBg, border:`1px solid ${T.amberBorder}`, borderRadius:T.r8, fontSize:12, color:T.amberText }}>
                  <NoIcon size={13} color={T.amber}/>
                  {payment.unpaidCompleted} completed booking{payment.unpaidCompleted!==1?"s":""} with no payment recorded
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
