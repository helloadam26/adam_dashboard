-- Compter la consommation de quota comme une activité, et isoler les comptes
-- dont l'usage n'a laissé aucune conversation.
--
-- Constat au 5 septembre 2026 : 6 comptes ont consommé leur quota de questions
-- sans qu'aucun message ne subsiste en base, et il n'existe aucun message
-- orphelin. Leurs conversations ont donc disparu, tandis que le compteur de
-- quota — qui doit survivre à une suppression, sinon le plafond se contourne —
-- garde la trace. `dashboard_user_status` ne regardait que `messages` : ces 6
-- comptes tombaient dans « jamais actifs », ce qui est faux, ils ont utilisé ADAM.
--
-- Deux changements :
--
-- 1. La date de dernière activité devient le plus récent des deux signaux,
--    message ou jour de quota consommé. Vérifié : aujourd'hui aucun compte ne
--    change de case pour autant (le quota n'est jamais plus récent que le
--    dernier message conservé) — la règle est posée pour rester juste ensuite.
--
-- 2. Un quatrième statut `untracked` isole les comptes sans aucun message mais
--    avec du quota consommé, plutôt que de les fondre dans « dormants ». Les
--    compter comme actifs sans le dire masquerait le fait qu'on ne sait plus
--    ce qu'ils ont demandé.
--
-- Découpage attendu sur les 86 comptes étudiants : 7 actifs, 44 dormants,
-- 6 untracked, 29 jamais actifs.

create or replace view public.dashboard_user_status as
with signaux as (
  select
    p.id,
    (select max(m.created_at)::date from public.messages m where m.user_id = p.id) as dernier_message,
    (select max(t.date) from public.daily_tokens t where t.user_id = p.id and t.tokens_used > 0) as dernier_quota
  from public.profiles p
  where not coalesce(p.is_admin, false)
)
select
  case
    when dernier_message is null and dernier_quota is null then 'never_active'
    -- Usage attesté par le seul compteur de quota : la conversation n'existe plus.
    when dernier_message is null then 'untracked'
    when greatest(dernier_message, coalesce(dernier_quota, dernier_message))
         >= current_date - 30 then 'active'
    else 'dormant'
  end as status,
  count(*)::int as n
from signaux
where public.is_dashboard_admin()
group by 1;
