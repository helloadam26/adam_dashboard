/**
 * Jeux de données de test, activés uniquement en développement par
 * VITE_DASHBOARD_FIXTURES=1 (voir .env.example et App.tsx).
 *
 * Raison d'être : la base réelle est dans l'état où elle est. Elle ne produit pas
 * sur commande une cohorte vide, un ratio calculé sur un seul actif, ou la phase
 * « avant lancement » — or ce sont précisément les états qu'il faut voir pour
 * vérifier les garde-fous du dashboard. Ces scénarios les fabriquent.
 *
 * Ces chiffres sont inventés. Le bandeau affiché en mode fixtures est là pour
 * qu'aucune capture d'écran ne puisse être prise pour de la donnée réelle.
 */
import type { AdamData, Cohort, Distribution, StatusItem } from './types';

export type ScenarioId = 'pilote-reel' | 'avant-lancement' | 'signal-faible' | 'sain';

export const SCENARIOS: { id: ScenarioId; label: string; description: string }[] = [
  {
    id: 'pilote-reel',
    label: 'Pilote réel',
    description: "L'état décrit par la revue : pilote lancé, faibles volumes, 2 objectifs sans donnée.",
  },
  {
    id: 'avant-lancement',
    label: 'Avant lancement',
    description: 'Le pilote n’a pas démarré : les cibles de fin de pilote ne sont pas exigibles.',
  },
  {
    id: 'signal-faible',
    label: 'Signal faible',
    description: 'Un seul actif, une cohorte de 2 : tous les ratios sont du bruit.',
  },
  { id: 'sain', label: 'Pilote sain', description: 'Volumes atteints — contrôle de mise à l’échelle.' },
];

const DAYS = 90;

function labels(): string[] {
  const out: string[] = [];
  for (let i = DAYS - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86_400_000);
    out.push(d.toLocaleDateString('fr-CA', { day: 'numeric', month: 'short' }));
  }
  return out;
}

/** Série déterministe : deux exécutions doivent produire la même capture. */
function serie(max: number, seed: number): number[] {
  const out: number[] = [];
  let x = seed;
  for (let i = 0; i < DAYS; i++) {
    x = (x * 1103515245 + 12345) % 2147483648;
    const ramp = i / DAYS;
    out.push(Math.round((x / 2147483648) * max * (0.25 + ramp)));
  }
  return out;
}

const statut = (a: number, d: number, u: number, n: number): StatusItem[] => [
  { label: 'Actifs', n: a, hint: 'une question posée ces 30 jours' },
  { label: 'Dormants', n: d, hint: 'aucune activité depuis plus de 30 jours' },
  {
    label: 'Usage sans historique',
    n: u,
    hint: 'ont consommé leur quota de questions, mais aucune conversation n’est conservée',
  },
  { label: 'Jamais actifs', n, hint: 'compte créé, aucune question posée' },
];

const vide: Distribution = { renseigne: false, items: [], manquants: 0 };

const remplie = (items: [string, number][], manquants = 0): Distribution => ({
  renseigne: true,
  items: items.map(([name, n]) => ({ name, n })),
  manquants,
});

const cohortes = (rows: [string, number, (number | null)[]][]): Cohort[] =>
  rows.map(([semaine, n, row]) => ({ label: `Sem. du ${semaine}`, n, row }));

function base(): AdamData {
  return {
    meta: {
      university: "Université d'Ottawa",
      pilot: 'FIXTURES · données inventées',
      range: '2 juin → aujourd’hui',
      updated: '5 sept. 2026, 14:30',
      lastActivity: '5 sept. 2026, 11:02',
      activeNow: 0,
      phase: 'en-cours',
      launchDate: '1 septembre 2026',
    },
    dates: labels(),
    objectives: [],
    users: {
      total: 0,
      new7: 0,
      newToday: 0,
      signups: serie(2, 7),
      status: statut(0, 0, 0, 0),
      byFaculty: vide,
      byProgram: vide,
      byYear: vide,
      byResidency: vide,
    },
    usage: {
      dau: 0,
      wau: 0,
      mau: 0,
      dauSeries: serie(3, 11),
      wauSeries: serie(5, 13),
      mauSeries: serie(8, 17),
      retentionD7N: 0,
      retentionD30N: 0,
      retentionD7: null,
      retentionD7Prev: null,
      retentionD30: null,
      retentionD30Prev: null,
      stickiness: 0,
      sessionsPerUser: 0,
      questionsPerUser: 0,
      questionsStored30d: 0,
      cohorts: [],
      conversations: { perDay: serie(6, 19), total: 0, avgLength: 0, byFaculty: [] },
    },
    quality: {
      satisfaction: null,
      satisfactionPrev: null,
      likes: 0,
      dislikes: 0,
      reactionsTotal: 0,
      reactionCoverage: 0,
      feedbacksTotal: 0,
      assistantMessages: 0,
      firstResolution: null,
      oneQuestionDiscussions: 0,
      answeredDiscussions: 0,
      topics: [],
    },
    faculties: [],
    quota: {
      counted: 0,
      counted30d: 0,
      perDay: serie(4, 23),
      usualLimit: 10,
      avgUsedOnActiveDays: 0,
      daysAtLimit: 0,
      usersAtLimit: 0,
      activeDays: 0,
    },
  };
}

const FACULTES = [
  { id: 'a1', name: 'Génie', description: 'Espace facultaire Génie' },
  { id: 'a2', name: 'Sciences de la santé', description: 'Espace facultaire Santé' },
  { id: 'a3', name: 'Sciences sociales', description: 'Espace facultaire Sciences sociales' },
  { id: 'a4', name: 'Droit', description: 'Espace facultaire Droit' },
];

export function fixture(id: ScenarioId): AdamData {
  const d = base();

  if (id === 'avant-lancement') {
    d.meta.phase = 'avant-lancement';
    d.meta.launchDate = '1 novembre 2026';
    d.users.total = 82;
    d.users.new7 = 6;
    d.users.newToday = 0;
    d.users.status = statut(1, 3, 0, 78);
    d.usage.dau = 1;
    d.usage.wau = 1;
    d.usage.mau = 2;
    d.usage.stickiness = 0.5;
    d.usage.sessionsPerUser = 28;
    d.usage.questionsPerUser = 34.5;
    d.usage.questionsStored30d = 0;
    d.usage.conversations.total = 56;
    d.usage.conversations.avgLength = 7.59;
    d.quality.assistantMessages = 574;
    d.objectives = [
      { label: 'Comptes créés', actual: 82, prev: 76, target: 240, unit: '' },
      { label: 'Utilisateurs actifs (WAU)', actual: 1, prev: 1, target: 100, unit: '' },
      { label: 'Rétention J+7', actual: null, prev: null, target: 30, unit: '%' },
      { label: 'Rétention J+30', actual: null, prev: null, target: 20, unit: '%' },
      { label: 'Stickiness (DAU/MAU)', actual: 0.5, prev: 0.5, target: 0.2, unit: '', dec: 2 },
      { label: 'Satisfaction réponses', actual: null, prev: null, target: 75, unit: '%' },
      { label: 'Résolution 1er échange', actual: null, prev: null, target: 65, unit: '%' },
    ];
    return d;
  }

  if (id === 'signal-faible') {
    d.users.total = 82;
    d.users.new7 = 1;
    d.users.newToday = 0;
    d.users.status = statut(1, 2, 1, 78);
    d.usage.dau = 1;
    d.usage.wau = 1;
    d.usage.mau = 1;
    d.usage.stickiness = 1;
    d.usage.sessionsPerUser = 28;
    d.usage.questionsPerUser = 34.5;
    d.usage.questionsStored30d = 28;
    d.usage.retentionD7 = 50;
    d.usage.retentionD7Prev = null;
    d.usage.conversations.total = 28;
    d.usage.conversations.avgLength = 7.59;
    d.usage.conversations.byFaculty = [{ name: 'Génie', val: 28 }];
    // Une cohorte de 2 personnes : « 50 % » y vaut exactement une personne.
    d.usage.cohorts = cohortes([
      ['10 août', 2, [100, 50, 50, null, null, null]],
      ['17 août', 1, [100, 0, null, null, null, null]],
    ]);
    d.quality.assistantMessages = 574;
    d.quality.likes = 3;
    d.quality.dislikes = 1;
    d.quality.reactionsTotal = 4;
    d.quality.reactionCoverage = 0.7;
    d.quality.feedbacksTotal = 1;
    d.quality.satisfaction = 75;
    d.quality.satisfactionPrev = null;
    d.quality.firstResolution = null;
    d.faculties = [{ ...FACULTES[0], conversations: 28, users: 1, questions: 213 }];
    d.quota = { ...d.quota, counted: 213, counted30d: 34, usualLimit: 10, avgUsedOnActiveDays: 4.2, daysAtLimit: 2, usersAtLimit: 1, activeDays: 21 };
    d.objectives = [
      { label: 'Comptes créés', actual: 82, prev: 82, target: 240, unit: '' },
      { label: 'Utilisateurs actifs (WAU)', actual: 1, prev: 0, target: 100, unit: '' },
      { label: 'Rétention J+7', actual: 50, prev: null, target: 30, unit: '%' },
      { label: 'Rétention J+30', actual: null, prev: null, target: 20, unit: '%' },
      { label: 'Stickiness (DAU/MAU)', actual: 1, prev: 1, target: 0.2, unit: '', dec: 2 },
      { label: 'Satisfaction réponses', actual: 75, prev: null, target: 75, unit: '%' },
      { label: 'Résolution 1er échange', actual: null, prev: null, target: 65, unit: '%' },
    ];
    return d;
  }

  if (id === 'sain') {
    d.users.total = 251;
    d.users.new7 = 18;
    d.users.newToday = 3;
    d.users.status = statut(147, 62, 9, 33);
    d.users.byFaculty = remplie([['Génie', 71], ['Sciences de la santé', 58], ['Sciences sociales', 49], ['Droit', 31]], 42);
    d.users.byYear = remplie([['1re année', 88], ['2e année', 64], ['3e année', 41], ['4e année', 16]], 42);
    d.users.byResidency = remplie([['Canadian', 163], ['International', 46]], 42);
    d.usage.dau = 38;
    d.usage.wau = 112;
    d.usage.mau = 147;
    d.usage.stickiness = 0.26;
    d.usage.sessionsPerUser = 6.4;
    d.usage.questionsPerUser = 14.2;
    d.usage.questionsStored30d = 3_980;
    d.usage.retentionD7 = 41;
    d.usage.retentionD7Prev = 36;
    d.usage.retentionD30 = 24;
    d.usage.retentionD30Prev = 21;
    d.usage.conversations.total = 3182;
    d.usage.conversations.avgLength = 4.31;
    d.usage.conversations.byFaculty = [
      { name: 'Génie', val: 1204 },
      { name: 'Sciences de la santé', val: 892 },
      { name: 'Sciences sociales', val: 671 },
      { name: 'Droit', val: 415 },
    ];
    d.usage.cohorts = cohortes([
      ['13 juill.', 34, [100, 62, 47, 41, 38, 35]],
      ['20 juill.', 41, [100, 68, 51, 44, 40, null]],
      ['27 juill.', 38, [100, 71, 55, 46, null, null]],
      ['3 août', 46, [100, 66, 52, null, null, null]],
    ]);
    d.quality.assistantMessages = 13_704;
    d.quality.likes = 812;
    d.quality.dislikes = 143;
    d.quality.reactionsTotal = 955;
    d.quality.reactionCoverage = 7;
    d.quality.feedbacksTotal = 62;
    d.quality.satisfaction = 85;
    d.quality.satisfactionPrev = 81;
    d.quality.firstResolution = 68;
    d.quality.oneQuestionDiscussions = 1421;
    d.quality.answeredDiscussions = 2090;
    d.quality.topics = [
      { title: 'Inscription aux cours', n: 34 },
      { title: 'Aide financière', n: 27 },
      { title: 'Horaires d’examens', n: 19 },
    ];
    d.faculties = FACULTES.map((f, i) => ({
      ...f,
      conversations: [1204, 892, 671, 415][i],
      users: [58, 44, 31, 22][i],
      questions: [5182, 3841, 2890, 1791][i],
    }));
    d.quota = { ...d.quota, counted: 12_840, counted30d: 4_310, usualLimit: 10, avgUsedOnActiveDays: 6.8, daysAtLimit: 214, usersAtLimit: 47, activeDays: 1904 };
    d.objectives = [
      { label: 'Comptes créés', actual: 251, prev: 233, target: 240, unit: '' },
      { label: 'Utilisateurs actifs (WAU)', actual: 112, prev: 98, target: 100, unit: '' },
      { label: 'Rétention J+7', actual: 41, prev: 36, target: 30, unit: '%' },
      { label: 'Rétention J+30', actual: 24, prev: 21, target: 20, unit: '%' },
      { label: 'Stickiness (DAU/MAU)', actual: 0.26, prev: 0.26, target: 0.2, unit: '', dec: 2 },
      { label: 'Satisfaction réponses', actual: 85, prev: 81, target: 75, unit: '%' },
      { label: 'Résolution 1er échange', actual: 68, prev: null, target: 65, unit: '%' },
    ];
    return d;
  }

  // pilote-reel : l'état décrit par la revue, pilote déjà lancé.
  d.users.total = 82;
  d.users.new7 = 4;
  d.users.newToday = 0;
  d.users.status = statut(7, 44, 6, 29);
  d.usage.dau = 1;
  d.usage.wau = 1;
  d.usage.mau = 2;
  d.usage.stickiness = 0.5;
  d.usage.sessionsPerUser = 28;
  d.usage.questionsPerUser = 34.5;
  d.usage.questionsStored30d = 33;
  d.usage.retentionD7 = 0;
  d.usage.retentionD7Prev = 0;
  d.usage.retentionD30 = null;
  d.usage.retentionD30Prev = null;
  d.usage.conversations.total = 619;
  d.usage.conversations.avgLength = 7.59;
  d.usage.conversations.byFaculty = [
    { name: 'Génie', val: 341 },
    { name: 'Sciences de la santé', val: 156 },
    { name: 'Sciences sociales', val: 122 },
  ];
  d.usage.cohorts = cohortes([
    ['10 août', 2, [100, 50, 0, null, null, null]],
    ['17 août', 3, [100, 33, null, null, null, null]],
    ['24 août', 1, [100, null, null, null, null, null]],
  ]);
  d.quality.assistantMessages = 574;
  d.quality.likes = 3;
  d.quality.dislikes = 1;
  d.quality.reactionsTotal = 4;
  d.quality.reactionCoverage = 0.7;
  d.quality.feedbacksTotal = 2;
  d.quality.satisfaction = 75;
  d.quality.satisfactionPrev = null;
  d.quality.firstResolution = null;
  d.quality.oneQuestionDiscussions = 0;
  d.quality.answeredDiscussions = 0;
  d.faculties = FACULTES.slice(0, 3).map((f, i) => ({
    ...f,
    conversations: [341, 156, 122][i],
    users: [2, 1, 1][i],
    questions: [2588, 1184, 926][i],
  }));
  d.quota = { ...d.quota, counted: 639, counted30d: 106, usualLimit: 10, avgUsedOnActiveDays: 3.5, daysAtLimit: 12, usersAtLimit: 4, activeDays: 184 };
  d.objectives = [
    { label: 'Comptes créés', actual: 82, prev: 82, target: 240, unit: '' },
    { label: 'Utilisateurs actifs (WAU)', actual: 1, prev: 0, target: 100, unit: '' },
    { label: 'Rétention J+7', actual: 0, prev: 0, target: 30, unit: '%' },
    { label: 'Rétention J+30', actual: null, prev: null, target: 20, unit: '%' },
    { label: 'Stickiness (DAU/MAU)', actual: 0.5, prev: 0.5, target: 0.2, unit: '', dec: 2 },
    { label: 'Satisfaction réponses', actual: 75, prev: null, target: 75, unit: '%' },
    { label: 'Résolution 1er échange', actual: null, prev: null, target: 65, unit: '%' },
  ];
  return d;
}
