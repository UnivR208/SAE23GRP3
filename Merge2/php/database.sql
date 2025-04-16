-- Création de la base de données
CREATE DATABASE IF NOT EXISTS tom;
USE tom;

-- Table des groupes
CREATE TABLE IF NOT EXISTS groups (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des utilisateurs
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('student', 'admin') NOT NULL DEFAULT 'student',
    group_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    FOREIGN KEY (group_id) REFERENCES groups(id)
);

-- Table des résidences
CREATE TABLE IF NOT EXISTS residences (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    type ENUM('main', 'secondary', 'other') NOT NULL,
    city_name VARCHAR(100) NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Table des données météorologiques des groupes
CREATE TABLE IF NOT EXISTS group_weather (
    id INT AUTO_INCREMENT PRIMARY KEY,
    group_id INT NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    weather_data JSON,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE
);

-- Table des logs
CREATE TABLE IF NOT EXISTS logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(50),
    action VARCHAR(50) NOT NULL,
    details TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Suppression des données existantes (dans l'ordre pour respecter les contraintes de clé étrangère)
DELETE FROM residences;
DELETE FROM group_weather;
DELETE FROM users;
DELETE FROM groups;

-- Insertion des données initiales
INSERT INTO users (id, name, email, password, role) VALUES
('TOM001', 'Tom', 'tom@example.com', 'tom', 'student'),
('ADMIN001', 'Admin', 'admin@example.com', 'admin', 'admin');

-- Insertion des résidences
INSERT INTO residences (user_id, type, city_name, latitude, longitude, start_date, end_date) VALUES
('TOM001', 'main', 'Besançon', 47.2378, 6.0241, '2024-01-01', '2024-12-31'),
('TOM001', 'secondary', 'Paris', 48.8566, 2.3522, '2024-07-01', '2024-08-31'); 