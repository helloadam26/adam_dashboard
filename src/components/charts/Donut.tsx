/**
 * Portage de la méthode donut() du prototype — anneau de répartition
 * (mix de catégories, ex. types de réponse ADAM).
 */
import { colors } from '../../theme/tokens';
import { pourcent } from '../../lib/format';

export interface DonutSegment {
  name: string;
  val: number;
  color: string;
}

interface DonutProps {
  segments: DonutSegment[];
  size?: number;
}

export function Donut({ segments, size = 140 }: DonutProps) {
  const r = 38;
  const c = 2 * Math.PI * r;
  const cx = size / 2;
  const cy = size / 2;
  let off = 0;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block', margin: '0 auto' }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,.05)" strokeWidth={13} />
      {segments.map((seg, i) => {
        const len = (c * seg.val) / 100;
        const el = (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={seg.color}
            strokeWidth={13}
            strokeDasharray={`${len} ${c - len}`}
            strokeDashoffset={-off}
            transform={`rotate(-90 ${cx} ${cy})`}
          />
        );
        off += len;
        return el;
      })}
    </svg>
  );
}

export function DonutLegend({ segments }: { segments: DonutSegment[] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {segments.map((seg) => (
        <div key={seg.name} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5 }}>
          <span style={{ width: 9, height: 9, borderRadius: 99, background: seg.color, flex: '0 0 auto' }} />
          <span style={{ color: colors.text, flex: 1 }}>{seg.name}</span>
          <span style={{ color: colors.muted, fontWeight: 600 }}>{pourcent(seg.val)}</span>
        </div>
      ))}
    </div>
  );
}
