<?php
require_once 'config/database.php';

try {
    $database = new Database();
    $conn = $database->getConnection();
    
    // Lire le fichier SQL
    $sql = file_get_contents('database.sql');
    
    // Exécuter les requêtes SQL
    $conn->exec($sql);
    
    echo json_encode(['success' => true, 'message' => 'Base de données initialisée avec succès']);
} catch(PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Erreur: ' . $e->getMessage()]);
}
?> 