'use client';

import { useState, useEffect } from 'react';
import { format, parseISO, startOfWeek, endOfWeek, addWeeks } from 'date-fns';

interface FFEvent {
  title: string;
  country: string;
  date: string; // e.g. "2024-04-16T08:30:00-04:00"
  impact: 'High' | 'Medium' | 'Low' | 'Non';
  forecast: string;
  previous: string;
}

export default function NewsPage() {
  const [events, setEvents] = useState<FFEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [impactFilter, setImpactFilter] = useState<string[]>(['High', 'Medium', 'Low']);
  const [currencyFilter, setCurrencyFilter] = useState<string>('ALL');

  // Navigation & Timezone
  const [activeTab, setActiveTab] = useState('Calendar');
  const [weekOffset, setWeekOffset] = useState(0);
  const [showTzMenu, setShowTzMenu] = useState(false);
  const [selectedTz, setSelectedTz] = useState({ label: 'Mumbai / IST (+5:30)', code: 'GMT+5:30' });

  const currentWeekDate = addWeeks(new Date(), weekOffset);
  const startDay = startOfWeek(currentWeekDate, { weekStartsOn: 0 });
  const endDay = endOfWeek(currentWeekDate, { weekStartsOn: 0 });

  const tzList = [
    { label: 'UTC (GMT+0)', code: 'GMT' },
    { label: 'London (GMT/BST)', code: 'GMT+1' },
    { label: 'Frankfurt (CET/CEST)', code: 'GMT+2' },
    { label: 'Paris (CET/CEST)', code: 'GMT+2' },
    { label: 'Moscow (MSK)', code: 'GMT+3' },
    { label: 'Istanbul (TRT)', code: 'GMT+3' },
    { label: 'Dubai (GST +4)', code: 'GMT+4' },
    { label: 'Mumbai / IST (+5:30)', code: 'GMT+5:30' },
    { label: 'Singapore (SGT +8)', code: 'GMT+8' },
    { label: 'Shanghai (CST +8)', code: 'GMT+8' }
  ];

  useEffect(() => {
    async function fetchNews() {
      try {
        setLoading(true);
        const res = await fetch('/api/news');
        if (!res.ok) throw new Error('API Error');
        const data = await res.json();
        
        // The endpoint may return an array directly
        if (Array.isArray(data)) {
          setEvents(data);
        } else {
          setEvents([]); // Fallback
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchNews();
  }, []);

  const toggleImpact = (imp: string) => {
    setImpactFilter(prev => prev.includes(imp) ? prev.filter(x => x !== imp) : [...prev, imp]);
  };

  const filtered = events.filter(e => {
    if (!impactFilter.includes(e.impact)) return false;
    if (currencyFilter !== 'ALL' && e.country !== currencyFilter) return false;
    return true;
  });

  // Impact Analysis calculations
  const highCurrs = new Set(events.filter(e => e.impact === 'High').map(e => e.country));
  const defaultPairs = ['EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD', 'USD/CAD', 'USD/CHF', 'NZD/USD', 'EUR/GBP', 'GBP/JPY', 'AUD/JPY'];
  const pairRisks = defaultPairs.map(p => {
     const [c1, c2] = p.split('/');
     const highEventsCount = events.filter(e => (e.country === c1 || e.country === c2) && e.impact === 'High').length;
     
     let riskLevel = 'LOW RISK';
     if (highEventsCount >= 3) riskLevel = 'HIGH RISK';
     else if (highEventsCount >= 1) riskLevel = 'CAUTION';
     
     return { 
       pair: p, 
       risk: riskLevel, 
       events: highEventsCount 
     };
  }).sort((a, b) => b.events - a.events);

  const currHighs = new Map<string, FFEvent[]>();
  events.filter(e => e.impact === 'High').forEach(e => {
     if (!currHighs.has(e.country)) currHighs.set(e.country, []);
     currHighs.get(e.country)!.push(e);
  });

  return (
    <div className="analytics-root fade-in">
      <div className="cal-panel" style={{ background: 'transparent', border: 'none' }}>
        
        {/* Top Header Row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 20 }}>🗓️</span>
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>Economic Calendar</h2>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
              ForexFactory events · times shown in your timezone
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="news-live-ff">
              <div className="live-dot" style={{ width: 6, height: 6 }} />
              LIVE FF
            </div>
            
            <div style={{ position: 'relative' }}>
              <button className="news-select" onClick={() => setShowTzMenu(!showTzMenu)}>
                🌐 {selectedTz.label} ⌄
              </button>
              
              {showTzMenu && (
                <div style={{
                  position: 'absolute', top: '100%', right: 0, marginTop: 8, width: 340,
                  background: '#13131a', border: '1px solid rgba(255,255,255,0.05)',
                  borderRadius: 12, zIndex: 100, boxShadow: '0 20px 40px rgba(0,0,0,0.8)'
                }}>
                  <div style={{ padding: '16px 16px 8px', fontSize: 10, letterSpacing: '0.15em', color: 'var(--text-muted)' }}>
                    SELECT TIMEZONE
                  </div>
                  <div style={{ padding: '8px 16px' }}>
                    <input type="text" placeholder="Search timezone..." style={{ 
                      width: '100%', background: '#0a0a0f', border: '1px solid rgba(255,255,255,0.05)', 
                      padding: '10px 14px', fontSize: 13, borderRadius: 8, color: '#fff', outline: 'none'
                    }} />
                  </div>
                  <div style={{ maxHeight: 280, overflowY: 'auto', padding: '8px 0' }}>
                     {tzList.map(t => (
                       <button 
                         key={t.code + t.label}
                         onClick={() => { setSelectedTz(t); setShowTzMenu(false); }}
                         style={{ 
                           width: '100%', display: 'flex', justifyContent: 'space-between', padding: '12px 16px',
                           background: 'transparent', border: 'none', color: '#fff', fontSize: 13, cursor: 'pointer',
                           textAlign: 'left'
                         }}
                         onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                         onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                       >
                         <span>{t.label}</span>
                         <span style={{ color: 'var(--text-muted)', fontFamily: 'JetBrains Mono', fontSize: 11 }}>{t.code}</span>
                       </button>
                     ))}
                     <div style={{ margin: '8px 16px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 16 }}>
                       <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 8 }}>Or type IANA timezone:</div>
                       <input type="text" placeholder="e.g. America/New_York" style={{ 
                         width: '100%', background: '#0a0a0f', border: '1px solid rgba(255,255,255,0.05)', 
                         padding: '10px 14px', fontSize: 12, fontFamily: 'JetBrains Mono', borderRadius: 8, color: '#fff'
                       }} />
                     </div>
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button className="news-nav-btn" onClick={() => setWeekOffset(prev => prev - 1)}>‹</button>
              <button 
                className={`news-nav-btn ${weekOffset === 0 ? 'active' : ''}`}
                onClick={() => setWeekOffset(0)}
              >
                This Week
              </button>
              <span style={{ fontSize: 13, color: 'var(--text-muted)', minWidth: 110, textAlign: 'center', letterSpacing: '0.02em' }}>
                {format(startDay, 'MMM d')} – {format(endDay, 'MMM d')}
              </span>
              <button className="news-nav-btn" onClick={() => setWeekOffset(prev => prev + 1)}>›</button>
            </div>
          </div>
        </div>

        {/* Secondary Tabs */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
          <button className={`news-btn-tab ${activeTab === 'Calendar' ? 'active' : ''}`} onClick={() => setActiveTab('Calendar')}>🗓️ Calendar</button>
          <button className={`news-btn-tab ${activeTab === 'Bank Holidays' ? 'active' : ''}`} onClick={() => setActiveTab('Bank Holidays')}>🏦 Bank Holidays</button>
          <button className={`news-btn-tab ${activeTab === 'Impact Analysis' ? 'active' : ''}`} onClick={() => setActiveTab('Impact Analysis')}>📊 Impact Analysis</button>
        </div>

        {activeTab === 'Calendar' && (
          <>
            {/* Filters Row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.1em' }}>IMPACT:</span>
            <button className={`news-filter-pill ${impactFilter.includes('High') ? 'active' : ''}`} onClick={() => toggleImpact('High')}>
              <span className="dot red-dot"/> High
            </button>
            <button className={`news-filter-pill ${impactFilter.includes('Medium') ? 'active' : ''}`} onClick={() => toggleImpact('Medium')}>
              <span className="dot" style={{ background: '#ff9800' }}/> Medium
            </button>
            <button className={`news-filter-pill ${impactFilter.includes('Low') ? 'active' : ''}`} onClick={() => toggleImpact('Low')}>
              <span className="dot" style={{ background: '#ffea00' }}/> Low
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.1em' }}>CURRENCY:</span>
            {['ALL','USD','EUR','GBP','JPY','AUD','CAD','CHF','NZD'].map(curr => (
              <button 
                key={curr} 
                className={`news-filter-pill ${currencyFilter === curr ? 'active green-border' : ''}`}
                onClick={() => setCurrencyFilter(curr)}
              >
                {curr}
              </button>
            ))}
          </div>
        </div>

        {/* Sub-banner */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: 8, marginTop: 16 }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: '#ff9800' }}>⚡</span> All times shown in: <span style={{ color: 'var(--text-primary)' }}>{selectedTz.label}</span>
          </div>
          <a href="https://www.forexfactory.com/calendar" target="_blank" rel="noreferrer" className="news-btn-open">
            Open FF ↗
          </a>
        </div>

        {/* Main Content Area */}
        <div className="cal-panel" style={{ marginTop: 16, minHeight: 400, display: 'flex', flexDirection: 'column' }}>
          {loading ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
              <div className="spinner">📡</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Fetching live data from ForexFactory...</div>
            </div>
          ) : error ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-red)' }}>
              Error fetching news: {error}
            </div>
          ) : weekOffset !== 0 ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', gap: 8 }}>
               <div style={{ fontSize: 24 }}>🗄️</div>
               <div>Historical/Future data requires the premium API subscription.</div>
               <div style={{ fontSize: 11 }}>Only the current active week is served on the free tier.</div>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              No events match the selected filters.
            </div>
          ) : (
            <table className="cal-table">
              <thead>
                <tr>
                  <th style={{ width: 140 }}>DATE / TIME</th>
                  <th>IMPACT</th>
                  <th>CURRENCY</th>
                  <th>EVENT TITLE</th>
                  <th>ACTUAL</th>
                  <th>FORECAST</th>
                  <th>PREVIOUS</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((ev, i) => {
                  let impactColor = '#ffea00'; // Low
                  if (ev.impact === 'High') impactColor = 'var(--accent-red)';
                  else if (ev.impact === 'Medium') impactColor = '#ff9800';
                  else if (ev.impact === 'Non') impactColor = 'var(--text-muted)';
                  
                  let dLabel = 'Unknown';
                  try {
                    const d = parseISO(ev.date);
                    dLabel = format(d, 'MMM d, h:mm a');
                  } catch (e) {
                    dLabel = ev.date; // fallback if JSON parsing fails timestamp
                  }

                  return (
                    <tr key={`${ev.title}-${i}`}>
                      <td style={{ color: 'var(--text-muted)', fontFamily: 'JetBrains Mono', fontSize: 11 }}>{dLabel}</td>
                      <td>
                        <span className="dot" style={{ background: impactColor, marginRight: 8 }}/>
                        <span style={{ fontSize: 11, color: impactColor }}>{ev.impact}</span>
                      </td>
                      <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{ev.country}</td>
                      <td style={{ color: 'var(--text-primary)' }}>{ev.title}</td>
                      <td style={{ fontFamily: 'JetBrains Mono' }}>—</td>
                      <td style={{ fontFamily: 'JetBrains Mono', color: 'var(--text-muted)' }}>{ev.forecast || '—'}</td>
                      <td style={{ fontFamily: 'JetBrains Mono', color: 'var(--text-muted)' }}>{ev.previous || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
        </>)}

        {/* Bank Holidays Tab */}
        {activeTab === 'Bank Holidays' && (
          <div className="cal-panel" style={{ marginTop: 16 }}>
            <div style={{ display:'flex', justifyContent:'space-between', padding:'16px 24px', borderBottom:'1px solid var(--border)' }}>
               <strong style={{ fontSize:15, fontWeight:700 }}>Upcoming Bank Holidays</strong>
               <span style={{ fontSize:10, color:'var(--text-muted)' }}>2025–2026</span>
            </div>
            <div style={{ padding: '8px 24px' }}>
               {[
                 {c:'US', date:'Mon, May 25, 2026', title:'Memorial Day', cur:'USD'},
                 {c:'US', date:'Fri, Jun 19, 2026', title:'Juneteenth', cur:'USD'},
                 {c:'US', date:'Sat, Jul 4, 2026', title:'Independence Day', cur:'USD'},
                 {c:'US', date:'Mon, Sep 7, 2026', title:'Labor Day', cur:'USD'},
                 {c:'US', date:'Thu, Nov 26, 2026', title:'Thanksgiving', cur:'USD'},
                 {c:'US', date:'Fri, Dec 25, 2026', title:'Christmas Day', cur:'USD'},
                 {c:'GB', date:'Fri, Dec 25, 2026', title:'Christmas Day', cur:'GBP'},
                 {c:'GB', date:'Sat, Dec 26, 2026', title:'Boxing Day', cur:'GBP'},
               ].map(h => (
                 <div key={h.title+h.c+h.date} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'16px 0', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ display:'flex', gap: 16, width: 220, fontFamily: 'JetBrains Mono', fontSize: 13 }}>
                      <strong style={{ color:'var(--text-primary)' }}>{h.c}</strong>
                      <span style={{ color:'#4d5b9e' }}>{h.date}</span>
                    </div>
                    <div style={{ flex: 1, color:'var(--text-primary)', fontSize: 13, fontWeight: 500 }}>{h.title}</div>
                    <div style={{ display:'flex', gap: 8 }}>
                      <span className="tag-chip" style={{ opacity: 0.5, border: '1px solid rgba(255,255,255,0.1)' }}>{h.c}</span>
                      <span className="tag-chip" style={{ background:'rgba(0,230,118,0.1)', color:'var(--accent-green)' }}>{h.cur}</span>
                    </div>
                 </div>
               ))}
            </div>
          </div>
        )}

        {/* Impact Analysis Tab */}
        {activeTab === 'Impact Analysis' && (
          <div className="cal-panel" style={{ marginTop: 16 }}>
            <div style={{ display:'flex', alignItems:'center', gap: 8, padding:'16px 24px', borderBottom:'1px solid var(--border)' }}>
               <span style={{ fontSize: 16 }}>📊</span> 
               <strong style={{ fontSize: 15, fontWeight:700 }}>Weekly Pair Risk Assessment</strong>
            </div>
            <div style={{ padding: '24px' }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 24 }}>
                Pairs with red folder events this week. Consider reducing size or sitting out during news windows.
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 40 }}>
                 {pairRisks.map(pr => {
                   let borderColor = 'rgba(255,255,255,0.05)';
                   let textColor = 'var(--text-muted)';
                   let bg = 'rgba(255,255,255,0.01)';
                   
                   if (pr.risk === 'HIGH RISK') {
                     borderColor = 'rgba(255,82,82,0.3)';
                     textColor = 'var(--accent-red)';
                     bg = 'rgba(255,82,82,0.02)';
                   } else if (pr.risk === 'CAUTION') {
                     borderColor = 'rgba(255,152,0,0.3)';
                     textColor = '#ff9800';
                     bg = 'rgba(255,152,0,0.02)';
                   } else if (pr.risk === 'LOW RISK') {
                     borderColor = 'rgba(0,230,118,0.2)';
                     textColor = 'var(--accent-green)';
                     bg = 'rgba(0,230,118,0.02)';
                   }

                   return (
                     <div key={pr.pair} style={{ 
                       padding: '16px 20px', 
                       borderRadius: 8, 
                       border: `1px solid ${borderColor}`,
                       background: bg,
                       minWidth: 120,
                       textAlign: 'center'
                     }}>
                       <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>{pr.pair}</div>
                       <div style={{ fontSize: 10, fontWeight: 700, color: textColor, letterSpacing: '0.05em' }}>{pr.risk}</div>
                       <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{pr.events} events</div>
                     </div>
                   );
                 })}
              </div>

              {Array.from(currHighs.entries()).map(([curr, evs]) => (
                <div key={curr} style={{ marginBottom: 24 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <span className="tag-chip" style={{ background:'rgba(0,230,118,0.1)', color:'var(--accent-green)' }}>{curr}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{evs.length} high-impact events this week</span>
                  </div>
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    {evs.map((ev, idx) => {
                       let dLabel = ev.date;
                       try { dLabel = format(parseISO(ev.date), 'hh:mm a'); } catch(e){}
                       return (
                         <div key={idx} style={{ 
                           display: 'flex', alignItems: 'center', padding: '12px 0',
                           borderBottom: '1px solid rgba(255,255,255,0.02)'
                         }}>
                           <span className="dot red-dot" style={{ margin: '0 12px 0 8px' }}/>
                           <span style={{ width: 80, fontSize: 11, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono' }}>{dLabel}</span>
                           <span style={{ flex: 1, fontSize: 13, color: 'var(--text-primary)' }}>{ev.title}</span>
                           <span style={{ fontSize: 11, color: '#4d5b9e', fontFamily: 'JetBrains Mono' }}>Fcst: {ev.forecast || '—'}</span>
                         </div>
                       );
                    })}
                  </div>
                </div>
              ))}
              
              {currHighs.size === 0 && (
                <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>No high impact events this week.</div>
              )}
            </div>
          </div>
        )}
        
      </div>
    </div>
  );
}
