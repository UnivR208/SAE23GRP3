-- Création de la base de données si elle n'existe pas
CREATE DATABASE IF NOT EXISTS `tdavid_05` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `tdavid_05`;

-- Suppression des tables existantes dans le bon ordre
DROP TABLE IF EXISTS `user_groups`;
DROP TABLE IF EXISTS `users`;
DROP TABLE IF EXISTS `residences`;
DROP TABLE IF EXISTS `groups`;

-- Table des groupes
CREATE TABLE `groups` (
    `id` VARCHAR(10) PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL UNIQUE,
    `description` TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table des résidences
CREATE TABLE `residences` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `address` VARCHAR(255) NOT NULL,
    `capacity` INT NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table des utilisateurs
CREATE TABLE `users` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `email` VARCHAR(100) NOT NULL UNIQUE,
    `password` VARCHAR(255) NOT NULL,
    `role` ENUM('admin', 'student') NOT NULL DEFAULT 'student',
    `residence_id` INT,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`residence_id`) REFERENCES `residences`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table de relation utilisateurs-groupes
CREATE TABLE `user_groups` (
    `user_id` INT NOT NULL,
    `group_id` VARCHAR(10) NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`user_id`, `group_id`),
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`group_id`) REFERENCES `groups`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Création des index pour optimiser les performances
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_residences_name ON residences(name);
CREATE INDEX idx_groups_name ON groups(name);

-- Insertion d'un utilisateur admin par défaut (mot de passe: admin123)
INSERT INTO `users` (`name`, `email`, `password`, `role`) VALUES 
('Admin', 'admin@example.com', '$2y$10$8tdsR1q8qW9.bf0u.yBkUe.2ZBdNf6VuYFDxqWGy4uVL2PqhO4d9a', 'admin'); 