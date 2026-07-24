/**
 * Logique de statut KPI, portée depuis Dashboard ADAM.dc.html
 * (méthodes statusFor / stMeta / buildObjectives).
 */
import { colors } from '../theme/tokens';
import type { Objective } from '../data/types';

export type KpiStatus = 'ok' | 'warn' | 'alarm';

export function statusFor(actual: number, target: number): KpiStatus {
  const ratio = actual / target;
  if (actual >= target) return 'ok';
  if (ratio >= 0.85) return 'warn';
  return 'alarm';
}

export function stMeta(status: KpiStatus): { color: string; label: string } {
  if (status === 'ok') return { color: colors.ok, label: 'Atteint' };
  if (status === 'warn') return { color: colors.warn, label: 'Proche' };
  return { color: colors.alarm, label: 'En écart' };
}

function fr(n: number, dec = 0): string {
  return n.toLocaleString('fr-CA', { minimumFractionDigits: dec, maximumFractionDigits: dec });
}

export interface BuiltObjective {
  label: string;
  actual: number;
  target: number;
  actualTxt: string;
  targetTxt: string;
  status: KpiStatus;
  statusLabel: string;
  statusColor: string;
  ratio: number;
  delta: number;
  deltaUp: boolean;
}

export function buildObjectives(objectives: Objective[]): BuiltObjective[] {
  return objectives.map((o) => {
    const dec = o.dec ?? 0;
    const status = statusFor(o.actual, o.target);
    const meta = stMeta(status);
    const ratio = Math.max(0, Math.min(1.3, o.actual / o.target));
    const delta = o.actual - o.prev;
    return {
      label: o.label,
      actual: o.actual,
      target: o.target,
      actualTxt: fr(o.actual, dec) + (o.unit || ''),
      targetTxt: fr(o.target, dec) + (o.unit || ''),
      status,
      statusLabel: meta.label,
      statusColor: meta.color,
      ratio,
      delta,
      deltaUp: delta >= 0,
    };
  });
}

export function pilotHealth(built: BuiltObjective[]): { label: string; color: string; achieved: number; total: number } {
  const achieved = built.filter((b) => b.status === 'ok').length;
  const alarms = built.filter((b) => b.status === 'alarm').length;
  const total = built.length;
  let label = 'Sain';
  let color: string = colors.ok;
  if (alarms > total / 2) {
    label = 'Critique';
    color = colors.alarm;
  } else if (alarms > 0 || achieved < total / 2) {
    label = 'À surveiller';
    color = colors.warn;
  }
  return { label, color, achieved, total };
}
