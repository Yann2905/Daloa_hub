# DALOA HUB

Plateforme marketplace de niveau production pour la ville de **Daloa** (Côte d'Ivoire).
Les vendeurs publient leurs produits, les clients achètent, les livreurs livrent,
les administrateurs gèrent la plateforme, et le système gère automatiquement les
abonnements et l'affectation des livraisons.

Application **PWA** mobile-first, construite avec Next.js 15, TypeScript,
Tailwind CSS, et Supabase (PostgreSQL, Auth, Storage, Realtime).

---

## Sommaire

1. [Stack technique](#stack-technique)
2. [Fonctionnalités](#fonctionnalités)
3. [Architecture & arborescence](#architecture--arborescence)
4. [Prérequis](#prérequis)
5. [Installation locale](#installation-locale)
6. [Base de données (migrations)](#base-de-données-migrations)
7. [Variables d'environnement](#variables-denvironnement)
8. [Jeu de données de démonstration](#jeu-de-données-de-démonstration)
9. [Déploiement Vercel](#déploiement-vercel)
10. [Règles métier clés](#règles-métier-clés)

---

## Stack technique

| Domaine        | Technologie                                   |
| -------------- | --------------------------------------------- |
| Frontend       | Next.js 15 (App Router), TypeScript, React 19 |
| UI             | Tailwind CSS, composants type Shadcn UI       |
| Backend        | Next.js Server Actions + API Routes           |
| Base de données| PostgreSQL (Supabase)                         |
| Auth           | Supabase Auth                                 |
| Fichiers       | Supabase Storage                              |
| Temps réel     | Supabase Realtime                             |
| Cartographie   | OpenStreetMap + Leaflet                       |
| PWA            | Service Worker, manifest, Web Push            |
| Déploiement    | Vercel (+ Vercel Cron)                        |

## Fonctionnalités

- **Client** : inscription, connexion, profil, catalogue, recherche instantanée,
  filtres, panier, commande, géolocalisation, historique, refus produit,
  évaluations (vendeur + livreur), signalement.
- **Vendeur** : création/gestion de boutique, CRUD produits, gestion du stock,
  gestion des commandes, statistiques, abonnement mensuel (1000 FCFA).
- **Livreur** : inscription, upload CNI + document véhicule, validation par admin,
  disponibilité ON/OFF, réception des commandes, navigation GPS, validation de
  livraison.
- **Admin** : gestion des utilisateurs, validation des livreurs et vendeurs,
  suspension de comptes, gestion des abonnements, statistiques (graphiques),
  gestion des signalements.
- **Système** : tarification de livraison automatique (standard/volumineux,
  proximité/distance), affectation du livreur le plus proche, cron d'expiration
  des abonnements, notifications temps réel.

## Architecture & arborescence

```
daloa-hub/
├── app/
│   ├── (auth)/                 # Connexion / inscription (par rôle)
│   ├── (store)/                # Vitrine client : accueil, produits, panier,
│   │                           #   commande, commandes, compte, boutique
│   ├── admin/                  # Dashboard administrateur
│   ├── vendeur/                # Dashboard vendeur
│   ├── livreur/                # Dashboard livreur
│   ├── api/cron/subscriptions/ # Cron d'expiration des abonnements
│   ├── offline/ 403/ suspendu/ # Pages système
│   ├── layout.tsx              # Layout racine (PWA, toasts)
│   └── globals.css             # Thème (charte graphique)
├── components/
│   ├── ui/                     # Primitives (button, input, card, toast, ...)
│   ├── site/                   # Header, footer, navigation
│   ├── product/                # Carte produit, filtres, ajout panier
│   ├── order/                  # Statut, actions commande (refus, note, signal.)
│   ├── vendor/ driver/ admin/  # Composants spécifiques par rôle
│   ├── dashboard/              # Shell de tableau de bord, cartes de stats
│   ├── notifications/          # Cloche temps réel
│   ├── upload/                 # Upload images / documents (Supabase Storage)
│   └── pwa/                    # Enregistrement du service worker
├── lib/
│   ├── actions/                # Server Actions (auth, orders, vendor, driver, admin)
│   ├── queries/                # Lecture de données serveur
│   ├── supabase/               # Clients (browser, server, admin/service_role)
│   ├── cart/                   # Contexte panier (localStorage)
│   ├── constants.ts            # Règles métier centralisées
│   ├── delivery.ts             # Calcul des frais de livraison
│   ├── geo.ts                  # Distances Haversine, livreur le plus proche
│   ├── auth.ts                 # RBAC serveur (requireRole, ...)
│   └── database.types.ts       # Types TypeScript de la base
├── supabase/migrations/        # Schéma SQL complet (11 fichiers)
├── scripts/seed.mjs            # Jeu de données de démonstration
├── public/                     # manifest, service worker, icônes
├── middleware.ts               # Rafraîchissement session + protection des routes
└── vercel.json                 # Configuration Vercel Cron
```

## Prérequis

- **Node.js 18.18+** (recommandé 20/22)
- Un compte **Supabase** (gratuit) — https://supabase.com
- Un compte **Vercel** (pour le déploiement) — https://vercel.com

## Installation locale

```bash
# 1. Installer les dépendances
npm install

# 2. Configurer l'environnement
cp .env.example .env.local
#   puis renseigner les valeurs Supabase (voir section ci-dessous)

# 3. Appliquer les migrations (voir section Base de données)

# 4. (Optionnel) Charger les données de démonstration
node --env-file=.env.local scripts/seed.mjs

# 5. Lancer en développement
npm run dev
# -> http://localhost:3000
```

## Base de données (migrations)

Le schéma complet se trouve dans `supabase/migrations/`. Appliquez les fichiers
**dans l'ordre numérique**.

**Option A — Éditeur SQL Supabase (le plus simple)**
1. Ouvrez votre projet Supabase > **SQL Editor**.
2. Copiez-collez puis exécutez successivement chaque fichier de
   `supabase/migrations/0001_*.sql` à `0011_*.sql`.

**Option B — Supabase CLI**
```bash
npm install -g supabase
supabase link --project-ref <votre-ref>
supabase db push
```

**Option C — psql**
```bash
# Concatène et applique tous les fichiers via DATABASE_URL
cat supabase/migrations/*.sql | psql "$DATABASE_URL"
```

Le schéma inclut : tables (`profiles`, `vendors`, `drivers`, `categories`,
`products`, `product_images`, `orders`, `order_items`, `order_status_history`,
`subscriptions`, `payments`, `ratings`, `reviews`, `reports`, `notifications`,
`push_subscriptions`), clés étrangères, index, contraintes, triggers
(updated_at, code commande, recalcul des notes, gestion du stock), fonctions
RPC (`place_order`, `assign_nearest_driver`, `refuse_order`,
`expire_subscriptions`), politiques **RLS** complètes, buckets Storage et
publication Realtime.

### Créer le premier administrateur

Après inscription d'un compte, promouvez-le via le SQL Editor :
```sql
update public.profiles set role = 'admin' where email = 'vous@exemple.com';
```
(Le script de seed crée déjà `admin@daloahub.ci`.)

## Variables d'environnement

Voir `.env.example`. Variables principales :

| Variable                          | Description                                    |
| --------------------------------- | ---------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`        | URL du projet Supabase                         |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`   | Clé publique (anon)                            |
| `SUPABASE_SERVICE_ROLE_KEY`       | Clé service_role (serveur uniquement)          |
| `DATABASE_URL`                    | Connexion Postgres directe (migrations/seed)   |
| `NEXT_PUBLIC_APP_URL`             | URL publique de l'application                  |
| `NEXT_PUBLIC_DEFAULT_LAT/LNG`     | Centre par défaut (Daloa)                      |
| `NEXT_PUBLIC_PROXIMITY_RADIUS_KM` | Rayon « proximité » pour la tarification       |
| `CRON_SECRET`                     | Secret protégeant l'endpoint cron              |
| `VAPID_*`                         | Clés Web Push (notifications push)             |

## Jeu de données de démonstration

```bash
node --env-file=.env.local scripts/seed.mjs
```
Crée un admin, 2 vendeurs (boutiques approuvées + abonnement actif), 2 livreurs
(validés), 2 clients et 7 produits. **Mot de passe commun : `Daloa2025!`**

| Rôle    | Email                       |
| ------- | --------------------------- |
| Admin   | `admin@daloahub.ci`         |
| Vendeur | `boutique.kone@daloahub.ci` |
| Livreur | `livreur.traore@daloahub.ci`|
| Client  | `client.yao@daloahub.ci`    |

## Déploiement Vercel

Voir le guide détaillé : [`docs/DEPLOIEMENT.md`](docs/DEPLOIEMENT.md). En résumé :

1. Poussez le code sur un dépôt Git, importez-le dans Vercel.
2. Renseignez toutes les variables d'environnement dans **Settings > Environment Variables**.
3. Le `vercel.json` configure déjà le **Cron quotidien** (`/api/cron/subscriptions` à 02:00).
4. Déployez. Vercel exécute `npm run build` automatiquement.

## Règles métier clés

- **Tarification livraison** (`lib/delivery.ts`) : standard 500/1000 FCFA,
  volumineux 1500/2000 FCFA. Le système choisit proximité vs distance selon le
  rayon configuré.
- **Affectation livreur** : le livreur disponible le plus proche est affecté
  automatiquement à la commande (Haversine côté app + RPC SQL).
- **Refus produit** : le client paie uniquement les frais de déplacement ; le
  stock est automatiquement réintégré (trigger SQL).
- **Abonnement vendeur** : 1000 FCFA / 30 jours. Un cron quotidien expire les
  abonnements échus et masque les boutiques concernées.
- **Sécurité** : RBAC applicatif (`requireRole`) + RLS PostgreSQL, validation
  serveur (Zod), en-têtes de sécurité (XSS, clickjacking), endpoint cron protégé.

---

© DALOA HUB — Marketplace de la ville de Daloa.
