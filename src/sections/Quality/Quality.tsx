import { useAdamData } from '../../data/useAdamData';
import { StatCard } from '../../components/kpi/StatCard';
import { Panel } from '../../components/layout/Panel';
import { Donut, DonutLegend } from '../../components/charts/Donut';
import { RankedList } from '../../components/RankedList';
import { colors, spacing } from '../../theme/tokens';

const RESPONSE_COLORS = [colors.indigo, colors.peri, colors.warn];

export function Quality() {
  const data = useAdamData();
  const { quality } = data;

  const responseSegments = quality.responseTypes.map((r, i) => ({
    name: r.name,
    val: r.val,
    color: RESPONSE_COLORS[i % RESPONSE_COLORS.length],
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xl, padding: spacing.xl }}>
      <header>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Qualité IA</h1>
        <p style={{ color: colors.muted, fontSize: 13, margin: '4px 0 0' }}>
          ADAM répond-il bien, et où doit-il s'améliorer ?
        </p>
      </header>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: spacing.lg }}>
        <StatCard
          label="Satisfaction (thumbs)"
          value={`${quality.satisfaction}%`}
          deltaText={`${quality.satisfaction - quality.satisfactionPrev >= 0 ? '+' : ''}${(quality.satisfaction - quality.satisfactionPrev).toFixed(0)} pts vs préc.`}
          deltaUp={quality.satisfaction >= quality.satisfactionPrev}
          hint="cible 75 %+"
        />
        <StatCard
          label="Résolution au 1er échange"
          value={`${quality.firstResolution}%`}
          deltaText={`${quality.firstResolution - quality.firstResolutionPrev >= 0 ? '+' : ''}${(quality.firstResolution - quality.firstResolutionPrev).toFixed(0)} pts vs préc.`}
          deltaUp={quality.firstResolution >= quality.firstResolutionPrev}
          hint="cible 65 %+"
        />
      </section>

      <Panel title="Répartition des réponses" subtitle="Directe / reformulation / redirection">
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.lg }}>
          <Donut segments={responseSegments} />
          <div style={{ flex: 1 }}>
            <DonutLegend segments={responseSegments} />
            <div style={{ marginTop: spacing.sm, fontSize: 11.5, color: colors.faint }}>
              Zone saine pour reformulation/redirection : 10–25 %
            </div>
          </div>
        </div>
      </Panel>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: spacing.lg }}>
        <Panel title="Top sujets de questions" subtitle="Hebdomadaire">
          <RankedList
            items={quality.topTopics.map((t) => ({ label: t.topic, value: t.n, trend: t.trend }))}
          />
        </Panel>
        <Panel title="Où ADAM échoue / manque d'info" subtitle="Hebdomadaire">
          <RankedList items={quality.failures.map((f) => ({ label: f.topic, value: f.n, note: f.note }))} />
        </Panel>
      </section>
    </div>
  );
}
