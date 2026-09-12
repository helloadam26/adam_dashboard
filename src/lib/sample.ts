/**
 * Garde-fou « petit échantillon », partagé par tout le dashboard.
 *
 * Un ratio affiché en gros titre se lit comme une tendance. « 25 % de rétention »
 * calculé sur 4 personnes, ou « 100 % » sur une cohorte d'une seule, n'est pas une
 * tendance : c'est du bruit. L'onglet Qualité IA portait déjà cet avertissement ;
 * ce module l'étend partout où un ratio est affiché.
 *
 * Le seuil reprend celui déjà retenu pour le k-anonymat des sujets de conversation
 * (« partagé par au moins 5 étudiants distincts ») : en deçà de 5 observations, on
 * ne montre pas un chiffre comme s'il signifiait quelque chose.
 */
export const N_MIN = 5;

export interface Sample {
  /** Nombre d'observations derrière le ratio. */
  n: number;
  /** Ce que compte `n`, au pluriel : « comptes », « réactions », « conversations ». */
  noun: string;
}

export function isLowSample(sample: Sample | undefined): boolean {
  return sample !== undefined && sample.n < N_MIN;
}

/** Phrase d'avertissement, au singulier ou au pluriel selon `n`. */
export function sampleWarning(sample: Sample): string {
  if (sample.n === 0) return `Aucune donnée — ce ratio n'a pas de dénominateur.`;
  const noun = sample.n === 1 ? sample.noun.replace(/s$/, '') : sample.noun;
  return `Signal insuffisant — calculé sur ${sample.n} ${noun}.`;
}
