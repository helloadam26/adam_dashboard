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

## 7. Ce qui bloque encore la bascule en données réelles

Le seul point qui ne peut pas être résolu sans information externe : le **schéma Supabase** de l'app ADAM (tables/colonnes disponibles) pour écrire les vues de lecture. Tout le reste — UI, composants, logique de statut KPI, sécurité, structure — peut avancer dès maintenant sur données simulées.

---

## 8. Prochaines étapes concrètes

1. Scaffold du projet Vite + React + TypeScript.
2. Portage des tokens de design + primitives de graphiques depuis le prototype.
3. Construction de la coquille (Sidebar + routing) + section **Vue d'ensemble** (scope bêta) de bout en bout avec données simulées.
4. Itération sur les autres sections du scope bêta.
5. Mise en place de l'authentification Supabase + 2FA.
6. Une fois le schéma Supabase obtenu : remplacement des hooks mock par les vraies requêtes, section par section.
