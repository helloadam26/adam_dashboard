import { colors, radius, spacing } from '../../theme/tokens';

interface StatCardProps {
  label: string;
  value: string | number;
  hint?: string;
  deltaText?: string;
  deltaUp?: boolean;
}

export function StatCard({ label, value, hint, deltaText, deltaUp }: StatCardProps) {
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
        <div style={{ fontSize: 12, fontWeight: 600, color: deltaUp ? colors.ok : colors.alarm }}>{deltaText}</div>
      )}
      {hint && <div style={{ fontSize: 11, color: colors.muted }}>{hint}</div>}
    </div>
  );
}
