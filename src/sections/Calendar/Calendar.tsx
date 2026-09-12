import { useAdamData } from '../../data/useAdamData';
import { StatCard } from '../../components/kpi/StatCard';
import { Panel } from '../../components/layout/Panel';
import { BarList } from '../../components/charts/BarList';
import { Donut, DonutLegend, type DonutSegment } from '../../components/charts/Donut';
import { EmptyState } from '../../components/EmptyState';
import { colors, spacing } from '../../theme/tokens';
import { nombre, pourcent } from '../../lib/format';
import { isLowSample, N_MIN, sampleWarning, type Sample } from '../../lib/sample';

/**
 * Section Calendrier. Le module laisse un étudiant déposer le plan de cours d'un
 * cours, en extrait les échéances datées par IA, les lui fait valider, puis
 * programme des rappels.
 *
 * Ce qui est mesuré ici, c'est la chaîne complète : combien de plans de cours
 * entrent, combien d'échéances en sortent, combien l'étudiant en garde, combien
 * de rappels en découlent. Le taux de correction est le vrai signal de qualité —
 * une échéance retouchée après extraction est une échéance que l'IA avait mal lue.
 *
 * Aucun contenu d'étudiant ne remonte jusqu'ici : les vues ne renvoient que des
 * comptes par type et par statut (migration 20260912100000).
 */

/** Part en pourcentage, ou null quand le dénominateur est vide. */
function part(n: number, total: number): number | null {
  return total > 0 ? (n / total) * 100 : null;
}

/**
 * Un ratio, avec le garde-fou commun du dashboard : sous 5 observations, la valeur
 * est grisée et annotée plutôt qu'affichée comme une tendance (voir lib/sample).
 */
function Ratio({ value, sample, dec = 0 }: { value: number | null; sample?: Sample; dec?: number }) {
  const low = isLowSample(sample);
  const texte = value === null ? '—' : pourcent(value, dec);
  if (!low || !sample) return <>{texte}</>;
  return (
    <span title={sampleWarning(sample)} style={{ color: colors.faint }}>
      {texte}
      <span style={{ fontSize: 10, marginLeft: 3 }}>*</span>
    </span>
  );
}

export function Calendar() {
  const { calendar } = useAdamData();
  const { imports, events, reminders, staff } = calendar;

  const rienChezLesEtudiants = imports.total === 0 && events.total === 0 && calendar.courses === 0;
  const testInterne = staff.imports > 0 || staff.events > 0;

  const echEvents: Sample = { n: events.total, noun: 'échéances' };
  const echImports: Sample = { n: imports.total, noun: 'imports' };

  const tauxCorrection = part(events.corrected, events.total);
  const tauxValidation = part(events.validated, events.total);
  const tauxEchec = part(imports.failed, imports.total);
  const echeancesParImport = imports.ready > 0 ? events.total / imports.ready : null;

  // `Donut` trace ses arcs à partir d'un pourcentage, pas d'un compte : les valeurs
  // brutes sont rappelées sous l'anneau.
  const niveaux: { name: string; n: number; color: string }[] = [
    { name: 'Haute', n: events.high, color: colors.ok },
    { name: 'Moyenne', n: events.medium, color: colors.warn },
    { name: 'Basse', n: events.low, color: colors.alarm },
  ];
  const confiance: DonutSegment[] = niveaux.map((n) => ({
    name: n.name,
    val: part(n.n, events.total) ?? 0,
    color: n.color,
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xl, padding: spacing.xl }}>
      <header>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Calendrier</h1>
        <p style={{ color: colors.muted, fontSize: 13, margin: '4px 0 0' }}>
          Import des plans de cours, extraction des échéances, validation et rappels.
        </p>
      </header>

      {rienChezLesEtudiants && (
        <EmptyState>
          {testInterne ? (
            <>
              <strong style={{ color: colors.warn }}>Module en test interne.</strong> Aucun étudiant
              n'a encore importé de plan de cours. Les {nombre(staff.imports)} import(s) et{' '}
              {nombre(staff.events)} échéance(s) présents en base appartiennent à{' '}
              {nombre(staff.users)} compte(s) de l'équipe, exclus des mesures comme toute activité
              administrateur. Les chiffres ci-dessous sont donc exacts à zéro : ils ne signalent pas
              une panne, mais une adoption qui n'a pas commencé.
            </>
          ) : (
            <>
              Aucune donnée de calendrier. Soit la migration <code>20260912100000</code> n'est pas
              encore appliquée, soit le module n'a jamais servi. Cette section se remplira sans
              changement de code dès le premier import d'un étudiant.
            </>
          )}
        </EmptyState>
      )}

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: spacing.lg }}>
        <StatCard
          label="Étudiants équipés"
          value={calendar.coursesUsers}
          hint={`${nombre(calendar.courses)} cours suivis`}
        />
        <StatCard
          label="Plans de cours importés"
          value={imports.total}
          hint={`${nombre(imports.ready)} traités · ${nombre(imports.failed)} en échec`}
        />
        <StatCard
          label="Échéances extraites"
          value={nombre(events.total)}
          hint={
            echeancesParImport === null
              ? 'aucun import traité'
              : `${echeancesParImport.toFixed(1)} par plan de cours`
          }
        />
        <StatCard
          label="Rappels programmés"
          value={nombre(reminders.total)}
          hint={`${nombre(reminders.optedIn)} compte(s) les ont activés`}
        />
      </section>

      <Panel
        title="Du plan de cours au rappel"
        subtitle="Ce qui subsiste à chaque étape de la chaîne"
      >
        {imports.total === 0 ? (
          <EmptyState>Aucun plan de cours importé par un étudiant.</EmptyState>
        ) : (
          <>
            <BarList
              items={[
                { name: 'Plans de cours traités', value: imports.ready },
                { name: 'Échéances extraites', value: events.total },
                { name: 'Échéances gardées', value: events.validated },
                { name: 'Rappels programmés', value: reminders.total },
              ]}
            />
            <p style={{ fontSize: 12, color: colors.muted, lineHeight: 1.6, margin: `${spacing.md}px 0 0` }}>
              L'étudiant garde <Ratio value={tauxValidation} sample={echEvents} /> de ce que l'IA lui propose.{' '}
              {events.draft > 0 && `${nombre(events.draft)} échéance(s) attendent encore sa décision. `}
              {events.rejected > 0 && `${nombre(events.rejected)} ont été écartées. `}
              {events.manual > 0 && `${nombre(events.manual)} ont été ajoutées à la main.`}
            </p>
          </>
        )}
      </Panel>

      <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.lg }}>
        <Panel title="Fiabilité de l'extraction" subtitle="Ce que l'IA a lu de travers">
          {events.total === 0 && imports.total === 0 ? (
            <EmptyState>Rien à mesurer tant qu'aucun plan de cours n'est importé.</EmptyState>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md, fontSize: 13 }}>
              <Ligne
                label="Échéances retouchées"
                value={<Ratio value={tauxCorrection} sample={echEvents} />}
                note={`${nombre(events.corrected)} sur ${nombre(events.total)} — le signal le plus direct d'une erreur de lecture`}
              />
              <Ligne
                label="Imports en échec"
                value={<Ratio value={tauxEchec} sample={echImports} />}
                note={`${nombre(imports.failed)} sur ${nombre(imports.total)}${imports.running > 0 ? ` · ${nombre(imports.running)} en cours` : ''}`}
              />
              <Ligne
                label="Imports avec avertissement"
                value={<Ratio value={part(imports.withWarnings, imports.total)} sample={echImports} />}
                note={`${nombre(imports.withWarnings)} import(s) signalent une date ambiguë ou une section douteuse`}
              />
              <Ligne
                label="Extraction reconfirmée"
                value={<Ratio value={part(imports.verified, imports.total)} sample={echImports} />}
                note={`${nombre(imports.verified)} import(s) validés par la seconde passe de vérification`}
              />
            </div>
          )}
        </Panel>

        <Panel title="Confiance déclarée" subtitle="Ce que l'IA dit de sa propre lecture">
          {events.total === 0 ? (
            <EmptyState>Aucune échéance extraite.</EmptyState>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: spacing.lg }}>
                <Donut segments={confiance} />
                <div style={{ flex: 1 }}>
                  <DonutLegend segments={confiance} />
                </div>
              </div>
              <div style={{ marginTop: spacing.md, display: 'flex', flexDirection: 'column', gap: 4 }}>
                {niveaux.map((n) => (
                  <div key={n.name} style={{ fontSize: 11.5, color: colors.faint }}>
                    {n.name} ({nombre(n.n)} échéance{n.n > 1 ? 's' : ''})
                  </div>
                ))}
              </div>
            </>
          )}
        </Panel>
      </section>

      {(isLowSample(echEvents) || isLowSample(echImports)) && !rienChezLesEtudiants && (
        <p style={{ fontSize: 11.5, color: colors.faint, margin: 0 }}>
          * Ratio calculé sur moins de {N_MIN} observations. Il est affiché tel quel mais ne vaut
          pas comme tendance.
        </p>
      )}

      <Panel title="Échéances par type" subtitle="Catégories fermées, fixées par l'app étudiante">
        {events.total === 0 ? (
          <EmptyState>Aucune échéance extraite.</EmptyState>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr
                style={{
                  textAlign: 'left',
                  color: colors.faint,
                  fontSize: 11,
                  textTransform: 'uppercase',
                  letterSpacing: '.04em',
                }}
              >
                <th style={{ padding: '0 0 10px', fontWeight: 700 }}>Type</th>
                <th style={{ padding: '0 0 10px', fontWeight: 700, textAlign: 'right' }}>Extraites</th>
                <th style={{ padding: '0 0 10px', fontWeight: 700, textAlign: 'right' }}>Gardées</th>
                <th style={{ padding: '0 0 10px', fontWeight: 700, textAlign: 'right' }}>Étudiants</th>
                <th style={{ padding: '0 0 10px', fontWeight: 700, textAlign: 'right' }}>Part</th>
              </tr>
            </thead>
            <tbody>
              {calendar.byType.map((t, i) => (
                <tr key={t.type} style={{ borderTop: i > 0 ? `1px solid ${colors.line}` : 'none' }}>
                  <td style={{ padding: '10px 0', color: colors.text }}>{t.label}</td>
                  <td style={{ padding: '10px 0', textAlign: 'right', fontWeight: 700 }}>{nombre(t.n)}</td>
                  <td style={{ padding: '10px 0', textAlign: 'right', color: colors.muted }}>{nombre(t.validated)}</td>
                  <td style={{ padding: '10px 0', textAlign: 'right', color: colors.muted }}>{t.users}</td>
                  <td style={{ padding: '10px 0', textAlign: 'right', color: colors.muted }}>
                    <Ratio value={part(t.n, events.total)} sample={echEvents} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>

      <Panel title="Rappels" subtitle="Une échéance ne déclenche un rappel qu'une fois validée">
        {reminders.total === 0 ? (
          <EmptyState>
            Aucun rappel programmé. Les rappels sont désactivés par défaut : l'étudiant doit les
            activer dans ses préférences, et seule une échéance qu'il a gardée peut en déclencher un.
          </EmptyState>
        ) : (
          <BarList
            items={[
              { name: 'Envoyés', value: reminders.sent },
              { name: 'En attente', value: reminders.pending },
              { name: 'En échec', value: reminders.failed },
            ]}
          />
        )}
      </Panel>

      {(calendar.firstImportDay || calendar.lastEventAt) && (
        <p style={{ fontSize: 11.5, color: colors.faint, margin: 0 }}>
          {calendar.firstImportDay && `Premier import le ${calendar.firstImportDay}. `}
          {calendar.lastEventAt && `Dernière modification d'échéance : ${calendar.lastEventAt}.`}
        </p>
      )}
    </div>
  );
}

function Ligne({
  label,
  value,
  note,
}: {
  label: string;
  value: React.ReactNode;
  note: string;
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: spacing.lg }}>
      <span style={{ color: colors.muted, flex: '1 1 auto' }}>
        {label}
        <span style={{ display: 'block', fontSize: 11.5, color: colors.faint, marginTop: 2 }}>{note}</span>
      </span>
      <span style={{ fontWeight: 700, flex: '0 0 auto' }}>{value}</span>
    </div>
  );
}
