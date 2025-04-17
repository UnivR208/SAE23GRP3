# Climatomètre BUT1 R&T - Application en mode Local

## À propos
Cette application permet aux étudiants de suivre les climats de leurs résidences. Toutes les données sont stockées localement dans le navigateur (localStorage) et ne nécessitent pas de serveur PHP.

## Fonctionnalités
- Login/Authentication locale
- Gestion des résidences étudiantes (principale, secondaire, autre)
- Affichage des données météo en temps réel et prévisions
- Mode jour/nuit
- Sauvegarde automatique des données dans le localStorage du navigateur

## Comment utiliser l'application
1. Ouvrir le fichier `index.html` dans un navigateur web
2. L'application demandera de se connecter
3. Utiliser les identifiants par défaut:
   - Email: `tom@example.com`
   - Mot de passe: `tom`
4. Une fois connecté, vous pouvez:
   - Visualiser les résidences existantes
   - Ajouter une nouvelle résidence
   - Consulter les données météo actuelles et les prévisions

## Structure de l'application

### Fichiers principaux
- `index.html` - Page principale de l'application
- `login.html` - Page de connexion
- `data/students.json` - Données initiales (chargées au premier lancement)

### Scripts JavaScript
- `scripts/localData.js` - Gère le stockage et la récupération des données en local
- `scripts/main.js` - Script principal de l'application
- `scripts/weather.js` - Gère l'API météo
- `scripts/redirect.js` - Gère les redirections et l'authentification

### CSS
- `css/index.css` - Styles principaux
- `css/windy.css` - Styles spécifiques pour les animations

## Stockage des données
Toutes les données sont stockées dans le localStorage du navigateur sous la clé `windy_data`. Au premier lancement, les données sont initialisées à partir du fichier `data/students.json`.

## APIs externes utilisées
- OpenWeatherMap API pour les données météo
- Nominatim (OpenStreetMap) pour la géolocalisation

## Notes techniques
- L'application fonctionne entièrement côté client, sans besoin de PHP ou de base de données.
- Les données sont persistantes entre les sessions grâce au localStorage.
- Pour réinitialiser toutes les données, vous pouvez effacer le localStorage de votre navigateur.

## Compatibilité
Fonctionne sur tous les navigateurs modernes qui supportent:
- JavaScript ES6+
- localStorage
- Fetch API
- Async/Await
