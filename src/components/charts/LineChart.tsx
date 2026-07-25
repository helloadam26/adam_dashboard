/**
 * Portage de la méthode lineChart() du prototype
 * (ressources/Dashboard interne d'ADAM/Dashboard ADAM.dc.html).
 *
 * Les repères de calendrier académique du prototype ont été retirés :
 * aucune table ne porte ces dates.
 */
import { useId } from 'react';
import { colors } from '../../theme/tokens';

interface LineChartProps {
  series: number[];
  color?: string;
  height?: number;
}

export function LineChart({ series, color = colors.indigo, height = 200 }: LineChartProps) {
  const gradientId = useId();
  const w = 640;
  const pl = 8;
  const pr = 8;
  const pt = 14;
  const pb = 12;
  const n = series.length;

  if (n < 2) {
    return (
      <div
        style={{
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 12,
          color: colors.faint,
        }}
      >
        Pas assez de points sur la période.
      </div>
    );
  }

  // Une série entièrement à zéro donnerait une échelle nulle : on force un plafond de 1.
  const mx = Math.max(...series, 1) * 1.12;

  const px = (i: number) => pl + (i * (w - pl - pr)) / (n - 1);
  const py = (v: number) => height - pb - (v / mx) * (height - pb - pt);
  const pts = series.map((v, i) => [px(i), py(v)] as const);

  const line = pts.map((q, i) => (i ? 'L' : 'M') + q[0].toFixed(1) + ' ' + q[1].toFixed(1)).join(' ');
  const area = line + ` L ${px(n - 1).toFixed(1)} ${height - pb} L ${px(0).toFixed(1)} ${height - pb} Z`;

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${w} ${height}`} preserveAspectRatio="none">
      <line x1={pl} y1={height - pb} x2={w - pr} y2={height - pb} stroke="rgba(255,255,255,.06)" />

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
