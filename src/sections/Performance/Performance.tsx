import { useAdamData } from '../../data/useAdamData';
import { buildObjectives, deltaColor } from '../../lib/kpi';
import { Panel } from '../../components/layout/Panel';
import { ObjectivesPanel } from '../../components/kpi/ObjectivesPanel';
import { colors, spacing } from '../../theme/tokens';

export function Performance() {
  const data = useAdamData();
  const built = buildObjectives(data.objectives);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xl, padding: spacing.xl }}>
      <header>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Performance</h1>
        <p style={{ color: colors.muted, fontSize: 13, margin: '4px 0 0' }}>
          ADAM atteint-il les objectifs fixés pour le pilote ?
        </p>
      </header>

      <ObjectivesPanel built={built} phase={data.meta.phase} launchDate={data.meta.launchDate} />

      <Panel title="KPIs vs cibles">
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ textAlign: 'left', color: colors.faint, fontSize: 11, textTransform: 'uppercase', letterSpacing: '.04em' }}>
              <th style={{ padding: '0 0 10px', fontWeight: 700 }}>KPI</th>
              <th style={{ padding: '0 0 10px', fontWeight: 700, textAlign: 'right' }}>Actuel</th>
              <th style={{ padding: '0 0 10px', fontWeight: 700, textAlign: 'right' }}>Cible fin de pilote</th>
              <th style={{ padding: '0 0 10px', fontWeight: 700, textAlign: 'right' }}>Δ vs préc.</th>
              <th style={{ padding: '0 0 10px', fontWeight: 700, textAlign: 'right' }}>Statut</th>
            </tr>
          </thead>
          <tbody>
            {built.map((o, i) => (
              <tr key={o.label} style={{ borderTop: i > 0 ? `1px solid ${colors.line}` : 'none' }}>
                <td style={{ padding: '10px 0', color: colors.text }}>{o.label}</td>
                <td
                  style={{
                    padding: '10px 0',
                    textAlign: 'right',
                    fontWeight: 700,
                    color: o.status === 'unknown' ? colors.faint : colors.text,
                  }}
                >
                  {o.actualTxt}
                </td>
                <td style={{ padding: '10px 0', textAlign: 'right', color: colors.muted }}>{o.targetTxt}</td>
                <td style={{ padding: '10px 0', textAlign: 'right', color: deltaColor(o.deltaTone) }}>
                  {o.deltaTone === 'none' ? '—' : o.deltaTxt.replace(' vs préc.', '')}
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
