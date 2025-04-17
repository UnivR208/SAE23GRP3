-- Création de la base de données
CREATE DATABASE IF NOT EXISTS tdavid_05;
USE tdavid_05;

-- Table des utilisateurs
CREATE TABLE IF NOT EXISTS `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL UNIQUE,
  `password` varchar(255) NOT NULL,
  `role` enum('admin', 'user') NOT NULL DEFAULT 'user',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table des groupes
CREATE TABLE IF NOT EXISTS `groups` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(50) NOT NULL,
    `description` TEXT,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table des résidences
CREATE TABLE IF NOT EXISTS `RESIDENCE` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `location_lat` decimal(10,8) NOT NULL,
  `location_lng` decimal(11,8) NOT NULL,
  `type` enum('main', 'secondary') NOT NULL DEFAULT 'main',
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  CONSTRAINT `valid_dates` CHECK (`start_date` <= `end_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table des données météorologiques des groupes
CREATE TABLE IF NOT EXISTS `METEO_GROUPE` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `residence_id` int(11) NOT NULL,
  `temperature` decimal(5,2),
  `humidity` decimal(5,2),
  `wind_speed` decimal(5,2),
  `weather_code` int(11),
  `timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`residence_id`) REFERENCES `RESIDENCE`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Suppression des données existantes
DELETE FROM `METEO_GROUPE`;
DELETE FROM `RESIDENCE`;
DELETE FROM `users`;

-- Insertion de l'utilisateur Tom
INSERT INTO `users` (`name`, `email`, `password`, `role`) VALUES
('Tom', 'tom@example.com', 'tom', 'user');

-- Insertion des résidences de Tom
INSERT INTO `RESIDENCE` (`user_id`, `name`, `location_lat`, `location_lng`, `type`, `start_date`, `end_date`) VALUES
(1, 'Besançon', 47.2378, 6.0241, 'main', '2024-01-01', '2024-12-31'),
(1, 'Paris', 48.8566, 2.3522, 'secondary', '2024-01-01', '2024-12-31');

-- Insertion d'un utilisateur admin par défaut
INSERT INTO `users` (`name`, `email`, `password`, `role`) VALUES
('Admin', 'admin@example.com', 'admin123', 'admin'); 