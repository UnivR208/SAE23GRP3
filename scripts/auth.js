document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const errorMessage = document.getElementById('errorMessage');

    if (!loginForm || !errorMessage) {
        console.error('Éléments du formulaire non trouvés');
        return;
    }

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const identifierInput = document.getElementById('identifier');
        const passwordInput = document.getElementById('password');

        if (!identifierInput || !passwordInput) {
            showError('Erreur: champs de formulaire non trouvés');
            return;
        }

        const identifier = identifierInput.value.trim();
        const password = passwordInput.value.trim();

        if (!identifier || !password) {
            showError('Veuillez remplir tous les champs');
            return;
        }

        try {
            const response = await fetch('/users/tdavid/data/students.json');
            if (!response.ok) {
                throw new Error('Erreur lors du chargement des données');
            }
            
            const data = await response.json();
            
            // Recherche dans les étudiants
            const student = data.students.find(s => 
                (s.id === identifier || s.email === identifier) && 
                s.password === password
            );
            
            if (student) {
                sessionStorage.setItem('loggedIn', 'true');
                sessionStorage.setItem('userId', student.id);
                sessionStorage.setItem('userName', student.name);
                sessionStorage.setItem('userEmail', student.email);
                sessionStorage.setItem('userRole', 'student');
                window.location.href = 'index.html';
                return;
            }

            // Recherche dans les administrateurs
            const admin = data.admins.find(a => 
                (a.id === identifier || a.email === identifier) && 
                a.password === password
            );
            
            if (admin) {
                sessionStorage.setItem('loggedIn', 'true');
                sessionStorage.setItem('userId', admin.id);
                sessionStorage.setItem('userName', admin.name);
                sessionStorage.setItem('userEmail', admin.email);
                sessionStorage.setItem('userRole', 'admin');
                window.location.href = 'admin.html';
                return;
            }

            showError('Identifiants incorrects');
        } catch (error) {
            console.error('Erreur lors de la vérification des identifiants:', error);
            showError('Une erreur est survenue lors de la connexion');
        }
    });

    function showError(message) {
        if (errorMessage) {
            errorMessage.textContent = message;
            errorMessage.style.display = 'block';
            setTimeout(() => {
                errorMessage.style.display = 'none';
            }, 3000);
        }
    }
}); 