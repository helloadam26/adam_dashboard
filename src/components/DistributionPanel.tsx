import type { Distribution } from '../data/types';
import { Panel } from './layout/Panel';
import { BarList } from './charts/BarList';
import { EmptyState } from './EmptyState';
import { colors } from '../theme/tokens';

/**
 * Répartition démographique. Tant que la colonne source n'est renseignée pour aucun
 * compte (`renseigne === false`), le bloc affiche un état vide expliquant ce qui manque,
 * plutôt qu'un graphique trompeur. Il s'alimentera sans changement de code.
 */
export function DistributionPanel({
  title,
  distribution,
  requis,
}: {
  title: string;
  distribution: Distribution;
  requis: string;
}) {
  return (
    <Panel title={title}>
      {distribution.renseigne ? (
        <>
          <BarList items={distribution.items.map((i) => ({ name: i.name, value: i.n }))} />
          {distribution.manquants > 0 && (
            <div style={{ marginTop: 10, fontSize: 11.5, color: colors.faint }}>
              {distribution.manquants} compte(s) sans valeur renseignée.
            </div>
          )}
        </>
      ) : (
        <EmptyState>
          Aucune donnée : ce champ n'est renseigné pour aucun compte. {requis}
        </EmptyState>
      )}
    </Panel>
  );
}
