/**
 * Portage de la méthode ring() du prototype — grand chiffre + jauge circulaire,
 * utilisé pour "% Objectifs atteints".
 */
import { colors } from '../../theme/tokens';

interface RingProps {
  value: number;
  total: number;
  color?: string;
}

export function Ring({ value, total, color = colors.indigo }: RingProps) {
  const size = 160;
  const r = 64;
  const c = 2 * Math.PI * r;
  const cx = size / 2;
  const cy = size / 2;
  const frac = total > 0 ? value / total : 0;

  return (
    <svg width="100%" height="auto" viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,.07)" strokeWidth={12} />
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={12}
        strokeLinecap="round"
        strokeDasharray={`${frac * c} ${c}`}
        transform={`rotate(-90 ${cx} ${cy})`}
      />
      <text x={cx} y={cy - 4} textAnchor="middle" fill={colors.text} fontSize={40} fontWeight={700} fontFamily="Montserrat">
        {value}
      </text>
      <text x={cx} y={cy + 20} textAnchor="middle" fill={colors.muted} fontSize={15} fontWeight={600} fontFamily="Montserrat">
        sur {total}
      </text>
    </svg>
  );
}
