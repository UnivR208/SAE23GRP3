<?php
// Headers CORS
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

// Répondre immédiatement aux requêtes OPTIONS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Connexion à la base de données
$servername = "localhost";
$username = "root";  // Utilisateur par défaut de phpMyAdmin
$password = "tom";      // Mot de passe par défaut de phpMyAdmin
$dbname = "tom";

try {
    $conn = new PDO("mysql:host=$servername;dbname=$dbname", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Récupération des données JSON
    $jsonData = file_get_contents('php://input');
    $data = json_decode($jsonData, true);

    // Si aucune donnée n'est envoyée, lire depuis le fichier JSON
    if (!$data) {
        $jsonData = file_get_contents(__DIR__ . '/../data/students.json');
        $data = json_decode($jsonData, true);
    }

    // Préparation des requêtes
    $stmtUser = $conn->prepare("INSERT INTO users (id, name, email, password, role) 
                               VALUES (:id, :name, :email, :password, :role)
                               ON DUPLICATE KEY UPDATE 
                               name = VALUES(name),
                               email = VALUES(email),
                               password = VALUES(password),
                               role = VALUES(role)");

    $stmtResidence = $conn->prepare("INSERT INTO residences (user_id, type, city_name, latitude, longitude, start_date, end_date)
                                    VALUES (:user_id, :type, :city_name, :latitude, :longitude, :start_date, :end_date)
                                    ON DUPLICATE KEY UPDATE
                                    city_name = VALUES(city_name),
                                    latitude = VALUES(latitude),
                                    longitude = VALUES(longitude),
                                    start_date = VALUES(start_date),
                                    end_date = VALUES(end_date)");

    // Suppression des données existantes
    $conn->exec("DELETE FROM residences");
    $conn->exec("DELETE FROM users");

    // Traitement des étudiants
    foreach ($data['students'] as $student) {
        // Insertion/Mise à jour de l'utilisateur
        $stmtUser->execute([
            ':id' => $student['id'],
            ':name' => $student['name'],
            ':email' => $student['email'],
            ':password' => $student['password'],
            ':role' => $student['role']
        ]);

        // Insertion/Mise à jour de la résidence principale
        if (isset($student['main'])) {
            $stmtResidence->execute([
                ':user_id' => $student['id'],
                ':type' => 'main',
                ':city_name' => $student['main']['location']['name'],
                ':latitude' => $student['main']['location']['lat'],
                ':longitude' => $student['main']['location']['lon'],
                ':start_date' => $student['main']['startDate'],
                ':end_date' => $student['main']['endDate']
            ]);
        }

        // Insertion/Mise à jour de la résidence secondaire
        if (isset($student['secondary'])) {
            $stmtResidence->execute([
                ':user_id' => $student['id'],
                ':type' => 'secondary',
                ':city_name' => $student['secondary']['location']['name'],
                ':latitude' => $student['secondary']['location']['lat'],
                ':longitude' => $student['secondary']['location']['lon'],
                ':start_date' => $student['secondary']['startDate'],
                ':end_date' => $student['secondary']['endDate']
            ]);
        }

        // Insertion/Mise à jour de la résidence "other"
        if (isset($student['other']) && isset($student['other']['startDate'])) {
            $stmtResidence->execute([
                ':user_id' => $student['id'],
                ':type' => 'other',
                ':city_name' => $student['other']['location']['name'],
                ':latitude' => $student['other']['location']['lat'],
                ':longitude' => $student['other']['location']['lon'],
                ':start_date' => $student['other']['startDate'],
                ':end_date' => $student['other']['endDate']
            ]);
        }
    }

    // Traitement des administrateurs
    foreach ($data['admins'] as $admin) {
        $stmtUser->execute([
            ':id' => $admin['id'],
            ':name' => $admin['name'],
            ':email' => $admin['email'],
            ':password' => $admin['password'],
            ':role' => 'admin'
        ]);
    }

    echo json_encode(['success' => true, 'message' => 'Synchronisation terminée avec succès!']);

} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur de synchronisation: ' . $e->getMessage()]);
}

$conn = null;
?> 