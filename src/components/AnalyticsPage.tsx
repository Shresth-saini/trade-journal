'use client';

import { useMemo } from 'react';
import { Trade } from '@/types';
import { Stats, getThunderRadarData } from '@/lib/stats';
import RadarChart from './RadarChart';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts';

interface Props {
  trades: Trade[];
  stats: Stats;
}

export default function AnalyticsPage({ trades, stats }: Props) {
  // Aggregate tags for Tag Performance
  const tagPerf = useMemo(() => {
    const map = new Map<string, { pnl: number; count: number; wins: number }>();
    trades.forEach(t => {
      if (!t.type || t.type.length === 0) return;
      t.type.forEach(tag => {
        if (!map.has(tag)) map.set(tag, { pnl: 0, count: 0, wins: 0 });
        const s = map.get(tag)!;
        s.pnl += t.pnl;
        s.count += 1;
        if (t.pnl > 0) s.wins += 1;
      });
    });
    return Array.from(map.entries()).map(([name, s]) => ({
      name, ...s, winRate: (s.wins / s.count) * 100
    })).sort((a,b) => b.pnl - a.pnl);
  }, [trades]);

  // Aggregate instrument performance
  const instPerf = useMemo(() => {
    const map = new Map<string, { pnl: number; count: number; wins: number; rr: number }>();
    trades.forEach(t => {
      const asset = t.asset || 'Unknown';
      if (!map.has(asset)) map.set(asset, { pnl: 0, count: 0, wins: 0, rr: 0 });
      const s = map.get(asset)!;
      s.pnl += t.pnl;
      s.count += 1;
      if (t.pnl > 0) s.wins += 1;
      s.rr += t.rr || 0;
    });
    return Array.from(map.entries()).map(([name, s]) => ({
      name, ...s, 
      winRate: (s.wins / s.count) * 100,
      avgRr: s.count > 0 ? s.rr / s.count : 0,
    })).sort((a,b) => b.pnl - a.pnl);
  }, [trades]);

  // Radar logic
  const radarData = useMemo(() => getThunderRadarData(trades), [trades]);

  // Consistency streaks
  const consistency = useMemo(() => {
    let currentRun = 0, bestRun = 0, worstRun = 0, currentLossRun = 0;
    let greenDays = 0, redDays = 0, flatDays = 0;
    
    // Group by day first
    const daysMap = new Map<string, number>();
    trades.forEach(t => {
      daysMap.set(t.date, (daysMap.get(t.date) || 0) + t.pnl);
    });
    
    const sortedDays = Array.from(daysMap.entries()).sort((a,b) => a[0].localeCompare(b[0]));
    
    let bestDay = { date: '', pnl: -Infinity };
    let worstDay = { date: '', pnl: Infinity };

    sortedDays.forEach(([d, pnl]) => {
      if (pnl > 0) {
        greenDays++;
        currentRun++;
        currentLossRun = 0;
        if (currentRun > bestRun) bestRun = currentRun;
      } else if (pnl < 0) {
        redDays++;
        currentLossRun++;
        currentRun = 0;
        if (currentLossRun > worstRun) worstRun = currentLossRun;
      } else {
        flatDays++;
        currentRun = 0;
        currentLossRun = 0;
      }

      if (pnl > bestDay.pnl) bestDay = { date: d, pnl };
      if (pnl < worstDay.pnl) worstDay = { date: d, pnl };
    });

    if (bestDay.pnl === -Infinity) bestDay = { date: '—', pnl: 0 };
    if (worstDay.pnl === Infinity) worstDay = { date: '—', pnl: 0 };

    return {
      currentRun, bestRun, worstRun, greenDays, redDays, flatDays,
      totalDays: sortedDays.length, bestDay, worstDay,
      avgDay: sortedDays.length > 0 ? Array.from(daysMap.values()).reduce((a,b)=>a+b,0) / sortedDays.length : 0
    };
  }, [trades]);

  const scorePct = consistency.totalDays > 0 ? Math.round((consistency.greenDays / consistency.totalDays) * 100) : 0;
  const gradeLabel = scorePct >= 80 ? 'Elite' : scorePct >= 60 ? 'Pro' : scorePct >= 40 ? 'Amateur' : 'Beginner';

  return (
    <div className="analytics-root fade-in">
      {/* ── Row 1 ── */}
      <div className="aly-grid-2">
        <div className="cal-panel">
          <div className="aly-panel-head">PERFORMANCE</div>
          <div className="aly-perf-list">
            <div className="aly-perf-item"><span>Total</span> <strong>{stats.totalTrades}</strong></div>
            <div className="aly-perf-item"><span>Wins</span> <strong>{stats.wins}</strong></div>
            <div className="aly-perf-item"><span>Losses</span> <strong>{stats.losses}</strong></div>
            <div className="aly-perf-item"><span>B/E</span> <strong>{stats.breakeven}</strong></div>
          </div>
        </div>

        <div className="cal-panel">
          <div className="aly-panel-head">🏷️ Tag Performance</div>
          <div className="aly-panel-body" style={{ minHeight: 180 }}>
            {tagPerf.length === 0 ? (
              <div className="aly-empty">No tags yet</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {tagPerf.map(t => (
                  <div key={t.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="tag-chip">{t.name}</span>
                    <span className={`aly-bold ${t.pnl >= 0 ? 'green' : 'red'}`}>
                      {t.pnl >= 0 ? '+' : '-'}${Math.abs(t.pnl).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Row 2 ── */}
      <div className="cal-panel" style={{ marginTop: 24 }}>
        <div className="aly-panel-head">🕒 Session Performance</div>
        <div className="aly-panel-body" style={{ background: '#111116', padding: 32 }}>
          <div className="aly-session-card" style={{ 
            maxWidth: 480, 
            padding: '28px 36px', 
            background: 'linear-gradient(145deg, #181b2a 0%, #0e0f17 100%)', 
            border: '1px solid rgba(92,106,255,0.15)', 
            boxShadow: '0 20px 40px rgba(0,0,0,0.6), inset 0 1px 1px rgba(255,255,255,0.05)', 
            borderRadius: 16 
          }}>
            <div className="aly-sc-left" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span className="tag-chip" style={{ background: 'rgba(92,106,255,0.15)', color: '#a5b4ff', border: 'none', fontSize: 11, padding: '4px 12px' }}>
                  London
                </span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  {stats.totalTrades} trades
                </span>
              </div>

              <div className={`aly-bold ${stats.netPnl >= 0 ? 'green' : 'red'}`} style={{ fontSize: 42, letterSpacing: '-0.02em', margin: '8px 0', textShadow: stats.netPnl >= 0 ? '0 0 20px rgba(0,230,118,0.2)' : '0 0 20px rgba(255,82,82,0.2)' }}>
                {stats.netPnl >= 0 ? '+' : '-'}${Math.abs(stats.netPnl).toFixed(0)}
              </div>

              <div className="aly-sc-meters" style={{ background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.02)' }}>
                <div className="aly-sc-circle" style={{ width: 64, height: 64 }}>
                  <svg viewBox="0 0 36 36">
                    <path
                      className="circle-bg"
                      style={{ stroke: 'rgba(255,255,255,0.05)', strokeWidth: 3 }}
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className={`circle-prog ${stats.tradeWinRate >= 50 ? 'stroke-green' : 'stroke-red'}`}
                      style={{ strokeWidth: 3, filter: 'drop-shadow(0 0 4px rgba(0,230,118,0.5))' }}
                      strokeDasharray={`${stats.tradeWinRate}, 100`}
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <div className="circle-text">
                    <strong style={{ fontSize: 13 }}>{stats.tradeWinRate.toFixed(0)}%</strong>
                    <span style={{ fontSize: 9 }}>WR</span>
                  </div>
                </div>

                <div className="aly-sc-stats" style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1, paddingLeft: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 700 }}>
                    <span className="green">✓ {stats.wins}W</span>
                    <span className="red">✗ {stats.losses}L</span>
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                    Avg: <span className={stats.netPnl >= 0 ? 'green' : 'red'}>
                      {stats.totalTrades > 0 ? (stats.netPnl > 0 ? '+' : '') + `$${(stats.netPnl / Math.max(1, stats.totalTrades)).toFixed(0)}` : '$0'}
                    </span>/trade
                  </div>
                  <div className="thunder-bar" style={{ height: 4, marginTop: 4, background: 'linear-gradient(90deg, #ff5252, #ff9800, #00e676)', position: 'relative', borderRadius: 2 }}>
                     <div style={{ position: 'absolute', left: `${stats.tradeWinRate}%`, top: -3, width: 10, height: 10, background: '#fff', borderRadius: '50%', transform: 'translateX(-50%)', border: '2px solid #000', boxShadow: '0 0 8px rgba(255,255,255,0.5)' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>
                    <span>Score</span>
                    <span>{stats.tradeWinRate.toFixed(0)}/100</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="aly-sc-radar" style={{ position: 'relative', right: -16, opacity: 0.9 }}>
              <RadarChart data={radarData} size={200} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Row 3: Consistency Score ── */}
      <div className="cal-panel" style={{ marginTop: 24 }}>
        <div className="aly-panel-head">📊 Consistency Score</div>
        <div className="aly-panel-body">
          <div className="aly-cons-header">
            <div className="aly-cons-ring">
              <svg viewBox="0 0 36 36">
                <path className="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                <path className="circle-prog stroke-green" strokeDasharray={`${scorePct}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              </svg>
              <div className="circle-text" style={{ flexDirection: 'column' }}>
                <strong style={{ fontSize: 16 }}>{scorePct}</strong>
                <span style={{ fontSize: 8 }}>/100</span>
              </div>
            </div>
            <div className="aly-cons-info">
              <div className="aly-cons-grade">{gradeLabel}</div>
              <div className="aly-cons-sub">{consistency.totalDays} trading days - avg ${(consistency.avgDay).toFixed(0)}/day</div>
              <div className="aly-cons-legend">
                <span><span className="dot green-dot"/> {consistency.greenDays} green</span>
                <span><span className="dot red-dot"/> {consistency.redDays} red</span>
                <span><span className="dot blue-dot"/> {consistency.flatDays} flat</span>
              </div>
            </div>
          </div>

          <div style={{ margin: '24px 0' }}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.1em', fontWeight: 700, marginBottom: 8, textTransform: 'uppercase' }}>Day Distribution</div>
            <div style={{ height: 8, background: 'var(--bg-input)', borderRadius: 4, overflow: 'hidden', display: 'flex' }}>
              <div style={{ width: `${consistency.totalDays ? (consistency.greenDays/consistency.totalDays)*100 : 0}%`, background: 'var(--accent-green)' }} />
              <div style={{ width: `${consistency.totalDays ? (consistency.flatDays/consistency.totalDays)*100 : 0}%`, background: '#2979ff' }} />
              <div style={{ width: `${consistency.totalDays ? (consistency.redDays/consistency.totalDays)*100 : 0}%`, background: 'var(--accent-red)' }} />
            </div>
          </div>

          <div className="cal-cards-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
            <div className="cal-card" style={{ textAlign: 'center', padding: '16px 10px' }}>
              <div style={{ fontSize: 8, color:'var(--text-muted)', letterSpacing: '0.1em' }}>CURRENT</div>
              <div className={`aly-bold ${consistency.currentRun > 0 ? 'green' : 'red'}`} style={{ fontSize: 16 }}>
                {consistency.currentRun > 0 ? '+' : ''}{consistency.currentRun}d
              </div>
            </div>
            <div className="cal-card" style={{ textAlign: 'center', padding: '16px 10px' }}>
              <div style={{ fontSize: 8, color:'var(--text-muted)', letterSpacing: '0.1em' }}>BEST RUN</div>
              <div className="aly-bold green" style={{ fontSize: 16 }}>{consistency.bestRun}d</div>
            </div>
            <div className="cal-card" style={{ textAlign: 'center', padding: '16px 10px' }}>
              <div style={{ fontSize: 8, color:'var(--text-muted)', letterSpacing: '0.1em' }}>WORST RUN</div>
              <div className="aly-bold red" style={{ fontSize: 16 }}>{consistency.worstRun}d</div>
            </div>
            <div className="cal-card" style={{ textAlign: 'center', padding: '16px 10px' }}>
              <div style={{ fontSize: 8, color:'var(--text-muted)', letterSpacing: '0.1em' }}>AVG/DAY</div>
              <div className={`aly-bold ${consistency.avgDay >= 0 ? 'green' : 'red'}`} style={{ fontSize: 16 }}>
                {consistency.avgDay >= 0 ? '+' : '-'}${Math.abs(consistency.avgDay).toFixed(0)}
              </div>
            </div>
          </div>

          <div className="cal-cards-row" style={{ gridTemplateColumns: 'repeat(2, 1fr)', marginTop: 16 }}>
            <div className="cal-card aly-best-card">
              <div className="cal-card-title">BEST DAY</div>
              <div className="aly-bold green">
                {consistency.bestDay.pnl >= 0 ? '+' : '-'}${Math.abs(consistency.bestDay.pnl).toFixed(0)}
              </div>
              <div className="cal-card-sub">{consistency.bestDay.date}</div>
            </div>
            <div className="cal-card aly-worst-card">
              <div className="cal-card-title">WORST DAY</div>
              <div className="aly-bold red">
                {consistency.worstDay.pnl >= 0 ? '+' : '-'}${Math.abs(consistency.worstDay.pnl).toFixed(0)}
              </div>
              <div className="cal-card-sub">{consistency.worstDay.date}</div>
            </div>
          </div>

          <div style={{ marginTop: 24 }}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.1em', fontWeight: 700, marginBottom: 8, textTransform: 'uppercase' }}>Last {Math.min(consistency.totalDays, 14)} Trading Days</div>
            <div style={{ height: 48, background: 'var(--accent-green)', borderRadius: 4, width: '100%', opacity: 0.9 }}>
               {/* Simplified fat bar representation exactly like screenshot */}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16, fontSize: 10, color: 'var(--text-muted)' }}>
              <div style={{ display: 'flex', gap: 16 }}>
                 <span><span className="dot green-dot"/> Profit day</span>
                 <span><span className="dot red-dot"/> Loss day</span>
                 <span><span className="dot blue-dot"/> Flat day</span>
              </div>
              <div>P&L timeline</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Row 4: Instruments ── */}
      <div className="cal-panel" style={{ marginTop: 24 }}>
        <div className="aly-panel-head">🏆 Instrument Performance</div>
        <table className="cal-table">
          <thead>
            <tr>
              <th>INSTRUMENT</th>
              <th>NET P&amp;L</th>
              <th style={{ width: 180 }}>WIN RATE</th>
              <th>TRADES</th>
              <th>AVG RR</th>
              <th>GRADE</th>
            </tr>
          </thead>
          <tbody>
            {instPerf.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign:'center', padding:24, color:'var(--text-muted)' }}>No data</td></tr>
            ) : (
              instPerf.map(i => (
                <tr key={i.name}>
                  <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>⭐ {i.name}</td>
                  <td className={i.pnl >= 0 ? 'green' : 'red'}>
                    {i.pnl >= 0 ? '+' : '-'}${Math.abs(i.pnl).toFixed(2)}
                  </td>
                  <td>
                    <div className="cal-winrate-wrap">
                      <div className="cal-winrate-bar">
                        <div className="cal-winrate-fill" style={{ width: `${i.winRate}%`, background: i.winRate >= 50 ? 'var(--accent-green)' : 'var(--accent-red)' }} />
                      </div>
                      <span className="cal-winrate-num">{i.winRate.toFixed(0)}%</span>
                    </div>
                  </td>
                  <td style={{ fontFamily: 'JetBrains Mono', color: '#8888aa' }}>{i.count}</td>
                  <td style={{ fontFamily: 'JetBrains Mono', color: '#a5b4ff' }}>{i.avgRr.toFixed(2)}</td>
                  <td><span className="cal-pill profit">A+</span></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Row 5: Tag Combo ── */}
      <div className="cal-panel" style={{ marginTop: 24 }}>
        <div className="aly-panel-head" style={{ borderBottom: 'none' }}>
           <div style={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
             <span>🧲 Tag Combo</span>
             <div className="aly-toggle">
               <button className="aly-tgb active">AND</button>
               <button className="aly-tgb">OR</button>
             </div>
           </div>
        </div>
        <div className="aly-panel-body" style={{ display: 'flex', flexWrap: 'wrap', gap: 8, paddingBottom: 24 }}>
           {['Asia','London','NY AM','NY PM','MACD','RSI','XAUUSD','MGC','CrudeOil','Silver','EUR/USD','GBP/USD','USD/JPY','AUD/USD','USD/CAD','EUR/GBP','NZD/USD','USD/CHF','BTC/USD','ETH/USD'].map(t => (
             <span key={t} className="tag-chip" style={{ opacity: 0.5, border: '1px solid var(--border)' }}>{t}</span>
           ))}
        </div>
      </div>

      {/* ── Row 6: Equity ── */}
      <div className="cal-panel" style={{ marginTop: 24, marginBottom: 40 }}>
        <div className="aly-panel-head" style={{ borderBottom: 'none', paddingBottom: 0 }}>
           <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
             <span style={{ fontSize: 16, fontWeight: 700 }}>Equity</span>
             <span className="green aly-bold" style={{ fontSize: 12 }}>+0.62%</span>
           </div>
        </div>
        <div className="aly-panel-body" style={{ height: 300, paddingTop: 10 }}>
           {stats.cumulativePnl.length > 0 ? (
             <ResponsiveContainer width="100%" height="100%">
               <AreaChart data={stats.cumulativePnl}>
                 <defs>
                   <linearGradient id="eqGrad" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="#5c6aff" stopOpacity={0.3}/>
                     <stop offset="95%" stopColor="#5c6aff" stopOpacity={0}/>
                   </linearGradient>
                 </defs>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                 <XAxis dataKey="date" tick={{ fill:'#444460', fontSize:10 }} tickLine={false} axisLine={false} />
                 <YAxis tick={{ fill:'#444460', fontSize:10 }} tickLine={false} axisLine={false} tickFormatter={v => `$${(10000+v)/1000}k`} width={44}/>
                 <Tooltip content={({ active, payload, label }: any) => {
                   if (!active || !payload?.length) return null;
                   return (
                     <div style={{ background: '#1a1a1f', border: '1px solid #2a2a35', borderRadius: 8, padding: '8px 12px', fontSize: 11 }}>
                       <div style={{ color: '#666688', marginBottom: 2 }}>{label}</div>
                       <div className={payload[0].value >= 0 ? "green aly-bold" : "red aly-bold"}>
                         ${(10000 + payload[0].value).toFixed(2)}
                       </div>
                     </div>
                   );
                 }} />
                 <Area type="monotone" dataKey="value" stroke="#5c6aff" strokeWidth={2} fill="url(#eqGrad)" />
               </AreaChart>
             </ResponsiveContainer>
           ) : (
             <div className="aly-empty">No equity data</div>
           )}
        </div>
      </div>
    </div>
  );
}
