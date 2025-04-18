<?php
// Autoriser les requêtes CORS
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

// Gérer les requêtes OPTIONS (pre-flight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once 'config/database.php';

try {
    $db = new Database();
    $pdo = $db->getConnection();
    
    error_log("Début de la synchronisation");
    
    // Si des données sont envoyées via POST
    $data = null;
    if ($_SERVER['REQUEST_METHOD'] === 'POST' && !empty(file_get_contents('php://input'))) {
        $data = json_decode(file_get_contents('php://input'), true);
        error_log("Données reçues : " . print_r($data, true));
    } else {
        // Sinon, lire le fichier JSON
        $jsonFile = '../data/students.json';
        if (!file_exists($jsonFile)) {
            throw new Exception("Fichier de données introuvable");
        }
        $data = json_decode(file_get_contents($jsonFile), true);
        error_log("Données lues depuis le fichier : " . print_r($data, true));
    }

    if ($data === null) {
        throw new Exception("Données invalides");
    }

    // Démarrer une transaction
    $pdo->beginTransaction();

    // Synchroniser les groupes
    if (isset($data['groups'])) {
        error_log("Synchronisation des groupes...");
        foreach ($data['groups'] as $group) {
            $stmt = $pdo->prepare("INSERT INTO groups (id, name, description) 
                                 VALUES (:id, :name, :description)
                                 ON DUPLICATE KEY UPDATE 
                                 name = :name, description = :description");
            
            $stmt->execute([
                ':id' => $group['id'],
                ':name' => $group['name'],
                ':description' => $group['description']
            ]);
        }
    }

    // Synchroniser les utilisateurs (étudiants et admins)
    $allUsers = [];
    if (isset($data['students'])) {
        $allUsers = array_merge($allUsers, $data['students']);
    }
    if (isset($data['admins'])) {
        $allUsers = array_merge($allUsers, $data['admins']);
    }

    foreach ($allUsers as $user) {
        // Vérifier l'email
        if (!filter_var($user['email'], FILTER_VALIDATE_EMAIL)) {
            throw new Exception("Email invalide pour l'utilisateur : " . $user['name']);
        }

        // Insérer ou mettre à jour l'utilisateur
        $stmt = $pdo->prepare("INSERT INTO users (id, name, email, role) 
                             VALUES (:id, :name, :email, :role)
                             ON DUPLICATE KEY UPDATE 
                             name = :name, role = :role");
        
        $stmt->execute([
            ':id' => $user['id'],
            ':name' => $user['name'],
            ':email' => $user['email'],
            ':role' => $user['role'] === 'admin' ? 'admin' : 'student'
        ]);

        // Gérer les relations utilisateur-groupe si spécifié
        if (isset($user['group_id'])) {
            $stmt = $pdo->prepare("INSERT INTO user_groups (user_id, group_id) 
                                 VALUES (:user_id, :group_id)
                                 ON DUPLICATE KEY UPDATE group_id = :group_id");
            
            $stmt->execute([
                ':user_id' => $user['id'],
                ':group_id' => $user['group_id']
            ]);
        }

        // Synchroniser la résidence principale
        if (isset($user['main']) && isset($user['main']['location'])) {
            $stmt = $pdo->prepare("INSERT INTO RESIDENCE (user_id, name, location_lat, location_lng, type) 
                                 VALUES (:user_id, :name, :lat, :lng, 'main')
                                 ON DUPLICATE KEY UPDATE 
                                 name = :name, location_lat = :lat, location_lng = :lng");
            
            $stmt->execute([
                ':user_id' => $user['id'],
                ':name' => $user['main']['location']['name'],
                ':lat' => $user['main']['location']['lat'],
                ':lng' => $user['main']['location']['lon']
            ]);
        }

        // Synchroniser la résidence secondaire
        if (isset($user['secondary']) && isset($user['secondary']['location'])) {
            $stmt = $pdo->prepare("INSERT INTO RESIDENCE (user_id, name, location_lat, location_lng, type) 
                                 VALUES (:user_id, :name, :lat, :lng, 'secondary')
                                 ON DUPLICATE KEY UPDATE 
                                 name = :name, location_lat = :lat, location_lng = :lng");
            
            $stmt->execute([
                ':user_id' => $user['id'],
                ':name' => $user['secondary']['location']['name'],
                ':lat' => $user['secondary']['location']['lat'],
                ':lng' => $user['secondary']['location']['lon']
            ]);
        }
    }

    // Valider la transaction
    $pdo->commit();
    error_log("Synchronisation terminée avec succès");
    
    echo json_encode([
        'success' => true,
        'message' => 'Synchronisation réussie'
    ]);

} catch (Exception $e) {
    error_log("Erreur de synchronisation : " . $e->getMessage());
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    echo json_encode([
        'success' => false,
        'message' => 'Erreur de synchronisation : ' . $e->getMessage()
    ]);
}
?> 