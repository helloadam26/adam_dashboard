import { colors, radius, spacing } from '../../theme/tokens';
import type { BuiltObjective } from '../../lib/kpi';

interface KpiCardProps {
  objective: BuiltObjective;
}

export function KpiCard({ objective }: KpiCardProps) {
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
      <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: colors.faint, letterSpacing: '.04em', textTransform: 'uppercase' }}>
          {objective.label}
        </span>
        <span style={{ marginLeft: 'auto', width: 7, height: 7, borderRadius: 99, background: objective.statusColor }} />
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, fontFamily: "'Montserrat',sans-serif", color: colors.text }}>
        {objective.actualTxt}
      </div>
      <div style={{ fontSize: 12, fontWeight: 600, color: objective.deltaUp ? colors.ok : colors.alarm }}>
        {objective.deltaUp ? '+' : ''}
        {objective.delta.toLocaleString('fr-CA', { maximumFractionDigits: 2 })} vs préc.
      </div>
      <div style={{ fontSize: 11, color: colors.muted }}>cible {objective.targetTxt}</div>
    </div>
  );
}
