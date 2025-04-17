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
                `description` TEXT
            )");

            // Table des résidences
            $this->conn->exec("CREATE TABLE IF NOT EXISTS `residences` (
                `id` INT PRIMARY KEY AUTO_INCREMENT,
                `name` VARCHAR(100) NOT NULL,
                `address` VARCHAR(255) NOT NULL,
                `capacity` INT NOT NULL
            )");

            // Table des utilisateurs
            $this->conn->exec("CREATE TABLE IF NOT EXISTS `users` (
                `id` INT PRIMARY KEY AUTO_INCREMENT,
                `name` VARCHAR(100) NOT NULL,
                `email` VARCHAR(100) NOT NULL UNIQUE,
                `password` VARCHAR(255) NOT NULL,
                `role` ENUM('admin', 'student') NOT NULL DEFAULT 'student',
                `residence_id` INT,
                `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (`residence_id`) REFERENCES `residences`(`id`) ON DELETE SET NULL
            )");

            // Table de relation utilisateurs-groupes
            $this->conn->exec("CREATE TABLE IF NOT EXISTS `user_groups` (
                `user_id` INT NOT NULL,
                `group_id` VARCHAR(10) NOT NULL,
                PRIMARY KEY (`user_id`, `group_id`),
                FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
                FOREIGN KEY (`group_id`) REFERENCES `groups`(`id`) ON DELETE CASCADE
            )");

        } catch(PDOException $e) {
            error_log("Erreur lors de la création des tables : " . $e->getMessage());
            throw new Exception("Erreur lors de la création des tables");
        }
    }
} 