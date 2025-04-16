# Guide Développeur - Climatomètre BUT1 R&T

## Architecture du projet

### Structure des fichiers
```
Merge2/
├── php/              # Backend PHP
│   ├── sync.php      # Synchronisation des données
│   ├── login.php     # Gestion de l'authentification
│   ├── admin.php     # Interface d'administration
│   └── database.sql  # Schéma de la base de données
├── js/               # Frontend JavaScript
│   ├── main.js       # Logique principale
│   └── weather.js    # Gestion des données météo
├── scripts/          # Scripts utilitaires
│   ├── auth.js       # Authentification
│   ├── redirect.js   # Redirection
│   ├── admin.js      # Administration
│   └── weather.js    # Météo
└── data/             # Données
    └── students.json # Données des étudiants
```

## Configuration de l'environnement

### Prérequis
- PHP 7.4+
- MySQL 5.7+
- Node.js 14+
- Serveur web (Apache/Nginx)

### Installation
1. Cloner le dépôt
2. Installer les dépendances :
   ```bash
   npm install
   ```
3. Configurer la base de données :
   ```bash
   mysql -u root -p < php/database.sql
   ```
4. Configurer les variables d'environnement :
   ```bash
   cp .env.example .env
   ```

## Développement

### Backend (PHP)
- Utilisation de PDO pour la base de données
- API RESTful pour les communications frontend/backend
- Gestion des sessions pour l'authentification

### Frontend (JavaScript)
- Architecture modulaire
- Utilisation de Fetch API pour les requêtes
- Gestion d'état avec des objets JavaScript

### Base de données
Structure principale :
```sql
-- Table des utilisateurs
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE,
    password VARCHAR(255),
    name VARCHAR(255),
    role ENUM('student', 'admin'),
    group_id INT
);

-- Table des groupes
CREATE TABLE groups (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255),
    description TEXT
);

-- Table des résidences
CREATE TABLE residences (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    city VARCHAR(255),
    start_date DATE,
    end_date DATE,
    type ENUM('main', 'secondary', 'other')
);
```

## API

### Endpoints
- `/api/login` - Authentification
- `/api/users` - Gestion des utilisateurs
- `/api/groups` - Gestion des groupes
- `/api/weather` - Données météorologiques

### Format des réponses
```json
{
    "status": "success|error",
    "data": {},
    "message": "Description de la réponse"
}
```

## Tests
1. Tests unitaires :
   ```bash
   npm test
   ```
2. Tests d'intégration :
   ```bash
   php tests/integration.php
   ```

## Déploiement
1. Construire les assets :
   ```bash
   npm run build
   ```
2. Configurer le serveur web
3. Mettre à jour la base de données
4. Vérifier les permissions

## Maintenance
- Journalisation des erreurs
- Sauvegarde régulière de la base de données
- Mise à jour des dépendances

## Contribution
1. Forker le projet
2. Créer une branche
3. Commiter les changements
4. Pousser vers la branche
5. Ouvrir une Pull Request

## Bonnes pratiques
- Suivre les conventions de code
- Documenter le code
- Tester avant de commiter
- Utiliser des messages de commit descriptifs 