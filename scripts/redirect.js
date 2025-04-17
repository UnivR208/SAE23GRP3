/**
 * Script de redirection pour vérifier si l'utilisateur est connecté
 * À inclure dans les pages qui nécessitent une authentification
 */
document.addEventListener('DOMContentLoaded', () => {
    // Vérifier si l'utilisateur est connecté
    const userId = sessionStorage.getItem('userId');
    const userName = sessionStorage.getItem('userName');
    
    if (!userId || !userName) {
        // Si pas connecté, rediriger vers la page de connexion
        window.location.href = 'login.html';
    }
}); 