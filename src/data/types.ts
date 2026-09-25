/**
 * Contrat de données du dashboard.
 *
 * Principe : toute métrique dont une table ou une colonne existe en base est câblée,
 * même si la colonne est encore vide aujourd'hui. Les blocs correspondants affichent
 * un état « aucune donnée » et se rempliront sans changement de code dès que l'app
 * principale commencera à écrire. Les métriques réellement impossibles — celles qui
 * n'ont aucun support en base — sont recensées dans `unavailableMetrics.ts`.
 */

import type { Sample } from '../lib/sample';

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
  /**
   * Observations derrière la valeur, quand c'est un ratio. Absent pour un compte
   * absolu — « 86 comptes créés » n'a pas d'échantillon, c'est la mesure elle-même.
   */
  sample?: Sample;
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
  /** Taille de la cohorte — dénominateur de chaque pourcentage de la ligne. */
  n: number;
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

/** Catégorie d'échéance. Liste fermée, contrainte par un CHECK en base. */
export type CalendarEventType = 'exam' | 'assignment' | 'quiz' | 'other';

export interface CalendarTypeItem {
  type: CalendarEventType;
  label: string;
  n: number;
  validated: number;
  users: number;
}

/**
 * Module Calendrier : un étudiant dépose le plan de cours d'un cours, une IA en
 * extrait les échéances datées, l'étudiant les valide, des rappels se programment.
 *
 * Aucun contenu écrit par l'étudiant ne transite ici — ni titre d'échéance, ni code
 * de cours, ni nom de fichier, ni extrait du plan de cours. Uniquement des comptes
 * par type et par statut (migration 20260912100000).
 */
export interface CalendarData {
  courses: number;
  coursesUsers: number;
  imports: {
    total: number;
    users: number;
    ready: number;
    failed: number;
    /** En attente ou en cours de traitement. */
    running: number;
    withWarnings: number;
    /** Imports dont la seconde passe de vérification a confirmé l'extraction. */
    verified: number;
    archived: number;
  };
  events: {
    total: number;
    users: number;
    validated: number;
    draft: number;
    rejected: number;
    /** Échéances saisies à la main plutôt qu'extraites. */
    manual: number;
    /** Échéances extraites puis retouchées par l'étudiant. */
    corrected: number;
    high: number;
    medium: number;
    low: number;
  };
  reminders: {
    total: number;
    sent: number;
    pending: number;
    failed: number;
    /** Comptes ayant activé les rappels dans leurs préférences. */
    optedIn: number;
  };
  byType: CalendarTypeItem[];
  firstImportDay: string | null;
  lastEventAt: string | null;
  /**
   * Ce que l'équipe a produit en test interne. Compté à part et jamais additionné
   * aux chiffres ci-dessus : au 12 septembre 2026 c'est la totalité des données du
   * module, et un écran tout à zéro sans cette précision se lirait comme une panne.
   */
  staff: { imports: number; events: number; users: number };
}

export interface AdamData {
  meta: {
    /**
     * Qui est mesuré — et non quelle institution serait derrière. « Établissement :
     * Université d'Ottawa » se lisait comme une caution officielle sur un écran
     * exportable, alors qu'ADAM est un projet étudiant sans partenariat formel.
     */
    population: string;
    /** Rappel explicite de l'absence de lien institutionnel, affiché et exporté. */
    affiliation: string;
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
    /** Taille des cohortes de rétention — dénominateurs des taux ci-dessous. */
    retentionD7N: number;
    retentionD30N: number;
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
  calendar: CalendarData;
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
