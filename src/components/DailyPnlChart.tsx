'use client';

import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  CartesianGrid,
} from 'recharts';

interface BarDataPoint {
  date: string;
  value: number;
}

interface Props {
  data: BarDataPoint[];
  height?: number;
  formatDate?: (d: string) => string;
}

// ─── Tooltip ─────────────────────────────────────────────────────────────────
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

export default function DailyPnlChart({ data, height = 210, formatDate }: Props) {
  // Ensure we have at least 7 columns on the X-axis to prevent 1 fat bar.
  const chartData = useMemo(() => {
    const minDays = 7;
    const paddingCount = Math.max(0, minDays - data.length);
    const padded = [...data];
    // Add empty spacer items if we have less than 7 days
    for (let i = 0; i < paddingCount; i++) {
       padded.push({ date: `empty-${i}`, value: 0 });
    }
    return padded;
  }, [data]);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
        <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
        <XAxis 
          dataKey="date" 
          tick={({ x, y, payload }) => {
            if (payload.value.startsWith('empty-')) return <g />;
            const label = formatDate ? formatDate(payload.value) : payload.value.slice(5);
            return (
              <text x={x} y={y + 12} fill="#444460" fontSize={10} textAnchor="middle">
                {label}
              </text>
            );
          }}
          tickLine={false} 
          axisLine={false} 
        />
        <YAxis 
          tick={{ fill: '#444460', fontSize: 10 }} 
          tickLine={false} 
          axisLine={false} 
          tickFormatter={(v) => `$${v}`} 
          width={44} 
        />
        <Tooltip cursor={{ fill: 'rgba(255,255,255,0.02)' }} content={<ChartTooltip />} />
        <ReferenceLine y={0} stroke="rgba(255,255,255,0.08)" />
        <Bar dataKey="value" radius={[2, 2, 2, 2]} maxBarSize={30}>
          {chartData.map((entry, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={entry.value >= 0 ? '#00e676' : '#ff5252'} 
              style={{ opacity: entry.value === 0 && entry.date.startsWith('empty-') ? 0 : 0.85 }}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
