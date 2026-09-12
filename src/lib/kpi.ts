/**
 * Logique de statut KPI, portée depuis Dashboard ADAM.dc.html
 * (méthodes statusFor / stMeta / buildObjectives).
 *
 * Deux principes s'ajoutent au portage initial :
 *
 * 1. Une métrique sans donnée derrière elle (`actual === null`) est « non mesurée »,
 *    pas « à 0 ». Elle ne compte donc pas comme un écart à la cible et ne pèse pas
 *    sur le verdict de santé du pilote.
 * 2. Les cibles sont des cibles de *fin* de pilote. Tant que le pilote n'est pas
 *    lancé, aucun verdict de santé n'est rendu — sinon tout est rouge par
 *    construction, et l'équipe apprend à ignorer le rouge.
 */
import { colors } from '../theme/tokens';
import type { Objective } from '../data/types';
import type { Sample } from './sample';
import { avecUnite, nombre } from './format';

export type KpiStatus = 'ok' | 'warn' | 'alarm' | 'unknown';

export function statusFor(actual: number | null, target: number): KpiStatus {
  if (actual === null || !Number.isFinite(actual)) return 'unknown';
  const ratio = actual / target;
  if (actual >= target) return 'ok';
  if (ratio >= 0.85) return 'warn';
  return 'alarm';
}

export function stMeta(status: KpiStatus): { color: string; label: string } {
  if (status === 'ok') return { color: colors.ok, label: 'Atteint' };
  if (status === 'warn') return { color: colors.warn, label: 'Proche' };
  if (status === 'unknown') return { color: colors.faint, label: 'Non mesuré' };
  return { color: colors.alarm, label: 'En écart' };
}

/**
 * Le sens d'une variation. `flat` est délibérément distinct de `up` : un « +0 »
 * affiché en vert dit « ça va » alors que c'est de la stagnation.
 */
export type DeltaTone = 'up' | 'flat' | 'down' | 'none';

export function deltaColor(tone: DeltaTone): string {
  if (tone === 'up') return colors.ok;
  if (tone === 'down') return colors.alarm;
  return colors.muted;
}

export interface BuiltObjective {
  label: string;
  actual: number | null;
  target: number;
  actualTxt: string;
  targetTxt: string;
  status: KpiStatus;
  statusLabel: string;
  statusColor: string;
  /** `null` quand la métrique n'est pas mesurée — sert au tri « à traiter en priorité ». */
  ratio: number | null;
  delta: number | null;
  deltaTone: DeltaTone;
  deltaTxt: string;
  sample?: Sample;
}

export function buildObjectives(objectives: Objective[]): BuiltObjective[] {
  return objectives.map((o) => {
    const dec = o.dec ?? 0;
    const status = statusFor(o.actual, o.target);
    const meta = stMeta(status);
    const measured = o.actual !== null && Number.isFinite(o.actual);
    const ratio = measured ? Math.max(0, Math.min(1.3, (o.actual as number) / o.target)) : null;
    const delta = measured && o.prev !== null ? (o.actual as number) - o.prev : null;
    const tone: DeltaTone = delta === null ? 'none' : delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat';

    return {
      label: o.label,
      actual: o.actual,
      target: o.target,
      actualTxt: measured ? avecUnite(nombre(o.actual as number, dec), o.unit) : '—',
      targetTxt: avecUnite(nombre(o.target, dec), o.unit),
      status,
      statusLabel: meta.label,
      statusColor: meta.color,
      ratio,
      delta,
      deltaTone: tone,
      deltaTxt:
        delta === null
          ? 'pas de comparaison'
          : `${delta > 0 ? '+' : ''}${nombre(delta, dec)} vs préc.`,
      sample: o.sample,
    };
  });
}

export interface PilotHealth {
  label: string;
  color: string;
  achieved: number;
  total: number;
  /** Objectifs sans donnée : exclus du verdict, mais signalés. */
  unmeasured: number;
}

export function pilotHealth(built: BuiltObjective[], phase: 'avant-lancement' | 'en-cours'): PilotHealth {
  const achieved = built.filter((b) => b.status === 'ok').length;
  const measured = built.filter((b) => b.status !== 'unknown');
  const alarms = measured.filter((b) => b.status === 'alarm').length;
  const total = built.length;
  const unmeasured = total - measured.length;

  // Avant le lancement, mesurer des cibles de fin de pilote ne dit rien d'utile.
  if (phase === 'avant-lancement') {
    return { label: 'Avant lancement', color: colors.muted, achieved, total, unmeasured };
  }
  if (measured.length === 0) {
    return { label: 'Non mesurable', color: colors.faint, achieved, total, unmeasured };
  }

  let label = 'Sain';
  let color: string = colors.ok;
  if (alarms > measured.length / 2) {
    label = 'Critique';
    color = colors.alarm;
  } else if (alarms > 0 || achieved < measured.length / 2) {
    label = 'À surveiller';
    color = colors.warn;
  }
  return { label, color, achieved, total, unmeasured };
}
