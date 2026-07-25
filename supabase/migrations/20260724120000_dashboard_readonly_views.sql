-- Couche de lecture du dashboard interne ADAM.
--
-- Les tables applicatives sont protégées par des policies RLS « chacun ses propres lignes »
-- (messages, discussions, daily_tokens : auth.uid() = user_id ; profiles : auth.uid() = id),
-- ce qui rend tout agrégat impossible depuis le client. Ces vues appartiennent à postgres
-- (security_invoker = off, le défaut) et contournent donc la RLS des tables sous-jacentes,
-- mais chacune est filtrée par is_dashboard_admin() : un compte non admin obtient zéro ligne.
--
-- Aucune vue n'expose de contenu de message, d'e-mail ni d'identifiant utilisateur :
-- uniquement des compteurs agrégés.

create or replace function public.is_dashboard_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select p.is_admin from public.profiles p where p.id = auth.uid()), false);
$$;

revoke all on function public.is_dashboard_admin() from public;
grant execute on function public.is_dashboard_admin() to authenticated;


-- Série quotidienne sur les 90 derniers jours.
create or replace view public.dashboard_daily_activity as
with days as (
  select generate_series(current_date - interval '89 days', current_date, interval '1 day')::date as day
)
select
  d.day,
  (select count(*) from public.profiles p where p.created_at::date = d.day)::int as signups,
  (select count(*) from public.discussions dc where dc.created_at::date = d.day)::int as conversations,
  (select count(distinct m.user_id) from public.messages m where m.created_at::date = d.day)::int as active_users,
  (select count(*) from public.messages m where m.created_at::date = d.day and m.role = 'user')::int as questions,
  (select coalesce(sum(t.tokens_used), 0) from public.daily_tokens t where t.date = d.day)::int as tokens
from days d
where public.is_dashboard_admin();


-- Compteurs de tête : une seule ligne.
create or replace view public.dashboard_overview as
select
  (select count(*) from public.profiles)::int as users_total,
  (select count(*) from public.profiles where created_at < now() - interval '30 days')::int as users_total_prev,
  (select count(*) from public.profiles where created_at >= now() - interval '7 days')::int as users_new_7d,
  (select count(*) from public.profiles where created_at::date = current_date)::int as users_new_today,
  (select count(distinct user_id) from public.messages where created_at >= now() - interval '24 hours')::int as dau,
  (select count(distinct user_id) from public.messages where created_at >= now() - interval '7 days')::int as wau,
  (select count(distinct user_id) from public.messages
     where created_at >= now() - interval '14 days' and created_at < now() - interval '7 days')::int as wau_prev,
  (select count(distinct user_id) from public.messages where created_at >= now() - interval '30 days')::int as mau,
  (select count(distinct user_id) from public.messages
     where created_at >= now() - interval '60 days' and created_at < now() - interval '30 days')::int as mau_prev,
  (select count(distinct user_id) from public.messages
     where created_at >= now() - interval '48 hours' and created_at < now() - interval '24 hours')::int as dau_prev,
  (select count(distinct user_id) from public.messages where created_at >= now() - interval '5 minutes')::int as active_now,
  (select count(*) from public.discussions)::int as conversations_total,
  (select count(*) from public.discussions where created_at >= now() - interval '30 days')::int as conversations_30d,
  (select count(*) from public.messages where role = 'user' and created_at >= now() - interval '30 days')::int as questions_30d,
  (select coalesce(round(avg(c), 2), 0) from (
     select discussion_id, count(*) as c from public.messages where role = 'user' group by 1
   ) s)::numeric as avg_conversation_length,
  (select max(created_at) from public.messages) as last_activity,
  (select min(created_at)::date from public.profiles) as first_signup_day,
  (select coalesce(sum(tokens_used), 0) from public.daily_tokens)::bigint as tokens_total,
  (select coalesce(sum(tokens_used), 0) from public.daily_tokens where date >= current_date - 29)::bigint as tokens_30d
where public.is_dashboard_admin();


-- Actifs / dormants / jamais connectés, sur la base de l'activité de messages.
create or replace view public.dashboard_user_status as
with last_seen as (
  select p.id, (select max(m.created_at) from public.messages m where m.user_id = p.id) as last_message
  from public.profiles p
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


-- Répartition par agent. Seule approximation « faculté » disponible :
-- profiles.faculty / program / study_years / statut sont NULL sur l'intégralité des lignes.
create or replace view public.dashboard_agent_usage as
select
  a.id as agent_id,
  a.name as agent_name,
  a.description as agent_description,
  count(distinct d.id)::int as conversations,
  count(distinct d.user_id)::int as users,
  (select count(*) from public.messages m
     join public.discussions d2 on d2.id = m.discussion_id
    where d2.agent_id = a.id and m.role = 'user')::int as questions
from public.agents a
left join public.discussions d on d.agent_id = a.id
where public.is_dashboard_admin()
group by a.id, a.name, a.description;


-- Rétention : part des inscrits d'une fenêtre encore actifs N jours après leur inscription.
create or replace view public.dashboard_retention as
with base as (
  select
    p.id,
    p.created_at,
    (select max(m.created_at) from public.messages m where m.user_id = p.id) as last_message
  from public.profiles p
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


-- Cohortes hebdomadaires d'inscription, rétention sur 6 semaines.
create or replace view public.dashboard_cohorts as
with cohort as (
  select p.id, date_trunc('week', p.created_at)::date as cohort_week
  from public.profiles p
  where p.created_at >= date_trunc('week', now()) - interval '7 weeks'
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


-- Séries hebdomadaire et mensuelle d'utilisateurs actifs (12 derniers points chacune).
create or replace view public.dashboard_active_series as
with weeks as (
  select generate_series(date_trunc('week', now()) - interval '11 weeks', date_trunc('week', now()), interval '1 week')::date as bucket
),
months as (
  select generate_series(date_trunc('month', now()) - interval '11 months', date_trunc('month', now()), interval '1 month')::date as bucket
)
select 'week' as grain, w.bucket,
       (select count(distinct m.user_id) from public.messages m
         where m.created_at >= w.bucket and m.created_at < w.bucket + interval '1 week')::int as active_users
from weeks w
where public.is_dashboard_admin()
union all
select 'month', mo.bucket,
       (select count(distinct m.user_id) from public.messages m
         where m.created_at >= mo.bucket and m.created_at < mo.bucket + interval '1 month')::int
from months mo
where public.is_dashboard_admin();


grant select on
  public.dashboard_overview,
  public.dashboard_daily_activity,
  public.dashboard_user_status,
  public.dashboard_agent_usage,
  public.dashboard_retention,
  public.dashboard_cohorts,
  public.dashboard_active_series
to authenticated;
