-- Création de la base de données
CREATE DATABASE IF NOT EXISTS nvincen3_05;
USE nvincen3_05;

-- Table des utilisateurs
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(20) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('student', 'admin') NOT NULL
);

-- Table des résidences
CREATE TABLE IF NOT EXISTS residences (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(20) NOT NULL,
    type ENUM('main', 'secondary', 'other') NOT NULL,
    city_name VARCHAR(100) NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE KEY unique_residence_type (user_id, type)
);

-- Suppression des données existantes
DELETE FROM residences;
DELETE FROM users;

-- Insertion de l'utilisateur Tom
INSERT INTO users (id, name, email, password, role) VALUES
('TOM001', 'Tom', 'tom@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'student'); 