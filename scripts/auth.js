// Configuration
const BASE_URL = 'https://rt-projet.pu-pm.univ-fcomte.fr/users/tdavid';

// Fonction de synchronisation
async function syncDatabase() {
    try {
        const response = await fetch(`${BASE_URL}/php/sync.php`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        const data = await response.json();
        console.log('Synchronisation:', data);
        return data.success;
    } catch (error) {
        console.error('Erreur de synchronisation:', error);
        return false;
    }
}

document.addEventListener('DOMContentLoaded', async function() {
    const loginForm = document.getElementById('loginForm');
    const errorMessage = document.getElementById('errorMessage');

    // Synchroniser la base de données au chargement
    await syncDatabase();

    // Vérifier si l'utilisateur est déjà connecté
    const loggedIn = sessionStorage.getItem('loggedIn');
    const userRole = sessionStorage.getItem('userRole');
    
    if (loggedIn === 'true') {
        // Rediriger vers la page appropriée
        if (userRole === 'admin') {
            window.location.href = 'admin.html';
        } else {
            window.location.href = 'index.html';
        }
        return;
    }

    // Gestion de la connexion
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const email = document.getElementById('identifier').value;
        const password = document.getElementById('password').value;

        try {
            // Synchroniser avant la tentative de connexion
            await syncDatabase();

            const response = await fetch(`${BASE_URL}/php/login.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'login',
                    email,
                    password
                })
            });

            const data = await response.json();
            console.log('Réponse du serveur:', data); // Debug
            
            if (data.success && data.user) {
                // Stocker les informations de l'utilisateur
                sessionStorage.setItem('userEmail', data.user.email);
                sessionStorage.setItem('userName', data.user.name);
                sessionStorage.setItem('userRole', data.user.role);
                sessionStorage.setItem('userId', data.user.id);
                sessionStorage.setItem('loggedIn', 'true');
                
                // Rediriger en fonction du rôle
                if (data.user.role === 'admin') {
                    window.location.href = 'admin.html';
                } else {
                    window.location.href = 'index.html';
                }
            } else {
                showError(data.message || 'Erreur de connexion');
            }
        } catch (error) {
            console.error('Erreur de connexion:', error); // Debug
            showError('Erreur réseau');
        }
    });
});

// Fonction de déconnexion
function logout() {
    // Effacer les données de session
    sessionStorage.clear();
    // Rediriger vers la page de connexion
    window.location.href = 'login.html';
}

function showError(message) {
    const errorMessage = document.getElementById('errorMessage');
    if (errorMessage) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
        setTimeout(() => {
            errorMessage.style.display = 'none';
        }, 3000);
    }
} 