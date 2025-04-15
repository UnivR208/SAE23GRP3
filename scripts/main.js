document.addEventListener('DOMContentLoaded', function() {
    const weatherManager = new WeatherManager();

    // Éléments du DOM
    const studentSearch = document.getElementById('student-search');
    const searchButton = document.getElementById('search-button');
    const mainResidence = document.getElementById('main-residence');
    const secondaryResidence = document.getElementById('secondary-residence');
    const otherResidence = document.getElementById('other-residence');
    const studentInfo = document.getElementById('student-info');
    const currentWeather = document.getElementById('current-weather');
    const forecast = document.getElementById('forecast');
    const addResidenceButton = document.getElementById('add-residence-button');
    const cityNameInput = document.getElementById('city-name');
    const startDateInput = document.getElementById('start-date');
    const endDateInput = document.getElementById('end-date');
    const residenceTypeSelect = document.getElementById('residence-type');
    const addResidenceError = document.getElementById('add-residence-error');

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
        otherResidence.disabled = false;
        loadResidenceData('main');
    });

    secondaryResidence.addEventListener('click', () => {
        mainResidence.disabled = false;
        secondaryResidence.disabled = true;
        otherResidence.disabled = false;
        loadResidenceData('secondary');
    });

    otherResidence.addEventListener('click', () => {
        mainResidence.disabled = false;
        secondaryResidence.disabled = false;
        otherResidence.disabled = true;
        loadResidenceData('other');
    });

    // Gestion de l'ajout d'une résidence
    addResidenceButton.addEventListener('click', async () => {
        const cityName = cityNameInput.value.trim();
        const startDate = startDateInput.value;
        const endDate = endDateInput.value;
        const residenceType = residenceTypeSelect.value;

        if (!cityName || !startDate || !endDate) {
            showAddResidenceError('Veuillez remplir tous les champs');
            return;
        }

        try {
            // Conversion du nom de la ville en coordonnées via l'API Nominatim
            const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cityName)}&format=json&limit=1`);
            const data = await response.json();

            if (data.length === 0) {
                showAddResidenceError('Ville non trouvée');
                return;
            }

            const location = {
                name: cityName,
                lat: parseFloat(data[0].lat),
                lon: parseFloat(data[0].lon)
            };

            // Mise à jour du fichier students.json
            const studentResponse = await fetch('data/students.json');
            const studentData = await studentResponse.json();
            const student = studentData.students.find(s => s.id === userId);

            if (!student) {
                showAddResidenceError('Étudiant non trouvé');
                return;
            }

            // Initialiser l'objet 'other' s'il n'existe pas
            if (residenceType === 'other' && !student.other) {
                student.other = {};
            }

            // Mise à jour de la résidence
            student[residenceType] = {
                location: location,
                startDate: startDate,
                endDate: endDate
            };

            // Sauvegarde des modifications
            try {
                const saveResponse = await fetch('data/students.json', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(studentData)
                });

                if (!saveResponse.ok) {
                    throw new Error('Erreur lors de la sauvegarde');
                }

                // Recharger les données
                loadStudentData(userId);
                
                // Réinitialiser le formulaire
                cityNameInput.value = '';
                startDateInput.value = '';
                endDateInput.value = '';
                
                showAddResidenceError('Résidence ajoutée avec succès', 'green');
            } catch (error) {
                console.error('Erreur lors de la sauvegarde:', error);
                showAddResidenceError('Erreur lors de la sauvegarde des données');
            }
        } catch (error) {
            console.error('Erreur lors de la conversion des coordonnées:', error);
            showAddResidenceError('Erreur lors de la recherche de la ville');
        }
    });

    function showAddResidenceError(message, color = 'red') {
        addResidenceError.style.color = color;
        addResidenceError.textContent = message;
        setTimeout(() => {
            addResidenceError.textContent = '';
        }, 3000);
    }

    function checkDateValidity(startDate, endDate) {
        const now = new Date();
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        if (now < start) {
            return { isValid: false, message: "La période d'étude n'a pas encore commencé" };
        }
        if (now > end) {
            return { isValid: false, message: "La période d'étude est terminée" };
        }
        return { 
            isValid: true, 
            message: `Période d'étude en cours (du ${start.toLocaleDateString('fr-FR')} au ${end.toLocaleDateString('fr-FR')})`
        };
    }

    async function loadStudentData(studentId) {
        try {
            const response = await fetch('data/students.json');
            const data = await response.json();
            const student = data.students.find(s => s.id === studentId);

            if (student) {
                // Vérifier la validité des périodes d'étude
                const mainStageStatus = checkDateValidity(student.main.startDate, student.main.endDate);
                const secondaryStageStatus = checkDateValidity(student.secondary.startDate, student.secondary.endDate);
                const otherStageStatus = student.other ? checkDateValidity(student.other.startDate, student.other.endDate) : { isValid: false, message: "Pas de résidence alternative" };

                studentInfo.innerHTML = `
                    <p>Nom : ${student.name}</p>
                    <p>Email : ${student.email}</p>
                    <div style="margin: 10px 0;">
                        <p><strong>Résidence Principale (${student.main.location.name})</strong></p>
                        <p style="color: ${mainStageStatus.isValid ? 'green' : 'red'}">
                            ${mainStageStatus.message}
                        </p>
                    </div>
                    <div style="margin: 10px 0;">
                        <p><strong>Résidence Secondaire (${student.secondary.location.name})</strong></p>
                        <p style="color: ${secondaryStageStatus.isValid ? 'green' : 'red'}">
                            ${secondaryStageStatus.message}
                        </p>
                    </div>
                    <div style="margin: 10px 0;">
                        <p><strong>Autre Résidence ${student.other ? `(${student.other.location.name})` : ''}</strong></p>
                        <p style="color: ${otherStageStatus.isValid ? 'green' : 'red'}">
                            ${otherStageStatus.message}
                        </p>
                    </div>
                `;

                // Désactiver les boutons si la période n'est pas valide
                mainResidence.disabled = !mainStageStatus.isValid;
                secondaryResidence.disabled = !secondaryStageStatus.isValid;
                otherResidence.disabled = !otherStageStatus.isValid;

                // Charger les données de la première résidence valide
                if (mainStageStatus.isValid) {
                    loadResidenceData('main', student);
                } else if (secondaryStageStatus.isValid) {
                    loadResidenceData('secondary', student);
                } else if (otherStageStatus.isValid) {
                    loadResidenceData('other', student);
                } else {
                    currentWeather.innerHTML = '<p>Aucune période d\'étude en cours</p>';
                    forecast.innerHTML = '';
                }
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

            const residence = studentData[residenceType];
            
            if (!residence) {
                showError(`Résidence ${residenceType} non trouvée`);
                return;
            }

            const dateStatus = checkDateValidity(residence.startDate, residence.endDate);

            if (!dateStatus.isValid) {
                currentWeather.innerHTML = `<p style="color: red">${dateStatus.message}</p>`;
                forecast.innerHTML = '';
                return;
            }

            const location = residence.location;
            
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
                .slice(0, 5)
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