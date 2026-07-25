-- Extension de la couche de lecture du dashboard.
--
-- 1. Resserre les droits sur les vues existantes (voir note « Unrestricted » plus bas).
-- 2. Ajoute les vues pour toute métrique dont une table existe, même si elle est
--    encore vide : le dashboard doit être conçu maintenant et s'alimenter tout seul
--    quand l'app principale commencera à remplir ces colonnes.
-- 3. Ouvre temporairement l'accès pendant la phase de conception, l'authentification
--    étant désactivée côté front. À REVERTER avant toute mise en ligne (voir fin de fichier).


-- ---------------------------------------------------------------------------
-- 1. Droits
-- ---------------------------------------------------------------------------
-- Supabase applique `alter default privileges in schema public grant all on tables
-- to anon, authenticated, service_role`, donc les vues créées par la migration
-- précédente ont reçu TOUS les privilèges et pas seulement SELECT. Les écritures
-- échoueraient de toute façon (une vue d'agrégats n'est pas modifiable), mais autant
-- ne pas laisser le droit ouvert.
--
-- À noter : le badge « Unrestricted » du Table Editor restera affiché. Une vue ne peut
-- pas porter de policy RLS en Postgres ; le contrôle d'accès de ces vues vit dans leur
-- corps (`where is_dashboard_admin()`), pas dans une policy.

revoke all on
  public.dashboard_overview,
  public.dashboard_daily_activity,
  public.dashboard_user_status,
  public.dashboard_agent_usage,
  public.dashboard_retention,
  public.dashboard_cohorts,
  public.dashboard_active_series
from anon, authenticated;


-- ---------------------------------------------------------------------------
-- 2. Nouvelles vues
-- ---------------------------------------------------------------------------

-- Répartitions démographiques. Les quatre colonnes existent mais sont NULL sur les
-- 81 comptes : la vue renverra donc un unique seau « Non renseigné » par dimension
-- jusqu'à ce que l'app principale collecte ces informations. C'est voulu — le bloc
-- d'affichage est prêt et se remplira sans changement de code.
create or replace view public.dashboard_demographics as
select 'faculty' as dimension, coalesce(p.faculty, 'Non renseigné') as value, count(*)::int as n
  from public.profiles p where public.is_dashboard_admin() group by 2
union all
select 'program', coalesce(p.program, 'Non renseigné'), count(*)::int
  from public.profiles p where public.is_dashboard_admin() group by 2
union all
select 'study_years', coalesce(p.study_years, 'Non renseigné'), count(*)::int
  from public.profiles p where public.is_dashboard_admin() group by 2
union all
select 'statut', coalesce(p.statut, 'Non renseigné'), count(*)::int
  from public.profiles p where public.is_dashboard_admin() group by 2;


-- Qualité des réponses, à partir des seuls signaux existants : les réactions
-- pouce haut / pouce bas et les commentaires libres.
create or replace view public.dashboard_quality as
select
  (select count(*) from public.message_reactions where reaction_type = 'like')::int as likes,
  (select count(*) from public.message_reactions where reaction_type = 'dislike')::int as dislikes,
  (select count(*) from public.message_reactions
     where reaction_type = 'like' and created_at >= now() - interval '30 days')::int as likes_30d,
  (select count(*) from public.message_reactions
     where reaction_type = 'dislike' and created_at >= now() - interval '30 days')::int as dislikes_30d,
  (select count(*) from public.message_reactions
     where reaction_type = 'like'
       and created_at >= now() - interval '60 days' and created_at < now() - interval '30 days')::int as likes_prev,
  (select count(*) from public.message_reactions
     where reaction_type = 'dislike'
       and created_at >= now() - interval '60 days' and created_at < now() - interval '30 days')::int as dislikes_prev,
  (select count(*) from public.message_feedbacks)::int as feedbacks_total,
  (select count(*) from public.messages where role = 'assistant')::int as assistant_messages,
  -- Proxy de « résolution au 1er échange » : conversations où l'étudiant n'a posé
  -- qu'une seule question. Pas une mesure de résolution réelle, faute de signal
  -- explicite côté app — l'étudiant peut aussi avoir abandonné.
  (select count(*) from (
     select discussion_id from public.messages where role = 'user' group by 1 having count(*) = 1
   ) s)::int as one_question_discussions,
  (select count(distinct discussion_id) from public.messages where role = 'user')::int as answered_discussions
where public.is_dashboard_admin();


-- Sujets des conversations, d'après le titre généré par l'app.
-- Aujourd'hui 6 titres sur 597 conversations.
-- ATTENTION : contrairement aux autres vues, celle-ci expose du texte rédigé par
-- les étudiants et non un agrégat. À arbitrer avec le volet vie privée du playbook.
create or replace view public.dashboard_topics as
select d.title, count(*)::int as n, max(d.created_at) as last_seen
from public.discussions d
where d.title is not null and public.is_dashboard_admin()
group by d.title
order by 2 desc, 3 desc
limit 20;


-- Quotas quotidiens de tokens : pression réelle du plafond sur les utilisateurs.
create or replace view public.dashboard_quota as
select
  (select coalesce(round(avg(tokens_limit), 1), 0) from public.daily_tokens)::numeric as avg_limit,
  (select coalesce(round(avg(tokens_used), 1), 0) from public.daily_tokens)::numeric as avg_used,
  (select count(*) from public.daily_tokens where tokens_used >= tokens_limit)::int as days_at_limit,
  (select count(distinct user_id) from public.daily_tokens where tokens_used >= tokens_limit)::int as users_at_limit,
  (select count(*) from public.daily_tokens)::int as user_days
where public.is_dashboard_admin();


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
  public.dashboard_topics,
  public.dashboard_quota
to anon, authenticated;


-- ---------------------------------------------------------------------------
-- 3. TEMPORAIRE — phase de conception
-- ---------------------------------------------------------------------------
-- L'authentification est masquée côté front le temps de finaliser le dashboard.
-- Sans session, auth.uid() est NULL et toutes les vues renvoient zéro ligne, ce qui
-- rend le dashboard vide. On ouvre donc le prédicat d'accès.
--
-- CONSÉQUENCE : n'importe qui disposant de la clé anon (elle est publique, elle part
-- dans le bundle JS) peut lire ces agrégats. Aucun contenu de message, e-mail ni
-- identifiant n'est exposé — SAUF par dashboard_topics, qui expose des titres de
-- conversation rédigés par les étudiants.
--
-- POUR RE-VERROUILLER, exécuter :
--
--   create or replace function public.is_dashboard_admin()
--   returns boolean language sql stable security definer set search_path = public as $$
--     select coalesce((select p.is_admin from public.profiles p where p.id = auth.uid()), false);
--   $$;
--   revoke select on public.dashboard_overview, public.dashboard_daily_activity,
--     public.dashboard_user_status, public.dashboard_agent_usage, public.dashboard_retention,
--     public.dashboard_cohorts, public.dashboard_active_series, public.dashboard_demographics,
--     public.dashboard_quality, public.dashboard_topics, public.dashboard_quota from anon;

create or replace function public.is_dashboard_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select true;
$$;
