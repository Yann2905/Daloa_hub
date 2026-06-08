# Guide de déploiement — DALOA HUB

Ce guide couvre la mise en production complète : **Supabase** (base de données,
auth, storage, realtime) puis **Vercel** (hébergement + cron).

---

## 1. Configuration Supabase

### 1.1 Créer le projet
1. Rendez-vous sur https://supabase.com > **New project**.
2. Notez le **mot de passe de la base** et la **région** (choisir la plus proche
   de la Côte d'Ivoire, ex. `eu-west`).

### 1.2 Récupérer les clés
**Project Settings > API** :
- `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
- `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `service_role` → `SUPABASE_SERVICE_ROLE_KEY` (**secret, serveur uniquement**)

**Project Settings > Database > Connection string (URI)** → `DATABASE_URL`.

### 1.3 Appliquer le schéma
Dans **SQL Editor**, exécutez successivement les fichiers de
`supabase/migrations/` de `0001` à `0011`. Ils créent : types, tables, index,
contraintes, triggers, fonctions RPC, politiques RLS, buckets Storage et
publication Realtime.

### 1.4 Vérifier le Storage
Les buckets `products`, `avatars`, `shops` (publics) et `documents` (privé) sont
créés par la migration `0011`. Vérifiez-les dans **Storage**.

### 1.5 Vérifier Realtime
La migration `0011` ajoute `orders`, `notifications`, `drivers` à la publication
`supabase_realtime`. Vérifiez dans **Database > Replication** si nécessaire.

### 1.6 Auth
**Authentication > Providers** : activez **Email**. Pour un démarrage rapide,
vous pouvez désactiver la confirmation d'e-mail (**Email Auth > Confirm email**).
Ajoutez l'URL de production dans **Authentication > URL Configuration**
(`Site URL` et `Redirect URLs`).

---

## 2. Déploiement Vercel

### 2.1 Importer le projet
1. Poussez le dépôt sur GitHub/GitLab/Bitbucket.
2. Sur https://vercel.com > **Add New > Project** > importez le dépôt.
3. Framework détecté : **Next.js** (aucune config build à modifier).

### 2.2 Variables d'environnement
Dans **Settings > Environment Variables**, ajoutez (Production + Preview) :

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
DATABASE_URL
NEXT_PUBLIC_APP_URL            (ex: https://daloahub.vercel.app)
NEXT_PUBLIC_APP_NAME           (DALOA HUB)
NEXT_PUBLIC_DEFAULT_LAT        (6.8772)
NEXT_PUBLIC_DEFAULT_LNG        (-6.4502)
NEXT_PUBLIC_PROXIMITY_RADIUS_KM (3)
SUBSCRIPTION_AMOUNT_FCFA       (1000)
SUBSCRIPTION_PERIOD_DAYS       (30)
CRON_SECRET                    (chaîne aléatoire longue)
```
Optionnel (push) : `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`.

### 2.3 Cron quotidien
Le fichier `vercel.json` déclare déjà :
```json
{ "crons": [{ "path": "/api/cron/subscriptions", "schedule": "0 2 * * *" }] }
```
Vercel appelle cet endpoint chaque jour à 02:00 UTC avec l'en-tête
`Authorization: Bearer $CRON_SECRET`. L'endpoint expire les abonnements échus et
masque les boutiques concernées.

> Le Cron Vercel nécessite un plan compatible (Hobby inclut 1 cron/jour). Vous
> pouvez aussi déclencher manuellement :
> ```bash
> curl -H "Authorization: Bearer $CRON_SECRET" https://votre-domaine/api/cron/subscriptions
> ```

### 2.4 Déployer
Cliquez sur **Deploy**. Vercel exécute `npm install` puis `npm run build`.

### 2.5 Après déploiement
1. Mettez à jour `NEXT_PUBLIC_APP_URL` avec l'URL finale, redéployez.
2. Ajoutez l'URL dans Supabase **Authentication > URL Configuration**.
3. (Optionnel) Lancez le seed depuis votre machine pointant vers la prod :
   ```bash
   node --env-file=.env.production.local scripts/seed.mjs
   ```
4. Promouvez votre compte admin (SQL Editor) :
   ```sql
   update public.profiles set role = 'admin' where email = 'vous@exemple.com';
   ```

---

## 3. Vérifications post-déploiement (checklist)

- [ ] Inscription/connexion fonctionnent (les 3 rôles).
- [ ] Un produit s'affiche dans le catalogue (boutique approuvée + abonnement actif).
- [ ] Ajout au panier + passage de commande avec partage de position.
- [ ] Le vendeur voit la commande et peut changer son statut.
- [ ] Le livreur (validé, en ligne) reçoit l'affectation.
- [ ] L'admin valide un livreur et consulte les documents (URL signée).
- [ ] La PWA est installable (icône, manifest, service worker en HTTPS).
- [ ] Le cron répond 200 avec le bon `CRON_SECRET`, 401 sinon.

---

## 4. Notes de production

- **Service worker** : actif uniquement en production (`NODE_ENV=production`) et
  en HTTPS. Vercel fournit le HTTPS automatiquement.
- **RLS** : toutes les tables ont des politiques. La clé `service_role` (cron,
  stats admin) contourne la RLS — ne jamais l'exposer côté client.
- **Paiements** : la V1 enregistre les paiements (abonnement, livraison) sans
  intégrer d'agrégateur Mobile Money. Branchez votre PSP dans
  `lib/actions/vendor.ts` (`renewSubscription`) et la table `payments`.
