document.addEventListener('DOMContentLoaded', function() {
    const weatherManager = new WeatherManager();

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
            
            // Récupération des données météo
            const weatherData = await weatherManager.getWeather(location.lat, location.lon);
            
            // Affichage de la météo actuelle
            currentWeather.innerHTML = `
                <h3>Météo à ${location.name}</h3>
                <div>
                    <p>${weatherManager.getWeatherIcon(weatherData.current.weather_code)}</p>
                    <p>Température : ${weatherManager.formatTemperature(weatherData.current.temperature_2m)}</p>
                    <p>Humidité : ${weatherData.current.relative_humidity_2m}%</p>
                    <p>Précipitations : ${weatherData.current.precipitation} mm</p>
                    <p>Vent : ${weatherData.current.wind_speed_10m} km/h</p>
                </div>
            `;

            // Affichage des prévisions (5 jours)
            const forecastHTML = weatherData.forecast.time
                .slice(0, 5) // Limiter à 5 jours
                .map((date, index) => `
                    <div style="border: 1px solid #ccc; padding: 10px; margin: 5px;">
                        <p><strong>${weatherManager.formatDate(date)}</strong></p>
                        <p>${weatherManager.getWeatherIcon(weatherData.forecast.weather_code[index])}</p>
                        <p>Max: ${weatherManager.formatTemperature(weatherData.forecast.temperature_2m_max[index])}</p>
                        <p>Min: ${weatherManager.formatTemperature(weatherData.forecast.temperature_2m_min[index])}</p>
                        <p>Probabilité de pluie: ${weatherData.forecast.precipitation_probability_max[index]}%</p>
                    </div>
                `).join('');

            forecast.innerHTML = `
                <h3>Prévisions sur 5 jours</h3>
                <div style="display: flex; flex-wrap: wrap; gap: 10px;">
                    ${forecastHTML}
                </div>
            `;

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