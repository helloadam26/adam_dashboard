-- Fin de la phase de conception : réactivation de l'authentification.
--
-- 1. Restaure le prédicat réel de is_dashboard_admin() (annule le `select true`
--    ouvert pendant la conception). L'accès aux agrégats redevient réservé aux
--    sessions dont le profil porte is_admin = true.
--
-- 2. Retire aux vues le rôle anon : après connexion, le client interroge en tant
--    que `authenticated` (le JWT utilisateur prime sur la clé anon). L'écran de
--    connexion, lui, n'interroge aucune vue. La clé anon publique ne doit donc
--    porter aucun droit de lecture.
--
-- 3. Sépare le staff dashboard des étudiants dans les MÉTRIQUES. Le trigger
--    on_auth_user_created (infra de l'app étudiante, non modifié ici) crée une
--    ligne profiles à chaque inscription — y compris pour un compte dashboard.
--    On exclut donc les comptes is_admin = true de tous les agrégats basés sur
--    profiles, pour qu'ils ne gonflent ni les comptes, ni les statuts, ni la
--    démographie, ni la rétention/cohortes. Les agrégats basés sur messages /
--    discussions / daily_tokens ne sont pas concernés : un compte dashboard n'a
--    aucune activité dans l'app étudiante.


-- 1. Prédicat réel ---------------------------------------------------------
create or replace function public.is_dashboard_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select p.is_admin from public.profiles p where p.id = auth.uid()), false);
$$;


-- 3. Vues basées sur profiles, staff exclu ---------------------------------

-- DROP explicite : cette version réordonne les colonnes (dau_prev remonté près de
-- dau), ce que CREATE OR REPLACE VIEW refuse. On recrée la vue à neuf. Les autres
-- vues ci-dessous conservent leur ordre de colonnes : un simple replace suffit.
drop view if exists public.dashboard_overview;

create view public.dashboard_overview as
select
  (select count(*) from public.profiles where not coalesce(is_admin, false))::int as users_total,
  (select count(*) from public.profiles where not coalesce(is_admin, false)
     and created_at < now() - interval '30 days')::int as users_total_prev,
  (select count(*) from public.profiles where not coalesce(is_admin, false)
     and created_at >= now() - interval '7 days')::int as users_new_7d,
  (select count(*) from public.profiles where not coalesce(is_admin, false)
     and created_at::date = current_date)::int as users_new_today,
  (select count(distinct user_id) from public.messages where created_at >= now() - interval '24 hours')::int as dau,
  (select count(distinct user_id) from public.messages
     where created_at >= now() - interval '48 hours' and created_at < now() - interval '24 hours')::int as dau_prev,
  (select count(distinct user_id) from public.messages where created_at >= now() - interval '7 days')::int as wau,
  (select count(distinct user_id) from public.messages
     where created_at >= now() - interval '14 days' and created_at < now() - interval '7 days')::int as wau_prev,
  (select count(distinct user_id) from public.messages where created_at >= now() - interval '30 days')::int as mau,
  (select count(distinct user_id) from public.messages
     where created_at >= now() - interval '60 days' and created_at < now() - interval '30 days')::int as mau_prev,
  (select count(distinct user_id) from public.messages where created_at >= now() - interval '5 minutes')::int as active_now,
  (select count(*) from public.discussions)::int as conversations_total,
  (select count(*) from public.discussions where created_at >= now() - interval '30 days')::int as conversations_30d,
  (select count(*) from public.messages where role = 'user' and created_at >= now() - interval '30 days')::int as questions_30d,
  (select coalesce(round(avg(c), 2), 0) from (
     select discussion_id, count(*) as c from public.messages where role = 'user' group by 1
   ) s)::numeric as avg_conversation_length,
  (select max(created_at) from public.messages) as last_activity,
  (select min(created_at)::date from public.profiles where not coalesce(is_admin, false)) as first_signup_day,
  (select coalesce(sum(tokens_used), 0) from public.daily_tokens)::bigint as tokens_total,
  (select coalesce(sum(tokens_used), 0) from public.daily_tokens where date >= current_date - 29)::bigint as tokens_30d
where public.is_dashboard_admin();


create or replace view public.dashboard_daily_activity as
with days as (
  select generate_series(current_date - interval '89 days', current_date, interval '1 day')::date as day
)
select
  d.day,
  (select count(*) from public.profiles p
     where p.created_at::date = d.day and not coalesce(p.is_admin, false))::int as signups,
  (select count(*) from public.discussions dc where dc.created_at::date = d.day)::int as conversations,
  (select count(distinct m.user_id) from public.messages m where m.created_at::date = d.day)::int as active_users,
  (select count(*) from public.messages m where m.created_at::date = d.day and m.role = 'user')::int as questions,
  (select coalesce(sum(t.tokens_used), 0) from public.daily_tokens t where t.date = d.day)::int as tokens
from days d
where public.is_dashboard_admin();


create or replace view public.dashboard_user_status as
with last_seen as (
  select p.id, (select max(m.created_at) from public.messages m where m.user_id = p.id) as last_message
  from public.profiles p
  where not coalesce(p.is_admin, false)
)
select
  case
    when last_message is null then 'never_active'
    when last_message >= now() - interval '30 days' then 'active'
    else 'dormant'
  end as status,
  count(*)::int as n
from last_seen
where public.is_dashboard_admin()
group by 1;


create or replace view public.dashboard_demographics as
select 'faculty' as dimension, coalesce(p.faculty, 'Non renseigné') as value, count(*)::int as n
  from public.profiles p where public.is_dashboard_admin() and not coalesce(p.is_admin, false) group by 2
union all
select 'program', coalesce(p.program, 'Non renseigné'), count(*)::int
  from public.profiles p where public.is_dashboard_admin() and not coalesce(p.is_admin, false) group by 2
union all
select 'study_years', coalesce(p.study_years, 'Non renseigné'), count(*)::int
  from public.profiles p where public.is_dashboard_admin() and not coalesce(p.is_admin, false) group by 2
union all
select 'statut', coalesce(p.statut, 'Non renseigné'), count(*)::int
  from public.profiles p where public.is_dashboard_admin() and not coalesce(p.is_admin, false) group by 2;


create or replace view public.dashboard_retention as
with base as (
  select
    p.id,
    p.created_at,
    (select max(m.created_at) from public.messages m where m.user_id = p.id) as last_message
  from public.profiles p
  where not coalesce(p.is_admin, false)
)
select
  (select coalesce(round(100.0 * count(*) filter (where last_message >= created_at + interval '7 days')
                         / nullif(count(*), 0), 0), 0)
     from base where created_at between now() - interval '37 days' and now() - interval '7 days')::int as d7,
  (select coalesce(round(100.0 * count(*) filter (where last_message >= created_at + interval '7 days')
                         / nullif(count(*), 0), 0), 0)
     from base where created_at between now() - interval '67 days' and now() - interval '37 days')::int as d7_prev,
  (select coalesce(round(100.0 * count(*) filter (where last_message >= created_at + interval '30 days')
                         / nullif(count(*), 0), 0), 0)
     from base where created_at between now() - interval '60 days' and now() - interval '30 days')::int as d30,
  (select coalesce(round(100.0 * count(*) filter (where last_message >= created_at + interval '30 days')
                         / nullif(count(*), 0), 0), 0)
     from base where created_at between now() - interval '90 days' and now() - interval '60 days')::int as d30_prev
where public.is_dashboard_admin();


create or replace view public.dashboard_cohorts as
with cohort as (
  select p.id, date_trunc('week', p.created_at)::date as cohort_week
  from public.profiles p
  where p.created_at >= date_trunc('week', now()) - interval '7 weeks'
    and not coalesce(p.is_admin, false)
),
activity as (
  select c.cohort_week, c.id,
         floor(extract(epoch from (m.created_at - c.cohort_week)) / 604800)::int as week_offset
  from cohort c
  join public.messages m on m.user_id = c.id
)
select
  c.cohort_week,
  (select count(*) from cohort c2 where c2.cohort_week = c.cohort_week)::int as cohort_size,
  o.week_offset,
  count(distinct o.id)::int as retained
from cohort c
left join activity o on o.cohort_week = c.cohort_week and o.week_offset between 0 and 5
where public.is_dashboard_admin()
group by c.cohort_week, o.week_offset;


-- 2. Retrait du rôle anon sur toutes les vues ------------------------------
revoke all on
  public.dashboard_overview,
  public.dashboard_daily_activity,
  public.dashboard_user_status,
  public.dashboard_agent_usage,
  public.dashboard_retention,
  public.dashboard_cohorts,
  public.dashboard_active_series,
  public.dashboard_demographics,
  public.dashboard_quality,
  public.dashboard_quota
from anon;
-- dashboard_topics a déjà été retirée à anon par la migration 20260724140000.

grant select on
  public.dashboard_overview,
  public.dashboard_daily_activity,
  public.dashboard_user_status,
  public.dashboard_agent_usage,
  public.dashboard_retention,
  public.dashboard_cohorts,
  public.dashboard_active_series,
  public.dashboard_demographics,
  public.dashboard_quality,
  public.dashboard_quota
to authenticated;


-- ---------------------------------------------------------------------------
-- Premier administrateur (à exécuter une fois le compte créé via le sign-up) :
--
--   update public.profiles p
--   set is_admin = true
--   from auth.users u
--   where u.id = p.id and u.email = 'TON_COURRIEL';
--
-- Un compte sans is_admin = true peut se connecter mais n'obtient aucune donnée
-- (état « en attente d'autorisation » côté dashboard).
-- ---------------------------------------------------------------------------
