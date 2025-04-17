<?php

class Database {
    private $host = "mysql_serv";
    private $db_name = "tdavid_05";
    private $username = "tdavid";
    private $password = "ev6&il}[sv";
    private $conn;

    public function getConnection() {
        $this->conn = null;

        try {
            $this->conn = new PDO(
                "mysql:host=" . $this->host . ";dbname=" . $this->db_name,
                $this->username,
                $this->password
            );
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $this->conn->exec("SET NAMES utf8");
            
            // Créer les tables si elles n'existent pas
            $this->createTables();
            
            return $this->conn;
        } catch(PDOException $e) {
            error_log("Erreur de connexion : " . $e->getMessage());
            throw new Exception("Erreur de connexion à la base de données");
        }
    }

    private function createTables() {
        try {
            // Table des groupes
            $this->conn->exec("CREATE TABLE IF NOT EXISTS `groups` (
                `id` VARCHAR(10) PRIMARY KEY,
                `name` VARCHAR(100) NOT NULL UNIQUE,
                `description` TEXT,
                `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )");

            // Table des utilisateurs
            $this->conn->exec("CREATE TABLE IF NOT EXISTS `users` (
                `id` VARCHAR(10) PRIMARY KEY,
                `name` VARCHAR(100) NOT NULL,
                `email` VARCHAR(100) NOT NULL UNIQUE,
                `role` ENUM('admin', 'student') NOT NULL DEFAULT 'student',
                `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )");

            // Table des localisations des utilisateurs
            $this->conn->exec("CREATE TABLE IF NOT EXISTS `user_locations` (
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
            )");

            // Table de relation utilisateurs-groupes
            $this->conn->exec("CREATE TABLE IF NOT EXISTS `user_groups` (
                `user_id` VARCHAR(10) NOT NULL,
                `group_id` VARCHAR(10) NOT NULL,
                `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (`user_id`, `group_id`),
                FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
                FOREIGN KEY (`group_id`) REFERENCES `groups`(`id`) ON DELETE CASCADE
            )");

            // Table de la météo moyenne des groupes
            $this->conn->exec("CREATE TABLE IF NOT EXISTS `group_weather` (
                `id` INT PRIMARY KEY AUTO_INCREMENT,
                `group_id` VARCHAR(10) NOT NULL,
                `temperature_avg` DECIMAL(5,2),
                `humidity_avg` DECIMAL(5,2),
                `wind_speed_avg` DECIMAL(5,2),
                `timestamp` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (`group_id`) REFERENCES `groups`(`id`) ON DELETE CASCADE,
                INDEX `idx_group_weather_timestamp` (`timestamp`)
            )");

        } catch(PDOException $e) {
            error_log("Erreur lors de la création des tables : " . $e->getMessage());
            throw new Exception("Erreur lors de la création des tables");
        }
    }
} 