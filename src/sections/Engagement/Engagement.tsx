import { useAdamData } from '../../data/useAdamData';
import { buildObjectives } from '../../lib/kpi';
import { StatCard } from '../../components/kpi/StatCard';
import { KpiCard } from '../../components/kpi/KpiCard';
import { colors, spacing } from '../../theme/tokens';

const OBJECTIVE_LABELS = ['Clic sur suggestions', 'Rétention J+7'];

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
        <StatCard label="Questions / utilisateur (médiane)" value={usage.questionsPerUser} />
        <StatCard label="Sessions / utilisateur / sem." value={usage.sessionsPerUser} />
        {built.map((o) => (
          <KpiCard key={o.label} objective={o} />
        ))}
      </section>
    </div>
  );
}
