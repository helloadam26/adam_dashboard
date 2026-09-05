/**
 * Contrat de données du dashboard.
 *
 * Principe : toute métrique dont une table ou une colonne existe en base est câblée,
 * même si la colonne est encore vide aujourd'hui. Les blocs correspondants affichent
 * un état « aucune donnée » et se rempliront sans changement de code dès que l'app
 * principale commencera à écrire. Les métriques réellement impossibles — celles qui
 * n'ont aucun support en base — sont recensées dans `unavailableMetrics.ts`.
 */

export interface Objective {
  label: string;
  /**
   * `null` quand la métrique n'a aucune donnée derrière elle (dénominateur vide).
   * Une absence de mesure n'est pas une valeur de 0 : elle ne doit ni compter comme
   * un écart à la cible, ni peser sur le verdict de santé du pilote.
   */
  actual: number | null;
  prev: number | null;
  target: number;
  unit: string;
  dec?: number;
}

export interface StatusItem {
  label: string;
  n: number;
  hint: string;
}

export interface NamedValue {
  name: string;
  val: number;
}

export interface NamedCount {
  name: string;
  n: number;
}

export interface Cohort {
  label: string;
  row: (number | null)[];
}

export interface AgentUsage {
  id: string;
  name: string;
  description: string;
  conversations: number;
  users: number;
  questions: number;
}

export interface TopicItem {
  title: string;
  n: number;
}

/**
 * Une répartition démographique. `renseigne` vaut false quand la colonne source
 * n'est renseignée pour aucun compte — le bloc s'affiche alors en état vide plutôt
 * que sous forme d'un unique segment « Non renseigné » à 100 %.
 */
export interface Distribution {
  renseigne: boolean;
  items: NamedCount[];
  /** Comptes dont la colonne est NULL. */
  manquants: number;
}

export interface AdamData {
  meta: {
    university: string;
    pilot: string;
    range: string;
    /** Horodatage de la requête, pas de la dernière activité. */
    updated: string;
    /** Dernier message reçu, toutes conversations confondues. */
    lastActivity: string;
    activeNow: number;
    /**
     * Phase du pilote. Avant le lancement officiel, les cibles — qui sont des cibles
     * de *fin* de pilote — ne sont pas encore exigibles : aucun verdict de santé
     * n'est rendu.
     */
    phase: 'avant-lancement' | 'en-cours';
    /** Date de lancement officiel du pilote, formatée pour l'affichage. */
    launchDate: string;
  };
  /** Étiquettes des 90 derniers jours, alignées sur toutes les séries quotidiennes. */
  dates: string[];
  objectives: Objective[];
  users: {
    total: number;
    new7: number;
    newToday: number;
    signups: number[];
    status: StatusItem[];
    byFaculty: Distribution;
    byProgram: Distribution;
    byYear: Distribution;
    byResidency: Distribution;
  };
  usage: {
    dau: number;
    wau: number;
    mau: number;
    dauSeries: number[];
    wauSeries: number[];
    mauSeries: number[];
    /** `null` quand aucune cohorte n'est encore observable sur la fenêtre. */
    retentionD7: number | null;
    retentionD7Prev: number | null;
    retentionD30: number | null;
    retentionD30Prev: number | null;
    stickiness: number;
    sessionsPerUser: number;
    questionsPerUser: number;
    /** Questions encore stockées sur 30 jours — à comparer à `quota.counted30d`. */
    questionsStored30d: number;
    cohorts: Cohort[];
    conversations: {
      perDay: number[];
      total: number;
      avgLength: number;
      byFaculty: NamedValue[];
    };
  };
  quality: {
    /** Part de pouces hauts sur l'ensemble des réactions. `null` si aucune réaction. */
    satisfaction: number | null;
    satisfactionPrev: number | null;
    likes: number;
    dislikes: number;
    reactionsTotal: number;
    /** Part des réponses de l'assistant ayant reçu une réaction. */
    reactionCoverage: number;
    feedbacksTotal: number;
    assistantMessages: number;
    /** Proxy : conversations à une seule question / conversations avec question. */
    firstResolution: number | null;
    oneQuestionDiscussions: number;
    answeredDiscussions: number;
    topics: TopicItem[];
  };
  /** Facultés et services — la table s'appelle encore `agents` côté app. */
  faculties: AgentUsage[];
  /**
   * Quota quotidien de questions. La colonne source s'appelle `daily_tokens.tokens_used`,
   * mais elle ne compte pas des tokens LLM : vérifié le 5 septembre 2026, elle égale
   * exactement le nombre de questions posées dans la journée sur 151 des 162
   * jours-utilisateur comparés, et son plafond `tokens_limit` vaut 10 par défaut.
   *
   * Ce compteur diverge des questions encore stockées dans `messages` (639 contre 594
   * au total, 106 contre 33 sur 30 jours) : il persiste quand une conversation
   * disparaît. Les deux mesures sont donc distinctes et toutes deux exactes —
   * « décomptées du quota » d'un côté, « encore conservées » de l'autre.
   */
  quota: {
    /** Questions décomptées du quota, cumul depuis le début. */
    counted: number;
    counted30d: number;
    perDay: number[];
    /**
     * Plafond quotidien usuel (le mode, pas la moyenne). Un unique compte à 1000
     * tirait la moyenne à 13,3 alors que le plafond rencontré est 10.
     */
    usualLimit: number;
    /** Questions par jour réellement actif — les jours à zéro sont exclus. */
    avgUsedOnActiveDays: number;
    /** Jours actifs où le plafond a été atteint. */
    daysAtLimit: number;
    usersAtLimit: number;
    /** Jours-utilisateur avec au moins une question — dénominateur des deux ci-dessus. */
    activeDays: number;
  };
}
