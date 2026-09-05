import { useAdamData } from '../../data/useAdamData';
import { StatCard } from '../../components/kpi/StatCard';
import { Panel } from '../../components/layout/Panel';
import { LineChart } from '../../components/charts/LineChart';
import { colors, spacing } from '../../theme/tokens';

export function Activity() {
  const data = useAdamData();
  const { usage, tokens } = data;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xl, padding: spacing.xl }}>
      <header>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Activité</h1>
        <p style={{ color: colors.muted, fontSize: 13, margin: '4px 0 0' }}>
          Quand et combien · 90 derniers jours. Dernier message reçu : {data.meta.lastActivity}.
        </p>
      </header>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: spacing.lg }}>
        <StatCard label="DAU" value={usage.dau} hint="actifs sur 24 h" />
        <StatCard label="WAU" value={usage.wau} hint="actifs sur 7 jours" />
        <StatCard label="MAU" value={usage.mau} hint="actifs sur 30 jours" />
      </section>

      <Panel title="Utilisateurs actifs par jour (DAU)" subtitle="Utilisateurs distincts ayant envoyé au moins un message">
        <LineChart series={usage.dauSeries} />
      </Panel>

      <Panel
        title="Conversations par jour"
        subtitle={`${usage.conversations.total.toLocaleString('fr-CA')} conversations au total · ${usage.conversations.avgLength} questions par conversation en moyenne. Une conversation est comptée dès qu'une question y a été posée : ouvrir un espace facultaire sans rien demander n'en crée pas.`}
      >
        <LineChart series={usage.conversations.perDay} color={colors.peri} />
      </Panel>

      <Panel
        title="Tokens consommés par jour"
        subtitle={`${tokens.last30.toLocaleString('fr-CA')} tokens sur 30 jours · ${tokens.total.toLocaleString('fr-CA')} depuis le lancement`}
      >
        <LineChart series={tokens.perDay} color={colors.warn} />
      </Panel>
    </div>
  );
}
