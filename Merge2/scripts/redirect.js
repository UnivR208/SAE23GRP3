document.addEventListener('DOMContentLoaded', async function() {
    // Vérifier si nous sommes déjà sur la page de login
    if (window.location.pathname.includes('login.html')) {
        // Si on est sur la page de login et qu'on est déjà connecté, rediriger vers la bonne page
        const isLoggedIn = sessionStorage.getItem('loggedIn');
        const userRole = sessionStorage.getItem('userRole');
        
        if (isLoggedIn) {
            if (userRole === 'admin') {
                window.location.href = 'admin.html';
            } else {
                window.location.href = 'index.html';
            }
        }
        return;
    }

    // Vérifier si l'utilisateur est connecté
    const isLoggedIn = sessionStorage.getItem('loggedIn');
    const userRole = sessionStorage.getItem('userRole');
    
    console.log('État de connexion:', isLoggedIn);
    console.log('Rôle de l\'utilisateur:', userRole);

    if (!isLoggedIn) {
        console.log('Redirection vers la page de login');
        window.location.href = 'login.html';
    } else {
        // Vérifier si l'utilisateur est sur la bonne page selon son rôle
        const currentPage = window.location.pathname;
        if (userRole === 'admin' && !currentPage.includes('admin.html')) {
            window.location.href = 'admin.html';
        } else if (userRole === 'student' && !currentPage.includes('index.html')) {
            window.location.href = 'index.html';
        }

        // Synchroniser avec la base de données
        try {
            await fetch('/php/sync.php', {
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