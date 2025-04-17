document.addEventListener('DOMContentLoaded', function() {
    const weatherManager = new WeatherManager();
    const dataManager = new LocalDataManager();

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
    const logoutButton = document.getElementById('logout-button');

    // Initialiser la date du jour dans le formulaire
    const today = new Date().toISOString().split('T')[0];
    startDateInput.value = today;
    
    // Récupérer les informations de l'utilisateur connecté
    const userId = sessionStorage.getItem('userId');
    const userName = sessionStorage.getItem('userName');

    if (userId && userName) {
        studentInfo.innerHTML = `<p>Étudiant connecté : ${userName} (${userId})</p>`;
        loadStudentData(userId);
    }
    
    // Bouton de déconnexion
    logoutButton.addEventListener('click', handleLogout);

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

            // Utiliser le gestionnaire de données local
            const result = await dataManager.addResidence({
                user_id: sessionStorage.getItem('userId'),
                type: residenceType,
                city_name: location.name,
                latitude: location.lat,
                longitude: location.lon,
                start_date: startDate,
                end_date: endDate
            });
            
            if (result.success) {
                // Recharger les données de l'étudiant
                await loadStudentData(sessionStorage.getItem('userId'));
                
                // Réinitialiser le formulaire
                cityNameInput.value = '';
                delete cityNameInput.dataset.lat;
                delete cityNameInput.dataset.lon;
                
                showAddResidenceError('Résidence ajoutée avec succès', 'green');
            } else {
                showAddResidenceError(result.message || 'Erreur lors de l\'ajout de la résidence');
            }
        } catch (error) {
            console.error('Erreur:', error);
            showAddResidenceError('Une erreur est survenue');
        }
    });

    // Fonction pour vérifier si les coordonnées sont valides
    function isValidCoordinates(lat, lon) {
        return lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
    }

    // Fonction pour afficher les erreurs du formulaire d'ajout de résidence
    function showAddResidenceError(message, color = 'red') {
        addResidenceError.style.color = color;
        addResidenceError.textContent = message;
        
        // Effacer le message après 5 secondes
        setTimeout(() => {
            addResidenceError.textContent = '';
        }, 5000);
    }

    // Fonction pour vérifier la validité des dates
    function checkDateValidity(startDate, endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        // Vérifier que la date de début est avant la date de fin
        if (start > end) {
            return {
                valid: false,
                message: 'La date de début doit être avant la date de fin'
            };
        }
        
        // Vérifier que la date de début n'est pas dans le futur
        const now = new Date();
        if (start > now) {
            return {
                valid: false,
                message: 'La date de début ne peut pas être dans le futur'
            };
        }
        
        // Vérifier que la durée n'est pas trop longue (par exemple, max 5 ans)
        const maxDuration = 5 * 365 * 24 * 60 * 60 * 1000; // 5 ans en millisecondes
        if (end - start > maxDuration) {
            return {
                valid: false,
                message: 'La durée maximale est de 5 ans'
            };
        }
        
        return {
            valid: true
        };
    }

    // Fonction pour mettre à jour l'interface d'ajout de résidence
    function updateAddInterface(student) {
        // Activer/désactiver les types de résidence dans le formulaire d'ajout
        if (student.residences) {
            const existingTypes = Object.keys(student.residences).filter(type => student.residences[type] !== null);
            
            // Mettre à jour les options du select
            const typeSelect = document.getElementById('residence-type');
            
            // Vider le select
            typeSelect.innerHTML = '';
            
            // Ajouter les options disponibles
            ['main', 'secondary', 'other'].forEach(type => {
                if (!student.residences[type]) { // Si cette résidence n'existe pas encore
                    const option = document.createElement('option');
                    option.value = type;
                    
                    let label;
                    switch (type) {
                        case 'main': label = 'Principale'; break;
                        case 'secondary': label = 'Secondaire'; break;
                        case 'other': label = 'Autre'; break;
                    }
                    
                    option.textContent = label;
                    typeSelect.appendChild(option);
                }
            });
            
            // Désactiver le bouton d'ajout si toutes les résidences sont déjà définies
            addResidenceButton.disabled = typeSelect.options.length === 0;
            
            if (typeSelect.options.length === 0) {
                showAddResidenceError('Toutes les résidences sont déjà définies', 'orange');
            }
        }
    }

    // Fonction pour charger les données d'un étudiant
    async function loadStudentData(studentId) {
        try {
            const result = await dataManager.getStudentData(studentId);
            
            if (result.success) {
                const student = result.student;
                
                // Mettre à jour les informations de l'étudiant
                studentInfo.innerHTML = `
                    <p>Étudiant: ${student.name} (${student.id})</p>
                    <p>Email: ${student.email}</p>
                `;
                
                // Mettre à jour les boutons de résidence
                if (student.residences) {
                    // Activer/désactiver les boutons de résidence
                    mainResidence.disabled = !student.residences.main;
                    secondaryResidence.disabled = !student.residences.secondary;
                    otherResidence.disabled = !student.residences.other;
                    
                    // Ajouter des labels aux boutons
                    const formatDate = (dateStr) => {
                        const date = new Date(dateStr);
                        return date.toLocaleDateString('fr-FR');
                    };
                    
                    // Créer un bouton de suppression pour chaque type de résidence
                    const createDeleteButton = (type) => `
                        <button class="delete-btn" data-type="${type}" title="Supprimer cette résidence">
                            🗑️
                        </button>
                    `;
                    
                    if (student.residences.main) {
                        mainResidence.innerHTML = `
                            ${student.residences.main.city_name}
                            <br>
                            <small>${formatDate(student.residences.main.start_date)} - ${formatDate(student.residences.main.end_date)}</small>
                            ${createDeleteButton('main')}
                        `;
                    } else {
                        mainResidence.textContent = 'Résidence Principale';
                    }
                    
                    if (student.residences.secondary) {
                        secondaryResidence.innerHTML = `
                            ${student.residences.secondary.city_name}
                            <br>
                            <small>${formatDate(student.residences.secondary.start_date)} - ${formatDate(student.residences.secondary.end_date)}</small>
                            ${createDeleteButton('secondary')}
                        `;
                    } else {
                        secondaryResidence.textContent = 'Résidence Secondaire';
                    }
                    
                    if (student.residences.other) {
                        otherResidence.innerHTML = `
                            ${student.residences.other.city_name}
                            <br>
                            <small>${formatDate(student.residences.other.start_date)} - ${formatDate(student.residences.other.end_date)}</small>
                            ${createDeleteButton('other')}
                        `;
                    } else {
                        otherResidence.textContent = 'Autre Résidence';
                    }
                    
                    // Ajouter des écouteurs d'événements pour les boutons de suppression
                    document.querySelectorAll('.delete-btn').forEach(btn => {
                        btn.addEventListener('click', async (e) => {
                            e.stopPropagation(); // Empêcher le déclenchement du clic sur le bouton parent
                            const type = btn.dataset.type;
                            if (confirm(`Voulez-vous vraiment supprimer cette résidence ${type} ?`)) {
                                await deleteResidence(type);
                            }
                        });
                    });
                    
                    // Mettre à jour l'interface d'ajout
                    updateAddInterface(student);
                    
                    // Charger les données de la résidence principale par défaut si elle existe
                    if (student.residences.main) {
                        loadResidenceData('main', student);
                    } else if (student.residences.secondary) {
                        loadResidenceData('secondary', student);
                    } else if (student.residences.other) {
                        loadResidenceData('other', student);
                    }
                }
            } else {
                studentInfo.innerHTML = `<p class="error">Erreur: ${result.message}</p>`;
            }
        } catch (error) {
            console.error('Erreur lors du chargement des données de l\'étudiant:', error);
            studentInfo.innerHTML = '<p class="error">Erreur lors du chargement des données</p>';
        }
    }

    // Fonction pour supprimer une résidence
    async function deleteResidence(residenceType) {
        try {
            const userId = sessionStorage.getItem('userId');
            
            if (!userId) {
                showError('Utilisateur non connecté');
                return;
            }
            
            const result = await dataManager.deleteResidence(userId, residenceType);
            
            if (result.success) {
                // Recharger les données de l'étudiant
                await loadStudentData(userId);
                
                // Effacer les données météo affichées
                currentWeather.innerHTML = '';
                forecast.innerHTML = '';
                
                showAddResidenceError('Résidence supprimée avec succès', 'green');
            } else {
                showError(result.message || 'Erreur lors de la suppression de la résidence');
            }
        } catch (error) {
            console.error('Erreur lors de la suppression:', error);
            showError('Une erreur est survenue lors de la suppression');
        }
    }

    // Fonction pour charger les données d'une résidence
    async function loadResidenceData(residenceType, studentData) {
        try {
            const userId = sessionStorage.getItem('userId');
            
            if (!userId) {
                showError('Utilisateur non connecté');
                return;
            }
            
            // Si les données de l'étudiant ne sont pas fournies, les récupérer
            let student = studentData;
            if (!student) {
                const result = await dataManager.getStudentData(userId);
                if (result.success) {
                    student = result.student;
                } else {
                    showError(result.message || 'Erreur lors du chargement des données de l\'étudiant');
                    return;
                }
            }
            
            if (!student.residences || !student.residences[residenceType]) {
                currentWeather.innerHTML = '<p>Aucune résidence de ce type n\'est définie</p>';
                forecast.innerHTML = '';
                return;
            }
            
            const residence = student.residences[residenceType];
            
            // Récupérer les données météo
            const weatherResult = await dataManager.getWeatherData(
                residence.city_name, 
                residence.latitude, 
                residence.longitude
            );
            
            if (weatherResult.success) {
                const weatherData = weatherResult.weather;
                
                // Afficher la météo actuelle
                const current = weatherData.current;
                currentWeather.innerHTML = `
                    <div class="weather-card">
                        <h4>${residence.city_name}</h4>
                        <div class="weather-icon">
                            <img src="https://openweathermap.org/img/wn/${current.weather[0].icon}@2x.png" alt="${current.weather[0].description}">
                        </div>
                        <div class="weather-details">
                            <p class="temp">${Math.round(current.temp)}°C</p>
                            <p class="desc">${current.weather[0].description}</p>
                            <p class="humidity">Humidité: ${current.humidity}%</p>
                            <p class="wind">Vent: ${Math.round(current.wind_speed * 3.6)} km/h</p>
                        </div>
                    </div>
                `;
                
                // Afficher les prévisions
                forecast.innerHTML = '<h4>Prévisions à 5 jours</h4><div class="forecast-cards"></div>';
                const forecastCards = forecast.querySelector('.forecast-cards');
                
                // Limiter à 5 jours de prévisions
                const days = weatherData.forecast.slice(0, 5);
                
                days.forEach(day => {
                    const date = new Date(day.dt * 1000);
                    const dayName = date.toLocaleDateString('fr-FR', { weekday: 'short' });
                    
                    forecastCards.innerHTML += `
                        <div class="forecast-card">
                            <p class="day">${dayName}</p>
                            <div class="weather-icon">
                                <img src="https://openweathermap.org/img/wn/${day.weather[0].icon}.png" alt="${day.weather[0].description}">
                            </div>
                            <p class="temp">${Math.round(day.temp.day)}°C</p>
                            <p class="desc">${day.weather[0].description}</p>
                        </div>
                    `;
                });
                
                if (weatherResult.cached) {
                    forecast.innerHTML += '<p class="cached-notice">Données météo en cache</p>';
                }
            } else {
                currentWeather.innerHTML = `<p class="error">Erreur: ${weatherResult.message || 'Impossible de récupérer les données météo'}</p>`;
                forecast.innerHTML = '';
            }
        } catch (error) {
            console.error('Erreur lors du chargement des données de résidence:', error);
            currentWeather.innerHTML = '<p class="error">Erreur lors du chargement des données météo</p>';
            forecast.innerHTML = '';
        }
    }

    // Fonction pour afficher une erreur
    function showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        document.querySelector('.container').appendChild(errorDiv);
        
        // Supprimer le message après 5 secondes
        setTimeout(() => {
            errorDiv.remove();
        }, 5000);
    }

    // Fonction pour gérer la connexion
    async function handleLogin(userId, userName) {
        sessionStorage.setItem('userId', userId);
        sessionStorage.setItem('userName', userName);
        location.reload(); // Recharger la page pour afficher les données de l'utilisateur
    }

    // Fonction pour gérer la déconnexion
    async function handleLogout() {
        sessionStorage.removeItem('userId');
        sessionStorage.removeItem('userName');
        location.href = 'login.html'; // Rediriger vers la page de connexion
    }
}); 