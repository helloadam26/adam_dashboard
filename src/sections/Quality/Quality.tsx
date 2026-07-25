import { useAdamData } from '../../data/useAdamData';
import { StatCard } from '../../components/kpi/StatCard';
import { Panel } from '../../components/layout/Panel';
import { RankedList } from '../../components/RankedList';
import { EmptyState } from '../../components/EmptyState';
import { colors, spacing } from '../../theme/tokens';

const LOW_COVERAGE = 2; // % de réponses évaluées en dessous duquel on affiche un avertissement.

export function Quality() {
  const data = useAdamData();
  const { quality } = data;

  const lowCoverage = quality.reactionCoverage < LOW_COVERAGE;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xl, padding: spacing.xl }}>
      <header>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Qualité IA</h1>
        <p style={{ color: colors.muted, fontSize: 13, margin: '4px 0 0' }}>
          ADAM répond-il bien, et où doit-il s'améliorer ?
        </p>
      </header>

      {lowCoverage && (
        <EmptyState>
          <strong style={{ color: colors.warn }}>Signal insuffisant.</strong> Seules{' '}
          {quality.reactionsTotal} réponses sur {quality.assistantMessages.toLocaleString('fr-CA')} ont reçu une
          réaction ({quality.reactionCoverage}% de couverture), et {quality.feedbacksTotal} commentaire(s) ont été
          laissés. Les indicateurs ci-dessous sont affichés tels quels mais n'ont pas de valeur statistique tant
          que le retour utilisateur n'est pas plus sollicité dans l'app.
        </EmptyState>
      )}

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: spacing.lg }}>
        <StatCard
          label="Satisfaction (pouces)"
          value={quality.satisfaction === null ? '—' : `${quality.satisfaction}%`}
          hint={`${quality.likes} 👍 · ${quality.dislikes} 👎`}
        />
        <StatCard label="Réponses évaluées" value={`${quality.reactionCoverage}%`} hint="couverture des réactions" />
        <StatCard label="Commentaires laissés" value={quality.feedbacksTotal} hint="feedbacks libres" />
        <StatCard
          label="Conv. à une question"
          value={quality.firstResolution === null ? '—' : `${quality.firstResolution}%`}
          hint="proxy de résolution — voir note"
        />
      </section>

      <Panel
        title="Sujets des conversations"
        subtitle="D'après le titre généré par l'app"
      >
        {quality.topics.length === 0 ? (
          <EmptyState>
            Aucun titre de conversation disponible. Les titres ne sont générés que pour une poignée de
            conversations ; il faut que l'app ADAM les produise systématiquement pour alimenter ce bloc.
          </EmptyState>
        ) : (
          <RankedList items={quality.topics.map((t) => ({ label: t.title, value: t.n }))} />
        )}
      </Panel>

      <Panel title="Note méthodologique">
        <div style={{ fontSize: 12.5, color: colors.muted, lineHeight: 1.7 }}>
          <p style={{ margin: '0 0 8px' }}>
            <strong style={{ color: colors.text }}>Satisfaction</strong> = part de pouces hauts parmi les
            réactions. <strong style={{ color: colors.text }}>Conv. à une question</strong> approxime la
            résolution au 1er échange en comptant les conversations où l'étudiant n'a posé qu'une seule question
            — mais cela confond une vraie résolution avec un abandon.
          </p>
          <p style={{ margin: 0 }}>
            Une mesure fiable de satisfaction, de résolution, de taux de repli ou de thèmes d'échec suppose
            davantage de retour explicite côté app (question de clôture, classification des réponses). Détail
            dans <em>Paramètres → Métriques non disponibles</em>.
          </p>
        </div>
      </Panel>
    </div>
  );
}
