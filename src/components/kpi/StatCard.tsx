import { colors, radius, spacing } from '../../theme/tokens';
import { deltaColor, type DeltaTone } from '../../lib/kpi';

interface StatCardProps {
  label: string;
  value: string | number;
  hint?: string;
  deltaText?: string;
  /** Même règle que les cartes KPI : le vert est réservé à un vrai progrès. */
  deltaTone?: DeltaTone;
}

export function StatCard({ label, value, hint, deltaText, deltaTone = 'none' }: StatCardProps) {
  return (
    <div
      style={{
        background: colors.panel,
        border: `1px solid ${colors.line}`,
        borderRadius: radius.lg,
        padding: spacing.lg,
        display: 'flex',
        flexDirection: 'column',
        gap: spacing.xs,
        minWidth: 0,
      }}
    >
      <span style={{ fontSize: 11, fontWeight: 700, color: colors.faint, letterSpacing: '.04em', textTransform: 'uppercase' }}>
        {label}
      </span>
      <div style={{ fontSize: 28, fontWeight: 700, fontFamily: "'Montserrat',sans-serif", color: colors.text }}>{value}</div>
      {deltaText && (
        <div style={{ fontSize: 12, fontWeight: 600, color: deltaColor(deltaTone) }}>{deltaText}</div>
      )}
      {hint && <div style={{ fontSize: 11, color: colors.muted }}>{hint}</div>}
    </div>
  );
}
