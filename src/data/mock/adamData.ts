/**
 * Données simulées (pilote automne 2026), portées depuis
 * ressources/Dashboard interne d'ADAM/adam-data.js
 *
 * Sert de contrat de données : les hooks useXData() retournent cette forme
 * exacte, qu'ils lisent le mock ou une vraie requête Supabase.
 */
import type { AdamData } from '../types';

const N = 82; // jours · 1 sept → 21 nov 2026
const start = new Date(2026, 8, 1);
const dates: string[] = [];
for (let i = 0; i < N; i++) {
  const d = new Date(start.getTime() + i * 864e5);
  dates.push(d.toLocaleDateString('fr-CA', { day: 'numeric', month: 'short' }));
}

const calendar = [
  { i: 2, short: 'Rentrée' },
  { i: 16, short: 'Limite ajout' },
  { i: 42, short: 'Sem. lecture', span: 4 },
  { i: 74, short: 'Limite abandon' },
];

let seed = 11;
const rnd = () => {
  seed = (seed * 1103515245 + 12345) & 0x7fffffff;
  return (seed % 1000) / 1000;
};
const jit = (a: number) => 1 + (rnd() - 0.5) * a;

const signups: number[] = [];
const conv: number[] = [];
const dau: number[] = [];
for (let i = 0; i < N; i++) {
  let s = 3;
  if (i <= 6) s = 24 - i * 2.4;
  if (i >= 13 && i <= 19) s += 6;
  if (i >= 42 && i <= 46) s *= 0.4;
  if (i >= 70 && i <= 75) s += 4;
  signups.push(Math.max(1, Math.round(s * jit(0.22))));

  let c = 95 + i * 2.6;
  if (i >= 13 && i <= 20) c += 150 * (1 - Math.abs(i - 16) / 5);
  if (i >= 42 && i <= 46) c *= 0.55;
  if (i >= 70 && i <= 76) c += 130 * (1 - Math.abs(i - 74) / 5);
  conv.push(Math.max(40, Math.round(c * jit(0.1))));

  let u = 14 + i * 0.28;
  if (i >= 13 && i <= 20) u += 14 * (1 - Math.abs(i - 16) / 5);
  if (i >= 42 && i <= 46) u *= 0.6;
  if (i >= 70 && i <= 76) u += 11 * (1 - Math.abs(i - 74) / 5);
  dau.push(Math.max(8, Math.round(u * jit(0.12))));
}

const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);

export const adamData: AdamData = {
  meta: {
    university: "Université d'Ottawa",
    universities: ["Université d'Ottawa"],
    pilot: 'Pilote · Automne 2026',
    range: '1 sept → 21 nov 2026',
    updated: 'il y a 14 min',
    activeNow: 17,
  },
  dates,
  calendar,

  objectives: [
    { label: 'Comptes créés', actual: 247, prev: 226, target: 240, unit: '' },
    { label: 'Utilisateurs actifs (WAU)', actual: 118, prev: 104, target: 100, unit: '' },
    { label: 'Rétention J+7', actual: 21, prev: 24, target: 30, unit: '%' },
    { label: 'Rétention J+30', actual: 12, prev: 14, target: 20, unit: '%' },
    { label: 'Stickiness (DAU/MAU)', actual: 0.13, prev: 0.15, target: 0.2, unit: '', dec: 2 },
    { label: 'Satisfaction réponses', actual: 71, prev: 73, target: 75, unit: '%' },
    { label: 'Résolution 1er échange', actual: 58, prev: 56, target: 65, unit: '%' },
    { label: 'Clic sur suggestions', actual: 6.4, prev: 8.1, target: 20, unit: '%', dec: 1 },
    { label: 'NPS (fin de pilote)', actual: 41, prev: 34, target: 50, unit: '' },
  ],

  users: {
    total: 247,
    new7: sum(signups.slice(-7)),
    newToday: signups[N - 1],
    signups,
    status: [
      { label: 'Actifs', n: 205, hint: 'connectés ces 30 jours' },
      { label: 'Inactifs', n: 31, hint: 'aucune activité > 30 j' },
      { label: 'En attente', n: 11, hint: 'invités, pas encore connectés' },
    ],
    byFaculty: [
      { name: 'Sciences sociales', n: 69 },
      { name: 'Génie', n: 47 },
      { name: 'Arts', n: 40 },
      { name: 'Telfer (gestion)', n: 35 },
      { name: 'Sciences', n: 30 },
      { name: 'Droit', n: 15 },
      { name: 'Santé', n: 11 },
    ],
    byResidency: [
      { name: 'Résident Ontario', val: 62 },
      { name: 'Hors province', val: 22 },
      { name: 'International', val: 16 },
    ],
    byLanguage: [
      { name: 'Anglais', val: 53 },
      { name: 'Français', val: 47 },
    ],
    byYear: [
      { name: '1re année', val: 38 },
      { name: 'Années sup.', val: 41 },
      { name: 'Cycles sup.', val: 9 },
      { name: 'Autre', val: 12 },
    ],
  },

  usage: {
    dau: 26,
    wau: 118,
    mau: 205,
    dauSeries: dau,
    wauSeries: [22, 41, 58, 64, 79, 88, 96, 71, 104, 112, 118, 121],
    mauSeries: [38, 72, 110, 138, 159, 176, 188, 181, 196, 201, 205, 207],
    retentionD7: 21,
    retentionD7Prev: 24,
    retentionD30: 12,
    retentionD30Prev: 14,
    stickiness: 0.13,
    sessionsPerUser: 2.3,
    questionsPerUser: 4,
    engagementRate: 34,
    cohorts: [
      { label: 'Sem. 1 (rentrée)', row: [100, 41, 28, 22, 19, 17] },
      { label: 'Sem. 2', row: [100, 38, 25, 19, 16, 14] },
      { label: 'Sem. 3 (ajout)', row: [100, 44, 31, 24, 21, null] },
      { label: 'Sem. 4', row: [100, 33, 21, 15, null, null] },
      { label: 'Sem. 5', row: [100, 29, 18, 12, null, null] },
      { label: 'Sem. 6', row: [100, 36, 24, null, null, null] },
      { label: 'Sem. 7 (lecture)', row: [100, 22, 13, null, null, null] },
      { label: 'Sem. 8', row: [100, 39, null, null, null, null] },
    ],
    topFeatures: [
      { name: 'Poser une question', val: 100 },
      { name: 'Recherche de service', val: 41 },
      { name: 'Calculateur de moyenne', val: 23 },
      { name: 'Calendrier & rappels', val: 18 },
      { name: 'Résumés intelligents', val: 14 },
    ],
    conversations: {
      perDay: conv,
      total: sum(conv),
      avgLength: 3.4,
      byCategory: [
        { name: 'Factuelle (dates, frais, lieux)', val: 48 },
        { name: 'Procédure / démarche', val: 27 },
        { name: 'Orientation / conseil', val: 16 },
        { name: 'Hors sujet / autre', val: 9 },
      ],
    },
  },

  quality: {
    satisfaction: 71,
    satisfactionPrev: 73,
    firstResolution: 58,
    firstResolutionPrev: 56,
    fallbackRate: 11,
    fallbackPrev: 13,
    csatSeries: [76, 75, 74, 73, 72, 72, 71, 71, 71],
    responseTypes: [
      { name: 'Réponse directe', val: 64, zone: null },
      { name: 'Reformulation', val: 22, zone: [10, 25] },
      { name: 'Redirection', val: 14, zone: [10, 25] },
    ],
    topTopics: [
      { topic: 'Dates & échéances', n: 412, trend: 'up' },
      { topic: 'Frais de scolarité', n: 288, trend: 'up' },
      { topic: 'Inscription aux cours', n: 255, trend: 'flat' },
      { topic: 'Relevés & transcripts', n: 190, trend: 'flat' },
      { topic: 'Aide financière / OSAP', n: 164, trend: 'up' },
      { topic: 'Co-op & stages', n: 121, trend: 'down' },
    ],
    failures: [
      { topic: 'Questions spécifiques à un programme', n: 87, note: 'sans réponse' },
      { topic: 'Infos en temps réel (places restantes)', n: 64, note: 'données non dispo' },
      { topic: "Démarches d'immigration / permis", n: 52, note: 'hors périmètre' },
      { topic: "Procédures d'appel de notes", n: 38, note: 'réponse vague' },
      { topic: 'Facturation personnelle', n: 29, note: 'accès compte requis' },
    ],
  },

  spot: [
    { label: 'Complétion du profil', val: 61 },
    { label: 'Usage du calculateur', val: 23 },
    { label: 'Installation PWA', val: 14 },
  ],

  filters: {
    faculty: ['Toutes facultés', 'Sciences sociales', 'Génie', 'Arts', 'Telfer (gestion)', 'Sciences', 'Droit', 'Santé'],
    period: ['Pilote complet', '30 derniers jours', '7 derniers jours'],
  },
};
