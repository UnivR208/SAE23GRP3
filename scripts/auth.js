document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const errorMessage = document.getElementById('errorMessage');

    // Gestion de la connexion
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const email = document.getElementById('identifier').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch('/php/login.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'login',
                    email: email,
                    password: password
                })
            });

            const result = await response.json();
            
            if (result.success) {
                // Stocker les informations de l'utilisateur
                sessionStorage.setItem('userId', result.user.id);
                sessionStorage.setItem('userName', result.user.name);
                sessionStorage.setItem('userRole', result.user.role);
                sessionStorage.setItem('loggedIn', 'true');
                
                // Rediriger en fonction du rôle
                if (result.user.role === 'admin') {
                    window.location.href = 'admin.html';
                } else {
                    window.location.href = 'index.html';
                }
            } else {
                errorMessage.textContent = result.message;
            }
        } catch (error) {
            console.error('Erreur:', error);
            errorMessage.textContent = 'Une erreur est survenue lors de la connexion';
        }
    });
}); 