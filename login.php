<?php
$servername = "mysql_serv";
$username = "nvincen3";
$password = "SQL7nathR&T";
$dbname = "nvincen3_05";

$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
    die("Échec de la connexion : " . $conn->connect_error);
}

if (isset($_POST['mail_user']) && isset($_POST['mdp_user'])) {
    $email = $_POST['mail_user'];
    $password = $_POST['mdp_user'];

    $stmt = $conn->prepare("SELECT * FROM users WHERE mail_user = ? AND mdp_user = ?");
    $stmt->bind_param("ss", $email, $password);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows > 0) {
        $user = $result->fetch_assoc();
        echo "Connexion réussie ! Bienvenue, " . htmlspecialchars($user['nom_user']) . ".";
    } else {
        echo "Mot de passe incorrect.";
    }

    $stmt->close();
}

$conn->close();
?>
