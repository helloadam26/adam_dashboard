import { colors, radius, spacing } from '../../theme/tokens';
import type { BuiltObjective } from '../../lib/kpi';

interface ObjectivesPanelProps {
  built: BuiltObjective[];
  /** Avant le lancement, les cibles ne sont pas encore exigibles — on le dit. */
  phase: 'avant-lancement' | 'en-cours';
  launchDate: string;
}

/**
 * Une pastille par objectif, colorée par statut. Remplace l'ancienne jauge circulaire :
 * l'anneau dessinait un fond gris complet en permanence, si bien qu'un score de 0 sur 7
 * se lisait comme un anneau plein — le visuel ne reflétait pas la valeur.
 */
function ObjectiveDots({ built }: { built: BuiltObjective[] }) {
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {built.map((b) => (
        <span
          key={b.label}
          title={`${b.label} — ${b.actualTxt} / ${b.targetTxt} · ${b.statusLabel}`}
          style={{
            width: 26,
            height: 8,
            borderRadius: 99,
            background: b.status === 'ok' ? colors.ok : 'transparent',
            border: `1.5px solid ${b.statusColor}`,
            opacity: b.status === 'unknown' ? 0.55 : 1,
          }}
        />
      ))}
    </div>
  );
}

export function ObjectivesPanel({ built, phase, launchDate }: ObjectivesPanelProps) {
  const achieved = built.filter((b) => b.status === 'ok').length;
  const unmeasured = built.filter((b) => b.status === 'unknown');
  const priority = built
    .filter((b) => b.status !== 'ok' && b.ratio !== null)
    .sort((a, b) => (a.ratio as number) - (b.ratio as number))
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
      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>Objectifs atteints</div>
      <div style={{ fontSize: 32, fontWeight: 700, marginBottom: spacing.sm }}>
        {achieved}
        <span style={{ fontSize: 16, color: colors.muted, fontWeight: 600 }}> / {built.length}</span>
      </div>

      <ObjectiveDots built={built} />

      <div style={{ fontSize: 11.5, color: colors.muted, margin: `${spacing.sm}px 0 ${spacing.lg}px` }}>
        {phase === 'avant-lancement'
          ? `Cibles de fin de pilote — le pilote démarre le ${launchDate}, elles ne sont pas encore exigibles.`
          : 'Cibles de fin de pilote.'}
        {unmeasured.length > 0 && ` ${unmeasured.length} objectif(s) sans donnée, exclus du décompte.`}
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
          <div style={{ fontSize: 12, color: colors.muted }}>
            {unmeasured.length === built.length
              ? "Aucun objectif n'est mesurable aujourd'hui."
              : 'Tous les objectifs mesurés sont atteints.'}
          </div>
        )}
      </div>

      {unmeasured.length > 0 && (
        <>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: colors.faint,
              letterSpacing: '.04em',
              margin: `${spacing.lg}px 0 ${spacing.xs}px`,
            }}
          >
            NON MESURÉS
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {unmeasured.map((b) => (
              <div key={b.label} style={{ fontSize: 12.5, color: colors.muted }}>
                {b.label} — aucune donnée derrière cet indicateur (voir{' '}
                <em>Paramètres → Métriques non disponibles</em>).
              </div>
            ))}
          </div>
        </>
      )}
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
