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
            case 'get_residences':
                // Récupérer l'ID de l'utilisateur à partir de son email
                $stmtGetUser = $conn->prepare("SELECT id FROM users WHERE email = :email");
                $stmtGetUser->execute([':email' => $data['user_email']]);
                $user = $stmtGetUser->fetch(PDO::FETCH_ASSOC);

                if (!$user) {
                    throw new Exception("Utilisateur non trouvé");
                }

                // Récupérer les résidences de l'utilisateur
                $stmtResidences = $conn->prepare("SELECT * FROM RESIDENCE WHERE user_id = :user_id");
                $stmtResidences->execute([':user_id' => $user['id']]);
                $residences = $stmtResidences->fetchAll(PDO::FETCH_ASSOC);

                echo json_encode([
                    'success' => true,
                    'residences' => $residences
                ]);
                break;

            case 'add_residence':
                // Récupérer l'ID de l'utilisateur à partir de son email
                $stmtGetUser = $conn->prepare("SELECT id FROM users WHERE email = :email");
                $stmtGetUser->execute([':email' => $data['user_email']]);
                $user = $stmtGetUser->fetch(PDO::FETCH_ASSOC);

                if (!$user) {
                    throw new Exception("Utilisateur non trouvé");
                }

                // Vérifions s'il s'agit du type "other" et modifions le nom et le type en conséquence
                $residenceType = $data['residence']['type'];
                $residenceName = $data['residence']['name'];

                // Vérifier si une résidence du même type existe déjà
                $stmtCheck = $conn->prepare("SELECT id FROM RESIDENCE WHERE user_id = :user_id AND type = :type");
                $stmtCheck->execute([
                    ':user_id' => $user['id'],
                    ':type' => $residenceType
                ]);
                $existing = $stmtCheck->fetch(PDO::FETCH_ASSOC);

                if ($existing) {
                    // Mettre à jour la résidence existante
                    $stmtUpdate = $conn->prepare("UPDATE RESIDENCE SET 
                        name = :name,
                        location_lat = :location_lat,
                        location_lng = :location_lng,
                        start_date = :start_date,
                        end_date = :end_date
                        WHERE id = :id");
                    
                    $stmtUpdate->execute([
                        ':id' => $existing['id'],
                        ':name' => $residenceName,
                        ':location_lat' => $data['residence']['location_lat'],
                        ':location_lng' => $data['residence']['location_lng'],
                        ':start_date' => $data['residence']['start_date'],
                        ':end_date' => $data['residence']['end_date']
                    ]);
                } else {
                    // Insérer une nouvelle résidence
                    $stmtInsert = $conn->prepare("INSERT INTO RESIDENCE 
                        (user_id, name, location_lat, location_lng, type, start_date, end_date)
                        VALUES (:user_id, :name, :location_lat, :location_lng, :type, :start_date, :end_date)");
                    
                    $stmtInsert->execute([
                        ':user_id' => $user['id'],
                        ':name' => $residenceName,
                        ':location_lat' => $data['residence']['location_lat'],
                        ':location_lng' => $data['residence']['location_lng'],
                        ':type' => $residenceType,
                        ':start_date' => $data['residence']['start_date'],
                        ':end_date' => $data['residence']['end_date']
                    ]);
                }

                echo json_encode([
                    'success' => true,
                    'message' => 'Résidence ajoutée avec succès'
                ]);
                break;

            case 'delete_residence':
                // Récupérer l'ID de l'utilisateur à partir de son email
                $stmtGetUser = $conn->prepare("SELECT id FROM users WHERE email = :email");
                $stmtGetUser->execute([':email' => $data['user_email']]);
                $user = $stmtGetUser->fetch(PDO::FETCH_ASSOC);

                if (!$user) {
                    throw new Exception("Utilisateur non trouvé");
                }

                // Supprimer la résidence
                if ($data['residence_type'] === 'other') {
                    // Pour "other", supprimer la résidence de type other
                    $stmtDelete = $conn->prepare("DELETE FROM RESIDENCE WHERE user_id = :user_id AND type = 'other'");
                    $stmtDelete->execute([':user_id' => $user['id']]);
                } else if ($data['residence_type'] === 'secondary') {
                    // Pour "secondary", suppression standard
                    $stmtDelete = $conn->prepare("DELETE FROM RESIDENCE WHERE user_id = :user_id AND type = 'secondary'");
                    $stmtDelete->execute([':user_id' => $user['id']]);
                } else {
                    // Pour "main", suppression standard
                    $stmtDelete = $conn->prepare("DELETE FROM RESIDENCE WHERE user_id = :user_id AND type = :type");
                    $stmtDelete->execute([
                        ':user_id' => $user['id'],
                        ':type' => $data['residence_type']
                    ]);
                }

                echo json_encode([
                    'success' => true,
                    'message' => 'Résidence supprimée avec succès'
                ]);
                break;

            default:
                throw new Exception("Action non reconnue");
        }
    } else {
        throw new Exception("Action non spécifiée");
    }
} catch (Exception $e) {
    error_log("Erreur API residence: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?> 