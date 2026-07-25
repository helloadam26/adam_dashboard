import { useAdamData } from '../../data/useAdamData';
import { Panel } from '../../components/layout/Panel';
import {
  METRIQUES_INDISPONIBLES,
  DEPENDANCE_LABELS,
  DEPENDANCE_HINTS,
  type Dependance,
} from '../../data/unavailableMetrics';
import { colors, radius, spacing } from '../../theme/tokens';

function Row({ label, value }: { label: string; value: string }) {
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
      <span style={{ fontWeight: 600, textAlign: 'right' }}>{value}</span>
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xl, padding: spacing.xl }}>
      <header>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Paramètres</h1>
        <p style={{ color: colors.muted, fontSize: 13, margin: '4px 0 0' }}>Configuration et provenance des données.</p>
      </header>

      <Panel title="Source des données">
        <Row label="Établissement" value={data.meta.university} />
        <Row label="Période couverte" value={data.meta.range} />
        <Row label="Source" value="Supabase · vues dashboard_* en lecture seule" />
        <Row label="Authentification" value="Désactivée (phase de conception)" />
        <Row label="Dernière activité enregistrée" value={data.meta.lastActivity} />
        <Row label="Données chargées le" value={data.meta.updated} />
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
                    {m.raison}
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
