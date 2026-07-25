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

export interface MetriqueIndisponible {
  metrique: string;
  /** Ce qui manque, factuellement. */
  raison: string;
  /** Ce qu'il faudrait mettre en place. */
  requis: string;
  dependance: Dependance;
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
    raison:
      'Les colonnes profiles.faculty, program et study_years existent mais sont vides sur les 81 comptes. Les blocs d’affichage sont en place et se rempliront seuls.',
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
    raison:
      'Le mécanisme existe (message_reactions) mais n’a récolté que 4 réactions pour 592 réponses, soit moins de 1 % de couverture. L’indicateur est affiché tel quel, sans valeur statistique.',
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
      'La seule approximation est discussions.title, renseigné pour 6 conversations sur 597. Aucune catégorisation thématique n’est stockée.',
    requis:
      'Générer systématiquement le titre de conversation, et idéalement classer chaque conversation dans une taxonomie de sujets côté app.',
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
    raison: 'Aucune table de dates universitaires (rentrée, limites d’ajout et d’abandon, semaine de lecture).',
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
