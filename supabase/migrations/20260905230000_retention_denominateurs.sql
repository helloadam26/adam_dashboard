-- Exposer la taille des cohortes de rétention.
--
-- `dashboard_retention` renvoyait quatre pourcentages sans leur dénominateur.
-- Impossible, côté dashboard, de savoir qu'un « 25 % » porte sur 4 comptes :
-- le chiffre s'affichait en gros titre sur la Vue d'ensemble avec le même poids
-- qu'un taux calculé sur mille personnes.
--
-- On ajoute donc quatre colonnes de taille de cohorte, en fin de liste pour
-- rester compatible avec `create or replace view`. Les colonnes existantes ne
-- bougent pas : elles renvoient toujours NULL quand la cohorte est vide
-- (migration 20260905120000).
--
-- Note : `d7_n` est le nombre de comptes créés dans la fenêtre observée, donc
-- le dénominateur exact du pourcentage renvoyé juste à côté.

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
  (select round(100.0 * count(*) filter (where last_message >= created_at + interval '7 days')
                / nullif(count(*), 0), 0)
     from base where created_at between now() - interval '37 days' and now() - interval '7 days')::int as d7,
  (select round(100.0 * count(*) filter (where last_message >= created_at + interval '7 days')
                / nullif(count(*), 0), 0)
     from base where created_at between now() - interval '67 days' and now() - interval '37 days')::int as d7_prev,
  (select round(100.0 * count(*) filter (where last_message >= created_at + interval '30 days')
                / nullif(count(*), 0), 0)
     from base where created_at between now() - interval '60 days' and now() - interval '30 days')::int as d30,
  (select round(100.0 * count(*) filter (where last_message >= created_at + interval '30 days')
                / nullif(count(*), 0), 0)
     from base where created_at between now() - interval '90 days' and now() - interval '60 days')::int as d30_prev,
  (select count(*) from base
    where created_at between now() - interval '37 days' and now() - interval '7 days')::int as d7_n,
  (select count(*) from base
    where created_at between now() - interval '67 days' and now() - interval '37 days')::int as d7_prev_n,
  (select count(*) from base
    where created_at between now() - interval '60 days' and now() - interval '30 days')::int as d30_n,
  (select count(*) from base
    where created_at between now() - interval '90 days' and now() - interval '60 days')::int as d30_prev_n
where public.is_dashboard_admin();
