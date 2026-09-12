/**
 * Formatage des nombres, partagé par tout le dashboard.
 *
 * L'interface est en français : virgule décimale et espace insécable avant le
 * « % ». Le mélange constaté en revue — « 0,20 » à côté de « 7.59 » et « 0.7% » —
 * venait de deux chemins concurrents : les valeurs passées par
 * `toLocaleString('fr-CA')` sortaient à la virgule, celles produites par
 * `toFixed()` ou rendues brutes gardaient le point de JavaScript.
 *
 * Règle : on ne formate jamais un nombre à la main. Les couches de données
 * transportent des `number`, ces fonctions les rendent.
 */

/** Espace fine insécable (U+202F), l'espace attendue devant « % » en français. */
const NBSP_FINE = ' ';

export function nombre(n: number, dec = 0): string {
  return n.toLocaleString('fr-CA', { minimumFractionDigits: dec, maximumFractionDigits: dec });
}

/** Nombre à décimales variables : n'affiche les décimales que si elles existent. */
export function nombreSouple(n: number, decMax = 2): string {
  return n.toLocaleString('fr-CA', { maximumFractionDigits: decMax });
}

export function pourcent(n: number, dec = 0): string {
  return `${nombre(n, dec)}${NBSP_FINE}%`;
}

/** Applique l'unité d'un objectif : « % » prend son espace, le reste est collé. */
export function avecUnite(valeur: string, unit: string): string {
  if (!unit) return valeur;
  return unit === '%' ? `${valeur}${NBSP_FINE}%` : `${valeur}${unit}`;
}
