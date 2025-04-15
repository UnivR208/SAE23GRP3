document.addEventListener('DOMContentLoaded', function() {
    // Éléments du DOM
    const studentSearch = document.getElementById('student-search');
    const searchButton = document.getElementById('search-button');
    const mainResidence = document.getElementById('main-residence');
    const secondaryResidence = document.getElementById('secondary-residence');
    const studentInfo = document.getElementById('student-info');
    const currentWeather = document.getElementById('current-weather');
    const forecast = document.getElementById('forecast');

    // Récupérer les informations de l'utilisateur connecté
    const userId = sessionStorage.getItem('userId');
    const userName = sessionStorage.getItem('userName');

    if (userId && userName) {
        studentInfo.innerHTML = `<p>Étudiant connecté : ${userName} (${userId})</p>`;
        loadStudentData(userId);
    }

    // Gestion de la recherche d'étudiants
    searchButton.addEventListener('click', () => {
        const searchTerm = studentSearch.value.trim();
        if (searchTerm) {
            loadStudentData(searchTerm);
        }
    });

    // Gestion du changement de résidence
    mainResidence.addEventListener('click', () => {
        mainResidence.disabled = true;
        secondaryResidence.disabled = false;
        loadResidenceData('main');
    });

    secondaryResidence.addEventListener('click', () => {
        mainResidence.disabled = false;
        secondaryResidence.disabled = true;
        loadResidenceData('secondary');
    });

    async function loadStudentData(studentId) {
        try {
            const response = await fetch('data/students.json');
            const data = await response.json();
            const student = data.students.find(s => s.id === studentId);

            if (student) {
                studentInfo.innerHTML = `
                    <p>Nom : ${student.name}</p>
                    <p>Email : ${student.email}</p>
                    <p>Résidence principale : ${student.main.location.name}</p>
                    <p>Résidence secondaire : ${student.secondary.location.name}</p>
                `;
                loadResidenceData('main', student);
            } else {
                showError('Étudiant non trouvé');
            }
        } catch (error) {
            console.error('Erreur lors du chargement des données:', error);
            showError('Erreur lors du chargement des données');
        }
    }

    async function loadResidenceData(residenceType, studentData) {
        try {
            if (!studentData) {
                const response = await fetch('data/students.json');
                const data = await response.json();
                studentData = data.students.find(s => s.id === userId);
            }

            if (!studentData) {
                showError('Données étudiant non trouvées');
                return;
            }

            const location = studentData[residenceType].location;
            currentWeather.innerHTML = `
                <p>Ville : ${location.name}</p>
                <p>Latitude : ${location.lat}</p>
                <p>Longitude : ${location.lon}</p>
            `;

            // Ici, vous pouvez ajouter l'appel à l'API météo si nécessaire
        } catch (error) {
            console.error('Erreur lors du chargement des données de résidence:', error);
            showError('Erreur lors du chargement des données de résidence');
        }
    }

    function showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.style.color = 'red';
        errorDiv.textContent = message;
        studentInfo.appendChild(errorDiv);
        setTimeout(() => errorDiv.remove(), 3000);
    }
}); 