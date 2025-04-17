// Configuration
const BASE_URL = 'https://rt-projet.pu-pm.univ-fcomte.fr/users/tdavid';

document.addEventListener('DOMContentLoaded', function() {
    // Ajouter la classe de chargement au body
    document.body.classList.add('loading');

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
    const addResidenceForm = document.getElementById('add-residence-form');

    // Initialiser la date du jour dans le formulaire
    const today = new Date().toISOString().split('T')[0];
    startDateInput.value = today;
    
    // Récupérer les informations de l'utilisateur connecté
    const userEmail = sessionStorage.getItem('userEmail');
    const userName = sessionStorage.getItem('userName');

    if (userEmail && userName) {
        studentInfo.innerHTML = `<p>Étudiant connecté : ${userName} (${userEmail})</p>`;
        loadStudentData(userEmail);
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
                            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=fr`
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
    function handleResidenceClick(residenceType) {
        console.log('Clic sur la résidence:', residenceType); // Debug
        const residence = currentResidences?.find(r => r.type === residenceType);
        console.log('Résidence trouvée:', residence); // Debug
        
        if (residence) {
            // Mettre à jour l'interface visuelle
            document.querySelectorAll('.residence-button').forEach(btn => {
                btn.classList.remove('active');
            });
            
            const clickedButton = document.querySelector(`[data-residence="${residenceType}"]`);
            if (clickedButton) {
                clickedButton.classList.add('active');
            }
            
            // Charger les données météo
            loadResidenceData(residenceType, residence).then(() => {
                console.log('Données météo chargées pour:', residenceType); // Debug
            }).catch(error => {
                console.error('Erreur lors du chargement des données:', error);
                showError('Erreur lors du chargement des données météo');
            });
        } else {
            console.log('Aucune résidence trouvée pour:', residenceType); // Debug
            showError(`Aucune résidence ${residenceType} trouvée`);
        }
    }

    // Ajouter les gestionnaires d'événements pour les boutons de résidence
    document.querySelectorAll('.residence-button').forEach(button => {
        button.addEventListener('click', () => {
            const residenceType = button.getAttribute('data-residence');
            handleResidenceClick(residenceType);
        });
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
                    name: cityInput.split(' (')[0], // Extraire le nom de la ville sans les coordonnées
                    lat: parseFloat(cityNameInput.dataset.lat),
                    lon: parseFloat(cityNameInput.dataset.lon)
                };
            } else {
                // Chercher par nom de ville
                const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cityInput)}&format=json&limit=1&accept-language=fr`);
                const data = await response.json();

                if (data.length === 0) {
                    showAddResidenceError('Ville non trouvée');
                    return;
                }

                location = {
                    name: data[0].display_name.split(',')[0], // Prendre le premier élément (nom de la ville)
                    lat: parseFloat(data[0].lat),
                    lon: parseFloat(data[0].lon)
                };
            }

            // Récupérer les données actuelles
            const response = await fetch(`${BASE_URL}/data/students.json`);
            const studentData = await response.json();

            // Trouver l'étudiant actuel
            const currentStudent = studentData.students.find(s => s.email === userEmail);
            if (!currentStudent) {
                throw new Error('Étudiant non trouvé');
            }

            // Mettre à jour la résidence dans le JSON
            currentStudent[residenceType] = {
                location: location,
                startDate: startDate,
                endDate: endDate
            };

            // Envoyer la requête à l'API
            const apiResponse = await fetch(`${BASE_URL}/php/sync.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'add_residence',
                    user_email: userEmail,
                    residence: {
                        name: location.name,
                        location_lat: location.lat,
                        location_lng: location.lon,
                        type: residenceType,
                        start_date: startDate,
                        end_date: endDate
                    }
                })
            });

            const result = await apiResponse.json();
            
            if (result.success) {
                // Recharger les données de l'étudiant
                await loadStudentData(userEmail);
                
                // Réinitialiser le formulaire
                cityNameInput.value = '';
                cityNameInput.dataset.lat = '';
                cityNameInput.dataset.lon = '';
                startDateInput.value = today;
                endDateInput.value = '';
                
                showAddResidenceError('Résidence ajoutée avec succès', 'green');
                
                // Mettre à jour l'affichage de la résidence
                if (residenceType === 'main') {
                    loadResidenceData('main');
                } else if (residenceType === 'secondary') {
                    loadResidenceData('secondary');
                } else {
                    loadResidenceData('other');
                }
            } else {
                throw new Error(result.message || 'Erreur lors de l\'ajout de la résidence');
            }
        } catch (error) {
            console.error('Erreur lors de l\'ajout de la résidence:', error);
            showAddResidenceError(error.message || 'Erreur lors de l\'ajout de la résidence');
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
        if (!startDate || !endDate) {
            return { isValid: false, message: "Dates non définies" };
        }

        const now = new Date();
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return { isValid: false, message: "Format de date invalide" };
        }
        
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

    // Fonction pour mettre à jour l'affichage des résidences
    function updateResidenceDisplay(mainResidence, secondaryResidence, otherResidence) {
        const mainResidenceDiv = document.getElementById('main-residence');
        const secondaryResidenceDiv = document.getElementById('secondary-residence');
        const otherResidenceDiv = document.getElementById('other-residence');
        
        if (mainResidence) {
            mainResidenceDiv.innerHTML = `
                <h3>Résidence Principale</h3>
                <p>${mainResidence.name}</p>
                <p>Du ${formatDate(mainResidence.start_date)} au ${formatDate(mainResidence.end_date)}</p>
            `;
            mainResidenceDiv.disabled = false;
        } else {
            mainResidenceDiv.innerHTML = 'Résidence Principale';
            mainResidenceDiv.disabled = true;
        }
        
        if (secondaryResidence) {
            secondaryResidenceDiv.innerHTML = `
                <h3>Résidence Secondaire</h3>
                <p>${secondaryResidence.name}</p>
                <p>Du ${formatDate(secondaryResidence.start_date)} au ${formatDate(secondaryResidence.end_date)}</p>
            `;
            secondaryResidenceDiv.disabled = false;
        } else {
            secondaryResidenceDiv.innerHTML = 'Résidence Secondaire';
            secondaryResidenceDiv.disabled = true;
        }

        if (otherResidence) {
            otherResidenceDiv.innerHTML = `
                <h3>Autre Résidence</h3>
                <p>${otherResidence.name}</p>
                <p>Du ${formatDate(otherResidence.start_date)} au ${formatDate(otherResidence.end_date)}</p>
            `;
            otherResidenceDiv.disabled = false;
        } else {
            otherResidenceDiv.innerHTML = 'Autre Résidence';
            otherResidenceDiv.disabled = true;
        }
    }

    // Variable pour stocker les résidences actuelles
    let currentResidences = [];

    async function loadStudentData(email) {
        try {
            // Récupérer d'abord les informations de l'utilisateur
            const userResponse = await fetch(`${BASE_URL}/php/api/user.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'get_user',
                    user_email: email
                })
            });

            if (!userResponse.ok) {
                throw new Error(`Erreur HTTP: ${userResponse.status}`);
            }

            const userData = await userResponse.json();
            
            if (!userData.success) {
                console.error('Erreur API user:', userData.message);
                // On continue même si on ne peut pas récupérer le nom, on affichera juste l'email
            }

            // Mettre à jour l'affichage du nom de l'étudiant
            const studentInfo = document.getElementById('student-info');
            if (studentInfo) {
                const userName = userData.success ? userData.user.name : 'Utilisateur';
                studentInfo.innerHTML = `<p>Étudiant connecté : ${userName} (${email})</p>`;
            }

            // Charger les résidences
            const response = await fetch(`${BASE_URL}/php/api/residence.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'get_residences',
                    user_email: email
                })
            });

            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.success) {
                // Stocker les résidences pour les utiliser plus tard
                currentResidences = data.residences;
                
                // Mettre à jour l'état des boutons en fonction des résidences disponibles
                const mainResidenceBtn = document.getElementById('main-residence');
                const secondaryResidenceBtn = document.getElementById('secondary-residence');
                const otherResidenceBtn = document.getElementById('other-residence');
                
                const mainResidence = currentResidences.find(r => r.type === 'main');
                const secondaryResidence = currentResidences.find(r => r.type === 'secondary');
                const otherResidence = currentResidences.find(r => r.type === 'other');
                
                // Activer/désactiver les boutons en fonction des résidences disponibles
                if (mainResidenceBtn) {
                    mainResidenceBtn.disabled = !mainResidence;
                }
                if (secondaryResidenceBtn) {
                    secondaryResidenceBtn.disabled = !secondaryResidence;
                }
                if (otherResidenceBtn) {
                    otherResidenceBtn.disabled = !otherResidence;
                }
                
                // Mettre à jour l'affichage avec les résidences
                updateResidenceDisplay(mainResidence, secondaryResidence, otherResidence);
                
                // Si une résidence est active, charger sa météo
                if (mainResidence) {
                    loadResidenceData('main', mainResidence);
                    // Mettre en évidence la résidence principale par défaut
                    if (mainResidenceBtn) mainResidenceBtn.classList.add('active');
                } else if (secondaryResidence) {
                    loadResidenceData('secondary', secondaryResidence);
                    // Mettre en évidence la résidence secondaire par défaut
                    if (secondaryResidenceBtn) secondaryResidenceBtn.classList.add('active');
                } else if (otherResidence) {
                    loadResidenceData('other', otherResidence);
                    // Mettre en évidence la résidence autre par défaut
                    if (otherResidenceBtn) otherResidenceBtn.classList.add('active');
                }
            } else {
                console.error('Erreur API residence:', data.message);
                showError('Erreur lors du chargement des résidences');
            }
        } catch (error) {
            console.error('Erreur lors du chargement des données:', error);
            showError('Erreur lors du chargement des données');
        }
    }

    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR');
    }

    async function loadResidenceData(residenceType, residenceData) {
        try {
            console.log('Chargement des données pour:', residenceType, residenceData);
            
            // Si les données de résidence ne sont pas fournies, tenter de les récupérer
            // à partir de currentResidences
            if (!residenceData) {
                residenceData = currentResidences.find(r => r.type === residenceType);
                
                if (!residenceData) {
                    throw new Error(`Résidence ${residenceType} non trouvée`);
                }
            }

            const dateStatus = checkDateValidity(residenceData.start_date, residenceData.end_date);
            console.log('Statut des dates:', dateStatus);

            if (!dateStatus.isValid) {
                currentWeather.innerHTML = `<p style="color: red">${dateStatus.message}</p>`;
                forecast.innerHTML = '';
                return;
            }

            const location = {
                lat: residenceData.location_lat,
                lon: residenceData.location_lng,
                name: residenceData.name
            };
            
            console.log('Récupération des données météo pour:', location);
            const weatherData = await weatherManager.getWeather(location.lat, location.lon);
            console.log('Données météo reçues:', weatherData);
            
            // Mise à jour de l'interface
            updateWeatherDisplay(weatherData, location);
            
        } catch (error) {
            console.error('Erreur lors du chargement des données de résidence:', error);
            showError('Erreur lors du chargement des données de résidence');
        }
    }

    function updateWeatherDisplay(weatherData, location) {
        console.log('Mise à jour de l\'affichage météo avec:', weatherData, location);
        
        if (!weatherData || !weatherData.current) {
            console.error('Données météo invalides:', weatherData);
            showError('Données météo invalides');
            return;
        }

        // Nettoyage du nom de la résidence
        let displayName = location.name;

        // Affichage de la météo actuelle
        currentWeather.innerHTML = `
            <h3>Météo à ${displayName}</h3>
            <div>
                <p>${weatherManager.getWeatherIcon(weatherData.current.weather_code)}</p>
                <p>Température : ${weatherManager.formatTemperature(weatherData.current.temperature_2m)}</p>
                <p>Humidité : ${weatherData.current.relative_humidity_2m}%</p>
                <p>Précipitations : ${weatherData.current.precipitation} mm</p>
                <p>Vent : ${weatherData.current.wind_speed_10m} km/h</p>
            </div>
        `;

        // Affichage des prévisions (5 jours)
        if (weatherData.forecast && weatherData.forecast.time) {
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
                <h3>Prévisions pour les prochains jours</h3>
                <div style="display: flex; overflow-x: auto;">
                    ${forecastHTML}
                </div>
            `;
        } else {
            forecast.innerHTML = '<p>Aucune prévision disponible</p>';
        }
    }

    function showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        errorDiv.style.backgroundColor = '#f44336';
        errorDiv.style.color = 'white';
        errorDiv.style.padding = '10px';
        errorDiv.style.margin = '10px 0';
        errorDiv.style.borderRadius = '5px';
        
        const container = document.querySelector('.container');
        container.insertBefore(errorDiv, container.firstChild);
        
        setTimeout(() => errorDiv.remove(), 5000);
    }
}); 