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

// Inclure la configuration de la base de données avec le chemin absolu
require_once(__DIR__ . '/config/database.php');

try {
    $conn = new PDO("mysql:host=$servername;dbname=$dbname", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $conn->exec("SET NAMES utf8");

    // Log pour déboguer
    error_log("Connexion à la base de données réussie");
    error_log("Serveur: $servername, Base: $dbname, Utilisateur: $username");

    // Récupérer les données JSON pour les requêtes POST
    $data = null;
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $jsonData = file_get_contents('php://input');
        error_log("Données POST reçues: " . $jsonData); // Log pour déboguer
        $data = json_decode($jsonData, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new Exception('Erreur de parsing JSON: ' . json_last_error_msg());
        }
    }

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
        error_log("Action GET reçue: " . $_GET['action']); // Log pour déboguer
        
        switch ($_GET['action']) {
            case 'get_groups':
                $stmt = $conn->query("SELECT * FROM groups");
                $result = ['success' => true, 'groups' => $stmt->fetchAll(PDO::FETCH_ASSOC)];
                error_log("Résultat get_groups: " . json_encode($result)); // Log pour déboguer
                echo json_encode($result);
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
                $result = ['success' => true, 'users' => $stmt->fetchAll(PDO::FETCH_ASSOC)];
                error_log("Résultat get_users: " . json_encode($result));
                echo json_encode($result);
                break;

            case 'get_groups_weather':
                $stmt = $conn->query("
                    SELECT g.*, gw.latitude, gw.longitude, gw.weather_data 
                    FROM groups g 
                    LEFT JOIN group_weather gw ON g.id = gw.group_id
                ");
                $groups = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                foreach ($groups as &$group) {
                    if ($group['weather_data']) {
                        $group['weather_data'] = json_decode($group['weather_data'], true);
                    }
                }
                
                echo json_encode(['success' => true, 'groups' => $groups]);
                break;
        }
    } elseif (isset($data['action'])) {
        error_log("Action POST reçue: " . $data['action']); // Log pour déboguer
        
        switch ($data['action']) {
            case 'add_group':
                if (!isset($data['name']) || trim($data['name']) === '') {
                    throw new Exception("Le nom du groupe est requis");
                }
                
                try {
                    // Générer un ID de groupe unique
                    $group_id = 'GRP' . str_pad(mt_rand(1, 999), 3, '0', STR_PAD_LEFT);
                    
                    $stmt = $conn->prepare("INSERT INTO groups (id, name, description) VALUES (:id, :name, :description)");
                    $stmt->execute([
                        'id' => $group_id,
                        'name' => trim($data['name']),
                        'description' => isset($data['description']) ? trim($data['description']) : null
                    ]);
                    
                    $result = ['success' => true, 'group_id' => $group_id];
                    error_log("Groupe ajouté avec succès. ID: " . $group_id);
                    echo json_encode($result);
                } catch (PDOException $e) {
                    if ($e->getCode() == '23000') {
                        throw new Exception("Un groupe avec ce nom existe déjà");
                    } else {
                        throw $e;
                    }
                }
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
                    'password' => password_hash('password123', PASSWORD_DEFAULT), // Mot de passe temporaire
                    'role' => $data['role'],
                    'group_id' => $data['group_id'] ? $data['group_id'] : null
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
                    'group_id' => $data['group_id'] ? $data['group_id'] : null,
                    'user_id' => $data['user_id']
                ]);

                echo json_encode(['success' => true]);
                break;
        }
    } else {
        throw new Exception("Aucune action spécifiée");
    }

} catch(PDOException $e) {
    error_log("Erreur PDO: " . $e->getMessage()); // Log pour déboguer
    echo json_encode(['success' => false, 'message' => 'Erreur de base de données: ' . $e->getMessage()]);
} catch(Exception $e) {
    error_log("Erreur générale: " . $e->getMessage()); // Log pour déboguer
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}

$conn = null;
?> 