<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Répondre immédiatement aux requêtes OPTIONS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Connexion à la base de données
$servername = "mysql_serv";
$username = "tdavid";
$password = "ev6&il}[sv";
$dbname = "tdavid_05";

try {
    $conn = new PDO("mysql:host=$servername;dbname=$dbname", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Récupérer les données JSON
    $jsonData = file_get_contents('php://input');
    $data = json_decode($jsonData, true);

    // Fonction pour calculer la position moyenne d'un groupe
    function calculateGroupAveragePosition($conn, $group_id) {
        $stmt = $conn->prepare("
            SELECT AVG(r.latitude) as avg_lat, AVG(r.longitude) as avg_lon
            FROM residences r
            JOIN users u ON r.user_id = u.id
            WHERE u.group_id = :group_id
        ");
        $stmt->execute(['group_id' => $group_id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    // Fonction pour mettre à jour la météo d'un groupe
    function updateGroupWeather($conn, $group_id, $latitude, $longitude) {
        // Ici, vous devrez implémenter l'appel à votre API météo
        // Pour l'exemple, nous utilisons des données factices
        $weather_data = [
            'temperature' => rand(10, 30),
            'conditions' => 'Ensoleillé'
        ];

        $stmt = $conn->prepare("
            INSERT INTO group_weather (group_id, latitude, longitude, weather_data)
            VALUES (:group_id, :latitude, :longitude, :weather_data)
            ON DUPLICATE KEY UPDATE
            latitude = VALUES(latitude),
            longitude = VALUES(longitude),
            weather_data = VALUES(weather_data),
            last_updated = CURRENT_TIMESTAMP
        ");

        $stmt->execute([
            'group_id' => $group_id,
            'latitude' => $latitude,
            'longitude' => $longitude,
            'weather_data' => json_encode($weather_data)
        ]);
    }

    // Gestion des actions
    if (isset($_GET['action'])) {
        switch ($_GET['action']) {
            case 'get_groups':
                $stmt = $conn->query("SELECT * FROM groups");
                echo json_encode(['success' => true, 'groups' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
                break;

            case 'get_users':
                $stmt = $conn->query("
                    SELECT 
                        u.id, 
                        u.name, 
                        u.email, 
                        u.role,
                        u.group_id,
                        COALESCE(g.name, 'Aucun') as group_name 
                    FROM users u 
                    LEFT JOIN groups g ON u.group_id = g.id
                    ORDER BY u.name
                ");
                echo json_encode(['success' => true, 'users' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
                break;

            case 'get_groups_weather':
                $stmt = $conn->query("SELECT g.*, gw.latitude, gw.longitude, gw.weather_data FROM groups g LEFT JOIN group_weather gw ON g.id = gw.group_id");
                $groups = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                // Décoder les données météo JSON
                foreach ($groups as &$group) {
                    if ($group['weather_data']) {
                        $group['weather_data'] = json_decode($group['weather_data'], true);
                    }
                }
                
                echo json_encode(['success' => true, 'groups' => $groups]);
                break;
        }
    } elseif (isset($data['action'])) {
        switch ($data['action']) {
            case 'add_group':
                $stmt = $conn->prepare("INSERT INTO groups (name, description) VALUES (:name, :description)");
                $stmt->execute(['name' => $data['name'], 'description' => $data['description']]);
                echo json_encode(['success' => true]);
                break;

            case 'add_user':
                // Générer un ID unique pour l'utilisateur
                $user_id = uniqid();
                
                $stmt = $conn->prepare("
                    INSERT INTO users (id, name, email, password, role, group_id)
                    VALUES (:id, :name, :email, :password, :role, :group_id)
                ");
                
                $stmt->execute([
                    'id' => $user_id,
                    'name' => $data['name'],
                    'email' => $data['email'],
                    'password' => password_hash($data['password'], PASSWORD_DEFAULT),
                    'role' => $data['role'],
                    'group_id' => $data['group_id'] ?: null
                ]);
                
                echo json_encode(['success' => true, 'user_id' => $user_id]);
                break;

            case 'delete_group':
                $stmt = $conn->prepare("DELETE FROM groups WHERE id = :id");
                $stmt->execute(['id' => $data['group_id']]);
                echo json_encode(['success' => true]);
                break;

            case 'delete_user':
                $stmt = $conn->prepare("DELETE FROM users WHERE id = :id");
                $stmt->execute(['id' => $data['user_id']]);
                echo json_encode(['success' => true]);
                break;

            case 'update_user':
                if (!isset($data['user_id']) || !isset($data['name']) || !isset($data['email']) || !isset($data['role'])) {
                    throw new Exception("Données manquantes pour la mise à jour");
                }

                $stmt = $conn->prepare("
                    UPDATE users 
                    SET name = :name, 
                        email = :email, 
                        role = :role, 
                        group_id = :group_id 
                    WHERE id = :user_id
                ");

                $stmt->execute([
                    'name' => $data['name'],
                    'email' => $data['email'],
                    'role' => $data['role'],
                    'group_id' => $data['group_id'],
                    'user_id' => $data['user_id']
                ]);

                echo json_encode(['success' => true]);
                break;
        }
    }

} catch(PDOException $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}

$conn = null;
?> 