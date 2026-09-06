import { useAdamData } from '../../data/useAdamData';
import { Panel } from '../../components/layout/Panel';
import { EmptyState } from '../../components/EmptyState';
import { colors, spacing } from '../../theme/tokens';
import { pourcent } from '../../lib/format';

/**
 * Section Facultés. Chaque « agent » de la table `agents` correspond à une faculté
 * ou à un service de l'uOttawa — le renommage de la table n'a pas encore été fait
 * côté app, mais ce sont bien les facultés.
 *
 * Ce tableau mesure l'usage par faculté à partir de l'agent choisi pour chaque
 * conversation. C'est distinct de la faculté déclarée de l'utilisateur (profiles.faculty,
 * encore vide) : ici on sait quel espace facultaire est sollicité, pas à quelle
 * faculté appartient la personne qui pose la question.
 */
export function Faculties() {
  const { faculties } = useAdamData();
  const totalConversations = faculties.reduce((a, b) => a + b.conversations, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xl, padding: spacing.xl }}>
      <header>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Facultés</h1>
        <p style={{ color: colors.muted, fontSize: 13, margin: '4px 0 0' }}>
          Usage par espace facultaire, d'après l'agent sollicité dans chaque conversation.
        </p>
      </header>

      <Panel>
        {faculties.length === 0 ? (
          <EmptyState>Aucune conversation rattachée à une faculté sur la période.</EmptyState>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ textAlign: 'left', color: colors.faint, fontSize: 11, textTransform: 'uppercase', letterSpacing: '.04em' }}>
                <th style={{ padding: '0 0 10px', fontWeight: 700 }}>Faculté / service</th>
                <th style={{ padding: '0 0 10px', fontWeight: 700, textAlign: 'right' }}>Conversations</th>
                <th style={{ padding: '0 0 10px', fontWeight: 700, textAlign: 'right' }}>Utilisateurs</th>
                <th style={{ padding: '0 0 10px', fontWeight: 700, textAlign: 'right' }}>Questions</th>
                <th style={{ padding: '0 0 10px', fontWeight: 700, textAlign: 'right' }}>Part</th>
              </tr>
            </thead>
            <tbody>
              {faculties.map((f, i) => (
                <tr key={f.id} style={{ borderTop: i > 0 ? `1px solid ${colors.line}` : 'none' }}>
                  <td style={{ padding: '10px 0', color: colors.text }}>
                    {f.name}
                    {f.description && (
                      <div style={{ fontSize: 11.5, color: colors.faint, marginTop: 2 }}>{f.description}</div>
                    )}
                  </td>
                  <td style={{ padding: '10px 0', textAlign: 'right', fontWeight: 700 }}>{f.conversations}</td>
                  <td style={{ padding: '10px 0', textAlign: 'right', color: colors.muted }}>{f.users}</td>
                  <td style={{ padding: '10px 0', textAlign: 'right', color: colors.muted }}>{f.questions}</td>
                  <td style={{ padding: '10px 0', textAlign: 'right', color: colors.muted }}>
                    {pourcent(totalConversations ? Math.round((f.conversations / totalConversations) * 100) : 0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>
    </div>
  );
}
