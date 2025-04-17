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

### Prérequis techniques
- PHP 7.4 ou supérieur
- MySQL 5.7 ou supérieur
- Node.js 14 ou supérieur
- Serveur web (Apache/Nginx)

### Procédure d'installation
1. Clonez le dépôt du projet
2. Installez les dépendances:
   ```bash
   npm install
   ```
3. Configurez la base de données:
   ```bash
   mysql -u root -p < php/database.sql
   ```
4. Configurez les variables d'environnement:
   ```bash
   cp .env.example .env
   ```

## Développement

### Backend (PHP)
- Utilisation de PDO pour les interactions avec la base de données
- Architecture API RESTful pour les communications frontend/backend
- Gestion sécurisée des sessions pour l'authentification

### Frontend (JavaScript)
- Architecture modulaire et évolutive
- Utilisation de l'API Fetch pour les requêtes asynchrones
- Gestion d'état optimisée avec des objets JavaScript

### Structure de la base de données
Modèle principal:
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

### Points d'accès
- `/api/login` - Authentification des utilisateurs
- `/api/users` - Gestion des utilisateurs
- `/api/groups` - Gestion des groupes
- `/api/weather` - Accès aux données météorologiques

### Format des réponses
```json
{
    "status": "success|error",
    "data": {},
    "message": "Description de la réponse"
}
```

## Tests
1. Tests unitaires:
   ```bash
   npm test
   ```
2. Tests d'intégration:
   ```bash
   php tests/integration.php
   ```

## Déploiement
1. Générez les assets:
   ```bash
   npm run build
   ```
2. Configurez le serveur web
3. Mettez à jour la base de données
4. Vérifiez les permissions d'accès

## Maintenance
- Système de journalisation des erreurs
- Sauvegarde régulière et automatisée de la base de données
- Mise à jour périodique des dépendances

## Contribution au projet
1. Créez un fork du projet
2. Créez une branche pour votre fonctionnalité
3. Committez vos modifications
4. Poussez les changements vers votre branche
5. Ouvrez une Pull Request

## Bonnes pratiques
- Respectez les conventions de codage établies
- Documentez systématiquement votre code
- Testez rigoureusement avant chaque commit
- Utilisez des messages de commit descriptifs et précis
