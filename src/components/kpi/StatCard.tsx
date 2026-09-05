import { colors, radius, spacing } from '../../theme/tokens';
import { deltaColor, type DeltaTone } from '../../lib/kpi';
import { isLowSample, sampleWarning, type Sample } from '../../lib/sample';

interface StatCardProps {
  label: string;
  value: string | number;
  hint?: string;
  deltaText?: string;
  /** Même règle que les cartes KPI : le vert est réservé à un vrai progrès. */
  deltaTone?: DeltaTone;
  /** Observations derrière la valeur, quand c'est un ratio. Sous le seuil, la valeur est grisée et annotée. */
  sample?: Sample;
}

export function StatCard({ label, value, hint, deltaText, deltaTone = 'none', sample }: StatCardProps) {
  const low = isLowSample(sample);

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
      <div
        style={{
          fontSize: 28,
          fontWeight: 700,
          fontFamily: "'Montserrat',sans-serif",
          color: low ? colors.faint : colors.text,
        }}
      >
        {value}
      </div>
      {low && sample && (
        <div style={{ fontSize: 11, fontWeight: 600, color: colors.warn, lineHeight: 1.4 }}>
          {sampleWarning(sample)}
        </div>
      )}
      {deltaText && (
        <div style={{ fontSize: 12, fontWeight: 600, color: deltaColor(deltaTone) }}>{deltaText}</div>
      )}
      {hint && <div style={{ fontSize: 11, color: colors.muted }}>{hint}</div>}
    </div>
  );
}
