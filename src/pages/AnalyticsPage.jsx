// pages/AnalyticsPage.jsx — no emoji, SVG icons
import { useState, useEffect } from "react";
import { fetchAnalyticsSummary, fetchAnalyticsByDay, fetchAnalyticsByService, fetchAnalyticsByPayment } from "../api.js";
import { getT } from "../theme.js";
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
      <div style={{ width:130, fontSize:11, color:T.textSecond, textOverflow:"ellipsis", overflow:"hidden", whiteSpace:"nowrap", flexShrink:0, textAlign:"right" }}>{label}</div>
      <div style={{ flex:1, height:24, background:T.elevated, borderRadius:T.r6, overflow:"hidden", position:"relative" }}>
        <div style={{ height:"100%", width:`${pct}%`, background:color, opacity:0.75, borderRadius:T.r6, minWidth:pct>0?4:0, transition:"width .4s ease" }}/>
        {value > 0 && (
          <span style={{ position:"absolute", right:8, top:"50%", transform:"translateY(-50%)", fontSize:11, fontWeight:600, color:T.textPrimary }}>
            {typeof value === "number" && suffix === "$" ? `$${value.toFixed(0)}` : `${value}${suffix}`}
          </span>
        )}
      </div>
    </div>
  );
}

function RevenueChart({ days }) {
  const T = getT();
  if (!days?.length) return <div style={{ fontSize:12, color:T.textMuted, padding:"20px 0", textAlign:"center" }}>No revenue data for this period</div>;
  const shown  = days.slice(-21);
  const maxRev = Math.max(...shown.map(d => d.revenue || 0), 1);
  return (
    <div style={{ overflowX:"auto", paddingBottom:4 }}>
      <div style={{ display:"flex", alignItems:"flex-end", gap:3, height:100, minWidth:Math.max(400, shown.length * 20) }}>
        {shown.map((d, i) => {
          const h    = Math.max(2, Math.round((d.revenue || 0) / maxRev * 88));
          const isOk = (d.revenue || 0) > 0;
          return (
            <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:0, position:"relative" }}
              title={`${d.date}: ${d.bookings} bookings · $${(d.revenue||0).toFixed(2)}`}>
              <div style={{ width:"100%", height:h, background:isOk ? T.blue : T.border, borderRadius:`${T.r4} ${T.r4} 0 0`, opacity:0.7 }}/>
              <div style={{ fontSize:8, color:T.textMuted, transform:"rotate(-45deg)", transformOrigin:"top left", marginTop:4, whiteSpace:"nowrap", paddingLeft:2 }}>
                {d.date.slice(5)}
              </div>
            </div>
          );
        })}
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

  useEffect(() => {
    const from = new Date();
    from.setDate(from.getDate() - parseInt(period));
    const params = { from: from.toISOString().slice(0,10), to: new Date().toISOString().slice(0,10) };
    setLoading(true);
    Promise.all([
      fetchAnalyticsSummary(params),
      fetchAnalyticsByDay(params),
      fetchAnalyticsByService(params),
      fetchAnalyticsByPayment(params),
    ]).then(([s, d, sv, p]) => {
      setSummary(s); setDays(d || []); setServices(sv || []); setPayment(p);
    }).catch(e => onAlert?.(e.message, "error")).finally(() => setLoading(false));
  }, [period]);

  const PERIOD_OPTIONS = [
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
            <StatCard label="Revenue"        value={`$${(summary?.revenue?.total||0).toFixed(0)}`}        accent={T.amber}  icon={<DollarIcon size={14} color={T.amber}/>}/>
            <StatCard label="Avg ticket"     value={`$${(summary?.revenue?.avgTicket||0).toFixed(0)}`}    accent={T.purple} icon={<DollarIcon size={14} color={T.purple}/>}/>
          </div>

          {/* Revenue chart */}
          <div style={{ background:T.cardBg, border:`1px solid ${T.border}`, borderRadius:T.r12, padding:"18px 20px", marginBottom:14 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
              <div style={{ fontSize:13, fontWeight:600, color:T.textPrimary }}>Daily revenue</div>
              <div style={{ fontSize:11, color:T.textMuted }}>
                ${(summary?.revenue?.total||0).toFixed(2)} total · {summary?.revenue?.paidCount||0} paid
              </div>
            </div>
            <RevenueChart days={days}/>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:14 }}>
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
                <div style={{ fontSize:12, color:T.textMuted }}>No payment data recorded yet</div>
              ) : (
                <>
                  {(() => {
                    const max = Math.max(...(payment.byMethod||[]).map(m => m.total||0), 1);
                    return (payment.byMethod||[]).map(m => (
                      <HBar key={m.method} label={m.method||"unknown"} value={m.total||0} max={max} color={T.teal} suffix="$"/>
                    ));
                  })()}
                  {payment.unpaidCompleted > 0 && (
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:12, padding:"9px 12px", background:T.amberBg, border:`1px solid ${T.amberBorder}`, borderRadius:T.r8, fontSize:12, color:T.amberText }}>
                      <NoIcon size={13} color={T.amber}/>
                      {payment.unpaidCompleted} completed booking{payment.unpaidCompleted!==1?"s":""} with no payment recorded
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
