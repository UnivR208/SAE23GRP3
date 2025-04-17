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

require_once 'Database.php';

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

    // Synchroniser les résidences
    if (isset($data['residences'])) {
        error_log("Synchronisation des résidences...");
        foreach ($data['residences'] as $residence) {
            $stmt = $pdo->prepare("INSERT INTO residences (id, name, address, capacity) 
                                 VALUES (:id, :name, :address, :capacity)
                                 ON DUPLICATE KEY UPDATE 
                                 name = :name, address = :address, capacity = :capacity");
            
            $stmt->execute([
                ':id' => $residence['id'],
                ':name' => $residence['name'],
                ':address' => $residence['address'],
                ':capacity' => $residence['capacity']
            ]);
        }
    }

    // Synchroniser les utilisateurs
    if (isset($data['users'])) {
        error_log("Synchronisation des utilisateurs...");
        foreach ($data['users'] as $user) {
            // Valider les données utilisateur
            if (!filter_var($user['email'], FILTER_VALIDATE_EMAIL)) {
                throw new Exception("Email invalide pour l'utilisateur : " . $user['name']);
            }
            
            if (empty($user['name']) || strlen($user['name']) > 100) {
                throw new Exception("Nom invalide pour l'utilisateur : " . $user['email']);
            }

            // Vérifier si l'utilisateur existe déjà
            $stmt = $pdo->prepare("SELECT id, password FROM users WHERE email = :email");
            $stmt->execute([':email' => $user['email']]);
            $existingUser = $stmt->fetch();

            // Gérer le mot de passe
            $password = $existingUser ? $existingUser['password'] : password_hash($user['password'], PASSWORD_DEFAULT);
            if (!$existingUser && strlen($user['password']) < 8) {
                throw new Exception("Le mot de passe doit contenir au moins 8 caractères pour : " . $user['email']);
            }

            if ($existingUser) {
                // Mettre à jour l'utilisateur existant
                $stmt = $pdo->prepare("UPDATE users SET 
                    name = :name,
                    role = :role,
                    residence_id = :residence_id,
                    updated_at = NOW()
                    WHERE email = :email");
            } else {
                // Créer un nouvel utilisateur
                $stmt = $pdo->prepare("INSERT INTO users (name, email, password, role, residence_id, created_at, updated_at) 
                    VALUES (:name, :email, :password, :role, :residence_id, NOW(), NOW())");
                $password = password_hash($user['password'], PASSWORD_DEFAULT);
            }

            $stmt->execute([
                ':name' => $user['name'],
                ':email' => $user['email'],
                ':password' => $password,
                ':role' => $user['role'],
                ':residence_id' => $user['residence_id'] ?? null
            ]);

            // Gérer les relations utilisateur-groupe
            if (isset($user['groups']) && is_array($user['groups'])) {
                // Supprimer les anciennes relations
                $stmt = $pdo->prepare("DELETE FROM user_groups WHERE user_id = (SELECT id FROM users WHERE email = :email)");
                $stmt->execute([':email' => $user['email']]);

                // Ajouter les nouvelles relations
                foreach ($user['groups'] as $groupId) {
                    $stmt = $pdo->prepare("INSERT INTO user_groups (user_id, group_id) 
                        VALUES ((SELECT id FROM users WHERE email = :email), :group_id)");
                    $stmt->execute([
                        ':email' => $user['email'],
                        ':group_id' => $groupId
                    ]);
                }
            }
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