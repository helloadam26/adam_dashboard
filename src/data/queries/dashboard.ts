/**
 * Lecture des vues `dashboard_*`
 * (voir supabase/migrations/2026072412*.sql et 2026072413*.sql).
 *
 * Les vues appartiennent à postgres et contournent donc la RLS des tables
 * applicatives ; l'accès est filtré dans leur corps par `is_dashboard_admin()`.
 * Ce prédicat est temporairement ouvert le temps de la phase de conception, pendant
 * laquelle l'authentification est masquée côté front.
 */
import { supabase } from '../supabaseClient';
import type { AdamData, Cohort, Distribution, NamedCount, Objective, StatusItem } from '../types';

export class MissingAdminAccessError extends Error {
  constructor() {
    super(
      "Les vues du dashboard ne renvoient aucune ligne. Soit la migration n'est pas appliquée, " +
        "soit le prédicat is_dashboard_admin() refuse la session courante.",
    );
    this.name = 'MissingAdminAccessError';
  }
}

/** Cibles du pilote, issues du playbook — elles ne vivent pas en base. */
const TARGETS = {
  usersTotal: 240,
  wau: 100,
  retentionD7: 30,
  retentionD30: 20,
  stickiness: 0.2,
  satisfaction: 75,
  firstResolution: 65,
} as const;

interface OverviewRow {
  users_total: number;
  users_total_prev: number;
  users_new_7d: number;
  users_new_today: number;
  dau: number;
  dau_prev: number;
  wau: number;
  wau_prev: number;
  mau: number;
  mau_prev: number;
  active_now: number;
  conversations_total: number;
  conversations_30d: number;
  questions_30d: number;
  avg_conversation_length: string | number;
  last_activity: string | null;
  first_signup_day: string | null;
  tokens_total: string | number;
  tokens_30d: string | number;
}

interface DailyRow {
  day: string;
  signups: number;
  conversations: number;
  active_users: number;
  questions: number;
  tokens: number;
}

interface StatusRow {
  status: 'active' | 'dormant' | 'never_active';
  n: number;
}

interface AgentRow {
  agent_id: string;
  agent_name: string;
  agent_description: string | null;
  conversations: number;
  users: number;
  questions: number;
}

interface RetentionRow {
  d7: number;
  d7_prev: number;
  d30: number;
  d30_prev: number;
}

interface CohortRow {
  cohort_week: string;
  cohort_size: number;
  week_offset: number | null;
  retained: number;
}

interface SeriesRow {
  grain: 'week' | 'month';
  bucket: string;
  active_users: number;
}

interface DemographicRow {
  dimension: 'faculty' | 'program' | 'study_years' | 'statut';
  value: string;
  n: number;
}

interface QualityRow {
  likes: number;
  dislikes: number;
  likes_30d: number;
  dislikes_30d: number;
  likes_prev: number;
  dislikes_prev: number;
  feedbacks_total: number;
  assistant_messages: number;
  one_question_discussions: number;
  answered_discussions: number;
}

interface TopicRow {
  title: string;
  n: number;
}

interface QuotaRow {
  avg_limit: string | number;
  avg_used: string | number;
  days_at_limit: number;
  users_at_limit: number;
  user_days: number;
}

/** PostgREST renvoie `numeric` et `bigint` sous forme de chaînes. */
const num = (v: string | number | null | undefined): number => (v == null ? 0 : Number(v));

const DAY_MS = 86_400_000;

/** Valeur écrite par la vue quand la colonne source est NULL. */
const NON_RENSEIGNE = 'Non renseigné';

function formatDay(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short' });
}

function formatDateTime(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('fr-CA', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const STATUS_LABELS: Record<StatusRow['status'], { label: string; hint: string }> = {
  active: { label: 'Actifs', hint: 'au moins un message ces 30 jours' },
  dormant: { label: 'Dormants', hint: 'aucun message depuis plus de 30 jours' },
  never_active: { label: 'Jamais actifs', hint: 'compte créé, aucun message envoyé' },
};

const STATUS_ORDER: StatusRow['status'][] = ['active', 'dormant', 'never_active'];

function buildStatus(rows: StatusRow[]): StatusItem[] {
  return STATUS_ORDER.map((status) => ({
    label: STATUS_LABELS[status].label,
    n: rows.find((r) => r.status === status)?.n ?? 0,
    hint: STATUS_LABELS[status].hint,
  }));
}

/**
 * Une dimension dont toutes les lignes retombent dans « Non renseigné » est marquée
 * non renseignée : le bloc s'affichera en état vide au lieu d'un camembert à 100 %.
 */
function buildDistribution(rows: DemographicRow[], dimension: DemographicRow['dimension']): Distribution {
  const forDimension = rows.filter((r) => r.dimension === dimension);
  const manquants = forDimension.find((r) => r.value === NON_RENSEIGNE)?.n ?? 0;
  const items: NamedCount[] = forDimension
    .filter((r) => r.value !== NON_RENSEIGNE)
    .map((r) => ({ name: r.value, n: r.n }))
    .sort((a, b) => b.n - a.n);
  return { renseigne: items.length > 0, items, manquants };
}

function buildCohorts(rows: CohortRow[]): Cohort[] {
  const byWeek = new Map<string, { size: number; retained: Map<number, number> }>();

  for (const row of rows) {
    let entry = byWeek.get(row.cohort_week);
    if (!entry) {
      entry = { size: row.cohort_size, retained: new Map() };
      byWeek.set(row.cohort_week, entry);
    }
    if (row.week_offset !== null) entry.retained.set(row.week_offset, row.retained);
  }

  const now = Date.now();

  return [...byWeek.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([week, entry]) => {
      const weeksElapsed = Math.floor((now - new Date(`${week}T00:00:00`).getTime()) / (7 * DAY_MS));
      const row = Array.from({ length: 6 }, (_, offset) => {
        // Une semaine pas encore écoulée n'est pas « 0 % de rétention », elle est inconnue.
        if (offset > weeksElapsed) return null;
        const retained = entry.retained.get(offset) ?? 0;
        return entry.size ? Math.round((retained / entry.size) * 100) : 0;
      });
      return { label: `Sem. du ${formatDay(week)} (n=${entry.size})`, row };
    });
}

const pct = (part: number, whole: number): number | null =>
  whole ? Math.round((part / whole) * 100) : null;

function buildObjectiveList(
  overview: OverviewRow,
  retention: RetentionRow,
  quality: QualityRow,
): Objective[] {
  const stickiness = overview.mau ? overview.dau / overview.mau : 0;
  const stickinessPrev = overview.mau_prev ? overview.dau_prev / overview.mau_prev : 0;
  const satisfaction = pct(quality.likes, quality.likes + quality.dislikes) ?? 0;
  const satisfactionPrev = pct(quality.likes_prev, quality.likes_prev + quality.dislikes_prev) ?? 0;
  const firstResolution = pct(quality.one_question_discussions, quality.answered_discussions) ?? 0;

  return [
    {
      label: 'Comptes créés',
      actual: overview.users_total,
      prev: overview.users_total_prev,
      target: TARGETS.usersTotal,
      unit: '',
    },
    {
      label: 'Utilisateurs actifs (WAU)',
      actual: overview.wau,
      prev: overview.wau_prev,
      target: TARGETS.wau,
      unit: '',
    },
    {
      label: 'Rétention J+7',
      actual: retention.d7,
      prev: retention.d7_prev,
      target: TARGETS.retentionD7,
      unit: '%',
    },
    {
      label: 'Rétention J+30',
      actual: retention.d30,
      prev: retention.d30_prev,
      target: TARGETS.retentionD30,
      unit: '%',
    },
    {
      label: 'Stickiness (DAU/MAU)',
      actual: Number(stickiness.toFixed(2)),
      prev: Number(stickinessPrev.toFixed(2)),
      target: TARGETS.stickiness,
      unit: '',
      dec: 2,
    },
    {
      label: 'Satisfaction réponses',
      actual: satisfaction,
      prev: satisfactionPrev,
      target: TARGETS.satisfaction,
      unit: '%',
    },
    {
      label: 'Résolution 1er échange',
      actual: firstResolution,
      prev: firstResolution,
      target: TARGETS.firstResolution,
      unit: '%',
    },
  ];
}

export async function fetchAdamData(): Promise<AdamData> {
  const [
    overviewRes,
    dailyRes,
    statusRes,
    facultiesRes,
    retentionRes,
    cohortsRes,
    seriesRes,
    demographicsRes,
    qualityRes,
    topicsRes,
    quotaRes,
  ] = await Promise.all([
    supabase.from('dashboard_overview').select('*').maybeSingle<OverviewRow>(),
    supabase.from('dashboard_daily_activity').select('*').order('day').returns<DailyRow[]>(),
    supabase.from('dashboard_user_status').select('*').returns<StatusRow[]>(),
    supabase
      .from('dashboard_agent_usage')
      .select('*')
      .order('conversations', { ascending: false })
      .returns<AgentRow[]>(),
    supabase.from('dashboard_retention').select('*').maybeSingle<RetentionRow>(),
    supabase.from('dashboard_cohorts').select('*').returns<CohortRow[]>(),
    supabase.from('dashboard_active_series').select('*').order('bucket').returns<SeriesRow[]>(),
    supabase.from('dashboard_demographics').select('*').returns<DemographicRow[]>(),
    supabase.from('dashboard_quality').select('*').maybeSingle<QualityRow>(),
    supabase.from('dashboard_topics').select('*').returns<TopicRow[]>(),
    supabase.from('dashboard_quota').select('*').maybeSingle<QuotaRow>(),
  ]);

  const responses = [
    overviewRes,
    dailyRes,
    statusRes,
    facultiesRes,
    retentionRes,
    cohortsRes,
    seriesRes,
    demographicsRes,
    qualityRes,
    topicsRes,
    quotaRes,
  ];
  for (const res of responses) {
    if (res.error) throw new Error(res.error.message);
  }

  const overview = overviewRes.data;
  const retention = retentionRes.data;
  const quality = qualityRes.data;
  const quota = quotaRes.data;

  // Ces quatre vues renvoient toujours exactement une ligne quand l'accès est ouvert.
  if (!overview || !retention || !quality || !quota) throw new MissingAdminAccessError();

  const daily = dailyRes.data ?? [];
  const series = seriesRes.data ?? [];
  const faculties = facultiesRes.data ?? [];
  const demographics = demographicsRes.data ?? [];

  const tokens30 = num(overview.tokens_30d);
  const reactionsTotal = quality.likes + quality.dislikes;

  return {
    meta: {
      university: "Université d'Ottawa",
      pilot: 'Données de production · ADAM',
      range: overview.first_signup_day ? `${formatDay(overview.first_signup_day)} → aujourd'hui` : '—',
      updated: formatDateTime(new Date().toISOString()),
      lastActivity: formatDateTime(overview.last_activity),
      activeNow: overview.active_now,
    },

    dates: daily.map((d) => formatDay(d.day)),

    objectives: buildObjectiveList(overview, retention, quality),

    users: {
      total: overview.users_total,
      new7: overview.users_new_7d,
      newToday: overview.users_new_today,
      signups: daily.map((d) => d.signups),
      status: buildStatus(statusRes.data ?? []),
      byFaculty: buildDistribution(demographics, 'faculty'),
      byProgram: buildDistribution(demographics, 'program'),
      byYear: buildDistribution(demographics, 'study_years'),
      byResidency: buildDistribution(demographics, 'statut'),
    },

    usage: {
      dau: overview.dau,
      wau: overview.wau,
      mau: overview.mau,
      dauSeries: daily.map((d) => d.active_users),
      wauSeries: series.filter((s) => s.grain === 'week').map((s) => s.active_users),
      mauSeries: series.filter((s) => s.grain === 'month').map((s) => s.active_users),
      retentionD7: retention.d7,
      retentionD7Prev: retention.d7_prev,
      retentionD30: retention.d30,
      retentionD30Prev: retention.d30_prev,
      stickiness: overview.mau ? Number((overview.dau / overview.mau).toFixed(2)) : 0,
      sessionsPerUser: overview.mau ? Number((overview.conversations_30d / overview.mau).toFixed(1)) : 0,
      questionsPerUser: overview.mau ? Number((overview.questions_30d / overview.mau).toFixed(1)) : 0,
      cohorts: buildCohorts(cohortsRes.data ?? []),
      conversations: {
        perDay: daily.map((d) => d.conversations),
        total: overview.conversations_total,
        avgLength: num(overview.avg_conversation_length),
        byFaculty: faculties.map((a) => ({ name: a.agent_name, val: a.conversations })),
      },
    },

    quality: {
      satisfaction: pct(quality.likes, reactionsTotal),
      satisfactionPrev: pct(quality.likes_prev, quality.likes_prev + quality.dislikes_prev),
      likes: quality.likes,
      dislikes: quality.dislikes,
      reactionsTotal,
      reactionCoverage: quality.assistant_messages
        ? Number(((reactionsTotal / quality.assistant_messages) * 100).toFixed(1))
        : 0,
      feedbacksTotal: quality.feedbacks_total,
      assistantMessages: quality.assistant_messages,
      firstResolution: pct(quality.one_question_discussions, quality.answered_discussions),
      oneQuestionDiscussions: quality.one_question_discussions,
      answeredDiscussions: quality.answered_discussions,
      topics: (topicsRes.data ?? []).map((t) => ({ title: t.title, n: t.n })),
    },

    faculties: faculties.map((a) => ({
      id: a.agent_id,
      name: a.agent_name,
      description: a.agent_description ?? '',
      conversations: a.conversations,
      users: a.users,
      questions: a.questions,
    })),

    tokens: {
      total: num(overview.tokens_total),
      last30: tokens30,
      perDay: daily.map((d) => d.tokens),
      avgPerActiveUser: overview.mau ? Number((tokens30 / overview.mau).toFixed(1)) : 0,
      avgLimit: num(quota.avg_limit),
      avgUsed: num(quota.avg_used),
      daysAtLimit: quota.days_at_limit,
      usersAtLimit: quota.users_at_limit,
      userDays: quota.user_days,
    },
  };
}
