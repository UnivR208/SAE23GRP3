<?php
// En-têtes CORS
header("Access-Control-Allow-Origin: https://rt-projet.pu-pm.univ-fcomte.fr");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json");

// Gérer les requêtes OPTIONS pour CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once 'config/database.php';

try {
    $database = new Database();
    $conn = $database->getConnection();

    // Récupération des données JSON
    $jsonData = file_get_contents('php://input');
    $data = json_decode($jsonData, true);

    // Si c'est une action d'ajout de résidence
    if (isset($data['action']) && $data['action'] === 'add_residence') {
        try {
            // Récupérer l'ID de l'utilisateur à partir de son email
            $stmtGetUser = $conn->prepare("SELECT id FROM users WHERE email = :email");
            $stmtGetUser->execute([':email' => $data['user_email']]);
            $user = $stmtGetUser->fetch(PDO::FETCH_ASSOC);

            if (!$user) {
                throw new Exception("Utilisateur non trouvé");
            }

            // Traitement du type de résidence
            $residenceType = $data['residence']['type'];
            $residenceName = $data['residence']['name'];
            
            // Pour le type "other", préfixer le nom avec "other_" et utiliser le type "secondary"
            if ($residenceType === 'other') {
                $residenceName = "other_ " . $residenceName;
                $residenceType = 'secondary'; // La base de données n'accepte que 'main' et 'secondary'
            }

            // Préparer la requête d'insertion de résidence
            $stmtResidence = $conn->prepare("INSERT INTO RESIDENCE (user_id, name, location_lat, location_lng, type, start_date, end_date)
                                           VALUES (:user_id, :name, :location_lat, :location_lng, :type, :start_date, :end_date)
                                           ON DUPLICATE KEY UPDATE
                                           name = VALUES(name),
                                           location_lat = VALUES(location_lat),
                                           location_lng = VALUES(location_lng),
                                           start_date = VALUES(start_date),
                                           end_date = VALUES(end_date)");

            // Exécuter la requête
            $stmtResidence->execute([
                ':user_id' => $user['id'],
                ':name' => $residenceName,
                ':location_lat' => $data['residence']['location_lat'],
                ':location_lng' => $data['residence']['location_lng'],
                ':type' => $residenceType,
                ':start_date' => $data['residence']['start_date'],
                ':end_date' => $data['residence']['end_date']
            ]);

            echo json_encode(['success' => true, 'message' => 'Résidence ajoutée avec succès']);
            exit();
        } catch (Exception $e) {
            error_log("Erreur lors de l'ajout de la résidence: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Erreur: ' . $e->getMessage()]);
            exit();
        }
    }

    // Si aucune donnée n'est envoyée, lire depuis le fichier JSON
    if (!$data) {
        $jsonFile = __DIR__ . '/../data/students.json';
        if (!file_exists($jsonFile)) {
            throw new Exception("Fichier students.json non trouvé");
        }
        $jsonData = file_get_contents($jsonFile);
        $data = json_decode($jsonData, true);
    }

    // Préparation des requêtes
    $stmtGroup = $conn->prepare("INSERT INTO `groups` (name, description) 
                                VALUES (:name, :description)
                                ON DUPLICATE KEY UPDATE 
                                description = VALUES(description)");

    $stmtUser = $conn->prepare("INSERT INTO users (name, email, password, role) 
                               VALUES (:name, :email, :password, :role)
                               ON DUPLICATE KEY UPDATE 
                               name = VALUES(name),
                               password = VALUES(password),
                               role = VALUES(role)");

    $stmtResidence = $conn->prepare("INSERT INTO RESIDENCE (user_id, name, location_lat, location_lng, type, start_date, end_date)
                                    VALUES (:user_id, :name, :location_lat, :location_lng, :type, :start_date, :end_date)
                                    ON DUPLICATE KEY UPDATE
                                    name = VALUES(name),
                                    location_lat = VALUES(location_lat),
                                    location_lng = VALUES(location_lng),
                                    start_date = VALUES(start_date),
                                    end_date = VALUES(end_date)");

    // Démarrer une transaction
    $conn->beginTransaction();

    // Synchroniser les groupes
    if (isset($data['groups'])) {
        foreach ($data['groups'] as $group) {
            $stmtGroup->execute([
                ':name' => $group['name'],
                ':description' => $group['description']
            ]);
        }
    }

    // Fusionner les étudiants et les admins
    $allUsers = array_merge(
        isset($data['students']) ? $data['students'] : [],
        isset($data['admins']) ? $data['admins'] : []
    );

    foreach ($allUsers as $user) {
        // Insertion/Mise à jour de l'utilisateur
        $stmtUser->execute([
            ':name' => $user['name'],
            ':email' => $user['email'],
            ':password' => isset($user['password']) ? $user['password'] : 'default',
            ':role' => isset($user['role']) ? $user['role'] : 'user'
        ]);

        $userId = $conn->lastInsertId();

        // Traitement de la résidence principale
        if (isset($user['main']) && isset($user['main']['location'])) {
            $stmtResidence->execute([
                ':user_id' => $userId,
                ':name' => $user['main']['location']['name'],
                ':location_lat' => $user['main']['location']['lat'],
                ':location_lng' => $user['main']['location']['lon'],
                ':type' => 'main',
                ':start_date' => isset($user['main']['startDate']) ? $user['main']['startDate'] : date('Y-m-d'),
                ':end_date' => isset($user['main']['endDate']) ? $user['main']['endDate'] : date('Y-m-d', strtotime('+1 year'))
            ]);
        }

        // Traitement de la résidence secondaire
        if (isset($user['secondary']) && isset($user['secondary']['location'])) {
            $stmtResidence->execute([
                ':user_id' => $userId,
                ':name' => $user['secondary']['location']['name'],
                ':location_lat' => $user['secondary']['location']['lat'],
                ':location_lng' => $user['secondary']['location']['lon'],
                ':type' => 'secondary',
                ':start_date' => isset($user['secondary']['startDate']) ? $user['secondary']['startDate'] : date('Y-m-d'),
                ':end_date' => isset($user['secondary']['endDate']) ? $user['secondary']['endDate'] : date('Y-m-d', strtotime('+1 year'))
            ]);
        }
        
        // Traitement de la résidence "other"
        if (isset($user['other']) && isset($user['other']['location'])) {
            $stmtResidence->execute([
                ':user_id' => $userId,
                ':name' => $user['other']['location']['name'],
                ':location_lat' => $user['other']['location']['lat'],
                ':location_lng' => $user['other']['location']['lon'],
                ':type' => 'other',
                ':start_date' => isset($user['other']['startDate']) ? $user['other']['startDate'] : date('Y-m-d'),
                ':end_date' => isset($user['other']['endDate']) ? $user['other']['endDate'] : date('Y-m-d', strtotime('+1 year'))
            ]);
        }
    }

    // Valider la transaction
    $conn->commit();
    echo json_encode(['success' => true, 'message' => 'Synchronisation réussie']);

} catch (Exception $e) {
    if (isset($conn)) {
        $conn->rollBack();
    }
    error_log("Erreur de synchronisation: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur: ' . $e->getMessage()]);
}
?> 