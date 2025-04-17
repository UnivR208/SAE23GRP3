<?php
// Générer les hashes des mots de passe
$admin_password = 'admin123';
$tom_password = 'tom123';

$admin_hash = password_hash($admin_password, PASSWORD_DEFAULT);
$tom_hash = password_hash($tom_password, PASSWORD_DEFAULT);

echo "Hash pour admin123: " . $admin_hash . "\n";
echo "Hash pour tom123: " . $tom_hash . "\n";
?> 