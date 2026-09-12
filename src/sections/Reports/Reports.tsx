import { useState } from 'react';
import { useAdamData } from '../../data/useAdamData';
import { buildObjectives, pilotHealth } from '../../lib/kpi';
import { Panel } from '../../components/layout/Panel';
import { colors, spacing } from '../../theme/tokens';

function buildSummaryText(data: ReturnType<typeof useAdamData>): string {
  const built = buildObjectives(data.objectives);
  const health = pilotHealth(built, data.meta.phase);
  const lines = [
    `ADAM — Résumé du pilote (${data.meta.pilot})`,
    // La mise en garde voyage avec le texte : c'est lui qui sort du dashboard,
    // pas l'écran où elle serait affichée.
    data.meta.affiliation + '.',
    `Population mesurée : ${data.meta.population}`,
    `Période : ${data.meta.range}`,
    data.meta.phase === 'avant-lancement'
      ? `Phase : avant lancement — le pilote démarre le ${data.meta.launchDate}. Les cibles ci-dessous sont des cibles de fin de pilote, pas encore exigibles.`
      : `Santé du pilote : ${health.label} — ${health.achieved}/${health.total} objectifs atteints`,
    health.unmeasured > 0
      ? `${health.unmeasured} objectif(s) sans donnée : non mesurés, exclus du verdict.`
      : null,
    '',
    ...built.map((o) => `- ${o.label} : ${o.actualTxt} (cible fin de pilote ${o.targetTxt}) — ${o.statusLabel}`),
  ].filter((l): l is string => l !== null);
  return lines.join('\n');
}

export function Reports() {
  const data = useAdamData();
  const [copied, setCopied] = useState(false);
  const summary = buildSummaryText(data);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xl, padding: spacing.xl }}>
      <header style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.lg }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Rapports</h1>
          <p style={{ color: colors.muted, fontSize: 13, margin: '4px 0 0' }}>
            Exporter les chiffres clés du pilote. À relire et à recadrer avant tout partage.
          </p>
        </div>
        <button
          onClick={handleCopy}
          style={{
            fontFamily: 'inherit',
            fontSize: 13,
            fontWeight: 700,
            color: colors.text,
            background: colors.indigo,
            border: 'none',
            borderRadius: 8,
            padding: '10px 16px',
            cursor: 'pointer',
          }}
        >
          {copied ? 'Copié ✓' : 'Copier les chiffres clés'}
        </button>
      </header>

      <Panel title="Brouillon — à relire avant partage">
        <pre
          style={{
            fontFamily: "'Montserrat', system-ui, sans-serif",
            fontSize: 13,
            lineHeight: 1.7,
            color: colors.text,
            whiteSpace: 'pre-wrap',
            margin: 0,
          }}
        >
          {summary}
        </pre>
      </Panel>
    </div>
  );
}
