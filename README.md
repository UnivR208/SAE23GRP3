# Climatomètre des étudiants BUT1 R&T

## Présentation du projet

Ce projet vise à développer un outil informatique qui affiche le "climatomètre" des étudiants du BUT1 R&T. L'application cartographie les climats des résidences (principale et secondaire) d'un groupe d'étudiants universitaires, recense le climat quotidien et stocke ces données dans une base de données.

## Fonctionnalités principales

- Affichage du climat journalier pour chaque étudiant (résidence principale et secondaire)
- Stockage des données climatiques dans une base de données
- Visualisation du temps présent et historique de chaque étudiant
- Affichage du climat médian du groupe d'étudiants (climatomètre collectif)
- Interface de gestion des données climatiques

## Gestion des données

Les informations pour chaque étudiant incluent :
- Nom et prénom
- Adresse de résidence principale (+ dates de début et fin)
- Adresse de résidence secondaire optionnelle (+ dates de début et fin)
- Données climatiques horodatées pour chaque lieu de résidence

Deux méthodes de saisie des données sont proposées :
1. Via un fichier JSON ou CSV complété par des informations provenant d'une API météo
2. Via une base de données à renseigner depuis une interface web ou mobile

## Implémentation technique

Le projet peut être développé sous forme de site web ou d'application mobile, rendant l'outil facilement accessible aux utilisateurs via un simple navigateur web.

### Étapes de réalisation

#### Section 1 : Mise en place de l'environnement de développement
- Utilisation d'une machine virtuelle ou accès à distance aux ressources (ESX, Proxmox, Guacamole, Docker, etc.)
- Installation d'un serveur web non chiffré (Nginx ou Apache)
- Possibilité d'utiliser des frameworks : Python (Django, Flask), JavaScript (jQuery), Java (Play), etc.

#### Section 2 : Réalisation documentée
- Développement algorithmique (scripts serveur, dépôt de code)
- Technologies web (HTML, CSS)
- Base de données avec manipulation complète (ajout, suppression, modification)

#### Section 3 : Formation et documentation
- Organisation d'une session de formation en français et anglais
- Documentation technique de l'application en anglais
- Tutoriel d'installation et d'utilisation

## Modalités d'évaluation

- Site fonctionnel et dynamique
- Manipulation des données (CSV/JSON et BDD)
- Documentation technique complète
- Tutoriel d'installation et d'utilisation
- Dépôt du code source
- Démonstration fonctionnelle
- Présentation des outils de développement utilisés
- Méthode de validation (cahier de tests, tests unitaires)

## Équipe

Ce projet peut être réalisé par un groupe de 2 ou 3 étudiants.

---

*Note: Ce projet expérimental propose un cahier des charges intentionnellement imparfait et évolutif, reflétant la complexité des situations réelles de développement.*
