<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST,GET,PUT,DELETE");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include_once '../config/database.php';

class Residence {
    private $conn;
    private $table_name = "residences";

    public $id;
    public $user_id;
    public $type;
    public $city_name;
    public $latitude;
    public $longitude;
    public $start_date;
    public $end_date;

    public function __construct($db) {
        $this->conn = $db;
    }

    // Créer une résidence
    public function create() {
        $query = "INSERT INTO " . $this->table_name . "
                SET
                    user_id = :user_id,
                    type = :type,
                    city_name = :city_name,
                    latitude = :latitude,
                    longitude = :longitude,
                    start_date = :start_date,
                    end_date = :end_date";

        $stmt = $this->conn->prepare($query);

        // Nettoyer les données
        $this->user_id = htmlspecialchars(strip_tags($this->user_id));
        $this->type = htmlspecialchars(strip_tags($this->type));
        $this->city_name = htmlspecialchars(strip_tags($this->city_name));
        $this->latitude = htmlspecialchars(strip_tags($this->latitude));
        $this->longitude = htmlspecialchars(strip_tags($this->longitude));
        $this->start_date = htmlspecialchars(strip_tags($this->start_date));
        $this->end_date = htmlspecialchars(strip_tags($this->end_date));

        // Lier les valeurs
        $stmt->bindParam(":user_id", $this->user_id);
        $stmt->bindParam(":type", $this->type);
        $stmt->bindParam(":city_name", $this->city_name);
        $stmt->bindParam(":latitude", $this->latitude);
        $stmt->bindParam(":longitude", $this->longitude);
        $stmt->bindParam(":start_date", $this->start_date);
        $stmt->bindParam(":end_date", $this->end_date);

        if($stmt->execute()) {
            return true;
        }
        return false;
    }

    // Lire toutes les résidences d'un utilisateur
    public function readByUser() {
        $query = "SELECT * FROM " . $this->table_name . " WHERE user_id = ?";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $this->user_id);
        $stmt->execute();
        return $stmt;
    }

    // Mettre à jour une résidence
    public function update() {
        $query = "UPDATE " . $this->table_name . "
                SET
                    city_name = :city_name,
                    latitude = :latitude,
                    longitude = :longitude,
                    start_date = :start_date,
                    end_date = :end_date
                WHERE
                    user_id = :user_id AND type = :type";

        $stmt = $this->conn->prepare($query);

        // Nettoyer les données
        $this->city_name = htmlspecialchars(strip_tags($this->city_name));
        $this->latitude = htmlspecialchars(strip_tags($this->latitude));
        $this->longitude = htmlspecialchars(strip_tags($this->longitude));
        $this->start_date = htmlspecialchars(strip_tags($this->start_date));
        $this->end_date = htmlspecialchars(strip_tags($this->end_date));
        $this->user_id = htmlspecialchars(strip_tags($this->user_id));
        $this->type = htmlspecialchars(strip_tags($this->type));

        // Lier les valeurs
        $stmt->bindParam(":city_name", $this->city_name);
        $stmt->bindParam(":latitude", $this->latitude);
        $stmt->bindParam(":longitude", $this->longitude);
        $stmt->bindParam(":start_date", $this->start_date);
        $stmt->bindParam(":end_date", $this->end_date);
        $stmt->bindParam(":user_id", $this->user_id);
        $stmt->bindParam(":type", $this->type);

        if($stmt->execute()) {
            return true;
        }
        return false;
    }

    // Supprimer une résidence
    public function delete() {
        $query = "DELETE FROM " . $this->table_name . " WHERE user_id = ? AND type = ?";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $this->user_id);
        $stmt->bindParam(2, $this->type);
        
        if($stmt->execute()) {
            return true;
        }
        return false;
    }
}
?> 