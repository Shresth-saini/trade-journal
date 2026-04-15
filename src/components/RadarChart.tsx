'use client';

import { useMemo } from 'react';

interface RadarDataPoint {
  axis: string;
  value: number; // 0 to 1
}

interface Props {
  data: RadarDataPoint[];
  size?: number;
}

export default function RadarChart({ data, size = 180 }: Props) {
  const cx = size / 2;
  const cy = size / 2;
  const maxRadius = size * 0.38;
  const levels = 4;

  const validData = useMemo(() => {
    return data.map(d => ({
      ...d,
      value: isNaN(d.value) ? 0 : d.value
    }));
  }, [data]);

  const angles = useMemo(() => {
    const len = validData.length || 1;
    return validData.map((_, i) => {
      return (i / len) * 2 * Math.PI - Math.PI / 2;
    });
  }, [validData]);

  const getPoint = (angle: number, radius: number) => {
    const r = isNaN(radius) ? 0 : radius;
    const a = isNaN(angle) ? 0 : angle;
    return {
      x: cx + r * Math.cos(a),
      y: cy + r * Math.sin(a),
    };
  };

  // Grid circles
  const gridCircles = Array.from({ length: levels }, (_, i) => {
    const r = ((i + 1) / levels) * maxRadius;
    const points = angles.map((a) => getPoint(a, r));
    return points.map((p, j) => `${j === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ') + 'Z';
  });

  // Axis lines
  const axisLines = angles.map((angle) => {
    const end = getPoint(angle, maxRadius);
    return `M${cx},${cy} L${end.x},${end.y}`;
  });

  // Data polygon
  const dataPoints = validData.map((d, i) => {
    const point = getPoint(angles[i], d.value * maxRadius);
    return point;
  });
  const dataPath =
    dataPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ') + 'Z';

  // Labels
  const labelOffset = maxRadius + 18;
  const labels = validData.map((d, i) => {
    const p = getPoint(angles[i], labelOffset);
    return { ...p, text: d.axis };
  });

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ overflow: 'visible' }}
    >
      {/* Grid */}
      {gridCircles.map((d, i) => (
        <path
          key={i}
          d={d}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={1}
        />
      ))}

      {/* Axes */}
      {axisLines.map((d, i) => (
        <path
          key={i}
          d={d}
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={1}
        />
      ))}

      {/* Data polygon fill */}
      <path
        d={dataPath}
        fill="rgba(100, 65, 255, 0.3)"
        stroke="#7c4dff"
        strokeWidth={2}
      />

      {/* Data points */}
      {dataPoints.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={3}
          fill="#9e7fff"
          stroke="rgba(124,77,255,0.4)"
          strokeWidth={6}
        />
      ))}

      {/* Labels */}
      {labels.map((l, i) => (
        <text
          key={i}
          x={l.x}
          y={l.y}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="rgba(200,200,220,0.6)"
          fontSize={9}
          fontFamily="Inter, sans-serif"
          fontWeight={500}
        >
          {l.text}
        </text>
      ))}
    </svg>
  );
}
