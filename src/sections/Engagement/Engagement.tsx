import { useAdamData } from '../../data/useAdamData';
import { buildObjectives } from '../../lib/kpi';
import { StatCard } from '../../components/kpi/StatCard';
import { KpiCard } from '../../components/kpi/KpiCard';
import { Panel } from '../../components/layout/Panel';
import { CohortTable } from '../../components/charts/CohortTable';
import { colors, spacing } from '../../theme/tokens';

const OBJECTIVE_LABELS = ['Rétention J+7', 'Rétention J+30'];

export function Engagement() {
  const data = useAdamData();
  const { usage } = data;
  const built = buildObjectives(data.objectives).filter((o) => OBJECTIVE_LABELS.includes(o.label));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xl, padding: spacing.xl }}>
      <header>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Engagement</h1>
        <p style={{ color: colors.muted, fontSize: 13, margin: '4px 0 0' }}>
          Les utilisateurs reviennent-ils et s'investissent-ils ?
        </p>
      </header>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: spacing.lg }}>
        <StatCard label="Questions / actif (30 j)" value={usage.questionsPerUser} />
        <StatCard label="Conversations / actif (30 j)" value={usage.sessionsPerUser} />
        {built.map((o) => (
          <KpiCard key={o.label} objective={o} />
        ))}
      </section>

      <Panel
        title="Rétention par cohorte d'inscription"
        subtitle="Part de la cohorte encore active, semaine après semaine. Un point signale une semaine pas encore écoulée."
      >
        <CohortTable cohorts={usage.cohorts} />
      </Panel>
    </div>
  );
}
