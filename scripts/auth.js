document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const errorMessage = document.getElementById('errorMessage');
    const identifierInput = document.getElementById('identifier');
    const datalist = document.createElement('datalist');
    datalist.id = 'identifierSuggestions';
    identifierInput.setAttribute('list', 'identifierSuggestions');
    document.body.appendChild(datalist);

    // Création des nuages animés
    createClouds();

    // Chargement des suggestions
    loadSuggestions();

    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const identifier = identifierInput.value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch('data/students.json');
            const data = await response.json();
            const users = [...data.students, ...data.admins];
            
            const user = users.find(user => 
                (user.email === identifier || user.id === identifier) && 
                user.password === password
            );

            if (user) {
                // Stockage des informations de l'utilisateur
                sessionStorage.setItem('currentUser', JSON.stringify({
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    isAdmin: user.role === 'admin'
                }));

                // Redirection vers la page appropriée
                if (user.role === 'admin') {
                    window.location.href = 'admin.html';
                } else {
                    window.location.href = 'index.html';
                }
            } else {
                showError('Identifiants incorrects');
            }
        } catch (error) {
            showError('Une erreur est survenue lors de la connexion');
            console.error('Erreur:', error);
        }
    });

    async function loadSuggestions() {
        try {
            const response = await fetch('data/students.json');
            const data = await response.json();
            const users = [...data.students, ...data.admins];
            
            // Création des options de suggestion
            datalist.innerHTML = users.map(user => 
                `<option value="${user.email}">${user.name} (${user.id})</option>`
            ).join('');
        } catch (error) {
            console.error('Erreur lors du chargement des suggestions:', error);
        }
    }

    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
        setTimeout(() => {
            errorMessage.style.display = 'none';
        }, 3000);
    }

    function createClouds() {
        const container = document.querySelector('.login-container');
        for (let i = 1; i <= 4; i++) {
            const cloud = document.createElement('div');
            cloud.className = `cloud cloud${i}`;
            container.appendChild(cloud);
        }
    }
}); 