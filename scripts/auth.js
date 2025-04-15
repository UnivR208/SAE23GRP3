document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const createAccountForm = document.getElementById('createAccountForm');
    const createAccountBtn = document.getElementById('createAccountBtn');
    const errorMessage = document.getElementById('errorMessage');
    const newGroupSelect = document.getElementById('new-group');

    // Charger la liste des groupes
    async function loadGroups() {
        try {
            const response = await fetch('/php/admin.php?action=get_groups');
            const result = await response.json();
            
            if (result.success) {
                newGroupSelect.innerHTML = '<option value="">Sélectionner un groupe</option>';
                result.groups.forEach(group => {
                    const option = document.createElement('option');
                    option.value = group.id;
                    option.textContent = group.name;
                    newGroupSelect.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Erreur lors du chargement des groupes:', error);
        }
    }

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
                
                // Rediriger en fonction du rôle
                if (result.user.role === 'admin') {
                    window.location.href = 'admin.html';
                } else {
                    window.location.href = 'index.html';
                }
            } else {
                if (result.message === 'Utilisateur non trouvé') {
                    // Afficher le formulaire de création de compte
                    createAccountForm.style.display = 'block';
                    document.getElementById('new-email').value = email;
                    loadGroups();
                } else {
                    errorMessage.textContent = result.message;
                }
            }
        } catch (error) {
            console.error('Erreur:', error);
            errorMessage.textContent = 'Une erreur est survenue lors de la connexion';
        }
    });

    // Gestion de la création de compte
    createAccountBtn.addEventListener('click', async function() {
        const name = document.getElementById('new-name').value;
        const email = document.getElementById('new-email').value;
        const password = document.getElementById('new-password').value;
        const groupId = newGroupSelect.value;

        if (!name || !email || !password || !groupId) {
            errorMessage.textContent = 'Veuillez remplir tous les champs';
            return;
        }

        try {
            const response = await fetch('/php/admin.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'add_user',
                    name: name,
                    email: email,
                    password: password,
                    group_id: groupId,
                    role: 'student'
                })
            });

            const result = await response.json();
            
            if (result.success) {
                // Connecter automatiquement l'utilisateur
                sessionStorage.setItem('userId', result.user_id);
                sessionStorage.setItem('userName', name);
                sessionStorage.setItem('userRole', 'student');
                window.location.href = 'index.html';
            } else {
                errorMessage.textContent = result.message;
            }
        } catch (error) {
            console.error('Erreur:', error);
            errorMessage.textContent = 'Une erreur est survenue lors de la création du compte';
        }
    });
}); 