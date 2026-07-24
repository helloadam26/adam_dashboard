import { useAdamData } from '../../data/useAdamData';
import { Panel } from '../../components/layout/Panel';
import { colors, spacing } from '../../theme/tokens';

export function Faculties() {
  const data = useAdamData();
  const { byFaculty } = data.users;
  const total = byFaculty.reduce((a, b) => a + b.n, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xl, padding: spacing.xl }}>
      <header>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Facultés</h1>
        <p style={{ color: colors.muted, fontSize: 13, margin: '4px 0 0' }}>Adoption et performance par faculté.</p>
      </header>

      <Panel>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ textAlign: 'left', color: colors.faint, fontSize: 11, textTransform: 'uppercase', letterSpacing: '.04em' }}>
              <th style={{ padding: '0 0 10px', fontWeight: 700 }}>Faculté</th>
              <th style={{ padding: '0 0 10px', fontWeight: 700, textAlign: 'right' }}>Utilisateurs</th>
              <th style={{ padding: '0 0 10px', fontWeight: 700, textAlign: 'right' }}>Part</th>
            </tr>
          </thead>
          <tbody>
            {byFaculty
              .slice()
              .sort((a, b) => b.n - a.n)
              .map((f, i) => (
                <tr key={f.name} style={{ borderTop: i > 0 ? `1px solid ${colors.line}` : 'none' }}>
                  <td style={{ padding: '10px 0', color: colors.text }}>{f.name}</td>
                  <td style={{ padding: '10px 0', textAlign: 'right', fontWeight: 700 }}>{f.n}</td>
                  <td style={{ padding: '10px 0', textAlign: 'right', color: colors.muted }}>
                    {Math.round((f.n / total) * 100)}%
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}
