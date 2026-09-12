/**
 * Légende des pastilles de statut.
 *
 * Les cartes KPI portent un point de couleur en haut à droite. Sans légende, un
 * point rouge n'est qu'une alerte sans échelle — on ne sait pas s'il en existe
 * deux niveaux ou cinq. Les libellés viennent de `stMeta`, donc la légende ne
 * peut pas dériver des cartes.
 */
import { stMeta, type KpiStatus } from '../../lib/kpi';
import { colors, spacing } from '../../theme/tokens';

const ORDRE: KpiStatus[] = ['ok', 'warn', 'alarm', 'unknown'];

export function StatusLegend() {
  return (
    <div style={{ display: 'flex', gap: spacing.lg, flexWrap: 'wrap', fontSize: 11.5, color: colors.faint }}>
      {ORDRE.map((status) => {
        const meta = stMeta(status);
        return (
          <span key={status} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 7, height: 7, borderRadius: 99, background: meta.color }} />
            {meta.label}
          </span>
        );
      })}
    </div>
  );
}
