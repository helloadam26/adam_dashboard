import { useAdamData } from '../../data/useAdamData';
import { Panel } from '../../components/layout/Panel';
import {
  METRIQUES_INDISPONIBLES,
  DEPENDANCE_LABELS,
  DEPENDANCE_HINTS,
  raisonTexte,
  type ContexteMetriques,
  type Dependance,
} from '../../data/unavailableMetrics';
import { colors, radius, spacing } from '../../theme/tokens';
import { nombre } from '../../lib/format';

function Row({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        gap: spacing.lg,
        padding: '12px 0',
        borderBottom: `1px solid ${colors.line}`,
        fontSize: 13,
      }}
    >
      <span style={{ color: colors.muted, flex: '0 0 auto' }}>{label}</span>
      <span style={{ textAlign: 'right' }}>
        <span style={{ fontWeight: 600 }}>{value}</span>
        {note && (
          <span style={{ display: 'block', fontSize: 11.5, color: colors.warn, fontWeight: 600, marginTop: 2 }}>
            {note}
          </span>
        )}
      </span>
    </div>
  );
}

const DEP_COLOR: Record<Dependance, string> = {
  utilisateurs: colors.warn,
  'app-principale': colors.alarm,
  dashboard: colors.indigo2,
};

const DEP_ORDER: Dependance[] = ['app-principale', 'utilisateurs', 'dashboard'];

export function Settings() {
  const data = useAdamData();

  // Les constats chiffrés lisent les mêmes vues que l'onglet Qualité IA : un seul
  // total pour une seule métrique, d'un onglet à l'autre.
  const ctx: ContexteMetriques = {
    comptes: data.users.total,
    reactions: data.quality.reactionsTotal,
    reponses: data.quality.assistantMessages,
    couverture: data.quality.reactionCoverage,
  };

  const untracked = data.users.status.find((s) => s.label === 'Usage sans historique')?.n ?? 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xl, padding: spacing.xl }}>
      <header>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Paramètres</h1>
        <p style={{ color: colors.muted, fontSize: 13, margin: '4px 0 0' }}>Configuration et provenance des données.</p>
      </header>

      <Panel title="Source des données">
        <Row label="Population mesurée" value={data.meta.population} note={data.meta.affiliation} />
        <Row label="Période couverte" value={data.meta.range} />
        <Row label="Source" value="Supabase · vues dashboard_* en lecture seule" />
        <Row label="Authentification" value="Activée · comptes admin dédiés (2FA à venir)" />
        <Row label="Dernière activité enregistrée" value={data.meta.lastActivity} />
        <Row label="Données chargées le" value={data.meta.updated} />
      </Panel>

      <Panel
        title="Deux compteurs, deux vérités"
        subtitle="Pourquoi certains chiffres ne se recoupent pas — et pourquoi c'est normal"
      >
        <div style={{ fontSize: 12.5, color: colors.muted, lineHeight: 1.7 }}>
          <p style={{ margin: '0 0 10px' }}>
            L'usage d'ADAM se mesure de deux façons, et elles ne donnent pas le même total.
            Les <strong style={{ color: colors.text }}>questions décomptées du quota</strong> comptent
            ce qui a été demandé : ce compteur doit survivre à la suppression d'une conversation,
            sinon le plafond quotidien se contournerait en effaçant son historique. Les{' '}
            <strong style={{ color: colors.text }}>questions conservées</strong> comptent ce qui reste
            réellement en base.
          </p>
          <p style={{ margin: '0 0 10px' }}>
            Sur les 30 derniers jours :{' '}
            <strong style={{ color: colors.text }}>
              {nombre(data.quota.counted30d)} questions décomptées
            </strong>{' '}
            pour{' '}
            <strong style={{ color: colors.text }}>
              {nombre(data.usage.questionsStored30d)} conservées
            </strong>
            . L'écart n'est pas une erreur de comptage : il mesure ce que les étudiants ont effacé.
          </p>
          {untracked > 0 && (
            <p style={{ margin: '0 0 10px' }}>
              <strong style={{ color: colors.peri }}>{untracked} compte(s)</strong> ont consommé leur
              quota sans qu'aucune conversation ne subsiste. Ils apparaissaient auparavant comme
              « jamais actifs », ce qui était faux — ils ont bien utilisé ADAM. Ils forment désormais
              la part <strong style={{ color: colors.peri }}>« Usage sans historique »</strong> du
              graphique des statuts, plutôt que d'être fondus dans les actifs : compter leur usage sans
              le signaler masquerait le fait qu'on ne sait plus ce qu'ils ont demandé.
            </p>
          )}
          <p style={{ margin: 0 }}>
            À retenir pour lire le reste du dashboard : tout ce qui dérive des messages —
            conversations, sujets, satisfaction, résolution — porte sur ce qui a été conservé, et
            sous-estime donc l'usage réel. Les indicateurs de quota, eux, sont complets.
          </p>
        </div>
      </Panel>

      <Panel
        title="Métriques non disponibles"
        subtitle="Prévues au périmètre initial, sans source exploitable aujourd'hui — classées par ce qu'il faut débloquer"
      >
        <div style={{ display: 'flex', gap: spacing.md, flexWrap: 'wrap', marginBottom: spacing.md }}>
          {DEP_ORDER.map((dep) => (
            <span key={dep} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: colors.muted }}>
              <span style={{ width: 8, height: 8, borderRadius: 99, background: DEP_COLOR[dep] }} />
              {DEPENDANCE_LABELS[dep]} — {DEPENDANCE_HINTS[dep]}
            </span>
          ))}
        </div>

        {DEP_ORDER.map((dep) => {
          const items = METRIQUES_INDISPONIBLES.filter((m) => m.dependance === dep);
          if (!items.length) return null;
          return (
            <div key={dep} style={{ marginTop: spacing.md }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '.04em',
                  color: DEP_COLOR[dep],
                  marginBottom: 6,
                }}
              >
                {DEPENDANCE_LABELS[dep]}
              </div>
              {items.map((m) => (
                <div
                  key={m.metrique}
                  style={{
                    padding: spacing.md,
                    borderLeft: `2px solid ${DEP_COLOR[dep]}`,
                    background: 'rgba(255,255,255,.015)',
                    borderRadius: radius.sm,
                    marginBottom: 8,
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 600, color: colors.text }}>{m.metrique}</div>
                  <div style={{ fontSize: 12, color: colors.muted, marginTop: 4, lineHeight: 1.5 }}>
                    <span style={{ color: colors.faint }}>Pourquoi : </span>
                    {raisonTexte(m, ctx)}
                  </div>
                  <div style={{ fontSize: 12, color: colors.muted, marginTop: 3, lineHeight: 1.5 }}>
                    <span style={{ color: colors.faint }}>Requis : </span>
                    {m.requis}
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </Panel>
    </div>
  );
}
