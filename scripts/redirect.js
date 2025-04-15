document.addEventListener('DOMContentLoaded', async function() {
    // Vérifier si nous sommes déjà sur la page de login
    if (window.location.pathname.includes('login.html')) {
        return;
    }

    // Vérifier si l'utilisateur est connecté
    const isLoggedIn = sessionStorage.getItem('loggedIn');
    if (!isLoggedIn) {
        // Rediriger vers la page de login
        window.location.href = 'login.html';
    } else {
        // Synchroniser avec la base de données
        try {
            await fetch('http://localhost/php/sync.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
        } catch (error) {
            console.error('Erreur lors de la synchronisation:', error);
        }
    }
}); 