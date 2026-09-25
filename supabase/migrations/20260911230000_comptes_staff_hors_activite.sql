-- Trois comptes de plus passent administrateurs, et l'activité du staff sort
-- des agrégats.
--
-- Comptes promus : mnuwa057@, lhoui070@, tnand033@ (uottawa.ca).
--
-- POURQUOI CE N'EST PAS QU'UN `update profiles set is_admin = true`
--
-- La migration 20260728190000 a exclu les comptes is_admin des agrégats basés
-- sur `profiles` (comptes, statuts, démographie, rétention, cohortes), et s'est
-- explicitement arrêtée là, sur cette justification : « les agrégats basés sur
-- messages / discussions / daily_tokens ne sont pas concernés : un compte
-- dashboard n'a aucune activité dans l'app étudiante ». 20260905170000 a redit
-- la même chose : les 2 comptes admin d'alors portaient 18 discussions vides et
-- zéro message, ils sortaient donc d'eux-mêmes des agrégats.
--
-- Cette prémisse ne tient plus. Les trois comptes promus ici sont des comptes
-- qui ont réellement utilisé ADAM : les promouvoir sans plus les retirerait des
-- effectifs tout en laissant leurs questions, leurs conversations et leur quota
-- dans l'Activité. Le dashboard afficherait alors des conversations sans
-- utilisateur pour les porter, et un ratio questions/compte gonflé.
--
-- On généralise donc la règle plutôt que de viser ces trois comptes : TOUT
-- compte is_admin est désormais hors des agrégats, y compris son activité. Un
-- futur administrateur sera couvert sans nouvelle migration.
--
-- Périmètre : dashboard_overview, dashboard_daily_activity, dashboard_agent_usage,
-- dashboard_active_series, dashboard_quota, dashboard_topics. Les vues déjà
-- filtrées sur profiles (user_status, retention, cohorts, demographics) ne
-- changent pas. dashboard_quality est traitée à part, voir la fin du fichier.


-- 1. Prédicat réutilisable --------------------------------------------------
-- Un user_id NULL n'est pas du staff : la ligne reste comptée, comme avant.
create or replace function public.is_staff_account(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select p.is_admin from public.profiles p where p.id = p_user_id), false);
$$;

revoke all on function public.is_staff_account(uuid) from public, anon;
grant execute on function public.is_staff_account(uuid) to authenticated;


-- 2. Promotion des trois comptes -------------------------------------------
-- `lower()` des deux côtés : l'adresse a été fournie avec une majuscule.
-- Idempotent, et sans effet sur un compte déjà administrateur.
update public.profiles p
set is_admin = true
from auth.users u
where u.id = p.id
  and lower(u.email) = any (array[
    'mnuwa057@uottawa.ca',
    'lhoui070@uottawa.ca',
    'tnand033@uottawa.ca'
  ]);


-- 3. Vue d'ensemble ---------------------------------------------------------
create or replace view public.dashboard_overview as
select
  (select count(*) from public.profiles where not coalesce(is_admin, false))::int as users_total,
  (select count(*) from public.profiles where not coalesce(is_admin, false)
     and created_at < now() - interval '30 days')::int as users_total_prev,
  (select count(*) from public.profiles where not coalesce(is_admin, false)
     and created_at >= now() - interval '7 days')::int as users_new_7d,
  (select count(*) from public.profiles where not coalesce(is_admin, false)
     and created_at::date = current_date)::int as users_new_today,
  (select count(distinct user_id) from public.messages
     where created_at >= now() - interval '24 hours'
       and not public.is_staff_account(user_id))::int as dau,
  (select count(distinct user_id) from public.messages
     where created_at >= now() - interval '48 hours' and created_at < now() - interval '24 hours'
       and not public.is_staff_account(user_id))::int as dau_prev,
  (select count(distinct user_id) from public.messages
     where created_at >= now() - interval '7 days'
       and not public.is_staff_account(user_id))::int as wau,
  (select count(distinct user_id) from public.messages
     where created_at >= now() - interval '14 days' and created_at < now() - interval '7 days'
       and not public.is_staff_account(user_id))::int as wau_prev,
  (select count(distinct user_id) from public.messages
     where created_at >= now() - interval '30 days'
       and not public.is_staff_account(user_id))::int as mau,
  (select count(distinct user_id) from public.messages
     where created_at >= now() - interval '60 days' and created_at < now() - interval '30 days'
       and not public.is_staff_account(user_id))::int as mau_prev,
  (select count(distinct user_id) from public.messages
     where created_at >= now() - interval '5 minutes'
       and not public.is_staff_account(user_id))::int as active_now,
  (select count(*) from public.discussions d
     where not public.is_staff_account(d.user_id)
       and exists (select 1 from public.messages m where m.discussion_id = d.id and m.role = 'user'))::int as conversations_total,
  (select count(*) from public.discussions d
     where d.created_at >= now() - interval '30 days'
       and not public.is_staff_account(d.user_id)
       and exists (select 1 from public.messages m where m.discussion_id = d.id and m.role = 'user'))::int as conversations_30d,
  (select count(*) from public.messages where role = 'user' and created_at >= now() - interval '30 days'
     and not public.is_staff_account(user_id))::int as questions_30d,
  (select coalesce(round(avg(c), 2), 0) from (
     select discussion_id, count(*) as c from public.messages
      where role = 'user' and not public.is_staff_account(user_id) group by 1
   ) s)::numeric as avg_conversation_length,
  (select max(created_at) from public.messages
     where not public.is_staff_account(user_id)) as last_activity,
  (select min(created_at)::date from public.profiles where not coalesce(is_admin, false)) as first_signup_day,
  (select coalesce(sum(tokens_used), 0) from public.daily_tokens
     where not public.is_staff_account(user_id))::bigint as tokens_total,
  (select coalesce(sum(tokens_used), 0) from public.daily_tokens
     where date >= current_date - 29
       and not public.is_staff_account(user_id))::bigint as tokens_30d
where public.is_dashboard_admin();


-- 4. Série quotidienne ------------------------------------------------------
create or replace view public.dashboard_daily_activity as
with days as (
  select generate_series(current_date - interval '89 days', current_date, interval '1 day')::date as day
)
select
  d.day,
  (select count(*) from public.profiles p
     where p.created_at::date = d.day and not coalesce(p.is_admin, false))::int as signups,
  (select count(*) from public.discussions dc
     where dc.created_at::date = d.day
       and not public.is_staff_account(dc.user_id)
       and exists (select 1 from public.messages m where m.discussion_id = dc.id and m.role = 'user'))::int as conversations,
  (select count(distinct m.user_id) from public.messages m
     where m.created_at::date = d.day
       and not public.is_staff_account(m.user_id))::int as active_users,
  (select count(*) from public.messages m
     where m.created_at::date = d.day and m.role = 'user'
       and not public.is_staff_account(m.user_id))::int as questions,
  (select coalesce(sum(t.tokens_used), 0) from public.daily_tokens t
     where t.date = d.day
       and not public.is_staff_account(t.user_id))::int as tokens
from days d
where public.is_dashboard_admin();


-- 5. Usage par faculté ------------------------------------------------------
-- Le prédicat reste dans la condition du LEFT JOIN : une faculté sans
-- conversation étudiante réelle s'affiche à 0 plutôt que de disparaître.
create or replace view public.dashboard_agent_usage as
select
  a.id as agent_id,
  a.name as agent_name,
  a.description as agent_description,
  count(distinct d.id)::int as conversations,
  count(distinct d.user_id)::int as users,
  (select count(*) from public.messages m
     join public.discussions d2 on d2.id = m.discussion_id
    where d2.agent_id = a.id and m.role = 'user'
      and not public.is_staff_account(d2.user_id))::int as questions
from public.agents a
left join public.discussions d
  on d.agent_id = a.id
 and not public.is_staff_account(d.user_id)
 and exists (select 1 from public.messages m where m.discussion_id = d.id and m.role = 'user')
where public.is_dashboard_admin()
group by a.id, a.name, a.description;


-- 6. Séries d'actifs --------------------------------------------------------
create or replace view public.dashboard_active_series as
with weeks as (
  select generate_series(date_trunc('week', now()) - interval '11 weeks', date_trunc('week', now()), interval '1 week')::date as bucket
),
months as (
  select generate_series(date_trunc('month', now()) - interval '11 months', date_trunc('month', now()), interval '1 month')::date as bucket
)
select 'week' as grain, w.bucket,
       (select count(distinct m.user_id) from public.messages m
         where m.created_at >= w.bucket and m.created_at < w.bucket + interval '1 week'
           and not public.is_staff_account(m.user_id))::int as active_users
from weeks w
where public.is_dashboard_admin()
union all
select 'month', mo.bucket,
       (select count(distinct m.user_id) from public.messages m
         where m.created_at >= mo.bucket and m.created_at < mo.bucket + interval '1 month'
           and not public.is_staff_account(m.user_id))::int
from months mo
where public.is_dashboard_admin();


-- 7. Quota ------------------------------------------------------------------
-- Les noms de colonnes restent ceux de 20260905190000 : le contrat client les
-- traduit déjà en libellés honnêtes (mode du plafond, jours actifs).
create or replace view public.dashboard_quota as
select
  (select coalesce(mode() within group (order by tokens_limit), 0) from public.daily_tokens
     where not public.is_staff_account(user_id))::numeric as avg_limit,
  (select coalesce(round(avg(tokens_used), 1), 0) from public.daily_tokens
     where tokens_used > 0 and not public.is_staff_account(user_id))::numeric as avg_used,
  (select count(*) from public.daily_tokens
     where tokens_used >= tokens_limit and not public.is_staff_account(user_id))::int as days_at_limit,
  (select count(distinct user_id) from public.daily_tokens
     where tokens_used >= tokens_limit and not public.is_staff_account(user_id))::int as users_at_limit,
  (select count(*) from public.daily_tokens
     where tokens_used > 0 and not public.is_staff_account(user_id))::int as user_days
where public.is_dashboard_admin();


-- 8. Sujets -----------------------------------------------------------------
-- Le k-anonymat (>= 5 étudiants distincts) est calculé après retrait du staff :
-- un titre ne doit pas franchir le seuil grâce à des comptes internes.
create or replace view public.dashboard_topics as
select
  d.title,
  count(*)::int as n,
  count(distinct d.user_id)::int as distinct_users,
  max(d.created_at) as last_seen
from public.discussions d
where d.title is not null
  and not public.is_staff_account(d.user_id)
  and public.is_dashboard_admin_strict()
group by d.title
having count(distinct d.user_id) >= 5   -- TOPIC_K_MIN
order by n desc, last_seen desc
limit 20;


-- 9. Qualité IA -------------------------------------------------------------
-- `message_reactions` et `message_feedbacks` portent toutes deux un `user_id` :
-- on filtre sur l'auteur de la réaction, sans passer par le message. C'est la
-- bonne sémantique — un « j'aime » laissé par un compte interne n'est pas de la
-- satisfaction étudiante.
create or replace view public.dashboard_quality as
with messages_etudiants as (
  select m.id, m.discussion_id, m.role, m.created_at
  from public.messages m
  where not public.is_staff_account(m.user_id)
),
reactions_etudiantes as (
  select r.reaction_type, r.created_at
  from public.message_reactions r
  where not public.is_staff_account(r.user_id)
)
select
  (select count(*) from reactions_etudiantes where reaction_type = 'like')::int as likes,
  (select count(*) from reactions_etudiantes where reaction_type = 'dislike')::int as dislikes,
  (select count(*) from reactions_etudiantes
     where reaction_type = 'like' and created_at >= now() - interval '30 days')::int as likes_30d,
  (select count(*) from reactions_etudiantes
     where reaction_type = 'dislike' and created_at >= now() - interval '30 days')::int as dislikes_30d,
  (select count(*) from reactions_etudiantes
     where reaction_type = 'like'
       and created_at >= now() - interval '60 days' and created_at < now() - interval '30 days')::int as likes_prev,
  (select count(*) from reactions_etudiantes
     where reaction_type = 'dislike'
       and created_at >= now() - interval '60 days' and created_at < now() - interval '30 days')::int as dislikes_prev,
  (select count(*) from public.message_feedbacks f
     where not public.is_staff_account(f.user_id))::int as feedbacks_total,
  (select count(*) from messages_etudiants where role = 'assistant')::int as assistant_messages,
  -- Proxy de « résolution au 1er échange » : conversations où l'étudiant n'a posé
  -- qu'une seule question. Pas une mesure de résolution réelle, faute de signal
  -- explicite côté app — l'étudiant peut aussi avoir abandonné.
  (select count(*) from (
     select discussion_id from messages_etudiants where role = 'user' group by 1 having count(*) = 1
   ) s)::int as one_question_discussions,
  (select count(distinct discussion_id) from messages_etudiants where role = 'user')::int as answered_discussions
where public.is_dashboard_admin();
