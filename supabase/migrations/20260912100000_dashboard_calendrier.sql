-- Section Calendrier : mesurer le module d'import de plans de cours.
--
-- Cinq tables ont été ajoutées par l'app étudiante (`courses`, `import_drafts`,
-- `calendar_events`, `reminders`, `reminder_preferences`) sans qu'aucune vue du
-- dashboard ne les lise. Le module était donc invisible côté pilotage.
--
-- CE QUE CES VUES N'EXPOSENT PAS
--
-- Rien de ce que l'étudiant a écrit ou déposé. Pas de titre d'échéance, pas de
-- code ni de nom de cours, pas de nom de fichier, pas d'extrait du plan de cours,
-- pas de note. Ces colonnes existent et sont identifiantes — un titre d'examen
-- rattaché à un cours nomme une personne dans une promotion de dix. On ne renvoie
-- que des comptes, par type et par statut, qui sont des catégories fermées
-- contrôlées par des contraintes CHECK. Même arbitrage que dashboard_topics
-- (migration 20260724140000), appliqué d'emblée plutôt qu'après coup.
--
-- LE STAFF EST EXCLU, ET ON LE DIT
--
-- Comme toutes les vues depuis 20260911230000, l'activité des comptes is_admin
-- sort des agrégats. Particularité du Calendrier : au 12 septembre 2026, la
-- TOTALITÉ des données lui appartient — le module n'est utilisé qu'en test
-- interne. Les chiffres étudiants sont donc tous à zéro, ce qui est exact mais
-- se lirait comme une panne. Les colonnes `staff_*` comptent à part ce que le
-- staff a produit, pour que la section puisse dire « le module tourne, mais
-- personne hors de l'équipe ne s'en sert encore » au lieu d'afficher un écran
-- mort. Elles ne sont jamais mélangées aux chiffres étudiants.

-- 1. Synthèse --------------------------------------------------------------
create or replace view public.dashboard_calendar as
select
  -- Cours suivis
  (select count(*) from public.courses c
     where not public.is_staff_account(c.user_id))::int as courses_total,
  (select count(distinct c.user_id) from public.courses c
     where not public.is_staff_account(c.user_id))::int as courses_users,

  -- Imports de plans de cours
  (select count(*) from public.import_drafts d
     where not public.is_staff_account(d.user_id))::int as imports_total,
  (select count(distinct d.user_id) from public.import_drafts d
     where not public.is_staff_account(d.user_id))::int as imports_users,
  (select count(*) from public.import_drafts d
     where d.status = 'ready' and not public.is_staff_account(d.user_id))::int as imports_ready,
  (select count(*) from public.import_drafts d
     where d.status = 'failed' and not public.is_staff_account(d.user_id))::int as imports_failed,
  (select count(*) from public.import_drafts d
     where d.status in ('queued', 'processing')
       and not public.is_staff_account(d.user_id))::int as imports_running,
  (select count(*) from public.import_drafts d
     where jsonb_array_length(d.warnings) > 0
       and not public.is_staff_account(d.user_id))::int as imports_with_warnings,
  (select count(*) from public.import_drafts d
     where d.verifier_agreed and not public.is_staff_account(d.user_id))::int as imports_verified,
  (select count(*) from public.import_drafts d
     where d.archived_at is not null and not public.is_staff_account(d.user_id))::int as imports_archived,

  -- Échéances extraites
  (select count(*) from public.calendar_events e
     where not public.is_staff_account(e.user_id))::int as events_total,
  (select count(distinct e.user_id) from public.calendar_events e
     where not public.is_staff_account(e.user_id))::int as events_users,
  (select count(*) from public.calendar_events e
     where e.status = 'validated' and not public.is_staff_account(e.user_id))::int as events_validated,
  (select count(*) from public.calendar_events e
     where e.status = 'draft' and not public.is_staff_account(e.user_id))::int as events_draft,
  (select count(*) from public.calendar_events e
     where e.status = 'rejected' and not public.is_staff_account(e.user_id))::int as events_rejected,
  (select count(*) from public.calendar_events e
     where e.origin = 'student' and not public.is_staff_account(e.user_id))::int as events_manual,
  (select count(*) from public.calendar_events e
     where e.student_modified and not public.is_staff_account(e.user_id))::int as events_corrected,
  (select count(*) from public.calendar_events e
     where e.confidence = 'high' and not public.is_staff_account(e.user_id))::int as events_high,
  (select count(*) from public.calendar_events e
     where e.confidence = 'medium' and not public.is_staff_account(e.user_id))::int as events_medium,
  (select count(*) from public.calendar_events e
     where e.confidence = 'low' and not public.is_staff_account(e.user_id))::int as events_low,

  -- Rappels
  (select count(*) from public.reminders r
     where not public.is_staff_account(r.user_id))::int as reminders_total,
  (select count(*) from public.reminders r
     where r.status = 'sent' and not public.is_staff_account(r.user_id))::int as reminders_sent,
  (select count(*) from public.reminders r
     where r.status = 'pending' and not public.is_staff_account(r.user_id))::int as reminders_pending,
  (select count(*) from public.reminders r
     where r.status = 'failed' and not public.is_staff_account(r.user_id))::int as reminders_failed,
  (select count(*) from public.reminder_preferences p
     where p.enabled and not public.is_staff_account(p.user_id))::int as reminders_opted_in,

  -- Repères de période
  (select min(d.created_at)::date from public.import_drafts d
     where not public.is_staff_account(d.user_id)) as first_import_day,
  (select max(e.updated_at) from public.calendar_events e
     where not public.is_staff_account(e.user_id)) as last_event_at,

  -- Test interne, compté à part et jamais mélangé à ce qui précède.
  (select count(*) from public.import_drafts d
     where public.is_staff_account(d.user_id))::int as staff_imports,
  (select count(*) from public.calendar_events e
     where public.is_staff_account(e.user_id))::int as staff_events,
  (select count(distinct u.user_id) from (
     select user_id from public.import_drafts
     union select user_id from public.calendar_events
     union select user_id from public.courses
   ) u where public.is_staff_account(u.user_id))::int as staff_users
where public.is_dashboard_admin();


-- 2. Échéances par type -----------------------------------------------------
-- `type` est une catégorie fermée (CHECK : exam, assignment, quiz, other), pas du
-- texte d'étudiant. Les quatre lignes sont toujours renvoyées, à zéro le cas
-- échéant, pour qu'un type absent se lise comme « aucune » et non comme un trou.
create or replace view public.dashboard_calendar_types as
select
  t.type,
  (select count(*) from public.calendar_events e
     where e.type = t.type and not public.is_staff_account(e.user_id))::int as n,
  (select count(*) from public.calendar_events e
     where e.type = t.type and e.status = 'validated'
       and not public.is_staff_account(e.user_id))::int as validated,
  (select count(distinct e.user_id) from public.calendar_events e
     where e.type = t.type and not public.is_staff_account(e.user_id))::int as users
from (values ('exam'), ('assignment'), ('quiz'), ('other')) as t(type)
where public.is_dashboard_admin();


-- 3. Droits -----------------------------------------------------------------
-- Même régime que les autres vues : rien pour anon, lecture pour authenticated,
-- le corps de la vue refusant déjà les sessions non administratrices.
revoke all on public.dashboard_calendar, public.dashboard_calendar_types from anon;
grant select on public.dashboard_calendar, public.dashboard_calendar_types to authenticated;
