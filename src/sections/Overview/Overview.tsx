import { useAdamData } from '../../data/useAdamData';
import { buildObjectives, pilotHealth } from '../../lib/kpi';
import { LineChart } from '../../components/charts/LineChart';
import { Ring } from '../../components/charts/Ring';
import { KpiCard } from '../../components/kpi/KpiCard';
import { ObjectivesPanel } from '../../components/kpi/ObjectivesPanel';
import { colors, radius, spacing } from '../../theme/tokens';

const CRITICAL_LABELS = ['Comptes créés', 'Utilisateurs actifs (WAU)', 'Rétention J+7', 'Satisfaction réponses'];

export function Overview() {
  const data = useAdamData();
  const built = buildObjectives(data.objectives);
  const health = pilotHealth(built);
  const critical = built.filter((b) => CRITICAL_LABELS.includes(b.label));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xl, padding: spacing.xl }}>
      <header>
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Vue d'ensemble</h1>
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12,
              fontWeight: 700,
              color: health.color,
              background: 'rgba(255,255,255,.04)',
              border: `1px solid ${colors.line}`,
              borderRadius: 99,
              padding: '4px 10px',
            }}
          >
            <span style={{ width: 7, height: 7, borderRadius: 99, background: health.color }} />
            Santé du pilote : {health.label}
          </span>
        </div>
        <p style={{ color: colors.muted, fontSize: 13, margin: '4px 0 0' }}>
          L'état d'ADAM en un coup d'œil — qui l'utilise, comment, et s'il atteint ses objectifs.
        </p>
      </header>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: spacing.lg }}>
        {critical.map((o) => (
          <KpiCard key={o.label} objective={o} />
        ))}
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: spacing.lg }}>
        <div
          style={{
            background: colors.panel,
            border: `1px solid ${colors.line}`,
            borderRadius: radius.lg,
            padding: spacing.lg,
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>Utilisateurs actifs</div>
          <div style={{ fontSize: 12, color: colors.muted, marginBottom: spacing.md }}>
            DAU quotidien · 90 derniers jours
          </div>
          <LineChart series={data.usage.dauSeries} />
        </div>

        <div
          style={{
            background: colors.panel,
            border: `1px solid ${colors.line}`,
            borderRadius: radius.lg,
            padding: spacing.lg,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 700, alignSelf: 'flex-start', marginBottom: spacing.sm }}>
            % Objectifs atteints
          </div>
          <Ring value={health.achieved} total={health.total} color={health.color} />
        </div>
      </section>

      <section>
        <ObjectivesPanel built={built} />
      </section>
    </div>
  );
}
