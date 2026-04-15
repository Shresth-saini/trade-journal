'use client';

import { useMemo } from 'react';
import { Trade } from '@/types';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isToday,
  parseISO,
  getWeek,
  startOfWeek as swk,
  endOfWeek as ewk,
} from 'date-fns';

interface Props {
  trades: Trade[];
  currentMonth: Date;
  onNavigate: (direction: 'prev' | 'next') => void;
  onDayClick?: (date: string) => void;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function CalendarView({ trades, currentMonth, onNavigate, onDayClick }: Props) {
  const { days, monthStats, weeklyPnl } = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

    const days = eachDayOfInterval({ start: calStart, end: calEnd });

    // Build trade map keyed by date string
    const tradeMap = new Map<string, { pnl: number; count: number }>();
    for (const t of trades) {
      const monthStr = t.date.substring(0, 7); // YYYY-MM
      if (monthStr !== format(currentMonth, 'yyyy-MM')) continue;
      const existing = tradeMap.get(t.date) ?? { pnl: 0, count: 0 };
      tradeMap.set(t.date, { pnl: existing.pnl + t.pnl, count: existing.count + 1 });
    }

    const monthTrades = trades.filter(
      (t) => t.date.substring(0, 7) === format(currentMonth, 'yyyy-MM')
    );

    const wins = monthTrades.filter((t) => t.pnl > 0).length;
    const losses = monthTrades.filter((t) => t.pnl < 0).length;
    const be = monthTrades.filter((t) => t.pnl === 0).length;

    const monthStats = {
      wins,
      losses,
      breakeven: be,
      total: monthTrades.length,
    };

    // Weekly PnL for the current week
    const weekStart = swk(new Date(), { weekStartsOn: 0 });
    const weekEnd = ewk(new Date(), { weekStartsOn: 0 });
    const weekTrades = trades.filter((t) => {
      const d = parseISO(t.date);
      return d >= weekStart && d <= weekEnd;
    });
    const weekPnl = weekTrades.reduce((s, t) => s + t.pnl, 0);
    const weekWins = weekTrades.filter((t) => t.pnl > 0).length;
    const weekWinRate = weekTrades.length > 0 ? (weekWins / weekTrades.length) * 100 : 0;

    const weeklyPnl = {
      pnl: weekPnl,
      winRate: weekWinRate,
      trades: weekTrades.length,
      startDate: format(weekStart, 'd MMM').toUpperCase(),
      endDate: format(weekEnd, 'd MMM').toUpperCase(),
    };

    return { days, tradeMap, monthStats, weeklyPnl };
  }, [trades, currentMonth]);

  // Build trade map for the calendar rendering
  const tradeMap = useMemo(() => {
    const map = new Map<string, { pnl: number; count: number }>();
    for (const t of trades) {
      const existing = map.get(t.date) ?? { pnl: 0, count: 0 };
      map.set(t.date, { pnl: existing.pnl + t.pnl, count: existing.count + 1 });
    }
    return map;
  }, [trades]);

  return (
    <div className="calendar-section">
      {/* Calendar main */}
      <div className="card" style={{ padding: 20 }}>
        {/* Month header */}
        <div className="calendar-header">
          <h2 className="calendar-month">{format(currentMonth, 'MMMM yyyy')}</h2>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              id="calendar-prev-btn"
              className="daily-nav-btn"
              onClick={() => onNavigate('prev')}
              aria-label="Previous month"
            >
              ‹
            </button>
            <button
              id="calendar-next-btn"
              className="daily-nav-btn"
              onClick={() => onNavigate('next')}
              aria-label="Next month"
            >
              ›
            </button>
          </div>
        </div>

        {/* Month stats */}
        <div className="calendar-stats-row">
          <div className="calendar-stat-cell">
            <div className="calendar-stat-value">{monthStats.wins}</div>
            <div className="calendar-stat-label">Profit</div>
          </div>
          <div className="calendar-stat-cell">
            <div className="calendar-stat-value red">{monthStats.losses}</div>
            <div className="calendar-stat-label">Loss</div>
          </div>
          <div className="calendar-stat-cell">
            <div className="calendar-stat-value blue">{monthStats.breakeven}</div>
            <div className="calendar-stat-label">B/E</div>
          </div>
          <div className="calendar-stat-cell">
            <div className="calendar-stat-value gray">{monthStats.total}</div>
            <div className="calendar-stat-label">Trades</div>
          </div>
        </div>

        {/* Calendar grid */}
        <div className="calendar-grid">
          {WEEKDAYS.map((d) => (
            <div key={d} className="calendar-day-header">{d}</div>
          ))}
          {days.map((day) => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const dayData = tradeMap.get(dateStr);
            const inMonth = isSameMonth(day, currentMonth);
            const today = isToday(day);

            let className = 'calendar-day';
            if (!inMonth) className += ' empty';
            if (today) className += ' today';
            if (dayData) {
              className += ' has-trade';
              className += dayData.pnl >= 0 ? ' positive' : ' negative';
            }

            return (
              <div
                key={dateStr}
                className={className}
                onClick={() => inMonth && onDayClick?.(dateStr)}
              >
                <div className="calendar-day-num">{format(day, 'd')}</div>
                {dayData && inMonth && (
                  <>
                    <div
                      className={`calendar-day-pnl ${dayData.pnl < 0 ? 'negative' : ''}`}
                    >
                      {dayData.pnl >= 0 ? '+' : ''}${dayData.pnl.toFixed(0)}
                    </div>
                    <div
                      className={`calendar-day-dot ${dayData.pnl < 0 ? 'negative' : ''}`}
                    />
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Weekly P&L card */}
      <div className="weekly-card">
        <div className="weekly-label">Weekly P&L</div>
        <div className="weekly-date-range">
          {weeklyPnl.startDate} – {weeklyPnl.endDate}
        </div>
        <div className={`weekly-pnl ${weeklyPnl.pnl < 0 ? 'negative' : ''}`}>
          {weeklyPnl.pnl >= 0 ? '+' : ''}${weeklyPnl.pnl.toFixed(2)}
        </div>
        <div className="weekly-win-rate">
          {weeklyPnl.winRate.toFixed(0)}% · {weeklyPnl.trades} trades
        </div>
        <div className="weekly-progress">
          <div
            className="weekly-progress-bar"
            style={{ width: `${Math.min(weeklyPnl.winRate, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}
