/**
 * Registre des métriques prévues au périmètre initial (playbook + prototype) qui
 * n'ont aucun support en base aujourd'hui.
 *
 * Ce fichier est la source de vérité de la section Paramètres → « Métriques non
 * disponibles ». Chaque entrée dit *pourquoi* c'est bloqué et *ce qu'il faut* pour
 * la débloquer, avec la dépendance responsable — c'est cette dépendance qui indique
 * à qui revient le travail.
 */

export type Dependance =
  /** Les utilisateurs doivent fournir l'information (formulaire, onboarding, sondage). */
  | 'utilisateurs'
  /** L'app étudiante ADAM doit collecter, instrumenter ou stocker la donnée. */
  | 'app-principale'
  /** La donnée existe : il reste à la calculer ou l'afficher dans ce dashboard. */
  | 'dashboard';

/**
 * Les chiffres cités dans ces textes doivent venir des mêmes vues que le reste du
 * dashboard. Écrits en dur, ils se figent au jour de leur rédaction et finissent par
 * contredire l'onglet Qualité IA sur la même métrique — c'est le tueur de confiance
 * n° 1 d'un dashboard.
 */
export interface ContexteMetriques {
  comptes: number;
  reactions: number;
  reponses: number;
  /** Part des réponses ayant reçu une réaction, en %. */
  couverture: number;
}

export interface MetriqueIndisponible {
  metrique: string;
  /** Ce qui manque, factuellement. Fonction dès que le constat cite un chiffre. */
  raison: string | ((ctx: ContexteMetriques) => string);
  /** Ce qu'il faudrait mettre en place. */
  requis: string;
  dependance: Dependance;
}

import { nombre as fr, pourcent } from '../lib/format';

export function raisonTexte(m: MetriqueIndisponible, ctx: ContexteMetriques): string {
  return typeof m.raison === 'function' ? m.raison(ctx) : m.raison;
}

export const DEPENDANCE_LABELS: Record<Dependance, string> = {
  utilisateurs: 'Utilisateurs',
  'app-principale': 'App ADAM',
  dashboard: 'Ce dashboard',
};

export const DEPENDANCE_HINTS: Record<Dependance, string> = {
  utilisateurs: "L'information doit être saisie par les étudiants.",
  'app-principale': "La fonctionnalité ou l'instrumentation manque dans l'app étudiante.",
  dashboard: 'La donnée est en base, le travail restant est ici.',
};

export const METRIQUES_INDISPONIBLES: MetriqueIndisponible[] = [
  {
    metrique: 'Répartition par faculté, programme et année d’étude',
    raison: (ctx) =>
      `Les colonnes profiles.faculty, program et study_years existent mais sont vides sur les ${fr(ctx.comptes)} comptes. Les blocs d’affichage sont en place et se rempliront seuls.`,
    requis:
      'Faire renseigner ces champs à l’inscription ou dans le profil, puis les rendre obligatoires ou les pré-remplir depuis l’annuaire uOttawa.',
    dependance: 'utilisateurs',
  },
  {
    metrique: 'Statut de résidence (Ontario / hors province / international)',
    raison:
      'profiles.statut n’accepte que « Canadian » et « International » et n’est renseigné pour aucun compte. La distinction « hors province » n’est pas modélisée.',
    requis:
      'Élargir la contrainte de profiles.statut aux trois valeurs attendues, puis collecter l’information à l’inscription.',
    dependance: 'app-principale',
  },
  {
    metrique: 'Langue d’interface',
    raison: 'Aucune colonne ni table ne stocke la langue choisie par l’utilisateur.',
    requis: 'Ajouter une colonne de préférence de langue sur profiles et l’écrire depuis l’app.',
    dependance: 'app-principale',
  },
  {
    metrique: 'Satisfaction et CSAT fiables',
    raison: (ctx) =>
      `Le mécanisme existe (message_reactions) mais n’a récolté que ${fr(ctx.reactions)} réactions pour ${fr(ctx.reponses)} réponses, soit ${pourcent(ctx.couverture, 1)} de couverture. L’indicateur est affiché tel quel, sans valeur statistique.`,
    requis:
      'Rendre les pouces haut/bas plus visibles dans l’app, ou solliciter une évaluation en fin de conversation, pour monter la couverture à quelques pourcents.',
    dependance: 'app-principale',
  },
  {
    metrique: 'Résolution au 1er échange (mesure réelle)',
    raison:
      'Aucun signal explicite de résolution. Le dashboard affiche un proxy — conversations à une seule question — qui confond résolution et abandon.',
    requis:
      'Une question de clôture du type « as-tu obtenu ta réponse ? », ou un événement de résolution émis par l’app.',
    dependance: 'app-principale',
  },
  {
    metrique: 'Taux de fallback et types de réponse (directe / reformulation / redirection)',
    raison:
      'messages ne porte ni type de réponse, ni score de confiance, ni marqueur de repli. Rien ne distingue une réponse directe d’un aveu d’ignorance.',
    requis:
      'Écrire une colonne de classification ou de métadonnées sur messages au moment de la génération de la réponse.',
    dependance: 'app-principale',
  },
  {
    metrique: 'Top sujets et thèmes d’échec',
    raison:
      'La seule source serait discussions.title, mais ces titres sont rares (6 sur 597) et surtout identifiants : sur les données actuelles, chacun provient d’un unique étudiant. Le bloc Qualité IA ne montre donc qu’un thème partagé par ≥ 5 étudiants distincts, réservé aux administrateurs — vide aujourd’hui, à dessein.',
    requis:
      'Une classification thématique produite côté app (taxonomie de sujets rattachée à chaque conversation), plutôt que des titres bruts, pour obtenir des thèmes agrégés et non-identifiants.',
    dependance: 'app-principale',
  },
  {
    metrique: 'Usage des fonctionnalités (calculateur, recherche, rappels…)',
    raison: 'Aucune table d’événements produit. Seuls les messages et conversations sont journalisés.',
    requis: 'Une table d’événements applicatifs (utilisateur, fonctionnalité, horodatage).',
    dependance: 'app-principale',
  },
  {
    metrique: 'NPS de fin de pilote',
    raison: 'Aucun sondage n’est administré ni stocké.',
    requis: 'Lancer le sondage NPS en fin de pilote et en stocker les réponses.',
    dependance: 'utilisateurs',
  },
  {
    metrique: 'Complétion du profil et installation PWA',
    raison:
      'La complétion serait calculable dès que les champs de profil seront remplis. L’installation PWA n’est journalisée nulle part.',
    requis:
      'Pour la complétion : rien de plus qu’un remplissage des champs de profil. Pour la PWA : journaliser l’événement d’installation.',
    dependance: 'app-principale',
  },
  {
    metrique: 'Repères du calendrier académique sur les courbes',
    raison:
      'Aucune table de dates universitaires (rentrée, limites d’ajout et d’abandon, semaine de lecture). '
      + 'À ne pas confondre avec le module Calendrier : `calendar_events` contient les échéances propres '
      + 'à chaque étudiant, extraites de son plan de cours, pas le calendrier officiel de l’université.',
    requis:
      'Ces dates sont publiques et peu nombreuses : une table de référence en base, ou une constante versionnée dans ce dépôt, suffit.',
    dependance: 'dashboard',
  },
  {
    metrique: 'Filtres transversaux (faculté, langue, appareil)',
    raison:
      'Le FiltersContext prévu par l’architecture n’a aucune dimension à filtrer tant que les champs de profil sont vides. Seule la période est exploitable.',
    requis: 'Les mêmes champs de profil que ci-dessus ; le câblage des filtres restera à faire ici.',
    dependance: 'dashboard',
  },
];
