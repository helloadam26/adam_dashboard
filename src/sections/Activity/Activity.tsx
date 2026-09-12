import { useAdamData } from '../../data/useAdamData';
import { StatCard } from '../../components/kpi/StatCard';
import { Panel } from '../../components/layout/Panel';
import { LineChart } from '../../components/charts/LineChart';
import { colors, spacing } from '../../theme/tokens';
import { nombre, nombreSouple } from '../../lib/format';

export function Activity() {
  const data = useAdamData();
  const { usage, quota } = data;

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
        <LineChart series={usage.dauSeries} labels={data.dates} />
      </Panel>

      <Panel
        title="Conversations par jour"
        subtitle={`${nombre(usage.conversations.total)} conversations au total · ${nombreSouple(usage.conversations.avgLength)} questions par conversation en moyenne. Une conversation est comptée dès qu'une question y a été posée : ouvrir un espace facultaire sans rien demander n'en crée pas.`}
      >
        <LineChart series={usage.conversations.perDay} labels={data.dates} color={colors.peri} />
      </Panel>

      <Panel
        title="Questions décomptées du quota, par jour"
        subtitle={
          `${nombre(quota.counted30d)} questions décomptées sur 30 jours · ` +
          `${nombre(quota.counted)} au total. Unité : une question posée, décomptée d'un ` +
          `plafond quotidien usuel de ${nombre(quota.usualLimit)}. Ce ne sont pas des tokens ` +
          `de modèle ni un coût.`
        }
      >
        <LineChart series={quota.perDay} labels={data.dates} color={colors.warn} />

        {/* Le compteur de quota persiste quand une conversation disparaît : les deux
            mesures divergent, et masquer l'écart reviendrait à en cacher une. */}
        {quota.counted30d > usage.questionsStored30d && (
          <div style={{ fontSize: 12, color: colors.muted, marginTop: spacing.md, lineHeight: 1.6 }}>
            Sur ces 30 jours, {nombre(quota.counted30d)} questions ont été décomptées mais{' '}
            {nombre(usage.questionsStored30d)} sont encore stockées. Le compteur de quota
            survit à la suppression d'une conversation : l'écart mesure ce que les étudiants ont effacé,
            pas une erreur de comptage.
          </div>
        )}
      </Panel>

      <Panel
        title="Pression du plafond quotidien"
        subtitle="Un plafond souvent atteint bride l'usage avant que les autres indicateurs ne le montrent"
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: spacing.lg }}>
          <StatCard
            label="Consommation moyenne"
            value={`${nombreSouple(quota.avgUsedOnActiveDays, 1)} / ${nombre(quota.usualLimit)}`}
            hint="questions par jour actif, sur le plafond usuel"
          />
          <StatCard
            label="Jours au plafond"
            value={quota.daysAtLimit}
            hint={`sur ${nombre(quota.activeDays)} jours actifs`}
          />
          <StatCard label="Comptes ayant atteint le plafond" value={quota.usersAtLimit} hint="au moins une fois" />
        </div>
      </Panel>
    </div>
  );
}
