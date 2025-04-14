<?php
$servername = "mysql_serv";
$username = "nvincen3";
$password = "SQL7nathR&T";
$dbname = "nvincen3_05";

// Connexion à la base de données
$conn = new mysqli($servername, $username, $password, $dbname);

// Vérifier la connexion
if ($conn->connect_error) {
    die("Échec de la connexion : " . $conn->connect_error);
}

if (isset($_POST['mail_user'])) {
    $email = $_POST['mail_user'];

    // Utiliser une requête préparée pour vérifier l'existence de l'adresse e-mail
    $stmt = $conn->prepare("SELECT * FROM users WHERE mail_user = ?");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows > 0) {
        // L'adresse e-mail existe, demander le mot de passe
        echo "<form action='login.php' method='post'>
                <input type='hidden' name='mail_user' value='$email'>
                <label for='mdp_user'>Mot de passe :</label>
                <input type='password' id='mdp_user' name='mdp_user' required>
                <button type='submit'>Se connecter</button>
              </form>";
    } else {
        // L'adresse e-mail n'existe pas, proposer la création de compte
        echo "<form action='create_account.php' method='post'>
                <input type='hidden' name='mail_user' value='$email'>
                <label for='nom_user'>Nom :</label>
                <input type='text' id='nom_user' name='nom_user' required>
                <label for='mdp_user'>Mot de passe :</label>
                <input type='password' id='mdp_user' name='mdp_user' required>
                <label for='telephone_user'>Téléphone :</label>
                <input type='text' id='telephone_user' name='telephone_user'>
                <button type='submit'>Créer un compte</button>
              </form>";
    }

    $stmt->close();
}

$conn->close();
?>
