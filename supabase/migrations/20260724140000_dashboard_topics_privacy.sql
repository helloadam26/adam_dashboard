-- Arbitrage vie privée sur dashboard_topics.
--
-- Contexte : parmi les 11 vues du dashboard, dashboard_topics est la seule à laisser
-- sortir du texte rattaché à la conversation d'un étudiant (discussions.title), et non
-- un simple compteur. Sur les données actuelles, les trois seuls titres proviennent
-- chacun d'un unique utilisateur — c'est donc de la donnée identifiante, pas un agrégat.
--
-- Deux garde-fous cumulés remplacent l'exposition brute :
--
--   1. Contrôle d'accès STRICT. dashboard_topics ne s'appuie plus sur is_dashboard_admin()
--      — que la phase de conception ouvre volontairement (`select true`) — mais sur
--      is_dashboard_admin_strict(), qui vérifie toujours réellement profiles.is_admin.
--      Tant que l'authentification est masquée, la vue renvoie donc zéro ligne, et la
--      clé anon publique ne peut rien en tirer.
--
--   2. k-anonymat. La vue ne renvoie qu'un titre partagé par au moins TOPIC_K_MIN
--      étudiants DISTINCTS. Un thème qu'un seul étudiant a formulé n'apparaît jamais.
--      Sur les données actuelles, le résultat est vide — c'est le constat honnête :
--      il n'existe pas encore de signal de thème non-identifiant.
--
-- Un véritable indicateur « sujets » suppose une classification thématique côté app,
-- pas des titres bruts (voir src/data/unavailableMetrics.ts).


-- Contrôle d'accès qui, contrairement à is_dashboard_admin(), n'est jamais ouvert
-- pendant la phase de conception. À réserver aux vues exposant de la donnée sensible.
create or replace function public.is_dashboard_admin_strict()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select p.is_admin from public.profiles p where p.id = auth.uid()), false);
$$;

revoke all on function public.is_dashboard_admin_strict() from public;
grant execute on function public.is_dashboard_admin_strict() to authenticated;


-- Seuil de k-anonymat : nombre minimum d'étudiants distincts partageant un titre
-- pour qu'il soit affiché. 5 est un plancher défendable pour un pilote de cette taille ;
-- l'ajuster ici si besoin.
--
-- DROP explicite : la vue de la migration 20260724130000 a les colonnes (title, n,
-- last_seen). On insère distinct_users au milieu, ce que CREATE OR REPLACE VIEW refuse
-- (il n'autorise que l'ajout de colonnes en fin). On recrée donc la vue à neuf.
drop view if exists public.dashboard_topics;

create view public.dashboard_topics as
select
  d.title,
  count(*)::int as n,
  count(distinct d.user_id)::int as distinct_users,
  max(d.created_at) as last_seen
from public.discussions d
where d.title is not null
  and public.is_dashboard_admin_strict()
group by d.title
having count(distinct d.user_id) >= 5   -- TOPIC_K_MIN
order by n desc, last_seen desc
limit 20;


-- Retire la vue à anon : même si le prédicat strict renvoie déjà vide sans session,
-- on ne laisse pas la clé publique porter le moindre droit sur ce texte. `revoke all`
-- car Supabase réaccorde tous les droits à anon via ses default privileges à la
-- (re)création de la vue.
revoke all on public.dashboard_topics from anon;
grant select on public.dashboard_topics to authenticated;


-- ---------------------------------------------------------------------------
-- Rappel de re-verrouillage global (inchangé, complété)
-- ---------------------------------------------------------------------------
-- Avant mise en ligne, en plus de la procédure en fin de migration
-- 20260724130000, il n'y a RIEN de spécifique à défaire ici : is_dashboard_admin_strict()
-- est déjà en mode verrouillé. dashboard_topics restera correctement protégée une fois
-- l'authentification réactivée et profiles.is_admin renseigné.
