<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET,POST");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include_once '../config/database.php';
include_once 'user.php';
include_once 'residence.php';

class Sync {
    private $conn;
    private $json_file;

    public function __construct($db) {
        $this->conn = $db;
        // Utiliser le chemin absolu
        $this->json_file = realpath(dirname(__FILE__) . '/../../data/students.json');
        error_log("Chemin du fichier JSON: " . $this->json_file);
    }

    public function syncToJson() {
        try {
            error_log("Début de la synchronisation");
            error_log("Chemin du fichier JSON: " . $this->json_file);

            // Vérifier si le fichier existe et est accessible en écriture
            if (!file_exists($this->json_file)) {
                error_log("Le fichier JSON n'existe pas");
                return false;
            }
            if (!is_writable($this->json_file)) {
                error_log("Le fichier JSON n'est pas accessible en écriture");
                error_log("Permissions du fichier: " . substr(sprintf('%o', fileperms($this->json_file)), -4));
                return false;
            }

            // Récupérer tous les utilisateurs
            $user = new User($this->conn);
            $stmt = $user->readAll();
            $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

            error_log("Nombre d'utilisateurs trouvés: " . count($users));

            // Récupérer toutes les résidences
            $residence = new Residence($this->conn);
            $stmt = $residence->readAll();
            $residences = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Organiser les données
            $students = [];
            $admins = [];

            foreach ($users as $user) {
                $userData = [
                    'id' => $user['id'],
                    'name' => $user['name'],
                    'email' => $user['email'],
                    'password' => $user['password'],
                    'role' => $user['role']
                ];

                // Ajouter les résidences
                $userResidences = array_filter($residences, function($res) use ($user) {
                    return $res['user_id'] === $user['id'];
                });

                foreach ($userResidences as $res) {
                    $userData[$res['type']] = [
                        'location' => [
                            'lat' => (float)$res['latitude'],
                            'lon' => (float)$res['longitude'],
                            'name' => $res['city_name']
                        ],
                        'startDate' => $res['start_date'],
                        'endDate' => $res['end_date']
                    ];
                }

                if ($user['role'] === 'student') {
                    $students[] = $userData;
                } else {
                    $admins[] = $userData;
                }
            }

            // Créer la structure JSON
            $jsonData = [
                'students' => $students,
                'admins' => $admins
            ];

            error_log("Données à écrire: " . json_encode($jsonData));

            // Écrire dans le fichier JSON
            $result = file_put_contents($this->json_file, json_encode($jsonData, JSON_PRETTY_PRINT));
            if ($result === false) {
                error_log("Erreur lors de l'écriture du fichier JSON");
                error_log("Dernière erreur PHP: " . error_get_last()['message']);
                return false;
            }
            
            error_log("Synchronisation réussie");
            return true;
        } catch (Exception $e) {
            error_log("Erreur de synchronisation: " . $e->getMessage());
            return false;
        }
    }
}

// Vérifier si c'est une requête GET
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $database = new Database();
    $db = $database->getConnection();

    $sync = new Sync($db);
    if ($sync->syncToJson()) {
        echo json_encode(["message" => "Synchronisation réussie"]);
    } else {
        http_response_code(500);
        echo json_encode(["message" => "Erreur lors de la synchronisation"]);
    }
}
?> 