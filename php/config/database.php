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
    'user_groups' => "
        CREATE TABLE IF NOT EXISTS user_groups (
            user_id VARCHAR(255),
            group_id VARCHAR(10),
            PRIMARY KEY (user_id, group_id),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE
        )
    ",
    'RESIDENCE' => "
        CREATE TABLE IF NOT EXISTS RESIDENCE (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id VARCHAR(255),
            name VARCHAR(255) NOT NULL,
            location_lat DECIMAL(10,8),
            location_lng DECIMAL(11,8),
            type ENUM('main', 'secondary', 'other') NOT NULL,
            start_date DATE,
            end_date DATE,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            UNIQUE KEY unique_user_residence_type (user_id, type)
        )
    ",
    'user_locations' => "
        CREATE TABLE IF NOT EXISTS user_locations (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id VARCHAR(255),
            name VARCHAR(255),
            latitude DECIMAL(10,8),
            longitude DECIMAL(11,8),
            type ENUM('main', 'secondary') NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            UNIQUE KEY unique_user_location (user_id, type)
        )
    ",
    'weather_data' => "
        CREATE TABLE IF NOT EXISTS weather_data (
            id INT AUTO_INCREMENT PRIMARY KEY,
            location_id INT,
            temperature DECIMAL(5,2),
            humidity INT,
            wind_speed DECIMAL(5,2),
            description VARCHAR(255),
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (location_id) REFERENCES user_locations(id) ON DELETE CASCADE
        )
    ",
    'group_weather' => "
        CREATE TABLE IF NOT EXISTS group_weather (
            group_id VARCHAR(10),
            temperature_avg DECIMAL(5,2),
            humidity_avg INT,
            wind_speed_avg DECIMAL(5,2),
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

            // Créer les tables si elles n'existent pas
            global $required_tables;
            foreach ($required_tables as $table_name => $create_query) {
                $this->conn->exec($create_query);
            }
        } catch(PDOException $exception) {
            echo "Erreur de connexion: " . $exception->getMessage();
        }

        return $this->conn;
    }
}
?> 