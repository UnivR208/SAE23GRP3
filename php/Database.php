<?php

class Database {
    private $host = "localhost";
    private $db_name = "sae23";
    private $username = "root";
    private $password = "";
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
                `id` INT PRIMARY KEY AUTO_INCREMENT,
                `name` VARCHAR(100) NOT NULL UNIQUE,
                `description` TEXT
            )");

            // Table des utilisateurs
            $this->conn->exec("CREATE TABLE IF NOT EXISTS `users` (
                `id` INT PRIMARY KEY AUTO_INCREMENT,
                `name` VARCHAR(100) NOT NULL,
                `email` VARCHAR(100) NOT NULL UNIQUE,
                `password` VARCHAR(255) NOT NULL,
                `role` ENUM('admin', 'user') NOT NULL DEFAULT 'user'
            )");

            // Table des résidences
            $this->conn->exec("CREATE TABLE IF NOT EXISTS `residences` (
                `id` INT PRIMARY KEY AUTO_INCREMENT,
                `user_id` INT NOT NULL,
                `name` VARCHAR(100) NOT NULL,
                `location_lat` DECIMAL(10, 8) NOT NULL,
                `location_lng` DECIMAL(11, 8) NOT NULL,
                `type` ENUM('main', 'secondary', 'other') NOT NULL,
                `start_date` DATE NOT NULL,
                `end_date` DATE NOT NULL,
                FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
            )");

        } catch(PDOException $e) {
            error_log("Erreur lors de la création des tables : " . $e->getMessage());
            throw new Exception("Erreur lors de la création des tables");
        }
    }
} 