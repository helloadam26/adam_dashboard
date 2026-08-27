import { useAdamData } from '../../data/useAdamData';
import { buildObjectives, pilotHealth } from '../../lib/kpi';
import { Panel } from '../../components/layout/Panel';
import { Ring } from '../../components/charts/Ring';
import { ObjectivesPanel } from '../../components/kpi/ObjectivesPanel';
import { colors, spacing } from '../../theme/tokens';

export function Performance() {
  const data = useAdamData();
  const built = buildObjectives(data.objectives);
  const health = pilotHealth(built);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xl, padding: spacing.xl }}>
      <header>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Performance</h1>
        <p style={{ color: colors.muted, fontSize: 13, margin: '4px 0 0' }}>
          ADAM atteint-il les objectifs fixés pour le pilote ?
        </p>
      </header>

      <section style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: spacing.lg }}>
        <Panel title="% Objectifs atteints" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Ring value={health.achieved} total={health.total} color={health.color} />
        </Panel>
        <ObjectivesPanel built={built} />
      </section>

      <Panel title="KPIs vs cibles">
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ textAlign: 'left', color: colors.faint, fontSize: 11, textTransform: 'uppercase', letterSpacing: '.04em' }}>
              <th style={{ padding: '0 0 10px', fontWeight: 700 }}>KPI</th>
              <th style={{ padding: '0 0 10px', fontWeight: 700, textAlign: 'right' }}>Actuel</th>
              <th style={{ padding: '0 0 10px', fontWeight: 700, textAlign: 'right' }}>Cible</th>
              <th style={{ padding: '0 0 10px', fontWeight: 700, textAlign: 'right' }}>Δ vs préc.</th>
              <th style={{ padding: '0 0 10px', fontWeight: 700, textAlign: 'right' }}>Statut</th>
            </tr>
          </thead>
          <tbody>
            {built.map((o, i) => (
              <tr key={o.label} style={{ borderTop: i > 0 ? `1px solid ${colors.line}` : 'none' }}>
                <td style={{ padding: '10px 0', color: colors.text }}>{o.label}</td>
                <td style={{ padding: '10px 0', textAlign: 'right', fontWeight: 700 }}>{o.actualTxt}</td>
                <td style={{ padding: '10px 0', textAlign: 'right', color: colors.muted }}>{o.targetTxt}</td>
                <td style={{ padding: '10px 0', textAlign: 'right', color: o.deltaUp ? colors.ok : colors.alarm }}>
                  {o.deltaUp ? '+' : ''}
                  {o.delta.toLocaleString('fr-CA', { maximumFractionDigits: 2 })}
                </td>
                <td style={{ padding: '10px 0', textAlign: 'right' }}>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '3px 9px',
                      borderRadius: 99,
                      fontSize: 11.5,
                      fontWeight: 700,
                      color: o.statusColor,
                      background: 'rgba(255,255,255,.04)',
                    }}
                  >
                    {o.statusLabel}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}
