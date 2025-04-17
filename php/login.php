<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once 'config/database.php';

try {
    $database = new Database();
    $conn = $database->getConnection();

    $jsonData = file_get_contents('php://input');
    $data = json_decode($jsonData, true);

    // Log des données reçues pour le débogage
    error_log("Données reçues : " . print_r($data, true));

    if (isset($data['action'])) {
        switch ($data['action']) {
            case 'login':
                if (!isset($data['email']) || !isset($data['password'])) {
                    throw new Exception("Email et mot de passe requis");
                }

                $stmt = $conn->prepare("SELECT id, name, email, password, role FROM users WHERE email = :email");
                $stmt->execute(['email' => $data['email']]);
                $user = $stmt->fetch(PDO::FETCH_ASSOC);

                // Log des informations utilisateur trouvées
                error_log("Utilisateur trouvé : " . print_r($user, true));

                if (!$user) {
                    throw new Exception("Utilisateur non trouvé");
                }

                if ($data['password'] !== $user['password']) {
                    throw new Exception("Mot de passe incorrect");
                }

                // Vérifier si l'utilisateur est un admin
                $isAdmin = strtolower($user['role']) === 'admin';
                
                $response = [
                    'success' => true,
                    'user' => [
                        'id' => $user['id'],
                        'name' => $user['name'],
                        'email' => $user['email'],
                        'role' => $isAdmin ? 'admin' : 'user'
                    ]
                ];

                // Log de la réponse
                error_log("Réponse envoyée : " . print_r($response, true));

                echo json_encode($response);
                break;

            case 'logout':
                echo json_encode(['success' => true]);
                break;

            default:
                throw new Exception("Action non reconnue");
        }
    } else {
        throw new Exception("Action non spécifiée");
    }
} catch(Exception $e) {
    $error = ['success' => false, 'message' => $e->getMessage()];
    error_log("Erreur : " . print_r($error, true));
    echo json_encode($error);
}
?> 