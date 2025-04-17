-- Création de la base de données si elle n'existe pas
CREATE DATABASE IF NOT EXISTS `tdavid_05` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `tdavid_05`;

-- Suppression des tables existantes dans le bon ordre
DROP TABLE IF EXISTS `group_weather`;
DROP TABLE IF EXISTS `user_groups`;
DROP TABLE IF EXISTS `user_locations`;
DROP TABLE IF EXISTS `users`;
DROP TABLE IF EXISTS `groups`;

-- Table des groupes
CREATE TABLE `groups` (
    `id` VARCHAR(10) PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL UNIQUE,
    `description` TEXT,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table des utilisateurs
CREATE TABLE `users` (
    `id` VARCHAR(10) PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL,
    `email` VARCHAR(100) NOT NULL UNIQUE,
    `role` ENUM('admin', 'student') NOT NULL DEFAULT 'student',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table des localisations des utilisateurs
CREATE TABLE `user_locations` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `user_id` VARCHAR(10) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `latitude` DECIMAL(10, 8) NOT NULL,
    `longitude` DECIMAL(11, 8) NOT NULL,
    `type` ENUM('main', 'secondary') NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    UNIQUE KEY `unique_user_location_type` (`user_id`, `type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table de relation utilisateurs-groupes
CREATE TABLE `user_groups` (
    `user_id` VARCHAR(10) NOT NULL,
    `group_id` VARCHAR(10) NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`user_id`, `group_id`),
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`group_id`) REFERENCES `groups`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table de la météo moyenne des groupes
CREATE TABLE `group_weather` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `group_id` VARCHAR(10) NOT NULL,
    `temperature_avg` DECIMAL(5,2),
    `humidity_avg` DECIMAL(5,2),
    `wind_speed_avg` DECIMAL(5,2),
    `timestamp` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`group_id`) REFERENCES `groups`(`id`) ON DELETE CASCADE,
    INDEX `idx_group_weather_timestamp` (`timestamp`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Création des index pour optimiser les performances
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_user_locations_name ON user_locations(name);
CREATE INDEX idx_groups_name ON groups(name);

-- Insertion des données initiales depuis le JSON
INSERT INTO `groups` (`id`, `name`, `description`) VALUES
('GRP001', 'RT1', 'Première année RT'),
('GRP002', 'RT2', 'Deuxième année RT');

-- Insertion des utilisateurs (sans mot de passe)
INSERT INTO `users` (`id`, `name`, `email`, `role`) VALUES
('ADMIN001', 'Admin', 'admin@example.com', 'admin'),
('TOM001', 'Tom', 'tom@example.com', 'student');

-- Insertion des localisations
INSERT INTO `user_locations` (`user_id`, `name`, `latitude`, `longitude`, `type`) VALUES
('TOM001', 'Besançon', 47.2378, 6.0241, 'main'),
('TOM001', 'Paris', 48.8566, 2.3522, 'secondary');

-- Association des utilisateurs aux groupes
INSERT INTO `user_groups` (`user_id`, `group_id`) VALUES
('TOM001', 'GRP002'); 