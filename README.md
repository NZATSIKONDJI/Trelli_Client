# Trelli — Client web

Interface web de Trelli, une application collaborative de gestion de projets et de tâches inspirée de Trello.

Ce dépôt contient uniquement le client. L’API FastAPI Trelli doit être lancée séparément pour que l’authentification et les fonctions de gestion soient disponibles.

## Technologies

- HTML5 ;
- CSS3 responsive ;
- JavaScript natif avec modules ES ;
- Nginx 1.29 pour servir les fichiers statiques et transmettre `/api` au serveur ;
- Docker pour construire et exécuter le client.

Aucun React, Node.js, Vite ou Pinia n’est nécessaire.

## Fonctionnalités de l’interface

- page de connexion centrée avec le logo Montpellier Ynov Campus ;
- formulaire vidé après la déconnexion ;
- barre Trelli et bouton de déconnexion visibles seulement durant une session ;
- liste des projets et statuts colorés ;
- tableau de tâches : « À faire », « En cours » et « Terminées » ;
- création et modification des projets selon les permissions ;
- création, attribution, modification et suppression des tâches ;
- changement rapide du statut des tâches autorisées ;
- gestion de l’équipe et des rôles réservée aux utilisateurs autorisés ;
- avatars PNG avec initiales de remplacement ;
- affichage adapté aux ordinateurs, tablettes et téléphones.

## Autorisations visibles dans le client

- Le propriétaire peut gérer son projet, ses participants et leurs rôles.
- Un administrateur délégué peut gérer le projet et toutes ses tâches, mais pas les rôles.
- Un participant voit toutes les tâches et peut en créer.
- Un participant peut modifier, supprimer ou changer le statut d’une tâche si elle lui est assignée ou s’il l’a créée.
- Un participant ne voit pas l’onglet « Équipe et rôles ».

L’interface masque les commandes interdites pour améliorer l’expérience, mais la sécurité réelle est toujours contrôlée par l’API.

## Arborescence

```text
client/
├── css/
│   └── styles.css              # couleurs, cartes, formulaires et responsive
├── images/
│   ├── logo-montpellier.png    # logo principal
│   └── membres/                # photos facultatives des membres
├── js/
│   ├── api.js                  # requêtes fetch, cookies et jeton CSRF
│   └── app.js                  # état et comportement de l’interface
├── index.html                  # structure HTML et dialogues
├── nginx.conf                  # serveur statique et proxy API
├── Dockerfile
└── README.md
```

## Communication avec le serveur

Le client appelle toutes les routes avec le préfixe relatif `/api` :

```javascript
const API_URL = "/api";
```

Nginx transmet ces requêtes au conteneur appelé `server` sur le port `8000` :

```text
Navigateur → http://localhost:8080/api/... → Nginx → server:8000/api/...
```

Le client et le serveur doivent donc appartenir au même réseau Docker, et le serveur doit être joignable sous le nom `server`. L’utilisation d’une URL relative permet aussi aux cookies de session de rester sur la même origine.

## Prérequis

- Docker Desktop avec la virtualisation activée ;
- le dépôt du serveur Trelli ;
- un réseau Docker commun entre les deux applications.

## Construction de l’image

Depuis le dossier du dépôt client :

```powershell
docker build -t trelli-client .
```

## Exécution avec un serveur séparé

Créer une seule fois un réseau partagé :

```powershell
docker network create trelli
```

Le conteneur de l’API doit être démarré sur ce réseau avec le nom `server`. Démarrer ensuite le client :

```powershell
docker run --name trelli-client --network trelli `
  -p 127.0.0.1:8080:8080 `
  --read-only `
  --tmpfs /var/cache/nginx `
  --tmpfs /var/run `
  --security-opt no-new-privileges:true `
  trelli-client
```

Ouvrir ensuite <http://localhost:8080>.

Dans l’environnement de développement actuel, le fichier `docker-compose.yml` global peut également lancer le client, le serveur, MySQL et phpMyAdmin ensemble :

```powershell
docker compose up --build -d
```

## Développement sans reconstruction permanente

Le projet n’a aucune dépendance JavaScript à installer. Après une modification, reconstruire l’image :

```powershell
docker build -t trelli-client .
```

Pour vérifier uniquement la syntaxe JavaScript si Node.js est disponible sur la machine :

```powershell
node --check js/app.js
node --check js/api.js
```

Node.js est facultatif et sert seulement à cette vérification ; il n’est pas utilisé par l’application.

## Photos des membres

Placer les images dans `images/membres`.  :

- PNG carré ;
- environ 256 × 256 pixels ;
- moins de 200 Ko ;
- nom identique au chemin enregistré par le serveur.

Si une image est absente, le client affiche automatiquement les initiales dans un avatar coloré.

## Sécurité côté client

- aucune insertion de contenu utilisateur avec `innerHTML` ;
- utilisation de `textContent` contre les injections HTML et XSS ;
- politique CSP restrictive dans HTML et Nginx ;
- en-têtes `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy` et `Permissions-Policy` ;
- cookie JWT inaccessible au JavaScript grâce à `HttpOnly` côté serveur ;
- lecture du cookie CSRF et envoi dans `X-CSRF-Token` pour les modifications ;
- `credentials: "include"` pour transmettre les cookies de session ;
- aucun secret ou mot de passe enregistré dans le dépôt client.

## Routes consommées

### Authentification

- `POST /api/authentification/connexion`
- `GET /api/authentification/moi`
- `POST /api/authentification/deconnexion`

### Projets et participants

- `GET|POST /api/projets`
- `PUT|DELETE /api/projets/{projet_id}`
- `POST /api/projets/{projet_id}/participants`
- `PUT /api/projets/{projet_id}/participants/{participant_id}/role`

### Tâches

- `POST /api/projets/{projet_id}/taches`
- `PUT|DELETE /api/projets/{projet_id}/taches/{tache_id}`
- `PATCH /api/projets/{projet_id}/taches/{tache_id}/statut`

## Production

- placer un reverse proxy HTTPS devant le client ;
- ne publier que le port `443` ;
- conserver le client et l’API sur la même origine ou configurer précisément CORS et les cookies ;
- reconstruire l’image après chaque version ;
- ne jamais placer de secret dans HTML, CSS ou JavaScript.
