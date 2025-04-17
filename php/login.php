<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once 'Database.php';

try {
    $database = new Database();
    $db = $database->getConnection();

    // Récupérer les données POST
    $data = json_decode(file_get_contents("php://input"));

    if (!isset($data->email) || empty($data->email)) {
        throw new Exception('Email requis');
    }

    // Vérifier si l'utilisateur existe
    $stmt = $db->prepare("SELECT id, name, email, role FROM users WHERE email = :email");
    $stmt->execute([':email' => $data->email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($user) {
        // Récupérer les localisations de l'utilisateur
        $stmt = $db->prepare("SELECT type, name, latitude, longitude FROM user_locations WHERE user_id = :user_id");
        $stmt->execute([':user_id' => $user['id']]);
        $locations = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Récupérer les groupes de l'utilisateur
        $stmt = $db->prepare("
            SELECT g.id, g.name, g.description 
            FROM groups g 
            JOIN user_groups ug ON g.id = ug.group_id 
            WHERE ug.user_id = :user_id
        ");
        $stmt->execute([':user_id' => $user['id']]);
        $groups = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Préparer la réponse
        $response = [
            'success' => true,
            'user' => [
                'id' => $user['id'],
                'name' => $user['name'],
                'email' => $user['email'],
                'role' => $user['role'],
                'locations' => $locations,
                'groups' => $groups
            ]
        ];
    } else {
        throw new Exception('Utilisateur non trouvé');
    }

    echo json_encode($response);

} catch(Exception $e) {
    http_response_code(401);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?> 