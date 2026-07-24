import { useAdamData } from '../../data/useAdamData';
import { StatCard } from '../../components/kpi/StatCard';
import { Panel } from '../../components/layout/Panel';
import { Donut, DonutLegend } from '../../components/charts/Donut';
import { BarList } from '../../components/charts/BarList';
import { colors, spacing } from '../../theme/tokens';

export function Users() {
  const data = useAdamData();
  const { users } = data;

  const statusColors = [colors.ok, colors.faint, colors.warn];
  const statusTotal = users.status.reduce((a, b) => a + b.n, 0);
  const statusSegments = users.status.map((s, i) => ({
    name: s.label,
    val: Math.round((s.n / statusTotal) * 100),
    color: statusColors[i % statusColors.length],
  }));

  const facultyItems = users.byFaculty.map((f) => ({ name: f.name, value: f.n }));

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

        <Panel title="Répartition par faculté">
          <BarList items={facultyItems} />
        </Panel>
      </section>
    </div>
  );
}
