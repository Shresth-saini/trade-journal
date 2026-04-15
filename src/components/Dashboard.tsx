'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getUserTrades, deleteTrade } from '@/lib/trades';
import { Trade } from '@/types';
import { computeStats, getThunderRadarData, Stats } from '@/lib/stats';
import NewTradeModal from '@/components/NewTradeModal';
import CalendarView from '@/components/CalendarView';
import CalendarPage from '@/components/CalendarPage';
import AnalyticsPage from '@/components/AnalyticsPage';
import PsychologyPage from '@/components/PsychologyPage';
import NewsPage from '@/components/NewsPage';
import RulesPage from '@/components/RulesPage';
import AccountPage from '@/components/AccountPage';
import RadarChart from '@/components/RadarChart';
import DailyPnlChart from '@/components/DailyPnlChart';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  CartesianGrid,
} from 'recharts';
import { format, parseISO, subMonths, addMonths } from 'date-fns';
import toast from 'react-hot-toast';

// ─── Icons ────────────────────────────────────────────────────────────────────
const IC = {
  dashboard: (
    <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
      <path d="M2 3h7v7H2V3zm9 0h7v4h-7V3zm0 6h7v8h-7V9zM2 12h7v5H2v-5z"/>
    </svg>
  ),
  tradelog: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" width="16" height="16">
      <rect x="3" y="3" width="14" height="14" rx="2"/>
      <path d="M7 7h6M7 10h6M7 13h4"/>
    </svg>
  ),
  analytics: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" width="16" height="16">
      <polyline points="2,14 7,9 11,12 18,5"/>
      <line x1="2" y1="17" x2="18" y2="17"/>
    </svg>
  ),
  calendar: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" width="16" height="16">
      <rect x="3" y="4" width="14" height="13" rx="2"/>
      <path d="M7 2v4M13 2v4M3 9h14"/>
    </svg>
  ),
  psychology: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" width="16" height="16">
      <circle cx="10" cy="10" r="7"/>
      <path d="M7 9c0-1.5 1-2.5 3-2.5s3 1 3 2.5c0 2-2 2.5-3 3"/>
      <circle cx="10" cy="15" r=".8" fill="currentColor"/>
    </svg>
  ),
  insights: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" width="16" height="16">
      <circle cx="10" cy="7" r="4"/>
      <path d="M10 11v2M8 16h4"/>
    </svg>
  ),
  news: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" width="16" height="16">
      <rect x="2" y="4" width="12" height="13" rx="1"/>
      <path d="M14 7h4v10H6"/>
      <path d="M5 8h6M5 11h6M5 14h4"/>
    </svg>
  ),
  rules: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" width="16" height="16">
      <path d="M4 5h12M4 9h8M4 13h10M4 17h6"/>
    </svg>
  ),
  account: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" width="16" height="16">
      <circle cx="10" cy="7" r="3"/>
      <path d="M3 18c0-3.3 3.1-6 7-6s7 2.7 7 6"/>
    </svg>
  ),
  logout: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" width="16" height="16">
      <path d="M13 4h4v13h-4M9 14l4-4-4-4M13 10H3"/>
    </svg>
  ),
  menu: (
    <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
      <rect y="3" width="20" height="2" rx="1"/>
      <rect y="9" width="20" height="2" rx="1"/>
      <rect y="15" width="20" height="2" rx="1"/>
    </svg>
  ),
};

// ─── User Info Dropdown ────────────────────────────────────────────────────────
function UserAvatar() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  if (!user) return null;
  return (
    <div style={{ position: 'relative' }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={user.photoURL ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName ?? 'T')}&background=00e676&color=000&size=64`}
        alt="avatar"
        className="user-avatar"
        onClick={() => setOpen(p => !p)}
      />
      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 499 }} onClick={() => setOpen(false)} />
          <div className="user-dropdown">
            <div className="user-dropdown-name">
              {user.displayName}
              <div className="user-dropdown-email">{user.email}</div>
            </div>
            <button className="user-dropdown-item danger" onClick={async () => { await logout(); toast.success('Signed out'); }}>
              🚪 Sign Out
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Tooltip for charts ───────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const val = payload[0].value as number;
  return (
    <div style={{ background: '#1a1a1f', border: '1px solid #2a2a35', borderRadius: 8, padding: '8px 12px', fontSize: 11 }}>
      <div style={{ color: '#666688', marginBottom: 2 }}>{label}</div>
      <div style={{ fontWeight: 700, fontFamily: 'JetBrains Mono', color: val >= 0 ? '#00e676' : '#ff5252' }}>
        {val >= 0 ? '+' : ''}${val.toFixed(2)}
      </div>
    </div>
  );
}

// ─── Donut ring ───────────────────────────────────────────────────────────────
function Donut({ pct, size = 48 }: { pct: number; size?: number }) {
  const r = (size - 6) / 2, c = 2 * Math.PI * r;
  const off = c - (Math.min(pct, 100) / 100) * c;
  return (
    <svg width={size} height={size}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#2a2a35" strokeWidth={3} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#00e676" strokeWidth={3}
        strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off}
        transform={`rotate(-90 ${size/2} ${size/2})`}
        style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
    </svg>
  );
}

// ─── Win/Loss ring ────────────────────────────────────────────────────────────
function WLRing({ wins, losses, size = 48 }: { wins: number; losses: number; size?: number }) {
  const r = (size - 6) / 2, c = 2 * Math.PI * r;
  const total = wins + losses;
  const wOff = c - (total > 0 ? wins / total : 0) * c;
  const lOff = c - (total > 0 ? losses / total : 0) * c;
  return (
    <svg width={size} height={size}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#2a2a35" strokeWidth={3} />
      {losses > 0 && <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#ff5252" strokeWidth={3} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={lOff} transform={`rotate(-90 ${size/2} ${size/2})`} />}
      {wins > 0 && <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#00e676" strokeWidth={3} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={wOff} transform={`rotate(-90 ${size/2} ${size/2})`} />}
      {wins > 0 && <text x={size/2} y={size/2 - 1} textAnchor="middle" fill="#00e676" fontSize={8} fontFamily="Inter" fontWeight={700}>{wins}</text>}
      {losses > 0 && <text x={size/2} y={size/2 + 9} textAnchor="middle" fill="#ff5252" fontSize={8} fontFamily="Inter" fontWeight={700}>{losses}</text>}
    </svg>
  );
}

// ─── Mini bar sparkline ───────────────────────────────────────────────────────
function Sparkle() {
  return (
    <svg width={32} height={16}>
      {[0.4,0.7,0.5,0.9,0.6,0.8,1].map((h,i)=>(
        <rect key={i} x={i*5} y={16-h*16} width={3} height={h*16} fill="#00e676" opacity={0.6+i*0.06} rx={1}/>
      ))}
    </svg>
  );
}

// ─── Nav items config ─────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { id:'dashboard', label:'Dashboard', icon: IC.dashboard },
  { id:'tradelog',  label:'Trade Log',  icon: IC.tradelog  },
  { id:'analytics', label:'Analytics', icon: IC.analytics },
  { id:'calendar',  label:'Calendar',  icon: IC.calendar  },
  { id:'psychology',label:'Psychology',icon: IC.psychology},
  { id:'insights',  label:'Insights',  icon: IC.insights  },
  { id:'news',      label:'News',      icon: IC.news      },
  { id:'rules',     label:'Rules',     icon: IC.rules     },
];

interface UserSettings {
  displayName: string;
  startingBalance: number;
  breakevenCap: number;
  ratingStyle: 'stars' | 'grades';
  theme: 'dark' | 'light';
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const { user, logout } = useAuth();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTrade, setEditTrade] = useState<Trade|null>(null);
  const [activeView, setActiveView] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [dailyOffset, setDailyOffset] = useState(0);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const [settings, setSettings] = useState<UserSettings>({
    displayName: user?.displayName ?? 'Trader',
    startingBalance: 10000,
    breakevenCap: 35,
    ratingStyle: 'grades',
    theme: 'dark'
  });

  const fetchTrades = useCallback(async () => {
    if (!user) return;
    try { setTrades(await getUserTrades(user.uid)); }
    catch { toast.error('Failed to load trades'); }
    finally { setLoading(false); }
  }, [user]);

  useEffect(() => { fetchTrades(); }, [fetchTrades]);

  useEffect(() => {
    if (settings.theme === 'light') {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }
  }, [settings.theme]);

  const stats: Stats = useMemo(() => computeStats(trades), [trades]);
  const radarData = useMemo(() => getThunderRadarData(stats), [stats]);

  const totalDailyPages = Math.max(Math.ceil(stats.dailyPnl.length / 7), 1);
  const visibleDaily = useMemo(() => {
    const idx = Math.max(0, Math.min(dailyOffset, totalDailyPages - 1));
    return stats.dailyPnl.slice(idx * 7, idx * 7 + 7);
  }, [stats.dailyPnl, dailyOffset, totalDailyPages]);

  const openNew = () => { setEditTrade(null); setShowModal(true); };
  const handleEdit = (t: Trade) => { setEditTrade(t); setShowModal(true); };
  const handleDelete = async (id: string) => {
    if (!confirm('Delete this trade?')) return;
    try { await deleteTrade(id); toast.success('Deleted'); fetchTrades(); }
    catch { toast.error('Failed'); }
  };

  const netPnlPct = stats.netPnl !== 0
    ? ((stats.netPnl / settings.startingBalance) * 100).toFixed(2)
    : '0.00';

  return (
    <div className={`db-root ${settings.theme === 'light' ? 'light-theme' : ''}`}>
      {/* ═══════════════ SIDEBAR ═══════════════ */}
      <aside className={`db-sidebar ${sidebarOpen ? 'open' : 'closed'} ${mobileNavOpen ? 'mobile-open' : ''}`}>
        {/* Mobile Close Button */}
        <button 
          className="db-menu-btn mobile-only" 
          style={{ position:'absolute', right:10, top:10, zIndex:1001 }}
          onClick={() => setMobileNavOpen(false)}
        >
          ✕
        </button>
        {/* Logo */}
        <div className="db-sidebar-logo">
          <div className="db-logo-box">
            <svg viewBox="0 0 20 20" fill="none" width="14" height="14">
              <rect x="1" y="10" width="4" height="9" rx="1" fill="#00e676"/>
              <rect x="8" y="6" width="4" height="13" rx="1" fill="#00e676"/>
              <rect x="15" y="1" width="4" height="18" rx="1" fill="#00e676"/>
            </svg>
          </div>
          <span className="db-logo-text">TRADEJOURNAL</span>
        </div>

        {/* Navigation */}
        <div className="db-nav-section-label">NAVIGATION</div>
        <nav className="db-nav">
          {NAV_ITEMS.map(item => (
            <button 
              key={item.id}
              id={`nav-${item.id}`}
              className={`db-nav-item ${activeView === item.id ? 'active' : ''}`}
              onClick={() => { setActiveView(item.id); setMobileNavOpen(false); }}
              title={item.label}
            >
              <span className="db-nav-icon">{item.icon}</span>
              <span className="db-nav-label">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Settings */}
        <div className="db-nav-section-label" style={{ marginTop: 12 }}>SETTINGS</div>
        <div className="db-nav db-settings-nav">
          <button className="db-nav-item" onClick={() => { setActiveView('account'); setMobileNavOpen(false); }} title="Account">
            <span className="db-nav-icon">{IC.account}</span>
            <span className="db-nav-label">Account</span>
          </button>
          <button
            className="db-nav-item logout"
            onClick={async () => { await logout(); toast.success('Signed out'); }}
            title="Logout"
          >
            <span className="db-nav-icon">{IC.logout}</span>
            <span className="db-nav-label">Logout</span>
          </button>
        </div>

        {/* Account info */}
        <div className="db-account-info">
          <div className="db-account-label">ACCOUNT</div>
          <div className="db-account-balance">${(settings.startingBalance + stats.netPnl).toLocaleString('en-US', { minimumFractionDigits: 0 })}</div>
          <div className="db-account-start">Start: ${settings.startingBalance.toLocaleString()}</div>
        </div>
      </aside>

      {/* ═══════════════ MAIN ═══════════════ */}
      <div className={`db-main ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        {/* ── Topbar ── */}
        <header className="db-topbar">
          <div className="db-topbar-left">
            <button
              className="db-menu-btn mobile-only"
              onClick={() => setMobileNavOpen(true)}
              style={{ marginRight: 12 }}
            >
              {IC.menu}
            </button>
            <button
              id="sidebar-toggle-btn"
              className="db-menu-btn desktop-only"
              onClick={() => setSidebarOpen(p => !p)}
              aria-label="Toggle sidebar"
            >
              {IC.menu}
            </button>
            <div>
              <div className="db-topbar-title">Dashboard</div>
              <div className="db-topbar-date">{format(new Date(), 'EEE, MMM d')}</div>
            </div>
          </div>

          <div className="db-topbar-center">
            {settings.displayName}
          </div>

          <div className="db-topbar-right">
            <button id="new-trade-btn" className="btn btn-primary" onClick={openNew}>
              + New Trade
            </button>
            <UserAvatar />
          </div>
        </header>

        {/* ── Content ── */}
        <main className="db-content">
          {loading ? (
            <div className="empty-state"><div className="loading-spinner" /></div>
          ) : (
            <>
              {/* ┌─────────────────── DASHBOARD ───────────────────┐ */}
              {(activeView === 'dashboard') && (
                <>
                  {/* ── 5 Stat Cards ── */}
                  <div className="db-stats-row">

                    {/* NET P&L */}
                    <div className="db-stat-card">
                      <div className="db-stat-label">NET P&amp;L · {trades.length}T</div>
                      <div className={`db-stat-value ${stats.netPnl < 0 ? 'red' : 'green'}`}>
                        {stats.netPnl >= 0 ? '+' : ''}${stats.netPnl.toFixed(2)}
                      </div>
                      <div className="db-stat-row">
                        <span className="green">+${stats.avgWin.toFixed(0)}</span>
                        <span style={{ color: 'var(--text-muted)', margin: '0 4px' }}>·</span>
                        <span className="green">+{netPnlPct}%</span>
                        <span style={{ color: 'var(--text-muted)', margin: '0 4px' }}>·</span>
                        <span className="red">-${stats.avgLoss.toFixed(0)}</span>
                      </div>
                    </div>

                    {/* TRADE WIN % */}
                    <div className="db-stat-card db-stat-card-flex">
                      <div>
                        <div className="db-stat-label">TRADE WIN %</div>
                        <div className="db-stat-value green">{stats.tradeWinRate.toFixed(1)}%</div>
                      </div>
                      <WLRing wins={stats.wins} losses={stats.losses} />
                    </div>

                    {/* PROFIT FACTOR */}
                    <div className="db-stat-card db-stat-card-flex">
                      <div>
                        <div className="db-stat-label">PROFIT FACTOR</div>
                        <div className="db-stat-value white">
                          {stats.profitFactor >= 999 ? '999.00' : stats.profitFactor.toFixed(2)}
                        </div>
                      </div>
                      <Donut pct={Math.min(stats.profitFactor * 20, 100)} />
                    </div>

                    {/* DAY WIN % */}
                    <div className="db-stat-card db-stat-card-flex">
                      <div>
                        <div className="db-stat-label">DAY WIN %</div>
                        <div className="db-stat-value green">{stats.dayWinRate.toFixed(1)}%</div>
                        <Sparkle />
                      </div>
                      <Donut pct={stats.dayWinRate} />
                    </div>

                    {/* AVG WIN/LOSS */}
                    <div className="db-stat-card">
                      <div className="db-stat-label">AVG WIN/LOSS</div>
                      <div className="db-stat-value white" style={{ fontSize: 22 }}>
                        {stats.avgLoss > 0 ? (stats.avgWin / stats.avgLoss).toFixed(1) : '∞'}
                      </div>
                      <div className="db-stat-row" style={{ marginTop: 6 }}>
                        <span className="green">+${stats.avgWin.toFixed(0)}</span>
                        <span className="red" style={{ marginLeft: 'auto' }}>-${stats.avgLoss.toFixed(0)}</span>
                      </div>
                      <div className="db-win-bar">
                        <div className="db-win-bar-fill" style={{ width: `${Math.min(stats.tradeWinRate, 100)}%` }} />
                      </div>
                    </div>
                  </div>

                  {/* ── 3 charts row ── */}
                  <div className="db-charts-row">
                    {/* Thunder Score */}
                    <div className="db-chart-card">
                      <div className="db-chart-title">
                        <span style={{ color: '#ffd740' }}>⚡</span> THUNDER SCORE
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 4 }}>
                        <RadarChart data={radarData} size={180} />
                      </div>
                      {/* Gradient bar */}
                      <div className="db-thunder-bar">
                        <div className="db-thunder-dot" style={{ left: `${stats.thunderScore}%` }} />
                      </div>
                      <div className="db-thunder-labels">
                        {['0','25','50','75','100'].map(l => <span key={l}>{l}</span>)}
                      </div>
                      <div className="db-thunder-num">{stats.thunderScore}</div>
                      <div className="db-thunder-sub">THUNDER SCORE</div>
                    </div>

                    {/* Cumulative P&L */}
                    <div className="db-chart-card">
                      <div className="db-chart-header">
                        <div className="db-chart-title">Cumulative P&amp;L</div>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <span className="db-badge green">↑{stats.tradeWinRate.toFixed(2)}%</span>
                          <span className={`db-badge ${stats.netPnl >= 0 ? 'green' : 'red'}`}>
                            {stats.netPnl >= 0 ? '+' : ''}${stats.netPnl.toFixed(2)}
                          </span>
                        </div>
                      </div>
                      {stats.cumulativePnl.length > 0 ? (
                        <ResponsiveContainer width="100%" height={210}>
                          <AreaChart data={stats.cumulativePnl} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                            <defs>
                              <linearGradient id="cumGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#00e676" stopOpacity={0.2}/>
                                <stop offset="95%" stopColor="#00e676" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false}/>
                            <XAxis dataKey="date" tick={{ fill:'#444460', fontSize:10 }} tickLine={false} axisLine={false}
                              tickFormatter={v => { try { return format(parseISO(v),'MMM d'); } catch { return v; }}}/>
                            <YAxis tick={{ fill:'#444460', fontSize:10 }} tickLine={false} axisLine={false}
                              tickFormatter={v => `$${v}`} width={44}/>
                            <Tooltip content={<ChartTooltip/>}/>
                            <ReferenceLine y={0} stroke="rgba(255,255,255,0.08)"/>
                            <Area type="monotone" dataKey="value" stroke="#00e676" strokeWidth={2} fill="url(#cumGrad)"
                              dot={(p:any) => <circle key={`d${p.cx}`} cx={p.cx} cy={p.cy} r={4} fill="#00e676" stroke="#0d0d0f" strokeWidth={2}/>}/>
                          </AreaChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="empty-state" style={{ height: 210 }}>
                          <div className="empty-state-icon">📈</div>
                          <div className="empty-state-text">No trades yet</div>
                        </div>
                      )}
                    </div>

                    {/* Daily P&L */}
                    <div className="db-chart-card">
                      <div className="db-chart-header">
                        <div className="db-chart-title">Daily P&amp;L</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <button className="db-nav-small" onClick={() => setDailyOffset(p => Math.max(0,p-1))} disabled={dailyOffset===0}>‹</button>
                          <span style={{ fontSize: 10, color: 'var(--text-muted)', minWidth: 24, textAlign:'center' }}>
                            {Math.min(dailyOffset+1,totalDailyPages)}/{totalDailyPages}
                          </span>
                          <button className="db-nav-small" onClick={() => setDailyOffset(p => Math.min(totalDailyPages-1,p+1))}
                            disabled={dailyOffset>=totalDailyPages-1}>›</button>
                        </div>
                      </div>
                      {visibleDaily.length > 0 ? (
                        <DailyPnlChart data={visibleDaily} height={210}
                          formatDate={v => { try { return format(parseISO(v),'MMM d'); } catch { return v; }}}/>
                      ) : (
                        <div className="empty-state" style={{ height: 210 }}>
                          <div className="empty-state-icon">📊</div>
                          <div className="empty-state-text">No daily data</div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ── Calendar ── */}
                  <CalendarView
                    trades={trades}
                    currentMonth={currentMonth}
                    onNavigate={dir => setCurrentMonth(p => dir==='prev' ? subMonths(p,1) : addMonths(p,1))}
                  />
                </>
              )}

              {/* ┌─────────────────── NEWS ───────────────────┐ */}
              {activeView === 'news' && <NewsPage />}

              {/* ┌─────────────────── ANALYTICS ───────────────────┐ */}
              {activeView === 'calendar' && (
                <CalendarPage trades={trades} />
              )}

              {/* ┌─────────────────── PSYCHOLOGY ───────────────────┐ */}
              {activeView === 'psychology' && (
                <PsychologyPage trades={trades} />
              )}
              {activeView === 'analytics' && (
                <AnalyticsPage trades={trades} stats={stats} />
              )}

              {/* ┌─────────────────── TRADE LOG ───────────────────┐ */}
              {activeView === 'tradelog' && (
                <div>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
                    <h2 style={{ fontSize:18, fontWeight:700 }}>
                      Trade Log
                    </h2>
                    <button className="btn btn-primary" onClick={openNew}>+ New Trade</button>
                  </div>
                  {trades.length === 0 ? (
                    <div className="empty-state">
                      <div className="empty-state-icon">📋</div>
                      <div className="empty-state-text">No trades yet</div>
                      <div className="empty-state-subtext">Click "+ New Trade" to add your first trade</div>
                    </div>
                  ) : (
                    <table className="trades-table">
                      <thead>
                        <tr>
                          <th>Date</th><th>Asset</th><th>Direction</th>
                          <th>P&amp;L</th><th>RR</th><th>Session</th>
                          <th>Rating</th><th>Tags</th><th>Mistakes</th><th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {trades.map(t => (
                          <tr key={t.id}>
                            <td>{t.date}</td>
                            <td style={{ fontWeight:600, color:'var(--text-primary)' }}>{t.asset}</td>
                            <td><span className={`direction-badge ${t.direction.toLowerCase()}`}>{t.direction}</span></td>
                             <td><span className={t.pnl>=0?'pnl-positive':'pnl-negative'}>{t.pnl>=0?'+':''}${t.pnl.toFixed(2)}</span></td>
                             <td style={{ fontFamily:'JetBrains Mono' }}>{t.rr?.toFixed(1)??'—'}</td>
                             <td>{t.session}</td>
                             <td>
                               {t.rating ? (
                                 <span className="rating-badge">
                                   {settings.ratingStyle === 'stars' 
                                     ? '★'.repeat(Number(t.rating) || 1) 
                                     : (isNaN(Number(t.rating)) ? t.rating : `Grade ${t.rating}`)}
                                 </span>
                               ) : '—'}
                             </td>
                            <td>
                              {t.type?.length > 0 ? (
                                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                  {t.type.slice(0, 2).map((tag) => (
                                    <span key={tag} className="tag-chip" style={{ margin: 0, fontSize: 10, padding: '2px 6px' }}>
                                      {tag}
                                    </span>
                                  ))}
                                  {t.type.length > 2 && (
                                    <span className="tag-chip" style={{ margin: 0, fontSize: 10, padding: '2px 6px' }}>
                                      +{t.type.length - 2}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span style={{ color: 'var(--text-muted)' }}>—</span>
                              )}
                            </td>
                            <td>{t.mistakes?.length>0
                              ? <span style={{ fontSize:11, color:'var(--accent-red)' }}>{t.mistakes.slice(0,2).join(', ')}{t.mistakes.length>2&&` +${t.mistakes.length-2}`}</span>
                              : <span style={{ fontSize:11, color:'var(--accent-green)' }}>✓ Clean</span>}
                            </td>
                            <td>
                              <div className="trade-actions">
                                <button className="trade-action-btn" onClick={()=>handleEdit(t)} title="Edit">✏</button>
                                <button className="trade-action-btn delete" onClick={()=>t.id&&handleDelete(t.id)} title="Delete">🗑</button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {/* ┌─────────────────── RULES ───────────────────┐ */}
              {activeView === 'rules' && <RulesPage />}

              {/* ┌─────────────────── ACCOUNT ───────────────────┐ */}
              {activeView === 'account' && (
                <AccountPage 
                  settings={settings} 
                  onSave={(newSet) => setSettings(newSet)}
                />
              )}

              {/* ┌─── Insights ───┐ */}
              {['insights'].includes(activeView) && (
                <div className="empty-state" style={{ marginTop: 60 }}>
                  <div className="empty-state-icon">🚧</div>
                  <div className="empty-state-text" style={{ fontSize:16, fontWeight:700, color:'var(--text-primary)' }}>
                    {NAV_ITEMS.find(x=>x.id===activeView)?.label ?? 'Coming Soon'}
                  </div>
                  <div className="empty-state-subtext">This section is coming soon. Focus on your dashboard for now!</div>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* ─── Modal ─── */}
      {showModal && (
        <NewTradeModal
          onClose={() => { setShowModal(false); setEditTrade(null); }}
          onSaved={fetchTrades}
          editTrade={editTrade}
        />
      )}
    </div>
  );
}
