# ITAOSYclub

API REST et interface web pour gérer les adhérents, leurs abonnements et le planning des cours collectifs. Le projet utilise Express 5, MongoDB/Mongoose, JWT et une interface native HTML/CSS/JavaScript.

## Prérequis

- Node.js 20 ou plus récent et npm
- Docker Desktop avec Compose, ou une instance MongoDB accessible

## Démarrage

À la racine du projet, dans PowerShell:

```powershell
Copy-Item .env.example .env
```

Modifiez ensuite `.env`: définissez un `JWT_SECRET` aléatoire d’au moins 32 caractères et changez le mot de passe administrateur fourni pour le développement local. Démarrez MongoDB et l’application:

```powershell
docker compose up -d
npm install
npm run dev
```

Ouvrez <http://localhost:3000>. Le premier démarrage crée le compte admin configuré par `ADMIN_EMAIL` et `ADMIN_PASSWORD`. Les comptes créés depuis l’interface ont le rôle adhérent; seul un administrateur peut gérer les comptes, abonnements et cours.

Pour arrêter MongoDB: `docker compose down`. Les données restent conservées dans le volume Docker `fitclub-data`.

## Fonctionnalités

- Inscription et connexion, mot de passe haché avec bcrypt et jeton JWT.
- CRUD des adhérents, accessible à l’administrateur.
- CRUD des abonnements avec calcul de date de fin à partir de la durée.
- Planning de cours, capacité contrôlée lors de chaque réservation, annulation d’inscription et refus des doublons.
- Réservation conditionnée à un abonnement actif.
- Alerte des abonnements expirant sous 7 jours via le tableau de bord admin et journal du serveur quotidien; bascule automatique au statut expiré.
- Menu admin latéral pour mettre à jour ses identifiants, créer des admins et choisir un compte nécessitant son mot de passe.
- Activités et coachs proposés configurables depuis l’administration.
- Offre d’abonnement configurable (22 000 Ar/mois par défaut), demandes adhérents validées par un admin, tarif total enregistré et badge Premium après activation.
- Notifications de demandes d’abonnement dans l’espace admin, actualisées pendant la session; encart promotionnel du club côté adhérent.
- Interface responsive pour les adhérents et les opérations courantes d’administration.
- Validation Zod, limitation des tentatives d’authentification, Helmet, contrôle des rôles et réponses d’erreur JSON.

## Routes principales

Toutes les routes sauf `POST /api/auth/register`, `POST /api/auth/login` et `GET /api/health` requièrent `Authorization: Bearer <token>`.

| Méthode | Route | Accès | Description |
| --- | --- | --- | --- |
| `POST` | `/api/auth/register` | Public | Créer un compte adhérent et son profil |
| `POST` | `/api/auth/login` | Public | Se connecter et obtenir un JWT |
| `GET` | `/api/auth/me` | Connecté | Obtenir le compte courant |
| `GET`, `POST` | `/api/admins` | Admin | Lister ou créer des administrateurs (sans exposer leurs mots de passe) |
| `GET` | `/api/admins/notifications` | Admin | Voir les demandes d’abonnement en attente |
| `PATCH` | `/api/admins/me` | Admin | Modifier l’e-mail ou le mot de passe après vérification de l’actuel |
| `GET`, `POST` | `/api/members` | Admin | Lister ou créer des adhérents |
| `GET`, `PUT` | `/api/members/:id` | Admin | Lire ou modifier un adhérent |
| `DELETE` | `/api/members/:id` | Admin | Supprimer un adhérent avec `adminPassword` dans le corps de la requête |
| `GET` | `/api/subscriptions` | Connecté | Lister les abonnements (les siens pour un adhérent) |
| `POST` | `/api/subscriptions/request` | Adhérent | Demander une formule au tarif mensuel courant |
| `POST` | `/api/subscriptions/:id/approve`, `/api/subscriptions/:id/reject` | Admin | Activer ou refuser une demande |
| `GET` | `/api/subscriptions/:id` | Connecté | Lire un abonnement (admin ou adhérent concerné) |
| `POST`, `PUT`, `DELETE` | `/api/subscriptions`, `/api/subscriptions/:id` | Admin | Gérer les abonnements |
| `GET` | `/api/subscriptions/expiring?days=7` | Admin | Voir les abonnements bientôt expirés |
| `GET` | `/api/classes` | Connecté | Consulter les cours futurs |
| `POST`, `PUT`, `DELETE` | `/api/classes`, `/api/classes/:id` | Admin | Gérer le planning |
| `GET`, `PUT` | `/api/club-settings` | Admin | Lire et modifier les activités et coachs proposés |
| `GET` | `/api/club-settings/offer` | Connecté | Lire le tarif mensuel de l’offre |
| `POST`, `DELETE` | `/api/classes/:id/book` | Adhérent | S’inscrire ou annuler son inscription |

Les réponses de collection utilisent `{ "data": [...] }`. Les erreurs utilisent `{ "error": { "message": "..." } }`. Les champs attendus sont validés par l’API; les dates sont transmises au format ISO 8601.

## Exemple d’inscription

```json
{
  "name": "Samira Benali",
  "firstName": "Samira",
  "lastName": "Benali",
  "email": "samira@example.com",
  "password": "MotDePasse123!",
  "phone": "0600000000"
}
```

Les fonctions d’alerte sont locales au serveur (journal et tableau de bord); aucun e-mail ou SMS n’est envoyé. `npm test` lance le runner Node intégré.