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