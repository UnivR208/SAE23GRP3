document.addEventListener('DOMContentLoaded', function() {
    // Vérifier si nous sommes déjà sur la page de login
    if (window.location.pathname.includes('login.html')) {
        return;
    }

    // Vérifier si l'utilisateur est connecté
    const currentUser = sessionStorage.getItem('currentUser');
    if (!currentUser) {
        // Rediriger vers la page de login
        window.location.href = 'login.html';
    }
}); 