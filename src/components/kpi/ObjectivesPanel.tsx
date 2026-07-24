import { colors, radius, spacing } from '../../theme/tokens';
import type { BuiltObjective } from '../../lib/kpi';

interface ObjectivesPanelProps {
  built: BuiltObjective[];
}

export function ObjectivesPanel({ built }: ObjectivesPanelProps) {
  const achieved = built.filter((b) => b.status === 'ok').length;
  const priority = built
    .filter((b) => b.status !== 'ok')
    .sort((a, b) => a.ratio - b.ratio)
    .slice(0, 3);

  return (
    <div
      style={{
        background: colors.panel,
        border: `1px solid ${colors.line}`,
        borderRadius: radius.lg,
        padding: spacing.lg,
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>Objectifs du pilote</div>
      <div style={{ fontSize: 32, fontWeight: 700, marginBottom: spacing.md }}>
        {achieved}
        <span style={{ fontSize: 16, color: colors.muted, fontWeight: 600 }}> / {built.length} atteints</span>
      </div>

      <div style={{ fontSize: 11, fontWeight: 700, color: colors.faint, letterSpacing: '.04em', marginBottom: spacing.xs }}>
        À TRAITER EN PRIORITÉ
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
        {priority.map((b) => (
          <div key={b.label} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 600 }}>
              <span>{b.label}</span>
              <span style={{ color: b.statusColor }}>
                {b.actualTxt} / {b.targetTxt}
              </span>
            </div>
            <div style={{ fontSize: 11.5, color: colors.muted }}>{priorityHint(b.label)}</div>
          </div>
        ))}
        {priority.length === 0 && (
          <div style={{ fontSize: 12, color: colors.muted }}>Tous les objectifs sont atteints.</div>
        )}
      </div>
    </div>
  );
}

function priorityHint(label: string): string {
  const hints: Record<string, string> = {
    'Rétention J+7': 'Relancer les inactifs, renforcer la valeur dès la 1re semaine',
    'Rétention J+30': 'Travailler la rétention long terme post-rentrée',
    'Stickiness (DAU/MAU)': "Installer un usage quotidien dès les premières semaines",
  };
  return hints[label] ?? 'Écart à la cible — à discuter en revue hebdo';
}
