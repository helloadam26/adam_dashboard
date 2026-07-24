import { colors } from '../theme/tokens';

export interface RankedItem {
  label: string;
  value: number;
  note?: string;
  trend?: 'up' | 'down' | 'flat';
}

function TrendIcon({ trend }: { trend?: 'up' | 'down' | 'flat' }) {
  if (!trend) return null;
  const color = trend === 'up' ? colors.ok : trend === 'down' ? colors.alarm : colors.faint;
  const d = trend === 'up' ? 'M4 15l6-6 4 4 6-8' : trend === 'down' ? 'M4 9l6 6 4-4 6 8' : 'M4 12h16';
  return (
    <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

interface RankedListProps {
  items: RankedItem[];
  valueLabel?: string;
}

export function RankedList({ items, valueLabel = '' }: RankedListProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {items.map((it, i) => (
        <div
          key={it.label}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px 0',
            borderBottom: i < items.length - 1 ? `1px solid ${colors.line}` : 'none',
          }}
        >
          <span style={{ fontSize: 11, fontWeight: 700, color: colors.faint, width: 16 }}>{i + 1}</span>
          <span style={{ fontSize: 13, color: colors.text, flex: 1 }}>{it.label}</span>
          {it.note && <span style={{ fontSize: 11.5, color: colors.faint }}>{it.note}</span>}
          <TrendIcon trend={it.trend} />
          <span style={{ fontSize: 13, fontWeight: 700, color: colors.text, minWidth: 40, textAlign: 'right' }}>
            {it.value}
            {valueLabel}
          </span>
        </div>
      ))}
    </div>
  );
}
