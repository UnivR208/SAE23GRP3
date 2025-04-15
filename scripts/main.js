document.addEventListener('DOMContentLoaded', function() {
    const weatherManager = new WeatherManager();
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
    
    // Éléments du DOM
    const studentSearch = document.getElementById('student-search');
    const searchButton = document.getElementById('search-button');
    const residenceButtons = document.querySelectorAll('.residence-button');
    const weatherInfo = document.querySelector('.weather-info');
    const dailyForecast = document.querySelector('.daily-forecast');

    // Chargement initial des données de l'utilisateur connecté
    if (currentUser) {
        loadStudentData(currentUser.id);
    }

    // Gestion de la recherche d'étudiants
    searchButton.addEventListener('click', async () => {
        const searchTerm = studentSearch.value.trim();
        if (searchTerm) {
            await loadStudentData(searchTerm);
        }
    });

    // Gestion du changement de résidence
    residenceButtons.forEach(button => {
        button.addEventListener('click', () => {
            residenceButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            updateWeatherDisplay(button.dataset.residence);
        });
    });

    async function loadStudentData(studentId) {
        try {
            const response = await fetch('data/students.json');
            const data = await response.json();
            const student = data.students.find(s => s.id === studentId);

            if (student) {
                updateWeatherDisplay('main', student.main.location);
            } else {
                showError('Étudiant non trouvé');
            }
        } catch (error) {
            console.error('Erreur lors du chargement des données:', error);
            showError('Erreur lors du chargement des données');
        }
    }

    async function updateWeatherDisplay(residenceType, location) {
        try {
            let currentLocation = location;
            
            // If location is not provided, get it from the current student data
            if (!currentLocation) {
                const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
                if (!currentUser) {
                    showError('Aucun étudiant sélectionné');
                    return;
                }
                
                const response = await fetch('data/students.json');
                const data = await response.json();
                const student = data.students.find(s => s.id === currentUser.id);
                
                if (!student) {
                    showError('Étudiant non trouvé');
                    return;
                }
                
                if (!student[residenceType] || !student[residenceType].location) {
                    showError(`Aucune résidence ${residenceType} trouvée pour cet étudiant`);
                    return;
                }
                
                currentLocation = student[residenceType].location;
            }

            if (!currentLocation || !currentLocation.lat || !currentLocation.lon) {
                showError('Coordonnées de localisation invalides');
                return;
            }

            const weatherData = await weatherManager.getWeather(currentLocation.lat, currentLocation.lon);
            
            // Mise à jour de la météo actuelle
            const current = weatherData.current;
            weatherInfo.innerHTML = `
                <div class="weather-card">
                    <div class="weather-icon">${weatherManager.getWeatherIcon(current.weather_code)}</div>
                    <div class="temperature">${weatherManager.formatTemperature(current.temperature_2m)}</div>
                    <div class="details">
                        <p>Humidité: ${current.relative_humidity_2m}%</p>
                        <p>Précipitations: ${current.precipitation}mm</p>
                        <p>Vent: ${current.wind_speed_10m} km/h</p>
                    </div>
                </div>
            `;

            // Mise à jour des prévisions
            dailyForecast.innerHTML = weatherData.forecast.time.map((date, index) => `
                <div class="forecast-card">
                    <div class="date">${weatherManager.formatDate(date)}</div>
                    <div class="weather-icon">${weatherManager.getWeatherIcon(weatherData.forecast.weather_code[index])}</div>
                    <div class="temperatures">
                        <span class="max">${weatherManager.formatTemperature(weatherData.forecast.temperature_2m_max[index])}</span>
                        <span class="min">${weatherManager.formatTemperature(weatherData.forecast.temperature_2m_min[index])}</span>
                    </div>
                    <div class="precipitation">
                        Pluie: ${weatherData.forecast.precipitation_probability_max[index]}%
                    </div>
                </div>
            `).join('');
        } catch (error) {
            console.error('Erreur lors de la mise à jour de la météo:', error);
            showError('Erreur lors de la mise à jour de la météo');
        }
    }

    function showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        document.querySelector('.weather-display').appendChild(errorDiv);
        setTimeout(() => errorDiv.remove(), 3000);
    }
}); 