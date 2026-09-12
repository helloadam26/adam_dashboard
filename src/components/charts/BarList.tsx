import { colors } from '../../theme/tokens';
import { nombre } from '../../lib/format';

export interface BarListItem {
  name: string;
  value: number;
}

interface BarListProps {
  items: BarListItem[];
  unit?: string;
  color?: string;
}

export function BarList({ items, unit = '', color = colors.indigo }: BarListProps) {
  const max = Math.max(...items.map((it) => it.value), 1);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {items.map((it) => (
        <div key={it.name}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 4 }}>
            <span style={{ color: colors.text }}>{it.name}</span>
            <span style={{ color: colors.muted, fontWeight: 600 }}>
              {nombre(it.value)}
              {unit}
            </span>
          </div>
          <div style={{ height: 6, borderRadius: 99, background: 'rgba(255,255,255,.06)' }}>
            <div
              style={{
                height: '100%',
                width: `${(it.value / max) * 100}%`,
                borderRadius: 99,
                background: color,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
