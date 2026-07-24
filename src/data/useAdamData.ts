import { adamData } from './mock/adamData';
import type { AdamData } from './types';

/**
 * Point d'entrée unique pour les données du dashboard.
 * Aujourd'hui : retourne les données simulées.
 * Plus tard : bascule vers des hooks TanStack Query branchés sur des vues
 * Supabase en lecture seule, en conservant la même forme de retour (AdamData),
 * donc sans changer les composants qui consomment ce hook.
 */
export function useAdamData(): AdamData {
  return adamData;
}
