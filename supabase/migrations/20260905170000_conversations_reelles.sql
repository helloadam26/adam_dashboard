-- Ne compter comme « conversation » qu'une discussion où une question a été posée.
--
-- L'app ADAM crée une ligne `discussions` dès qu'un étudiant ouvre un espace
-- facultaire, pas quand il converse. Résultat au 5 septembre 2026 : 660 lignes,
-- dont 544 sans aucun message et 563 sans la moindre question — 85 % de coquilles.
--
-- Le critère retenu est « au moins un message role = 'user' », et non « au moins
-- un message » : 19 discussions ne portent qu'une amorce de l'assistant, sans que
-- personne n'ait rien demandé. Ce critère est aussi celui qui rend la ligne
-- d'Activité arithmétiquement vraie — avg_conversation_length divise déjà les
-- questions par les discussions questionnées : 97 x 6,12 = 594 questions, pile.
--
-- Le dashboard les comptait toutes. Deux conséquences visibles :
--   - Activité affichait « 660 conversations · 6,12 questions par conversation ».
--     Les deux ne pouvaient pas être vraies ensemble : 660 x 6,12 ferait 4 040
--     questions, il n'y en a que 594.
--   - Facultés affichait 87 utilisateurs pour SEUO, alors qu'il n'existe que 86
--     comptes étudiants et que 17 personnes seulement y ont écrit.
--
-- Le prédicat règle aussi la contamination par le staff :
-- les 2 comptes admin portent 18 discussions vides mais zéro message, ils sortent
-- donc d'eux-mêmes des agrégats. Aucun filtre is_admin supplémentaire n'est requis
-- ici — contrairement aux agrégats basés sur `profiles`, déjà traités en
-- 20260728190000.
--
-- dashboard_quality n'est pas concernée : elle dérive déjà de `messages`.

-- 1. Totaux de conversations -----------------------------------------------
create or replace view public.dashboard_overview as
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
  (select count(*) from public.discussions d
     where exists (select 1 from public.messages m where m.discussion_id = d.id and m.role = 'user'))::int as conversations_total,
  (select count(*) from public.discussions d
     where d.created_at >= now() - interval '30 days'
       and exists (select 1 from public.messages m where m.discussion_id = d.id and m.role = 'user'))::int as conversations_30d,
  (select count(*) from public.messages where role = 'user' and created_at >= now() - interval '30 days')::int as questions_30d,
  (select coalesce(round(avg(c), 2), 0) from (
     select discussion_id, count(*) as c from public.messages where role = 'user' group by 1
   ) s)::numeric as avg_conversation_length,
  (select max(created_at) from public.messages) as last_activity,
  (select min(created_at)::date from public.profiles where not coalesce(is_admin, false)) as first_signup_day,
  (select coalesce(sum(tokens_used), 0) from public.daily_tokens)::bigint as tokens_total,
  (select coalesce(sum(tokens_used), 0) from public.daily_tokens where date >= current_date - 29)::bigint as tokens_30d
where public.is_dashboard_admin();


-- 2. Série quotidienne ------------------------------------------------------
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
       and exists (select 1 from public.messages m where m.discussion_id = dc.id and m.role = 'user'))::int as conversations,
  (select count(distinct m.user_id) from public.messages m where m.created_at::date = d.day)::int as active_users,
  (select count(*) from public.messages m where m.created_at::date = d.day and m.role = 'user')::int as questions,
  (select coalesce(sum(t.tokens_used), 0) from public.daily_tokens t where t.date = d.day)::int as tokens
from days d
where public.is_dashboard_admin();


-- 3. Usage par faculté ------------------------------------------------------
-- Le prédicat passe dans la condition du LEFT JOIN, pour qu'une faculté sans
-- conversation réelle reste affichée à 0 au lieu de disparaître du tableau.
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
left join public.discussions d
  on d.agent_id = a.id
 and exists (select 1 from public.messages m where m.discussion_id = d.id and m.role = 'user')
where public.is_dashboard_admin()
group by a.id, a.name, a.description;
