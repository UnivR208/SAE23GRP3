document.addEventListener('DOMContentLoaded', function() {
    // Vérifier si l'utilisateur est connecté et est admin
    const loggedIn = sessionStorage.getItem('loggedIn');
    const userRole = sessionStorage.getItem('userRole');

    if (loggedIn !== 'true' || userRole !== 'admin') {
        window.location.href = 'login.html';
        return;
    }

    // Gérer la déconnexion
    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', function() {
            // Effacer les données de session
            sessionStorage.clear();
            // Rediriger vers la page de connexion
            window.location.href = 'login.html';
        });
    }

    // Éléments du DOM
    const groupsTable = document.getElementById('groups-table').getElementsByTagName('tbody')[0];
    const usersTable = document.getElementById('users-table').getElementsByTagName('tbody')[0];
    const addGroupBtn = document.getElementById('add-group');
    const addUserBtn = document.getElementById('add-user');
    const userGroupSelect = document.getElementById('user-group');
    const groupsWeatherDiv = document.getElementById('groups-weather');
    const userSearchInput = document.getElementById('user-search');
    const selectUser = document.getElementById('select-user');
    const userEditForm = document.getElementById('user-edit-form');
    const updateUserBtn = document.getElementById('update-user');

    let allUsers = []; // Stockage de tous les utilisateurs
    let allGroups = []; // Stockage de tous les groupes

    // Charger les données initiales
    loadGroups();
    loadUsers();
    loadGroupsWeather();

    // Mettre à jour le menu déroulant des utilisateurs
    function updateUserSelect(users) {
        selectUser.innerHTML = '<option value="">Choisir un utilisateur...</option>';
        users.forEach(user => {
            const option = document.createElement('option');
            option.value = user.id;
            option.textContent = `${user.name} (${user.email})`;
            selectUser.appendChild(option);
        });
    }

    // Gestionnaire de sélection d'utilisateur
    selectUser.addEventListener('change', function(e) {
        const userId = e.target.value;
        if (userId) {
            const user = allUsers.find(u => u.id === userId);
            if (user) {
                document.getElementById('edit-name').value = user.name;
                document.getElementById('edit-email').value = user.email;
                document.getElementById('edit-role').value = user.role;
                document.getElementById('edit-group').value = user.group_id || '';
                userEditForm.style.display = 'block';
            }
        } else {
            userEditForm.style.display = 'none';
        }
    });

    // Gestionnaire de mise à jour d'utilisateur
    updateUserBtn.addEventListener('click', async function() {
        const userId = selectUser.value;
        if (!userId) return;

        const userData = {
            action: 'update_user',
            user_id: userId,
            name: document.getElementById('edit-name').value,
            email: document.getElementById('edit-email').value,
            role: document.getElementById('edit-role').value,
            group_id: document.getElementById('edit-group').value || null
        };

        try {
            const response = await fetch('/php/admin.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });

            const result = await response.json();
            if (result.success) {
                alert('Utilisateur mis à jour avec succès');
                loadUsers();
            } else {
                alert('Erreur lors de la mise à jour: ' + result.message);
            }
        } catch (error) {
            console.error('Erreur:', error);
            alert('Erreur lors de la mise à jour de l\'utilisateur');
        }
    });

    // Gestionnaire de recherche d'utilisateurs
    userSearchInput.addEventListener('input', function(e) {
        const searchTerm = e.target.value.toLowerCase();
        const filteredUsers = allUsers.filter(user => 
            user.name.toLowerCase().includes(searchTerm) ||
            user.email.toLowerCase().includes(searchTerm) ||
            (user.group_name && user.group_name.toLowerCase().includes(searchTerm))
        );
        displayUsers(filteredUsers);
        updateUserSelect(filteredUsers);
    });

    // Fonction pour afficher les utilisateurs filtrés
    function displayUsers(users) {
        console.log('Affichage des utilisateurs:', users); // Log pour déboguer
        usersTable.innerHTML = '';
        users.forEach(user => {
            const row = usersTable.insertRow();
            row.innerHTML = `
                <td>${user.id}</td>
                <td>${user.name}</td>
                <td>${user.email}</td>
                <td>${user.group_name || 'Aucun'}</td>
                <td>${user.role}</td>
                <td>
                    <button class="btn btn-danger" onclick="deleteUser('${user.id}')">Supprimer</button>
                </td>
            `;
        });
    }

    // Gestion des groupes
    addGroupBtn.addEventListener('click', async () => {
        const name = document.getElementById('group-name').value;
        const description = document.getElementById('group-description').value;

        try {
            const response = await fetch('https://rt-projet.pu-pm.univ-fcomte.fr/users/tdavid/php/admin.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'add_group',
                    name: name,
                    description: description
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const text = await response.text();
            console.log('Response text:', text);
            
            try {
                const result = JSON.parse(text);
                if (result.success) {
                    loadGroups();
                    document.getElementById('group-name').value = '';
                    document.getElementById('group-description').value = '';
                } else {
                    alert('Erreur lors de l\'ajout du groupe: ' + result.message);
                }
            } catch (jsonError) {
                console.error('Erreur de parsing JSON:', jsonError, 'Texte reçu:', text);
                alert('Erreur lors du traitement de la réponse du serveur');
            }
        } catch (error) {
            console.error('Erreur:', error);
            alert('Erreur lors de l\'ajout du groupe');
        }
    });

    // Gestion des utilisateurs
    addUserBtn.addEventListener('click', async () => {
        const email = document.getElementById('user-email').value;
        const name = document.getElementById('user-name').value;
        const groupId = userGroupSelect.value;
        const role = document.getElementById('user-role').value;

        if (!email || !name) {
            alert('Veuillez remplir tous les champs obligatoires');
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
                    email: email,
                    name: name,
                    group_id: groupId,
                    role: role
                })
            });

            const result = await response.json();
            if (result.success) {
                loadUsers();
                document.getElementById('user-email').value = '';
                document.getElementById('user-name').value = '';
            } else {
                alert('Erreur lors de l\'ajout de l\'utilisateur: ' + result.message);
            }
        } catch (error) {
            console.error('Erreur:', error);
            alert('Erreur lors de l\'ajout de l\'utilisateur');
        }
    });

    async function loadUsers() {
        try {
            const response = await fetch('https://rt-projet.pu-pm.univ-fcomte.fr/users/tdavid/php/admin.php?action=get_users');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const text = await response.text();
            console.log('Response text:', text);
            try {
                const result = JSON.parse(text);
                if (result.success) {
                    console.log('Utilisateurs reçus:', result.users);
                    allUsers = result.users;
                    displayUsers(allUsers);
                    updateUserSelect(allUsers);
                } else {
                    console.error('Erreur lors du chargement des utilisateurs:', result.message);
                }
            } catch (jsonError) {
                console.error('Erreur de parsing JSON:', jsonError, 'Texte reçu:', text);
            }
        } catch (error) {
            console.error('Erreur lors du chargement des utilisateurs:', error);
        }
    }

    async function loadGroups() {
        try {
            const response = await fetch('https://rt-projet.pu-pm.univ-fcomte.fr/users/tdavid/php/admin.php?action=get_groups');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const text = await response.text();
            console.log('Response text:', text);
            try {
                const result = JSON.parse(text);
                if (result.success) {
                    allGroups = result.groups;
                    groupsTable.innerHTML = '';
                    result.groups.forEach(group => {
                        const row = groupsTable.insertRow();
                        row.innerHTML = `
                            <td>${group.id}</td>
                            <td>${group.name}</td>
                            <td>${group.description}</td>
                            <td>
                                <button class="btn btn-danger" onclick="deleteGroup(${group.id})">Supprimer</button>
                            </td>
                        `;
                    });
                    updateGroupSelects();
                }
            } catch (jsonError) {
                console.error('Erreur de parsing JSON:', jsonError, 'Texte reçu:', text);
            }
        } catch (error) {
            console.error('Erreur lors du chargement des groupes:', error);
        }
    }

    function updateGroupSelects() {
        const groupSelects = [userGroupSelect, document.getElementById('edit-group')];
        groupSelects.forEach(select => {
            if (select) {
                select.innerHTML = '<option value="">Sélectionner un groupe</option>';
                allGroups.forEach(group => {
                    const option = document.createElement('option');
                    option.value = group.id;
                    option.textContent = group.name;
                    select.appendChild(option);
                });
            }
        });
    }

    async function loadGroupsWeather() {
        try {
            const response = await fetch('https://rt-projet.pu-pm.univ-fcomte.fr/users/tdavid/php/admin.php?action=get_groups_weather');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const text = await response.text();
            console.log('Response text:', text);
            try {
                const result = JSON.parse(text);
                if (result.success) {
                    groupsWeatherDiv.innerHTML = '';
                    result.groups.forEach(group => {
                        const weatherDiv = document.createElement('div');
                        weatherDiv.className = 'group-weather';
                        
                        // Vérifier si les coordonnées existent
                        const coordinates = group.latitude && group.longitude 
                            ? `${group.latitude.toFixed(4)}, ${group.longitude.toFixed(4)}`
                            : 'Non disponible';
                        
                        // Vérifier si les données météo existent
                        let weatherData = '<p>Données météo non disponibles</p>';
                        if (group.weather_data) {
                            weatherData = `
                                <p>Température: ${group.weather_data.temperature}°C</p>
                                <p>Conditions: ${group.weather_data.conditions}</p>
                            `;
                        }

                        weatherDiv.innerHTML = `
                            <h3>${group.name}</h3>
                            <p>Position moyenne: ${coordinates}</p>
                            <div class="weather-data">
                                ${weatherData}
                            </div>
                        `;
                        groupsWeatherDiv.appendChild(weatherDiv);
                    });
                }
            } catch (jsonError) {
                console.error('Erreur de parsing JSON:', jsonError, 'Texte reçu:', text);
            }
        } catch (error) {
            console.error('Erreur lors du chargement de la météo des groupes:', error);
        }
    }

    // Fonctions globales pour les boutons de suppression
    window.deleteGroup = async function(groupId) {
        if (!confirm('Êtes-vous sûr de vouloir supprimer ce groupe ?')) return;

        try {
            const response = await fetch('https://rt-projet.pu-pm.univ-fcomte.fr/users/tdavid/php/admin.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'delete_group',
                    group_id: groupId
                })
            });

            const result = await response.json();
            if (result.success) {
                loadGroups();
                loadUsers();
            } else {
                alert('Erreur lors de la suppression du groupe: ' + result.message);
            }
        } catch (error) {
            console.error('Erreur:', error);
            alert('Erreur lors de la suppression du groupe');
        }
    };

    window.deleteUser = async function(userId) {
        if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) return;

        try {
            const response = await fetch('https://rt-projet.pu-pm.univ-fcomte.fr/users/tdavid/php/admin.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'delete_user',
                    user_id: userId
                })
            });

            const result = await response.json();
            if (result.success) {
                loadUsers();
            } else {
                alert('Erreur lors de la suppression de l\'utilisateur: ' + result.message);
            }
        } catch (error) {
            console.error('Erreur:', error);
            alert('Erreur lors de la suppression de l\'utilisateur');
        }
    };
}); 