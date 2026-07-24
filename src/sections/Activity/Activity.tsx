import { useAdamData } from '../../data/useAdamData';
import { StatCard } from '../../components/kpi/StatCard';
import { Panel } from '../../components/layout/Panel';
import { LineChart } from '../../components/charts/LineChart';
import { colors, spacing } from '../../theme/tokens';

export function Activity() {
  const data = useAdamData();
  const { usage } = data;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xl, padding: spacing.xl }}>
      <header>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Activité</h1>
        <p style={{ color: colors.muted, fontSize: 13, margin: '4px 0 0' }}>Quand et combien.</p>
      </header>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: spacing.lg }}>
        <StatCard label="DAU" value={usage.dau} hint="utilisateurs actifs aujourd'hui" />
        <StatCard label="WAU" value={usage.wau} hint="utilisateurs actifs (7 jours)" />
        <StatCard label="MAU" value={usage.mau} hint="utilisateurs actifs (30 jours)" />
      </section>

      <Panel title="Utilisateurs actifs par jour (DAU)" subtitle="Repères du calendrier académique en surimpression">
        <LineChart series={usage.dauSeries} events={data.calendar} />
      </Panel>

      <Panel title="Volume de questions par jour" subtitle={`${usage.conversations.total.toLocaleString('fr-CA')} conversations sur la période`}>
        <LineChart series={usage.conversations.perDay} events={data.calendar} color={colors.peri} />
      </Panel>
    </div>
  );
}
