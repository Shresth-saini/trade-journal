'use client';

import { useMemo } from 'react';
import { Trade } from '@/types';

interface Props {
  trades: Trade[];
}

export default function PsychologyPage({ trades }: Props) {
  // Aggregate by Emotion (psychologyBefore)
  const emotionStats = useMemo(() => {
    const map = new Map<string, { wins: number; count: number }>();
    trades.forEach(t => {
      const emotion = t.psychologyBefore || 'Neutral';
      if (!map.has(emotion)) map.set(emotion, { wins: 0, count: 0 });
      const s = map.get(emotion)!;
      s.count += 1;
      if (t.pnl > 0) s.wins += 1;
    });

    return Array.from(map.entries()).map(([name, s]) => ({
      name,
      ...s,
      winRate: s.count > 0 ? (s.wins / s.count) * 100 : 0,
    })).sort((a,b) => b.count - a.count);
  }, [trades]);

  // Aggregate by Mistake
  const mistakeStats = useMemo(() => {
    const map = new Map<string, { wins: number; count: number }>();
    let totalMistakesCount = 0;
    trades.forEach(t => {
      if (!t.mistakes || t.mistakes.length === 0) return;
      t.mistakes.forEach(mis => {
        if (!map.has(mis)) map.set(mis, { wins: 0, count: 0 });
        const s = map.get(mis)!;
        s.count += 1;
        totalMistakesCount += 1;
        if (t.pnl > 0) s.wins += 1;
      });
    });

    return {
      total: totalMistakesCount,
      list: Array.from(map.entries()).map(([name, s]) => ({
        name,
        ...s,
        occurrence: totalMistakesCount > 0 ? (s.count / totalMistakesCount) * 100 : 0
      })).sort((a,b) => b.count - a.count)
    };
  }, [trades]);

  return (
    <div className="analytics-root fade-in">
      <div className="aly-grid-2">
        {/* Win Rate by Emotion */}
        <div className="cal-panel">
          <div className="aly-panel-head">WIN RATE BY EMOTION</div>
          <div className="aly-panel-body" style={{ minHeight: 250, display: 'flex', flexDirection: 'column', gap: 20 }}>
            {emotionStats.length === 0 ? (
              <div className="aly-empty">No emotion data yet</div>
            ) : (
              emotionStats.map(em => (
                <div key={em.name}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 6 }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{em.name}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{em.count} trades</div>
                    </div>
                    <div className={em.winRate >= 50 ? 'green aly-bold' : 'red aly-bold'} style={{ fontSize: 12 }}>
                      {em.winRate.toFixed(0)}%
                    </div>
                  </div>
                  <div style={{ height: 4, background: 'var(--bg-input)', borderRadius: 2, position: 'relative', overflow: 'hidden' }}>
                    <div style={{ 
                      height: '100%', 
                      width: `${em.winRate}%`, 
                      background: em.winRate >= 50 ? 'var(--accent-green)' : 'var(--accent-red)', 
                      borderRadius: 2 
                    }} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Mistakes */}
        <div className="cal-panel">
          <div className="aly-panel-head">MISTAKES</div>
          <div className="aly-panel-body" style={{ minHeight: 250, display: 'flex', flexDirection: 'column', gap: 20 }}>
            {mistakeStats.list.length === 0 ? (
              <div className="aly-empty">No mistakes</div>
            ) : (
              mistakeStats.list.map(mis => (
                <div key={mis.name}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 6 }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{mis.name}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{mis.count} occurrences</div>
                    </div>
                    <div className="red aly-bold" style={{ fontSize: 12 }}>
                      {mis.occurrence.toFixed(0)}% Frequency
                    </div>
                  </div>
                  <div style={{ height: 4, background: 'var(--bg-input)', borderRadius: 2, position: 'relative', overflow: 'hidden' }}>
                    <div style={{ 
                      height: '100%', 
                      width: `${mis.occurrence}%`, 
                      background: 'var(--accent-red)', 
                      borderRadius: 2 
                    }} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
