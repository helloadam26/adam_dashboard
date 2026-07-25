import type { Cohort } from '../../data/types';
import { colors, radius } from '../../theme/tokens';

/** Une case vide signale une semaine pas encore écoulée, pas une rétention nulle. */
function cellStyle(value: number | null) {
  if (value === null) {
    return { background: 'transparent', color: colors.faint, border: `1px dashed ${colors.line}` };
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

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ borderCollapse: 'separate', borderSpacing: 3, fontSize: 12, minWidth: 480 }}>
        <thead>
          <tr style={{ color: colors.faint, fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '.04em' }}>
            <th style={{ textAlign: 'left', fontWeight: 700, padding: '0 8px 6px 0' }}>Cohorte</th>
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
                      ...cellStyle(value),
                    }}
                  >
                    {value === null ? '·' : `${value}%`}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
