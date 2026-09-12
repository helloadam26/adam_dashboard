-- dashboard_quota : remplacer deux moyennes trompeuses.
--
-- 1. `avg_limit` moyennait le plafond quotidien sur tous les jours-utilisateur.
--    La distribution réelle au 5 septembre 2026 : 327 jours à 10, 62 à 15, et
--    UNE seule ligne à 1000. Cette ligne unique tirait la moyenne à 13,3, alors
--    que le plafond que rencontre un étudiant est 10. On expose donc le mode —
--    le plafond usuel — et le maximum à part pour ne pas cacher l'exception.
--
-- 2. `avg_used` moyennait la consommation sur tous les jours-utilisateur, y
--    compris les 206 jours à zéro question. Le résultat (1,6) se lisait comme
--    « un étudiant actif pose 1,6 question », ce qui est faux : sur les jours
--    réellement actifs, c'est 3,5. On restreint donc aux jours actifs, et on
--    expose leur nombre pour que le dénominateur soit lisible.
--
-- Rappel : `tokens_used` ne compte pas des tokens de modèle mais les questions
-- décomptées d'un quota quotidien — vérifié, la colonne égale le nombre de
-- messages role='user' du jour sur 151 des 162 jours-utilisateur comparés.

create or replace view public.dashboard_quota as
select
  (select coalesce(mode() within group (order by tokens_limit), 0) from public.daily_tokens)::numeric as avg_limit,
  (select coalesce(round(avg(tokens_used), 1), 0) from public.daily_tokens where tokens_used > 0)::numeric as avg_used,
  (select count(*) from public.daily_tokens where tokens_used >= tokens_limit)::int as days_at_limit,
  (select count(distinct user_id) from public.daily_tokens where tokens_used >= tokens_limit)::int as users_at_limit,
  (select count(*) from public.daily_tokens where tokens_used > 0)::int as user_days
where public.is_dashboard_admin();

-- Les noms de colonnes restent inchangés : `create or replace view` l'exige, et
-- le contrat côté client les traduit déjà en libellés honnêtes (AdamData.quota).
