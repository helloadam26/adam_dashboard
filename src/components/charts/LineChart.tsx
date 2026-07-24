/**
 * Portage de la méthode lineChart() du prototype
 * (ressources/Dashboard interne d'ADAM/Dashboard ADAM.dc.html).
 */
import { useId } from 'react';
import type { CalendarMark } from '../../data/types';
import { colors } from '../../theme/tokens';

interface LineChartProps {
  series: number[];
  events?: CalendarMark[];
  color?: string;
  height?: number;
}

export function LineChart({ series, events = [], color = colors.indigo, height = 200 }: LineChartProps) {
  const gradientId = useId();
  const w = 640;
  const pl = 8;
  const pr = 8;
  const pt = 14;
  const pb = events.length ? 26 : 12;
  const n = series.length;
  const mx = Math.max(...series) * 1.12;

  const px = (i: number) => pl + (i * (w - pl - pr)) / (n - 1);
  const py = (v: number) => height - pb - (v / mx) * (height - pb - pt);
  const pts = series.map((v, i) => [px(i), py(v)] as const);

  const line = pts.map((q, i) => (i ? 'L' : 'M') + q[0].toFixed(1) + ' ' + q[1].toFixed(1)).join(' ');
  const area = line + ` L ${px(n - 1).toFixed(1)} ${height - pb} L ${px(0).toFixed(1)} ${height - pb} Z`;

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${w} ${height}`} preserveAspectRatio="none">
      <line x1={pl} y1={height - pb} x2={w - pr} y2={height - pb} stroke="rgba(255,255,255,.06)" />

      {events.map((ev, k) => (
        <g key={k}>
          {ev.span ? (
            <rect
              x={px(ev.i)}
              y={pt - 2}
              width={px(ev.i + ev.span) - px(ev.i)}
              height={height - pb - pt + 2}
              fill="rgba(255,255,255,.035)"
            />
          ) : null}
          <line
            x1={px(ev.i)}
            y1={pt - 2}
            x2={px(ev.i)}
            y2={height - pb}
            stroke="rgba(255,255,255,.14)"
            strokeWidth={1}
            strokeDasharray="3 3"
          />
          <text
            x={px(ev.i)}
            y={height - pb + 14}
            fill="#6E6E80"
            fontSize={9}
            fontWeight={600}
            fontFamily="Montserrat"
            textAnchor={ev.i < 8 ? 'start' : ev.i > n - 9 ? 'end' : 'middle'}
          >
            {ev.short}
          </text>
        </g>
      ))}

      <defs>
        <linearGradient id={gradientId} x1={0} y1={0} x2={0} y2={1}>
          <stop offset="0%" stopColor={color} stopOpacity={0.22} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradientId})`} />
      <path d={line} fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts[n - 1][0]} cy={pts[n - 1][1]} r={3.4} fill={color} stroke="#121217" strokeWidth={2} />
    </svg>
  );
}
