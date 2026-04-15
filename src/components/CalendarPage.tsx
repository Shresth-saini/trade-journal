'use client';

import { useState, useMemo } from 'react';
import { Trade } from '@/types';
import CalendarView from './CalendarView';
import { format, parseISO, subMonths, addMonths, startOfWeek, endOfWeek } from 'date-fns';

interface Props {
  trades: Trade[];
}

export default function CalendarPage({ trades }: Props) {
  const [tab, setTab] = useState('Monthly');
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // ─── COMPUTE MONTHLY STATS ───
  const monthlyStats = useMemo(() => {
    const map = new Map<string, { pnl: number; wins: number; losses: number; count: number }>();
    
    trades.forEach((t) => {
      // Get YYYY-MM
      const mLabel = t.date.substring(0, 7); 
      if (!map.has(mLabel)) {
        map.set(mLabel, { pnl: 0, wins: 0, losses: 0, count: 0 });
      }
      const st = map.get(mLabel)!;
      st.pnl += t.pnl;
      st.count += 1;
      if (t.pnl > 0) st.wins += 1;
      else if (t.pnl < 0) st.losses += 1;
    });

    const arr = Array.from(map.entries()).map(([m, stats]) => {
      const dateObj = new Date(`${m}-02`); // quick parse safely
      return {
        key: m,
        label: format(dateObj, 'MMM yyyy'),
        pnl: stats.pnl,
        winRate: (stats.wins / Math.max(stats.count, 1)) * 100,
        count: stats.count,
        pct: ((stats.pnl / 10000) * 100).toFixed(2), // dummy account size 10k
      };
    }).sort((a, b) => b.key.localeCompare(a.key)); // desc sort

    let best = arr[0];
    let worst = arr[0];
    let totalPnl = 0;
    arr.forEach(m => {
      totalPnl += m.pnl;
      if (m.pnl > best.pnl) best = m;
      if (m.pnl < worst.pnl) worst = m;
    });

    return {
      months: arr,
      best,
      worst,
      avg: arr.length > 0 ? totalPnl / arr.length : 0,
    };
  }, [trades]);

  // ─── COMPUTE WEEKLY STATS ───
  const weeklyStats = useMemo(() => {
    const map = new Map<string, { pnl: number; wins: number; losses: number; count: number, start: Date }>();
    
    trades.forEach((t) => {
      const d = parseISO(t.date);
      const wStart = startOfWeek(d);
      const wEnd = endOfWeek(d);
      const wLabel = `${format(wStart, 'MMM d')} - ${format(wEnd, 'MMM d')}`;
      
      if (!map.has(wLabel)) {
        map.set(wLabel, { pnl: 0, wins: 0, losses: 0, count: 0, start: wStart });
      }
      const st = map.get(wLabel)!;
      st.pnl += t.pnl;
      st.count += 1;
      if (t.pnl > 0) st.wins += 1;
      else if (t.pnl < 0) st.losses += 1;
    });

    const arr = Array.from(map.entries()).map(([w, stats]) => {
      return {
        key: w,
        label: w,
        start: stats.start,
        pnl: stats.pnl,
        winRate: (stats.wins / Math.max(stats.count, 1)) * 100,
        count: stats.count,
        pct: ((stats.pnl / 10000) * 100).toFixed(2),
      };
    }).sort((a, b) => b.start.getTime() - a.start.getTime());

    let best = arr[0];
    let worst = arr[0];
    let totalPnl = 0;
    arr.forEach(w => {
      totalPnl += w.pnl;
      if (w.pnl > best.pnl) best = w;
      if (w.pnl < worst.pnl) worst = w;
    });

    return {
      weeks: arr,
      best,
      worst,
      avg: arr.length > 0 ? totalPnl / arr.length : 0,
    };
  }, [trades]);

  // ─── COMPUTE DAILY STATS ───
  const dailyStats = useMemo(() => {
    const map = new Map<string, { pnl: number; wins: number; losses: number; count: number, short: string }>();
    
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const shorts = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    days.forEach((d, i) => {
      map.set(d, { pnl: 0, wins: 0, losses: 0, count: 0, short: shorts[i] });
    });

    trades.forEach((t) => {
      const d = parseISO(t.date);
      const dayName = format(d, 'EEEE');
      if (map.has(dayName)) {
        const st = map.get(dayName)!;
        st.pnl += t.pnl;
        st.count += 1;
        if (t.pnl > 0) st.wins += 1;
        else if (t.pnl < 0) st.losses += 1;
      }
    });

    const arr = Array.from(map.entries()).map(([dName, stats]) => {
      return {
        name: dName,
        short: stats.short,
        pnl: stats.pnl,
        winRate: stats.count > 0 ? (stats.wins / stats.count) * 100 : 0,
        count: stats.count,
      };
    }).filter(d => d.count > 0);

    let best = arr[0];
    let worst = arr[0];
    arr.forEach(d => {
      if (d.pnl > best.pnl) best = d;
      if (d.pnl < worst.pnl) worst = d;
    });

    return {
      days: arr,
      best,
      worst,
    };
  }, [trades]);

  return (
    <div className="cal-page-root">
      {/* ── Tabs ── */}
      <div className="cal-tabs">
        <button className={`cal-tab ${tab === 'Calendar' ? 'active' : ''}`} onClick={() => setTab('Calendar')}>
          📅 Calendar
        </button>
        <button className={`cal-tab ${tab === 'Monthly' ? 'active' : ''}`} onClick={() => setTab('Monthly')}>
          Monthly
        </button>
        <button className={`cal-tab ${tab === 'Weekly' ? 'active' : ''}`} onClick={() => setTab('Weekly')}>
          Weekly
        </button>
        <button className={`cal-tab ${tab === 'Daily' ? 'active' : ''}`} onClick={() => setTab('Daily')}>
          Daily
        </button>
      </div>

      {/* ── Calendar View ── */}
      {tab === 'Calendar' && (
        <CalendarView
          trades={trades}
          currentMonth={currentMonth}
          onNavigate={(dir) => setCurrentMonth((p) => (dir === 'prev' ? subMonths(p, 1) : addMonths(p, 1)))}
        />
      )}

      {/* ── Monthly View ── */}
      {tab === 'Monthly' && (
        <div className="cal-monthly-view">
          <div className="cal-panel">
            <div className="cal-panel-header">
              <span className="cal-panel-title">Monthly Performance</span>
              <span className="cal-panel-sub">{monthlyStats.months.length} months</span>
            </div>

            <table className="cal-table">
              <thead>
                <tr>
                  <th>MONTH</th>
                  <th>NET P&amp;L</th>
                  <th>% GAIN</th>
                  <th>TRADES</th>
                  <th style={{ width: 200 }}>WIN RATE</th>
                  <th>RESULT</th>
                </tr>
              </thead>
              <tbody>
                {monthlyStats.months.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>
                      No data available
                    </td>
                  </tr>
                ) : (
                  monthlyStats.months.map((m) => (
                    <tr key={m.key}>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{m.label}</td>
                      <td className={m.pnl >= 0 ? 'green' : 'red'}>
                        {m.pnl >= 0 ? '+' : '-'}${Math.abs(m.pnl).toFixed(2)}
                      </td>
                      <td>
                        <span className={`cal-badge ${m.pnl >= 0 ? 'green' : 'red'}`}>
                          {m.pnl >= 0 ? '+' : ''}{m.pct}%
                        </span>
                      </td>
                      <td style={{ color: '#8888aa', fontFamily: 'JetBrains Mono' }}>{m.count}</td>
                      <td>
                        <div className="cal-winrate-wrap">
                          <div className="cal-winrate-bar">
                            <div
                              className="cal-winrate-fill"
                              style={{ width: `${m.winRate}%`, background: m.winRate >= 50 ? 'var(--accent-green)' : 'var(--accent-red)' }}
                            />
                          </div>
                          <span className="cal-winrate-num">{m.winRate.toFixed(0)}%</span>
                        </div>
                      </td>
                      <td>
                        <span className={`cal-pill ${m.pnl >= 0 ? 'profit' : 'loss'}`}>
                          {m.pnl >= 0 ? 'PROFIT' : 'LOSS'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="cal-cards-row">
            <div className="cal-card">
              <div className="cal-card-title">BEST MONTH</div>
              <div className={`cal-card-val ${monthlyStats.best?.pnl >= 0 ? 'green' : 'red'}`}>
                {monthlyStats.best?.pnl >= 0 ? '+' : '-'}${Math.abs(monthlyStats.best?.pnl || 0).toFixed(2)}
              </div>
              <div className="cal-card-sub">{monthlyStats.best?.label || '—'}</div>
            </div>
            <div className="cal-card">
              <div className="cal-card-title">WORST MONTH</div>
              <div className={`cal-card-val ${monthlyStats.worst?.pnl >= 0 ? 'green' : 'red'}`}>
                {monthlyStats.worst?.pnl >= 0 ? '+' : '-'}${Math.abs(monthlyStats.worst?.pnl || 0).toFixed(2)}
              </div>
              <div className="cal-card-sub">{monthlyStats.worst?.label || '—'}</div>
            </div>
            <div className="cal-card">
              <div className="cal-card-title">AVG MONTHLY</div>
              <div className={`cal-card-val ${monthlyStats.avg >= 0 ? 'green' : 'red'}`}>
                {monthlyStats.avg >= 0 ? '+' : '-'}${Math.abs(monthlyStats.avg).toFixed(2)}
              </div>
              <div className="cal-card-sub">Average</div>
            </div>
          </div>
        </div>
      )}

      {/* ── Weekly View ── */}
      {tab === 'Weekly' && (
        <div className="cal-monthly-view">
          <div className="cal-panel">
            <div className="cal-panel-header">
              <span className="cal-panel-title">Weekly Performance</span>
              <span className="cal-panel-sub">{weeklyStats.weeks.length} weeks</span>
            </div>

            <table className="cal-table">
              <thead>
                <tr>
                  <th>WEEK</th>
                  <th>NET P&amp;L</th>
                  <th>% GAIN</th>
                  <th>TRADES</th>
                  <th style={{ width: 200 }}>WIN RATE</th>
                  <th>RESULT</th>
                </tr>
              </thead>
              <tbody>
                {weeklyStats.weeks.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>
                      No data available
                    </td>
                  </tr>
                ) : (
                  weeklyStats.weeks.map((w) => (
                    <tr key={w.key}>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{w.label}</td>
                      <td className={w.pnl >= 0 ? 'green' : 'red'}>
                        {w.pnl >= 0 ? '+' : '-'}${Math.abs(w.pnl).toFixed(2)}
                      </td>
                      <td>
                        <span className={`cal-badge ${w.pnl >= 0 ? 'green' : 'red'}`}>
                          {w.pnl >= 0 ? '+' : ''}{w.pct}%
                        </span>
                      </td>
                      <td style={{ color: '#8888aa', fontFamily: 'JetBrains Mono' }}>{w.count}</td>
                      <td>
                        <div className="cal-winrate-wrap">
                          <div className="cal-winrate-bar">
                            <div
                              className="cal-winrate-fill"
                              style={{ width: `${w.winRate}%`, background: w.winRate >= 50 ? 'var(--accent-green)' : 'var(--accent-red)' }}
                            />
                          </div>
                          <span className="cal-winrate-num">{w.winRate.toFixed(0)}%</span>
                        </div>
                      </td>
                      <td>
                        <span className={`cal-pill ${w.pnl >= 0 ? 'profit' : 'loss'}`}>
                          {w.pnl >= 0 ? 'PROFIT' : 'LOSS'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="cal-cards-row">
            <div className="cal-card">
              <div className="cal-card-title">BEST WEEK</div>
              <div className={`cal-card-val ${weeklyStats.best?.pnl >= 0 ? 'green' : 'red'}`}>
                {weeklyStats.best?.pnl >= 0 ? '+' : '-'}${Math.abs(weeklyStats.best?.pnl || 0).toFixed(2)}
              </div>
              <div className="cal-card-sub">{weeklyStats.best?.label || '—'}</div>
            </div>
            <div className="cal-card">
              <div className="cal-card-title">WORST WEEK</div>
              <div className={`cal-card-val ${weeklyStats.worst?.pnl >= 0 ? 'green' : 'red'}`}>
                {weeklyStats.worst?.pnl >= 0 ? '+' : '-'}${Math.abs(weeklyStats.worst?.pnl || 0).toFixed(2)}
              </div>
              <div className="cal-card-sub">{weeklyStats.worst?.label || '—'}</div>
            </div>
            <div className="cal-card">
              <div className="cal-card-title">AVG WEEKLY</div>
              <div className={`cal-card-val ${weeklyStats.avg >= 0 ? 'green' : 'red'}`}>
                {weeklyStats.avg >= 0 ? '+' : '-'}${Math.abs(weeklyStats.avg).toFixed(2)}
              </div>
              <div className="cal-card-sub">Average</div>
            </div>
          </div>
        </div>
      )}

      {/* ── Daily View ── */}
      {tab === 'Daily' && (
        <div className="cal-monthly-view">
          <div className="cal-panel">
            <div className="cal-panel-header">
              <span className="cal-panel-title">Performance by Day of Week</span>
            </div>
            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {dailyStats.days.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No data available</div>
              ) : (
                dailyStats.days.map((d) => (
                  <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ width: 40, color: 'var(--text-muted)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>
                      {d.short}
                    </div>
                    <div style={{ width: 60, color: d.pnl >= 0 ? 'var(--accent-green)' : 'var(--accent-red)', fontWeight: 700, fontFamily: 'JetBrains Mono', fontSize: 14 }}>
                      {d.pnl >= 0 ? '+' : '-'}${Math.abs(d.pnl).toFixed(0)}
                    </div>
                    <div style={{ width: 50 }}>
                      {dailyStats.best?.name === d.name && d.pnl > 0 && <span className="cal-pill profit" style={{ padding: '2px 6px', fontSize: 9 }}>BEST</span>}
                      {dailyStats.worst?.name === d.name && d.pnl < 0 && <span className="cal-pill loss" style={{ padding: '2px 6px', fontSize: 9 }}>WORST</span>}
                    </div>
                    
                    <div style={{ flex: 1, height: 4, background: 'var(--bg-input)', borderRadius: 2, position: 'relative' }}>
                      <div style={{ width: `${d.winRate}%`, height: '100%', background: d.winRate >= 50 ? 'var(--accent-green)' : 'var(--accent-red)', borderRadius: 2 }} />
                    </div>
                    
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono', minWidth: 60, textAlign: 'right' }}>
                      {d.winRate.toFixed(0)}% WR
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="cal-cards-row" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
            <div className="cal-card">
              <div className="cal-card-title">MOST PROFITABLE DAY</div>
              <div style={{ color: 'var(--accent-green)', fontSize: 16, fontWeight: 700, margin: '4px 0' }}>
                {dailyStats.best?.name || '—'}
              </div>
              <div className="cal-card-sub" style={{ display:'flex', gap: 6, alignItems:'center' }}>
                <span className="green" style={{ fontFamily: 'JetBrains Mono', fontWeight: 600 }}>
                  {dailyStats.best?.pnl >= 0 ? '+' : '-'}${Math.abs(dailyStats.best?.pnl || 0).toFixed(2)}
                </span>
                <span>·</span>
                <span style={{ fontFamily: 'JetBrains Mono' }}>{dailyStats.best?.winRate.toFixed(0)}% WR</span>
              </div>
            </div>

            <div className="cal-card">
              <div className="cal-card-title">LEAST PROFITABLE DAY</div>
              <div style={{ color: 'var(--accent-red)', fontSize: 16, fontWeight: 700, margin: '4px 0' }}>
                {dailyStats.worst?.name || '—'}
              </div>
              <div className="cal-card-sub" style={{ display:'flex', gap: 6, alignItems:'center' }}>
                <span className="red" style={{ fontFamily: 'JetBrains Mono', fontWeight: 600 }}>
                  {dailyStats.worst?.pnl >= 0 ? '+' : '-'}${Math.abs(dailyStats.worst?.pnl || 0).toFixed(2)}
                </span>
                <span>·</span>
                <span style={{ fontFamily: 'JetBrains Mono' }}>{dailyStats.worst?.winRate.toFixed(0)}% WR</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
