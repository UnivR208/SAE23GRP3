# Climatomètre BUT1 R&T

## Présentation
Le Climatomètre est une application web qui permet de suivre et visualiser les conditions météorologiques des résidences (principale et secondaire) des étudiants du BUT1 R&T. L'application offre une interface intuitive pour consulter les données météo en temps réel et historiques, ainsi que des statistiques collectives.

## Fonctionnalités
- Affichage du climat journalier pour chaque étudiant
- Gestion des résidences principales et secondaires
- Visualisation des données météo en temps réel
- Historique des conditions météorologiques
- Statistiques collectives du groupe
- Interface responsive et moderne

## Installation

### Prérequis
- Un serveur web (Apache, Nginx, etc.)
- PHP 7.4 ou supérieur
- MySQL 5.7 ou supérieur
- Une clé API OpenWeatherMap

### Étapes d'installation
1. Cloner le dépôt :
```bash
git clone [URL_DU_REPO]
```

2. Installer les dépendances :
```bash
cd climatomètre
npm install
```

3. Configurer la base de données :
- Créer une base de données MySQL
- Importer le fichier `database.sql`
- Configurer les paramètres de connexion dans `config/database.php`

4. Configurer l'API météo :
- Obtenir une clé API sur [OpenWeatherMap](https://openweathermap.org/api)
- Mettre à jour la clé API dans `js/main.js`

5. Configurer le serveur web :
- Pointer le document root vers le dossier `public`
- Configurer les permissions des dossiers `data` et `cache`

## Structure du projet
```
climatomètre/
├── css/
│   ├── main.css
│   └── weather.css
├── js/
│   ├── main.js
│   └── weather.js
├── public/
│   └── index.html
├── config/
│   └── database.php
├── data/
│   └── students.json
└── README.md
```

## Utilisation
1. Accéder à l'application via un navigateur web
2. Rechercher un étudiant par son nom
3. Sélectionner la résidence (principale ou secondaire)
4. Consulter les données météo et les statistiques

## API
L'application utilise l'API OpenWeatherMap pour récupérer les données météorologiques. Les endpoints utilisés sont :
- `/weather` pour les conditions actuelles
- `/forecast` pour les prévisions
- `/onecall` pour les données complètes

## Sécurité
- Les données sensibles sont stockées dans des variables d'environnement
- Les requêtes API sont sécurisées avec HTTPS
- Les entrées utilisateur sont validées et échappées

## Contribution
Les contributions sont les bienvenues ! Pour contribuer :
1. Forker le projet
2. Créer une branche pour votre fonctionnalité
3. Commiter vos changements
4. Pousser vers la branche
5. Ouvrir une Pull Request

## Licence
Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## Auteurs
- Nathanaël
- Séphora
- Tom 

## Support
Pour toute question ou problème, veuillez ouvrir une issue sur le dépôt GitHub. 
