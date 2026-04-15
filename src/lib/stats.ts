import { Trade } from '@/types';

export interface Stats {
  netPnl: number;
  netPnlPercent: number;
  tradeWinRate: number;
  profitFactor: number;
  dayWinRate: number;
  avgWin: number;
  avgLoss: number;
  totalTrades: number;
  wins: number;
  losses: number;
  breakeven: number;
  thunderScore: number;
  cumulativePnl: { date: string; value: number }[];
  dailyPnl: { date: string; value: number }[];
}

export function computeStats(trades: Trade[]): Stats {
  if (trades.length === 0) {
    return {
      netPnl: 0,
      netPnlPercent: 0,
      tradeWinRate: 0,
      profitFactor: 0,
      dayWinRate: 0,
      avgWin: 0,
      avgLoss: 0,
      totalTrades: 0,
      wins: 0,
      losses: 0,
      breakeven: 0,
      thunderScore: 0,
      cumulativePnl: [],
      dailyPnl: [],
    };
  }

  const netPnl = trades.reduce((sum, t) => sum + t.pnl, 0);

  const wins = trades.filter((t) => t.pnl > 0);
  const losses = trades.filter((t) => t.pnl < 0);
  const breakeven = trades.filter((t) => t.pnl === 0).length;

  const tradeWinRate = trades.length > 0 ? (wins.length / trades.length) * 100 : 0;

  const totalGain = wins.reduce((sum, t) => sum + t.pnl, 0);
  const totalLoss = Math.abs(losses.reduce((sum, t) => sum + t.pnl, 0));
  const profitFactor = totalLoss === 0 ? (totalGain > 0 ? 999 : 0) : totalGain / totalLoss;

  const avgWin = wins.length > 0 ? totalGain / wins.length : 0;
  const avgLoss = losses.length > 0 ? totalLoss / losses.length : 0;

  // Daily stats for day win rate
  const dailyMap = new Map<string, number>();
  for (const t of trades) {
    dailyMap.set(t.date, (dailyMap.get(t.date) ?? 0) + t.pnl);
  }
  const dayProfits = Array.from(dailyMap.values());
  const winningDays = dayProfits.filter((p) => p > 0).length;
  const dayWinRate = dayProfits.length > 0 ? (winningDays / dayProfits.length) * 100 : 0;

  // Cumulative P&L
  const sorted = [...trades].sort((a, b) => a.date.localeCompare(b.date));
  let cumulative = 0;
  const cumulativePnl = sorted.map((t) => {
    cumulative += t.pnl;
    return { date: t.date, value: cumulative };
  });

  // Daily P&L from map
  const dailyPnl = Array.from(dailyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, value]) => ({ date, value }));

  // Thunder Score (0-100)
  const thunderScore = computeThunderScore({
    tradeWinRate,
    profitFactor,
    avgWin,
    avgLoss,
    dayWinRate,
    trades,
  });

  return {
    netPnl,
    netPnlPercent: netPnl !== 0 ? (netPnl / Math.max(avgLoss * trades.length, 1)) * 100 : 0,
    tradeWinRate,
    profitFactor,
    dayWinRate,
    avgWin,
    avgLoss,
    totalTrades: trades.length,
    wins: wins.length,
    losses: losses.length,
    breakeven,
    thunderScore,
    cumulativePnl,
    dailyPnl,
  };
}

function computeThunderScore({
  tradeWinRate,
  profitFactor,
  avgWin,
  avgLoss,
  dayWinRate,
  trades,
}: {
  tradeWinRate: number;
  profitFactor: number;
  avgWin: number;
  avgLoss: number;
  dayWinRate: number;
  trades: Trade[];
}): number {
  if (trades.length === 0) return 0;

  // Win rate score (0-25)
  const winScore = Math.min(tradeWinRate / 4, 25);

  // PF score (0-25)
  const pfScore = Math.min((Math.min(profitFactor, 5) / 5) * 25, 25);

  // Avg Win/Loss ratio score (0-20)
  const rrScore =
    avgLoss > 0 ? Math.min((avgWin / avgLoss / 3) * 20, 20) : avgWin > 0 ? 20 : 0;

  // Day win rate score (0-20)
  const dayScore = Math.min(dayWinRate / 5, 20);

  // Consistency score based on mistakes (0-10)
  const totalMistakes = trades.reduce((sum, t) => sum + (t.mistakes?.length ?? 0), 0);
  const mistakeRate = totalMistakes / trades.length;
  const consistencyScore = Math.max(0, 10 - mistakeRate * 3);

  return Math.round(Math.min(winScore + pfScore + rrScore + dayScore + consistencyScore, 100));
}

export function getThunderRadarData(stats: Stats) {
  return [
    {
      axis: 'Win %',
      value: Math.min(stats.tradeWinRate / 100, 1),
    },
    {
      axis: 'PF',
      value: Math.min(stats.profitFactor / 5, 1),
    },
    {
      axis: 'Avg W/L',
      value: stats.avgLoss > 0 ? Math.min(stats.avgWin / stats.avgLoss / 3, 1) : 0.5,
    },
    {
      axis: 'Consist.',
      value: Math.min(stats.dayWinRate / 100, 1),
    },
    {
      axis: 'Recovery',
      value: stats.netPnl >= 0 ? Math.min(stats.netPnl / 1000, 1) : 0,
    },
  ];
}
