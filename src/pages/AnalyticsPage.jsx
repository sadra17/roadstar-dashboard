// pages/AnalyticsPage.jsx
import { useState, useEffect } from "react";
import { fetchAnalyticsSummary, fetchAnalyticsByDay, fetchAnalyticsByService, fetchAnalyticsByPayment } from "../api.js";
import { getT } from "../theme.js";
import { PageHeader, Spinner, Card, StatCard } from "../components.jsx";

function SimpleBar({ data, valueKey, labelKey, color, maxVal }) {
  const T = getT(); const max = maxVal || Math.max(...data.map(d => d[valueKey] || 0), 1);
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
      {data.map((d, i) => {
        const pct = Math.round((d[valueKey] || 0) / max * 100);
        return (
          <div key={i} style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:90, fontSize:11, color:T.textMuted, textAlign:"right", flexShrink:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{d[labelKey]}</div>
            <div style={{ flex:1, height:22, background:T.elevated, borderRadius:T.r6, overflow:"hidden", position:"relative" }}>
              <div style={{ height:"100%", width:`${pct}%`, background:color, borderRadius:T.r6, minWidth:pct>0?3:0, opacity:0.8 }}/>
              {d[valueKey] > 0 && <div style={{ position:"absolute", right:8, top:"50%", transform:"translateY(-50%)", fontSize:10, fontWeight:600, color:T.textPrimary }}>{d[valueKey]}</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function RevenueChart({ days }) {
  const T = getT();
  if (!days?.length) return <div style={{ fontSize:13, color:T.textMuted, textAlign:"center", padding:"20px 0" }}>No data for this period</div>;
  const maxRev = Math.max(...days.map(d => d.revenue || 0), 1);
  const maxBk  = Math.max(...days.map(d => d.bookings || 0), 1);
  const last   = days.slice(-14);
  return (
    <div style={{ overflowX:"auto" }}>
      <div style={{ display:"flex", alignItems:"flex-end", gap:4, height:120, padding:"10px 0", minWidth:400 }}>
        {last.map((d, i) => {
          const h = Math.round((d.revenue || 0) / maxRev * 100);
          return (
            <div key={i} title={`${d.date}: ${d.bookings} bookings, $${(d.revenue||0).toFixed(2)}`}
              style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
              <div style={{ width:"100%", height:`${h}%`, background:T.blue, borderRadius:`${T.r4} ${T.r4} 0 0`, opacity:0.8, minHeight:d.revenue?2:0 }}/>
              <div style={{ fontSize:9, color:T.textMuted, whiteSpace:"nowrap", transform:"rotate(-45deg)", transformOrigin:"top center", marginTop:4 }}>
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
  const [period, setPeriod] = useState("30");
  const [summary, setSummary]   = useState(null);
  const [days,    setDays]      = useState([]);
  const [services,setServices]  = useState([]);
  const [payment, setPayment]   = useState(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    const from = new Date(); from.setDate(from.getDate() - parseInt(period));
    const params = { from: from.toISOString().slice(0,10), to: new Date().toISOString().slice(0,10) };
    setLoading(true);
    Promise.all([
      fetchAnalyticsSummary(params),
      fetchAnalyticsByDay(params),
      fetchAnalyticsByService(params),
      fetchAnalyticsByPayment(params),
    ]).then(([s, d, sv, p]) => {
      setSummary(s); setDays(d || []); setServices(sv || []); setPayment(p);
    }).catch(e => onAlert?.(e.message,"error"))
    .finally(() => setLoading(false));
  }, [period]);

  return (
    <div>
      <PageHeader title="Analytics" sub="Booking and revenue insights"
        actions={
          <select value={period} onChange={e => setPeriod(e.target.value)}
            style={{ background:T.cardBg, border:`1px solid ${T.border}`, borderRadius:T.r8, padding:"7px 12px", color:T.textPrimary, fontSize:12, fontFamily:T.font, outline:"none" }}>
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>
        }
      />

      {loading ? <Spinner/> : (
        <>
          {/* Summary cards */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))", gap:10, marginBottom:24 }}>
            <StatCard label="Total Bookings" value={summary?.totals?.all || 0}       accent={T.blue}  />
            <StatCard label="Confirmed"       value={summary?.totals?.confirmed || 0} accent={T.green} />
            <StatCard label="Completed"       value={summary?.totals?.completed || 0} accent={T.teal}  />
            <StatCard label="No-shows"        value={summary?.totals?.no_show || 0}   accent={T.red}   />
            <StatCard label="Revenue"         value={`$${(summary?.revenue?.total||0).toFixed(2)}`} accent={T.amber}/>
            <StatCard label="Avg Ticket"      value={`$${(summary?.revenue?.avgTicket||0).toFixed(2)}`} accent={T.purple}/>
          </div>

          {/* Revenue by day */}
          <div style={{ background:T.cardBg, border:`1px solid ${T.border}`, borderRadius:T.r12, padding:"16px 18px", marginBottom:16 }}>
            <div style={{ fontSize:13, fontWeight:700, color:T.textPrimary, marginBottom:12 }}>Revenue by day (last 14)</div>
            <RevenueChart days={days}/>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:16 }}>
            {/* Bookings by service */}
            <div style={{ background:T.cardBg, border:`1px solid ${T.border}`, borderRadius:T.r12, padding:"16px 18px" }}>
              <div style={{ fontSize:13, fontWeight:700, color:T.textPrimary, marginBottom:12 }}>Bookings by service</div>
              {services.length === 0
                ? <div style={{ fontSize:12, color:T.textMuted }}>No data</div>
                : <SimpleBar data={services} labelKey="service" valueKey="count" color={T.blue}/>
              }
            </div>

            {/* Revenue by service */}
            <div style={{ background:T.cardBg, border:`1px solid ${T.border}`, borderRadius:T.r12, padding:"16px 18px" }}>
              <div style={{ fontSize:13, fontWeight:700, color:T.textPrimary, marginBottom:12 }}>Revenue by service</div>
              {services.length === 0
                ? <div style={{ fontSize:12, color:T.textMuted }}>No data</div>
                : <SimpleBar data={services} labelKey="service" valueKey="revenue" color={T.green}/>
              }
            </div>
          </div>

          {/* Payment breakdown */}
          {payment && (
            <div style={{ background:T.cardBg, border:`1px solid ${T.border}`, borderRadius:T.r12, padding:"16px 18px" }}>
              <div style={{ fontSize:13, fontWeight:700, color:T.textPrimary, marginBottom:12 }}>Payment methods</div>
              {payment.byMethod?.length === 0
                ? <div style={{ fontSize:12, color:T.textMuted }}>No payment data recorded yet</div>
                : (
                  <>
                    <SimpleBar data={payment.byMethod || []} labelKey="method" valueKey="total" color={T.teal}/>
                    {payment.unpaidCompleted > 0 && (
                      <div style={{ marginTop:12, padding:"8px 12px", background:T.amberBg, border:`1px solid ${T.amberBorder}`, borderRadius:T.r8, fontSize:12, color:T.amberText }}>
                        ⚠️ {payment.unpaidCompleted} completed booking{payment.unpaidCompleted!==1?"s":""} with no payment recorded
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
