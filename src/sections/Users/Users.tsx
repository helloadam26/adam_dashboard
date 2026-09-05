import { useAdamData } from '../../data/useAdamData';
import { StatCard } from '../../components/kpi/StatCard';
import { Panel } from '../../components/layout/Panel';
import { Donut, DonutLegend } from '../../components/charts/Donut';
import { LineChart } from '../../components/charts/LineChart';
import { DistributionPanel } from '../../components/DistributionPanel';
import { colors, spacing } from '../../theme/tokens';

export function Users() {
  const data = useAdamData();
  const { users } = data;

  const statusColors = [colors.ok, colors.warn, colors.peri, colors.faint];
  const statusTotal = users.status.reduce((a, b) => a + b.n, 0);
  const statusSegments = users.status.map((s, i) => ({
    name: s.label,
    val: statusTotal ? Math.round((s.n / statusTotal) * 100) : 0,
    color: statusColors[i % statusColors.length],
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xl, padding: spacing.xl }}>
      <header>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Utilisateurs</h1>
        <p style={{ color: colors.muted, fontSize: 13, margin: '4px 0 0' }}>Qui utilise ADAM.</p>
      </header>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: spacing.lg }}>
        <StatCard label="Total comptes" value={users.total} />
        <StatCard label="Nouveaux (7 derniers jours)" value={`+${users.new7}`} />
        <StatCard label="Nouveaux aujourd'hui" value={`+${users.newToday}`} />
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: spacing.lg }}>
        <Panel title="Statut des comptes">
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.lg }}>
            <Donut segments={statusSegments} />
            <div style={{ flex: 1 }}>
              <DonutLegend segments={statusSegments} />
            </div>
          </div>
          <div style={{ marginTop: spacing.md, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {users.status.map((s) => (
              <div key={s.label} style={{ fontSize: 11.5, color: colors.faint }}>
                {s.label} ({s.n}) — {s.hint}
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Inscriptions par jour" subtitle="90 derniers jours">
          <LineChart series={users.signups} height={220} />
        </Panel>
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: spacing.lg }}>
        <DistributionPanel
          title="Répartition par faculté"
          distribution={users.byFaculty}
          requis="Renseigner profiles.faculty à l'inscription dans l'app ADAM."
        />
        <DistributionPanel
          title="Répartition par programme"
          distribution={users.byProgram}
          requis="Renseigner profiles.program à l'inscription dans l'app ADAM."
        />
        <DistributionPanel
          title="Répartition par année d'étude"
          distribution={users.byYear}
          requis="Renseigner profiles.study_years à l'inscription dans l'app ADAM."
        />
        <DistributionPanel
          title="Statut de résidence"
          distribution={users.byResidency}
          requis="Renseigner profiles.statut (Canadian / International) à l'inscription dans l'app ADAM."
        />
      </section>
    </div>
  );
}
