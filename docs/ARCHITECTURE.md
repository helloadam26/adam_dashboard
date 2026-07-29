# ADAM — Dashboard interne · Proposition d'architecture

Basée sur le playbook (`ressources/ADAM — Dashboard interne · Playbook...md`), le prototype existant (`ressources/Dashboard interne d'ADAM/Dashboard ADAM.dc.html`) et les décisions prises en discussion :

- Frontend **React (Vite, sans Next.js)**
- Accès données : **requêtes directes en lecture seule sur Supabase**
- Hosting du sous-domaine : à clarifier plus tard, non bloquant
- Prototype existant : **réutiliser un maximum du code/CSS**

---

## 1. Stack technique

| Couche | Choix | Pourquoi |
|---|---|---|
| Build/runtime | Vite + React 18 + TypeScript | SPA légère, pas besoin de SSR pour un outil interne authentifié à 4 comptes. TypeScript pour sécuriser le mapping des métriques (beaucoup de formes de données différentes par section). |
| Routing | React Router | Correspond 1:1 à la navigation par sections déjà définie dans le prototype (`overview`, `users`, `faculty`, `activity`, `engagement`, `quality`, `reports`, `settings`). |
| Style | CSS variables + styles par composant, portés depuis le prototype | Le prototype est déjà en styles inline avec valeurs directes (couleurs hex, spacing) — pas de framework CSS à apprendre, juste à extraire en tokens réutilisables. |
| Graphiques | Composants SVG maison portés du prototype (courbe, anneau/donut, jauge, heatmap cohortes) | Le prototype les a déjà écrits en `React.createElement` pur — aucune dépendance de charting externe nécessaire pour démarrer. |
| Data fetching | `@supabase/supabase-js` + TanStack Query | Cache, refetch automatique au changement de filtre, gestion propre des états loading/error répétés sur 9 sections. |
| État global | React Context (filtres transversaux) | 4 utilisateurs, pas de complexité qui justifie Redux/Zustand. |
| Auth | Supabase Auth avec MFA (TOTP) | Natif à Supabase, couvre l'obligation de 2FA du playbook sans service tiers. |
| Déploiement | Build statique (Vite) → hébergeur à choisir (Vercel/Netlify/Cloudflare Pages) | Pas de serveur Node requis : aucune route API custom, tout passe par Supabase directement depuis le client. |

---

## 2. Sécurité

- **2FA** : Supabase Auth MFA (TOTP), obligatoire à la connexion pour les 4 comptes — bloque l'accès au dashboard tant qu'il n'est pas configuré.
- **Session** : expiration courte côté Supabase + minuteur d'inactivité côté client (ex. 20–30 min) qui force la déconnexion, conforme au playbook.
- **Accès aux données** : rôle Postgres dédié en lecture seule, avec **RLS** limitant l'accès aux seules données nécessaires au dashboard. Recommandation : exposer des **vues SQL dédiées** côté Supabase (`dashboard_daily_signups`, `dashboard_user_status`, `dashboard_quality_metrics`, etc.) plutôt que d'interroger les tables brutes de l'app ADAM directement.
  - Avantage : le dashboard ne dépend pas du schéma interne exact de l'app, seulement du contrat de ces vues. Si le schéma d'ADAM évolue, on ajuste la vue, pas le front.
  - Avantage sécurité : la vue ne peut exposer que des colonnes agrégées/anonymisées si besoin, jamais l'accès à la table brute.
- **Pas de rôles applicatifs** : un seul groupe d'accès Supabase, les 4 comptes ont des droits identiques (conforme au playbook — "zéro complexité inutile").
- **Isolation lecture/prod** : à l'échelle du pilote (~250 comptes), interroger directement les vues en lecture sur la base de prod via RLS est suffisant ; pas besoin de réplique dédiée pour démarrer. À revisiter si le volume augmente après le pilote.

---

## 3. Structure de dossiers proposée

```
src/
  app/                  # shell applicatif, routing, layout général
  auth/                 # login, 2FA, minuteur d'inactivité
  data/
    supabaseClient.ts
    queries/            # une source par domaine : users.ts, activity.ts, quality.ts, engagement.ts...
    mock/               # portage TS de adam-data.js — utilisé tant que Supabase n'est pas branché
  components/
    charts/             # LineChart, Ring, Donut, CohortHeatmap, Sparkline — portés du prototype
    kpi/                # KpiCard, ObjectiveRow, ActionRecommandee
    layout/              # Sidebar, TopBar, FilterBar
  sections/
    Overview/  Users/  Faculties/  Activity/
    Quality/   Engagement/  Performance/  Reports/  Settings/
  lib/
    kpi.ts               # statusFor(), stMeta(), buildObjectives() — logique de statut vs cible
  theme/                 # tokens extraits du prototype (couleurs, spacing, typo)
```

Chaque dossier de `sections/` correspond exactement à une entrée de la sidebar du playbook — continuité directe avec la structure déjà validée.

---

## 4. Réutilisation concrète du prototype existant

Constat après inspection du fichier `.dc.html` : son moteur de rendu (`support.js`) compile déjà tout en `React.createElement` pur. Concrètement :

- Les primitives graphiques (`lineChart()`, `donut()`, `ring()`, `cohort()`, `icon()`) sont des fonctions JS qui construisent du SVG avec `React.createElement` — portables quasiment telles quelles en composants React fonctionnels.
- La logique métier (`statusFor()`, `stMeta()`, `buildObjectives()` — calcul du statut atteint/proche/écart d'un KPI vs sa cible) est du JS pur, sans dépendance au moteur de template — copiable directement dans `lib/kpi.ts`.
- Seule la couche de template (`{{ variable }}`, `<sc-if>`, `<sc-for>`) doit être traduite en JSX, ce qui est mécanique :
  - `{{ x }}` → `{x}`
  - `<sc-if value="{{ cond }}">...</sc-if>` → `{cond && (...)}`
  - `<sc-for list="{{ items }}" as="it">...</sc-for>` → `{items.map(it => (...))}`

**Plan d'extraction** :
1. Sortir les méthodes de charts dans `components/charts/`.
2. Sortir la logique de statut KPI dans `lib/kpi.ts` (fonctions pures, testables).
3. Passer chaque bloc de markup du template propriétaire en JSX section par section.
4. Porter `adam-data.js` en `data/mock/adamData.ts`, typé — cet objet devient le **contrat de données** que les vraies requêtes Supabase devront respecter.

---

## 5. Couche données : bascule mock → réel sans réécriture

Chaque domaine (objectifs, utilisateurs, usage, qualité...) a une interface TypeScript calquée sur la forme déjà bien conçue de `adam-data.js`. Chaque section consomme un hook `useXData(filters)` :

- **Aujourd'hui** : retourne les données simulées (`data/mock/adamData.ts`).
- **Une fois le schéma Supabase confirmé** : le même hook interroge une vue Supabase via TanStack Query, en conservant exactement la même forme de retour.

Résultat : aucun composant d'affichage n'a besoin d'être modifié au moment de brancher les vraies données — seul le hook change d'implémentation.

---

## 6. Filtres transversaux

Un `FiltersContext` global porte faculté / statut / langue / appareil / période, consommé par tous les hooks de données de section — reproduit le comportement transversal des filtres décrit dans le playbook (section 4, "Transversal").

---

## 7. Bascule en données réelles — ce que le schéma permet réellement

Schéma constaté (24 juillet 2026) : `profiles` (81), `agents` (9), `discussions` (597), `messages` (1 172), `daily_tokens` (356), `message_reactions` (4), `message_feedbacks` (2). Données de octobre 2025 à juillet 2026.

**Principe de conception** : toute métrique dont une table ou une colonne existe en base est câblée, même si la colonne est encore vide. Les 9 sections du playbook sont toutes présentes. Les blocs sans donnée affichent un état vide explicite et s'alimenteront sans changement de code dès que l'app principale écrira. Ce n'est pas de l'analyse — c'est la conception complète du dashboard.

**Alimenté par de vraies valeurs** — comptes créés et inscriptions/jour, DAU/WAU/MAU et séries, rétention J+7 / J+30, cohortes hebdomadaires, stickiness, conversations/jour, longueur moyenne de conversation, questions et conversations par actif, statut des comptes (actif / dormant / jamais actif), usage par faculté (via l'agent sollicité), quotas de tokens.

**Câblé mais en attente de données** (bloc présent, état vide aujourd'hui) :

| Métrique | Support en base | Ce qui manque |
|---|---|---|
| Répartition par faculté / programme / année | colonnes `profiles.*` présentes | valeurs NULL sur 81/81 — collecte côté app |
| Statut de résidence | `profiles.statut` | idem + élargir la contrainte à 3 valeurs |
| Satisfaction, résolution, sujets | `message_reactions`, `message_feedbacks`, `discussions.title` | volume dérisoire (4 réactions, 6 titres) — plus de sollicitation côté app |

**Sans aucun support en base** — types de réponse et taux de repli, NPS, usage détaillé des fonctionnalités, installation PWA, langue d'interface, calendrier académique. Recensés exhaustivement, avec la dépendance responsable (utilisateurs / app principale / dashboard) et ce qu'il faudrait, dans [`src/data/unavailableMetrics.ts`](../src/data/unavailableMetrics.ts) — rendu dans **Paramètres → Métriques non disponibles**.

La section **Facultés** est conservée sous ce nom : la table s'appelle encore `agents` côté app faute de renommage, mais les 9 entrées *sont* les facultés et services de l'uOttawa.

Le `FiltersContext` de la section 6 reste en attente : sans dimension démographique renseignée, seul le filtre de période serait exploitable.

### Accès aux données

Les policies RLS des tables applicatives sont toutes de la forme « chacun ses propres lignes » (`auth.uid() = user_id`, et `profiles` limité à son propre profil). Aucun agrégat n'est donc lisible depuis le client. Deux migrations composent la couche de lecture :

- `20260724120000_dashboard_readonly_views.sql` — `is_dashboard_admin()` (`security definer`) + 7 vues d'agrégats ;
- `20260724130000_dashboard_metrics_extension.sql` — 4 vues supplémentaires (`demographics`, `quality`, `topics`, `quota`), resserrement des droits sur les vues existantes, et ouverture temporaire du prédicat d'accès (refermée depuis, voir plus bas) ;
- `20260728190000_reenable_auth_admin_scope.sql` — clôture de la phase de conception : prédicat réel restauré, `anon` retiré, staff dashboard exclu des métriques.

Les vues appartiennent à `postgres` (hors RLS des tables sous-jacentes) ; le contrôle d'accès vit dans leur corps (`where is_dashboard_admin()`), pas dans une policy — d'où le badge « Unrestricted » du Table Editor, normal pour une vue. Aucune vue n'expose de contenu de message, d'e-mail ni d'identifiant.

**Arbitrage `dashboard_topics` (migration `20260724140000`).** C'était la seule vue à laisser sortir du texte rattaché à la conversation d'un étudiant (`discussions.title`). Constat sur les données : les titres existants proviennent chacun d'un unique utilisateur — donnée identifiante, pas agrégat. Deux garde-fous cumulés :

- **accès strict** — la vue s'appuie sur `is_dashboard_admin_strict()` (toujours un vrai contrôle `is_admin`), jamais sur le prédicat ouvert de la phase de conception ; elle est de plus retirée du rôle `anon` ;
- **k-anonymat** — seuls les titres partagés par au moins 5 étudiants distincts sont renvoyés.

Résultat aujourd'hui : bloc vide, à dessein. Un vrai indicateur « sujets » suppose une classification thématique côté app, pas des titres bruts.

**Authentification (migration `20260728190000`).** La phase de conception est close : `<AuthGate>` protège de nouveau `App.tsx` et `is_dashboard_admin()` revient au vrai contrôle `profiles.is_admin`. Le rôle `anon` n'a plus aucun droit de lecture sur les vues — après connexion, le client interroge en tant que `authenticated`.

Les comptes du dashboard sont **dédiés et distincts des comptes étudiants** : sign-up + login par courriel/mot de passe. Le trigger `on_auth_user_created` (infra de l'app étudiante, non modifié) crée malgré tout une ligne `profiles` à chaque inscription ; les comptes `is_admin = true` sont donc **exclus de tous les agrégats basés sur profiles** (comptes, statuts, démographie, rétention, cohortes) pour ne pas polluer les métriques étudiantes. Un compte connecté mais non `is_admin` reste en état « en attente d'autorisation ».

Provisionnement du premier admin (le sign-up ne l'accorde pas) :

```sql
update public.profiles p set is_admin = true
from auth.users u
where u.id = p.id and u.email = 'TON_COURRIEL';
```

Reste au périmètre du playbook, non implémenté : 2FA (TOTP) et minuteur d'inactivité.

---

## 8. Prochaines étapes concrètes

1. ~~Scaffold du projet Vite + React + TypeScript.~~
2. ~~Portage des tokens de design + primitives de graphiques depuis le prototype.~~
3. ~~Construction de la coquille (Sidebar + routing) + les 9 sections.~~
4. ~~Remplacement des hooks mock par les vraies requêtes Supabase.~~
5. ~~Câbler toute métrique ayant un support en base, états vides pour le reste.~~
6. **Avant mise en ligne** : réactiver `<AuthGate>`, restaurer le prédicat de `is_dashboard_admin()` (fin de migration `20260724130000`), passer `is_admin = true` sur les comptes du dashboard, puis ajouter 2FA (TOTP) et minuteur d'inactivité.
7. Côté app ADAM : renseigner les champs de profil et solliciter davantage le retour utilisateur, pour remplir les blocs aujourd'hui en attente.
