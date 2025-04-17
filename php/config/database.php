<?php
// Configuration de la base de données
$servername = "mysql_serv";  // Serveur MySQL distant
$username = "tdavid";        // Votre nom d'utilisateur
$password = "ev6&il}[sv";    // Votre mot de passe
$dbname = "tdavid_05";       // Votre base de données

// Vérification de l'existence des tables nécessaires
$required_tables = [
    'users' => "
        CREATE TABLE IF NOT EXISTS users (
            id VARCHAR(255) PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            role ENUM('student', 'admin') DEFAULT 'student',
            group_name VARCHAR(255)
        )
    ",
    'groups' => "
        CREATE TABLE IF NOT EXISTS groups (
            id VARCHAR(10) PRIMARY KEY,
            name VARCHAR(255) NOT NULL UNIQUE,
            description TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ",
    'group_weather' => "
        CREATE TABLE IF NOT EXISTS group_weather (
            group_id VARCHAR(10),
            latitude DECIMAL(10,8),
            longitude DECIMAL(11,8),
            weather_data JSON,
            last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (group_id),
            FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE
        )
    "
];

// Les tables seront créées lors de la première connexion si elles n'existent pas

class Database {
    private $servername = "mysql_serv";
    private $username = "tdavid";
    private $password = "ev6&il}[sv";
    private $dbname = "tdavid_05";
    public $conn;

    public function getConnection() {
        $this->conn = null;

        try {
            $this->conn = new PDO(
                "mysql:host=" . $this->servername . ";dbname=" . $this->dbname,
                $this->username,
                $this->password
            );
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $this->conn->exec("set names utf8");
        } catch(PDOException $exception) {
            echo "Erreur de connexion: " . $exception->getMessage();
        }

        return $this->conn;
    }
}
?> 