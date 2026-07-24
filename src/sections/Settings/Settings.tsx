import { useAdamData } from '../../data/useAdamData';
import { Panel } from '../../components/layout/Panel';
import { colors, spacing } from '../../theme/tokens';

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        padding: '12px 0',
        borderBottom: `1px solid ${colors.line}`,
        fontSize: 13,
      }}
    >
      <span style={{ color: colors.muted }}>{label}</span>
      <span style={{ fontWeight: 600 }}>{value}</span>
    </div>
  );
}

export function Settings() {
  const data = useAdamData();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xl, padding: spacing.xl }}>
      <header>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Paramètres</h1>
        <p style={{ color: colors.muted, fontSize: 13, margin: '4px 0 0' }}>Configuration du pilote.</p>
      </header>

      <Panel title="Pilote">
        <Row label="Établissement" value={data.meta.university} />
        <Row label="Période" value={data.meta.range} />
        <Row label="Source des données" value="Données simulées — Supabase non branché" />
        <Row label="Dernière mise à jour" value={data.meta.updated} />
      </Panel>
    </div>
  );
}
