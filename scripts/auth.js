// Configuration
const BASE_URL = 'https://rt-projet.pu-pm.univ-fcomte.fr/users/tdavid';

document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const errorMessage = document.getElementById('errorMessage');

    // Gestion de la connexion
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const email = document.getElementById('identifier').value;
        const password = document.getElementById('password').value;

        try {
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
            
            if (data.success) {
                // Stocker les informations de l'utilisateur
                sessionStorage.setItem('userEmail', email);
                sessionStorage.setItem('userName', data.userName);
                sessionStorage.setItem('userRole', data.userRole);
                sessionStorage.setItem('loggedIn', 'true');
                
                // Rediriger en fonction du rôle
                if (data.userRole === 'admin') {
                    window.location.href = 'admin.html';
                } else {
                    window.location.href = 'index.html';
                }
            } else {
                showError(data.message || 'Erreur de connexion');
            }
        } catch (error) {
            showError('Erreur réseau');
            console.error('Erreur:', error);
        }
    });
});

async function login(email, password) {
    try {
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
        
        if (data.success) {
            sessionStorage.setItem('userId', data.userId);
            sessionStorage.setItem('userName', data.userName);
            sessionStorage.setItem('userRole', data.userRole);
            sessionStorage.setItem('loggedIn', 'true');
            
            // Rediriger en fonction du rôle
            if (data.userRole === 'admin') {
                window.location.href = 'admin.html';
            } else {
                window.location.href = 'index.html';
            }
        } else {
            showError(data.message || 'Erreur de connexion');
        }
    } catch (error) {
        showError('Erreur réseau');
        console.error('Erreur:', error);
    }
}

function showError(message) {
    errorMessage.textContent = message;
} 