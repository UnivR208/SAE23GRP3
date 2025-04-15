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

    $stmtDeleteResidence = $conn->prepare("DELETE FROM residences WHERE user_id = :user_id AND type = :type");

    // Si l'action est delete, supprimer la résidence
    if (isset($data['action']) && $data['action'] === 'delete') {
        try {
            // Supprimer de la base de données
            $stmtDeleteResidence->execute([
                ':user_id' => $data['user_id'],
                ':type' => $data['type']
            ]);
            
            // Vérifier si la suppression a réussi
            if ($stmtDeleteResidence->rowCount() > 0) {
                // Mettre à jour le fichier JSON
                $jsonFile = __DIR__ . '/../data/students.json';
                
                // Vérifier si le fichier est accessible en écriture
                if (!is_writable($jsonFile)) {
                    error_log("Le fichier $jsonFile n'est pas accessible en écriture");
                    // Continuer quand même car la suppression en BDD a réussi
                } else {
                    try {
                        $jsonData = file_get_contents($jsonFile);
                        $students = json_decode($jsonData, true);
                        
                        foreach ($students['students'] as &$student) {
                            if ($student['id'] === $data['user_id']) {
                                unset($student[$data['type']]);
                                break;
                            }
                        }
                        
                        if (file_put_contents($jsonFile, json_encode($students, JSON_PRETTY_PRINT)) === false) {
                            error_log("Impossible d'écrire dans le fichier $jsonFile");
                        }
                    } catch (Exception $e) {
                        error_log("Erreur lors de la mise à jour du JSON: " . $e->getMessage());
                    }
                }
                
                echo json_encode(['success' => true, 'message' => 'Résidence supprimée avec succès']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Aucune résidence trouvée à supprimer']);
            }
        } catch (PDOException $e) {
            error_log("Erreur PDO: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Erreur lors de la suppression: ' . $e->getMessage()]);
        }
        exit();
    }

    // Si l'action est add, ajouter la résidence
    if (isset($data['action']) && $data['action'] === 'add') {
        try {
            // Vérifier si la résidence existe déjà
            $checkStmt = $conn->prepare("SELECT id FROM residences WHERE user_id = :user_id AND type = :type");
            $checkStmt->execute([
                ':user_id' => $data['user_id'],
                ':type' => $data['type']
            ]);
            
            if ($checkStmt->rowCount() > 0) {
                // Mettre à jour la résidence existante
                $stmtResidence = $conn->prepare("UPDATE residences SET 
                    city_name = :city_name,
                    latitude = :latitude,
                    longitude = :longitude,
                    start_date = :start_date,
                    end_date = :end_date
                    WHERE user_id = :user_id AND type = :type");
            } else {
                // Insérer une nouvelle résidence
                $stmtResidence = $conn->prepare("INSERT INTO residences 
                    (user_id, type, city_name, latitude, longitude, start_date, end_date)
                    VALUES (:user_id, :type, :city_name, :latitude, :longitude, :start_date, :end_date)");
            }

            $stmtResidence->execute([
                ':user_id' => $data['user_id'],
                ':type' => $data['type'],
                ':city_name' => $data['city_name'],
                ':latitude' => $data['latitude'],
                ':longitude' => $data['longitude'],
                ':start_date' => $data['start_date'],
                ':end_date' => $data['end_date']
            ]);
            
            // Mettre à jour le fichier JSON
            $jsonFile = __DIR__ . '/../data/students.json';
            if (is_writable($jsonFile)) {
                $jsonData = file_get_contents($jsonFile);
                $students = json_decode($jsonData, true);
                
                foreach ($students['students'] as &$student) {
                    if ($student['id'] === $data['user_id']) {
                        $student[$data['type']] = [
                            'location' => [
                                'name' => $data['city_name'],
                                'lat' => $data['latitude'],
                                'lon' => $data['longitude']
                            ],
                            'startDate' => $data['start_date'],
                            'endDate' => $data['end_date']
                        ];
                        break;
                    }
                }
                
                file_put_contents($jsonFile, json_encode($students, JSON_PRETTY_PRINT));
            }
            
            echo json_encode(['success' => true, 'message' => 'Résidence ajoutée avec succès']);
        } catch (PDOException $e) {
            error_log("Erreur PDO: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Erreur lors de l\'ajout: ' . $e->getMessage()]);
        }
        exit();
    }

    // Fonction pour synchroniser la base de données avec le JSON
    function syncDatabaseWithJSON($conn) {
        try {
            // Lire le fichier JSON
            $jsonFile = __DIR__ . '/../data/students.json';
            $jsonData = file_get_contents($jsonFile);
            $data = json_decode($jsonData, true);

            if (!$data) {
                throw new Exception("Impossible de lire le fichier JSON");
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

                // Insertion/Mise à jour des résidences
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

                if (isset($student['other'])) {
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

            return true;
        } catch (Exception $e) {
            error_log("Erreur de synchronisation: " . $e->getMessage());
            return false;
        }
    }

    // Si l'action est sync, synchroniser la base de données
    if (isset($data['action']) && $data['action'] === 'sync') {
        try {
            if (syncDatabaseWithJSON($conn)) {
                echo json_encode(['success' => true, 'message' => 'Synchronisation réussie']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Erreur lors de la synchronisation']);
            }
        } catch (Exception $e) {
            echo json_encode(['success' => false, 'message' => 'Erreur: ' . $e->getMessage()]);
        }
        exit();
    }

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