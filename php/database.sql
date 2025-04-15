-- Création de la base de données
CREATE DATABASE IF NOT EXISTS climatometre;
USE climatometre;

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

-- Insertion des données de test
INSERT INTO users (id, name, email, password, role) VALUES
('BUT1RT001', 'Jean Dupont', 'jean.dupont@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'student'),
('BUT1RT002', 'Marie Martin', 'marie.martin@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'student'),
('BUT1RT003', 'Pierre Durand', 'pierre.durand@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'student'),
('ADMIN001', 'Admin Principal', 'admin@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin');

INSERT INTO residences (user_id, type, city_name, latitude, longitude, start_date, end_date) VALUES
('BUT1RT001', 'main', 'Paris', 48.8566, 2.3522, '2024-01-01', '2024-12-31'),
('BUT1RT001', 'secondary', 'Marseille', 43.2965, 5.3698, '2024-07-01', '2024-08-31'),
('BUT1RT002', 'main', 'Lyon', 45.7640, 4.8357, '2024-01-01', '2024-12-31'),
('BUT1RT002', 'secondary', 'Toulouse', 43.6047, 1.4442, '2024-07-01', '2024-08-31'),
('BUT1RT003', 'main', 'Nice', 43.7000, 7.2500, '2024-01-01', '2024-12-31'),
('BUT1RT003', 'secondary', 'Rennes', 48.1173, -1.6778, '2024-07-01', '2024-08-31'); 