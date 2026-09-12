import type { Cohort } from '../../data/types';
import { N_MIN } from '../../lib/sample';
import { colors, radius } from '../../theme/tokens';
import { pourcent } from '../../lib/format';

/**
 * Une case vide signale une semaine pas encore écoulée, pas une rétention nulle.
 *
 * Sous le seuil d'échantillon, la case perd sa couleur : sur une cohorte de deux
 * personnes, « 50 % » désigne exactement un individu, et une case bien saturée le
 * ferait lire comme une tendance.
 */
function cellStyle(value: number | null, low: boolean) {
  if (value === null) {
    return { background: 'transparent', color: colors.faint, border: `1px dashed ${colors.line}` };
  }
  if (low) {
    return { background: 'rgba(255,255,255,.02)', color: colors.faint, border: `1px solid ${colors.line}` };
  }
  const intensity = Math.min(1, value / 100);
  return {
    background: `rgba(109,93,246,${(0.08 + intensity * 0.62).toFixed(3)})`,
    color: intensity > 0.45 ? '#fff' : colors.text,
    border: `1px solid ${colors.line}`,
  };
}

export function CohortTable({ cohorts }: { cohorts: Cohort[] }) {
  if (!cohorts.length) {
    return <div style={{ fontSize: 12.5, color: colors.faint }}>Aucune cohorte d'inscription sur les 8 dernières semaines.</div>;
  }

  const weeks = Array.from({ length: 6 }, (_, i) => i);

  const anyLow = cohorts.some((c) => c.n < N_MIN);

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ borderCollapse: 'separate', borderSpacing: 3, fontSize: 12, minWidth: 480 }}>
        <thead>
          <tr style={{ color: colors.faint, fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '.04em' }}>
            <th style={{ textAlign: 'left', fontWeight: 700, padding: '0 8px 6px 0' }}>Cohorte</th>
            <th style={{ fontWeight: 700, padding: '0 8px 6px 0', textAlign: 'right' }}>N</th>
            {weeks.map((w) => (
              <th key={w} style={{ fontWeight: 700, padding: '0 0 6px', minWidth: 46 }}>
                S+{w}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {cohorts.map((c) => (
            <tr key={c.label}>
              <td style={{ color: colors.text, whiteSpace: 'nowrap', paddingRight: 8 }}>{c.label}</td>
              <td
                title={c.n < N_MIN ? `Cohorte de ${c.n} : les pourcentages de cette ligne ne sont pas lisibles comme une tendance.` : undefined}
                style={{
                  textAlign: 'right',
                  paddingRight: 8,
                  color: c.n < N_MIN ? colors.warn : colors.muted,
                  fontWeight: 600,
                }}
              >
                {c.n}
              </td>
              {weeks.map((w) => {
                const value = c.row[w] ?? null;
                return (
                  <td
                    key={w}
                    style={{
                      textAlign: 'center',
                      padding: '7px 0',
                      borderRadius: radius.sm,
                      fontWeight: 600,
                      ...cellStyle(value, c.n < N_MIN),
                    }}
                  >
                    {value === null ? '·' : pourcent(value)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      {anyLow && (
        <div style={{ fontSize: 11.5, color: colors.warn, marginTop: 10, lineHeight: 1.5 }}>
          Les lignes dont la colonne N est en orange comptent moins de {N_MIN} personnes : leurs
          pourcentages sont grisés, car chacun n'y désigne qu'un individu ou deux.
        </div>
      )}
    </div>
  );
}
