<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST,GET,PUT,DELETE");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include_once '../config/database.php';
include_once 'user.php';
include_once 'residence.php';

$database = new Database();
$db = $database->getConnection();

$request_method = $_SERVER["REQUEST_METHOD"];
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$uri = explode('/', $uri);

// Les endpoints commencent par /api/
if ($uri[1] == 'api') {
    switch($request_method) {
        case 'POST':
            if ($uri[2] == 'login') {
                // Login
                $data = json_decode(file_get_contents("php://input"));
                $user = new User($db);
                $user->email = $data->email;
                $user->password = $data->password;
                
                if($user_data = $user->login()) {
                    http_response_code(200);
                    echo json_encode($user_data);
                } else {
                    http_response_code(401);
                    echo json_encode(array("message" => "Identifiants invalides"));
                }
            } elseif ($uri[2] == 'residence') {
                // Ajouter une résidence
                $data = json_decode(file_get_contents("php://input"));
                $residence = new Residence($db);
                $residence->user_id = $data->user_id;
                $residence->type = $data->type;
                $residence->city_name = $data->city_name;
                $residence->latitude = $data->latitude;
                $residence->longitude = $data->longitude;
                $residence->start_date = $data->start_date;
                $residence->end_date = $data->end_date;
                
                if($residence->create()) {
                    http_response_code(201);
                    echo json_encode(array("message" => "Résidence créée avec succès"));
                } else {
                    http_response_code(503);
                    echo json_encode(array("message" => "Impossible de créer la résidence"));
                }
            }
            break;
            
        case 'GET':
            if ($uri[2] == 'residence' && isset($uri[3])) {
                // Lire les résidences d'un utilisateur
                $residence = new Residence($db);
                $residence->user_id = $uri[3];
                $stmt = $residence->readByUser();
                $num = $stmt->rowCount();
                
                if($num > 0) {
                    $residences_arr = array();
                    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                        extract($row);
                        $residence_item = array(
                            "type" => $type,
                            "location" => array(
                                "name" => $city_name,
                                "lat" => $latitude,
                                "lon" => $longitude
                            ),
                            "startDate" => $start_date,
                            "endDate" => $end_date
                        );
                        array_push($residences_arr, $residence_item);
                    }
                    http_response_code(200);
                    echo json_encode($residences_arr);
                } else {
                    http_response_code(404);
                    echo json_encode(array("message" => "Aucune résidence trouvée"));
                }
            }
            break;
            
        case 'PUT':
            if ($uri[2] == 'residence') {
                // Mettre à jour une résidence
                $data = json_decode(file_get_contents("php://input"));
                $residence = new Residence($db);
                $residence->user_id = $data->user_id;
                $residence->type = $data->type;
                $residence->city_name = $data->city_name;
                $residence->latitude = $data->latitude;
                $residence->longitude = $data->longitude;
                $residence->start_date = $data->start_date;
                $residence->end_date = $data->end_date;
                
                if($residence->update()) {
                    http_response_code(200);
                    echo json_encode(array("message" => "Résidence mise à jour avec succès"));
                } else {
                    http_response_code(503);
                    echo json_encode(array("message" => "Impossible de mettre à jour la résidence"));
                }
            }
            break;
            
        case 'DELETE':
            if ($uri[2] == 'residence' && isset($uri[3]) && isset($uri[4])) {
                // Supprimer une résidence
                $residence = new Residence($db);
                $residence->user_id = $uri[3];
                $residence->type = $uri[4];
                
                if($residence->delete()) {
                    http_response_code(200);
                    echo json_encode(array("message" => "Résidence supprimée avec succès"));
                } else {
                    http_response_code(503);
                    echo json_encode(array("message" => "Impossible de supprimer la résidence"));
                }
            }
            break;
    }
}
?> 