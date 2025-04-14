// Variables globales pour stocker les coordonnées
let currentLatitude = 48.8566;
let currentLongitude = 2.3522;
let currentCity = "Paris";

// Fonction d'initialisation de l'application
function initApp() {
    // Initialiser l'autocomplétion des villes
    initCityAutocomplete();
    
    // Essayer de charger les dernières données météo (cache)
    const hasCache = loadLastWeatherData();
    
    // Si pas de cache, charger les données pour Paris (par défaut)
    if (!hasCache) {
        getWeather();
    }
    
    // Ajouter la gestion des touches du clavier
    document.getElementById('city-input').addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            searchCity();
        }
    });
    
    // Ajouter la gestion de la localisation actuelle si disponible
    if (navigator.geolocation) {
        const locationButton = document.createElement('button');
        locationButton.textContent = "Ma position";
        locationButton.onclick = getUserLocation;
        document.getElementById('search-box').appendChild(locationButton);
    }
}

// J'ai ajouté cette fonction qui était référencée mais non définie
function searchCity() {
    const cityInput = document.getElementById('city-input');
    const cityName = cityInput.value.trim();
    
    if (cityName.length < 2) {
        document.getElementById('status').textContent = "Veuillez entrer au moins 2 caractères";
        return;
    }
    
    document.getElementById('status').textContent = "Recherche de " + cityName + "...";
    
    // Utiliser l'API Nominatim pour rechercher les coordonnées de la ville
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cityName)}&limit=1&addressdetails=1`)
        .then(response => response.json())
        .then(data => {
            if (data && data.length > 0) {
                currentLatitude = parseFloat(data[0].lat);
                currentLongitude = parseFloat(data[0].lon);
                currentCity = data[0].display_name.split(',')[0];
                
                // Mettre à jour l'entrée avec le nom complet de la ville
                cityInput.value = currentCity;
                
                // Charger la météo pour cette position
                getWeather();
            } else {
                document.getElementById('status').textContent = "Ville non trouvée";
            }
        })
        .catch(error => {
            console.error("Erreur de recherche:", error);
            document.getElementById('status').textContent = "Erreur de recherche: " + error.message;
        });
}

// Fonction pour initialiser l'autocomplétion des villes
function initCityAutocomplete() {
    // Cette fonction devrait être implémentée si nécessaire
    // Pour l'instant on la laisse vide
}

// Fonction pour obtenir la position de l'utilisateur
function getUserLocation() {
    document.getElementById('status').textContent = "Recherche de votre position...";
    
    navigator.geolocation.getCurrentPosition(
        // Succès
        function(position) {
            currentLatitude = position.coords.latitude;
            currentLongitude = position.coords.longitude;
            
            // Faire une recherche inverse pour obtenir le nom de la ville
            fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${currentLatitude}&lon=${currentLongitude}&zoom=10`)
                .then(response => response.json())
                .then(data => {
                    currentCity = data.display_name;
                    document.getElementById('city-input').value = data.address.city || data.address.town || data.address.village || data.address.hamlet || "Position actuelle";
                    getWeather();
                })
                .catch(error => {
                    console.error("Erreur de géocodage inverse:", error);
                    currentCity = "Votre position";
                    document.getElementById('city-input').value = "Ma position";
                    getWeather();
                });
        },
        // Erreur
        function(error) {
            document.getElementById('status').textContent = "Impossible d'obtenir votre position: " + error.message;
        }
    );
}

// Lancer l'application au chargement de la page
window.onload = initApp;