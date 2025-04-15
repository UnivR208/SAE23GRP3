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
    const useLocationButton = document.getElementById('use-location-button');

    // Récupérer les informations de l'utilisateur connecté
    const userId = sessionStorage.getItem('userId');
    const userName = sessionStorage.getItem('userName');

    if (userId && userName) {
        studentInfo.innerHTML = `<p>Étudiant connecté : ${userName} (${userId})</p>`;
        loadStudentData(userId);
    }

    // Gestion de la géolocalisation
    useLocationButton.addEventListener('click', () => {
        if (!navigator.geolocation) {
            showAddResidenceError('La géolocalisation n\'est pas supportée par votre navigateur');
            return;
        }

        useLocationButton.disabled = true;
        useLocationButton.textContent = '📍 Localisation...';

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const lat = position.coords.latitude;
                    const lon = position.coords.longitude;

                    // Stocker les coordonnées dans des attributs data-
                    cityNameInput.dataset.lat = lat;
                    cityNameInput.dataset.lon = lon;

                    // Essayer d'obtenir le nom de la ville pour l'affichage
                    try {
                        const response = await fetch(
                            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`
                        );
                        const data = await response.json();
                        const city = data.address.city || data.address.town || data.address.village || data.address.municipality;
                        
                        if (city) {
                            cityNameInput.value = `${city} (${lat.toFixed(4)}, ${lon.toFixed(4)})`;
                        } else {
                            cityNameInput.value = `Position GPS: ${lat.toFixed(4)}, ${lon.toFixed(4)}`;
                        }
                    } catch (error) {
                        // En cas d'erreur de reverse geocoding, afficher juste les coordonnées
                        cityNameInput.value = `Position GPS: ${lat.toFixed(4)}, ${lon.toFixed(4)}`;
                    }
                    
                    showAddResidenceError('Position GPS trouvée', 'green');
                } catch (error) {
                    console.error('Erreur de géolocalisation:', error);
                    showAddResidenceError('Erreur lors de la récupération de la position');
                } finally {
                    useLocationButton.disabled = false;
                    useLocationButton.textContent = '📍 Ma position';
                }
            },
            (error) => {
                let errorMessage = 'Erreur de géolocalisation';
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage = 'Vous avez refusé la géolocalisation';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage = 'Position non disponible';
                        break;
                    case error.TIMEOUT:
                        errorMessage = 'La demande de géolocalisation a expiré';
                        break;
                }
                showAddResidenceError(errorMessage);
                useLocationButton.disabled = false;
                useLocationButton.textContent = '📍 Ma position';
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    });

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
        const cityInput = cityNameInput.value.trim();
        const startDate = startDateInput.value;
        const endDate = endDateInput.value;
        const residenceType = residenceTypeSelect.value;

        if (!cityInput || !startDate || !endDate) {
            showAddResidenceError('Veuillez remplir tous les champs');
            return;
        }

        try {
            let location;

            // Si on a des coordonnées GPS stockées, les utiliser directement
            if (cityNameInput.dataset.lat && cityNameInput.dataset.lon) {
                location = {
                    name: cityInput,
                    lat: parseFloat(cityNameInput.dataset.lat),
                    lon: parseFloat(cityNameInput.dataset.lon)
                };
            } else {
                // Vérifier si l'entrée est au format "lat, lon"
                const coordsMatch = cityInput.match(/^(-?\d+\.?\d*),\s*(-?\d+\.?\d*)$/);
                if (coordsMatch) {
                    const lat = parseFloat(coordsMatch[1]);
                    const lon = parseFloat(coordsMatch[2]);
                    
                    if (isValidCoordinates(lat, lon)) {
                        try {
                            // Essayer d'obtenir le nom de la ville
                            const response = await fetch(
                                `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`
                            );
                            const data = await response.json();
                            const cityName = data.address.city || data.address.town || data.address.village || 
                                          data.address.municipality || `Position GPS: ${lat}, ${lon}`;
                            
                            location = {
                                name: cityName,
                                lat: lat,
                                lon: lon
                            };
                        } catch (error) {
                            location = {
                                name: `Position GPS: ${lat}, ${lon}`,
                                lat: lat,
                                lon: lon
                            };
                        }
                    } else {
                        showAddResidenceError('Coordonnées invalides');
                        return;
                    }
                } else {
                    // Chercher par nom de ville
                    const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cityInput)}&format=json&limit=1`);
                    const data = await response.json();

                    if (data.length === 0) {
                        showAddResidenceError('Ville non trouvée');
                        return;
                    }

                    location = {
                        name: cityInput,
                        lat: parseFloat(data[0].lat),
                        lon: parseFloat(data[0].lon)
                    };
                }
            }

            // En mode développement, on stocke les données dans le sessionStorage
            const studentData = JSON.parse(sessionStorage.getItem('studentData')) || {
                students: [
                    {
                        id: sessionStorage.getItem('userId'),
                        name: sessionStorage.getItem('userName'),
                        email: sessionStorage.getItem('userEmail'),
                        main: {},
                        secondary: {},
                        other: {}
                    }
                ]
            };

            const student = studentData.students.find(s => s.id === sessionStorage.getItem('userId'));

            if (!student) {
                showAddResidenceError('Étudiant non trouvé');
                return;
            }

            // Mise à jour de la résidence
            student[residenceType] = {
                location: location,
                startDate: startDate,
                endDate: endDate
            };

            // Sauvegarde dans le sessionStorage
            sessionStorage.setItem('studentData', JSON.stringify(studentData));
            
            // Recharger les données
            loadStudentData(sessionStorage.getItem('userId'));
            
            // Réinitialiser le formulaire
            cityNameInput.value = '';
            cityNameInput.dataset.lat = '';
            cityNameInput.dataset.lon = '';
            startDateInput.value = '';
            endDateInput.value = '';
            
            showAddResidenceError('Résidence ajoutée avec succès', 'green');

        } catch (error) {
            console.error('Erreur lors de l\'ajout de la résidence:', error);
            showAddResidenceError('Erreur lors de l\'ajout de la résidence');
        }
    });

    // Fonction pour valider les coordonnées
    function isValidCoordinates(lat, lon) {
        return !isNaN(lat) && !isNaN(lon) && 
               lat >= -90 && lat <= 90 && 
               lon >= -180 && lon <= 180;
    }

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
            // Récupérer les données du sessionStorage
            const studentData = JSON.parse(sessionStorage.getItem('studentData'));
            const student = studentData?.students.find(s => s.id === studentId);

            if (student) {
                // Vérifier la validité des périodes d'étude
                const mainStageStatus = student.main.startDate ? checkDateValidity(student.main.startDate, student.main.endDate) : { isValid: false, message: "Pas de résidence principale" };
                const secondaryStageStatus = student.secondary.startDate ? checkDateValidity(student.secondary.startDate, student.secondary.endDate) : { isValid: false, message: "Pas de résidence secondaire" };
                const otherStageStatus = student.other.startDate ? checkDateValidity(student.other.startDate, student.other.endDate) : { isValid: false, message: "Pas de résidence alternative" };

                // Fonction pour formater les dates
                const formatDate = (dateStr) => {
                    if (!dateStr) return '';
                    const date = new Date(dateStr);
                    return date.toLocaleDateString('fr-FR');
                };

                studentInfo.innerHTML = `
                    <p>Nom : ${student.name}</p>
                    <p>Email : ${student.email}</p>
                    <div style="margin: 10px 0;">
                        <p><strong>Résidence Principale ${student.main.location ? `(${student.main.location.name})` : ''}</strong></p>
                        ${student.main.startDate ? `
                            <p style="margin: 5px 0;">
                                <span style="color: #666;">Période : du ${formatDate(student.main.startDate)} au ${formatDate(student.main.endDate)}</span>
                            </p>
                        ` : ''}
                        <p style="color: ${mainStageStatus.isValid ? 'green' : 'red'}">
                            ${mainStageStatus.message}
                        </p>
                    </div>
                    <div style="margin: 10px 0;">
                        <p><strong>Résidence Secondaire ${student.secondary.location ? `(${student.secondary.location.name})` : ''}</strong></p>
                        ${student.secondary.startDate ? `
                            <p style="margin: 5px 0;">
                                <span style="color: #666;">Période : du ${formatDate(student.secondary.startDate)} au ${formatDate(student.secondary.endDate)}</span>
                            </p>
                        ` : ''}
                        <p style="color: ${secondaryStageStatus.isValid ? 'green' : 'red'}">
                            ${secondaryStageStatus.message}
                        </p>
                    </div>
                    <div style="margin: 10px 0;">
                        <p><strong>Autre Résidence ${student.other.location ? `(${student.other.location.name})` : ''}</strong></p>
                        ${student.other.startDate ? `
                            <p style="margin: 5px 0;">
                                <span style="color: #666;">Période : du ${formatDate(student.other.startDate)} au ${formatDate(student.other.endDate)}</span>
                            </p>
                        ` : ''}
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