<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

require_once '../config/database.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    $database = new Database();
    $conn = $database->getConnection();

    $jsonData = file_get_contents('php://input');
    $data = json_decode($jsonData, true);

    if (isset($data['action'])) {
        switch ($data['action']) {
            case 'get_user':
                if (!isset($data['user_email'])) {
                    throw new Exception("Email utilisateur non spécifié");
                }

                // Récupérer les informations de l'utilisateur
                $stmt = $conn->prepare("SELECT id, name, email, role FROM users WHERE email = :email");
                $stmt->execute([':email' => $data['user_email']]);
                $user = $stmt->fetch(PDO::FETCH_ASSOC);

                if (!$user) {
                    throw new Exception("Utilisateur non trouvé");
                }

                echo json_encode([
                    'success' => true,
                    'user' => $user
                ]);
                break;

            default:
                throw new Exception("Action non reconnue");
        }
    } else {
        throw new Exception("Action non spécifiée");
    }
} catch (Exception $e) {
    error_log("Erreur API user: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
} 