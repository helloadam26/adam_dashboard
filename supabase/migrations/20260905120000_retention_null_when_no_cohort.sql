-- Rétention : distinguer « 0 % » de « pas de cohorte à mesurer ».
--
-- Les quatre colonnes de dashboard_retention enveloppaient leur ratio dans
-- `coalesce(..., 0)`. Quand aucun compte ne tombe dans la fenêtre d'inscription
-- observée, `nullif(count(*), 0)` produit bien NULL — mais le coalesce le
-- réécrivait en 0, et le dashboard lisait « 0 % de rétention ».
--
-- Conséquence en aval : ces 0 comptaient comme un écart à la cible et pesaient
-- sur le verdict de santé du pilote. Une absence de mesure y devenait un échec
-- de mesure, ce qui teintait tout le tableau en rouge par construction.
--
-- Le nullif interne suffit : on retire le coalesce externe et NULL remonte
-- jusqu'au client, qui l'affiche en « Non mesuré ». Aucun autre changement —
-- même périmètre, mêmes fenêtres, même exclusion des comptes is_admin.

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
     from base where created_at between now() - interval '90 days' and now() - interval '60 days')::int as d30_prev
where public.is_dashboard_admin();

-- `create or replace view` conserve les droits déjà accordés : la vue reste
-- lisible par `authenticated` seul, filtrée par is_dashboard_admin() dans son corps.
