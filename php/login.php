<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$servername = "localhost";
$username = "root";
$password = "tom";
$dbname = "tom";

try {
    $conn = new PDO("mysql:host=$servername;dbname=$dbname", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $jsonData = file_get_contents('php://input');
    $data = json_decode($jsonData, true);

    if (isset($data['action'])) {
        switch ($data['action']) {
            case 'login':
                if (!isset($data['email']) || !isset($data['password'])) {
                    throw new Exception("Email et mot de passe requis");
                }

                $stmt = $conn->prepare("SELECT id, name, email, password, role FROM users WHERE email = :email");
                $stmt->execute(['email' => $data['email']]);
                $user = $stmt->fetch(PDO::FETCH_ASSOC);

                if (!$user || $data['password'] !== $user['password']) {
                    throw new Exception("Email ou mot de passe incorrect");
                }

                echo json_encode(['success' => true, 'user' => [
                    'id' => $user['id'],
                    'name' => $user['name'],
                    'email' => $user['email'],
                    'role' => $user['role']
                ]]);
                break;

            case 'logout':
                echo json_encode(['success' => true]);
                break;
        }
    }
} catch(Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?> 