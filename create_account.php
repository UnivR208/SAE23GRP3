<?php
$servername = "mysql_serv";
$username = "nvincen3";
$password = "SQL7nathR&T";
$dbname = "nvincen3_05";

$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
    die("Échec de la connexion : " . $conn->connect_error);
}

if (isset($_POST['mail_user']) && isset($_POST['nom_user']) && isset($_POST['mdp_user'])) {
    $email = $_POST['mail_user'];
    $nom = $_POST['nom_user'];
    $password = $_POST['mdp_user'];
    $telephone = isset($_POST['telephone_user']) ? $_POST['telephone_user'] : '';

    $stmt = $conn->prepare("INSERT INTO users (nom_user, mdp_user, mail_user, telephone_user) VALUES (?, ?, ?, ?)");
    $stmt->bind_param("ssss", $nom, $password, $email, $telephone);

    if ($stmt->execute()) {
        echo "Compte créé avec succès ! Vous pouvez maintenant vous connecter.";
    } else {
        echo "Erreur lors de la création du compte : " . $stmt->error;
    }

    $stmt->close();
}

$conn->close();
?>
