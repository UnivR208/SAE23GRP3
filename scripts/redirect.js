document.addEventListener('DOMContentLoaded', function() {
    // Vérifier si nous sommes déjà sur la page de login
    if (window.location.pathname.includes('login.html')) {
        return;
    }

    // Vérifier si l'utilisateur est connecté
    const isLoggedIn = sessionStorage.getItem('loggedIn');
    if (!isLoggedIn) {
        // Rediriger vers la page de login
        window.location.href = 'login.html';
    }
}); 