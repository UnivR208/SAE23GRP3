// Cache pour stocker les résultats de recherche précédents
const citiesCache = {};
let debounceTimer;

// Base de données des grandes villes avec leur population (approximative)
const majorCities = {
    "Paris": 2200000,
    "Marseille": 870000,
    "Lyon": 515000,
    "Toulouse": 470000,
    "Nice": 340000,
    "Nantes": 310000,
    "Strasbourg": 280000,
    "Montpellier": 280000,
    "Bordeaux": 250000,
    "Lille": 230000,
    "Rennes": 215000,
    // Ajoutez d'autres grandes villes si nécessaire
};

// Initialiser l'autocomplétion
function initCityAutocomplete() {
    // Ajouter un écouteur d'événements pour l'autocomplétion
    document.getElementById('city-input').addEventListener('input', function(e) {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            const query = e.target.value.trim();
            if (query.length > 1) { // Réduit à 1 caractère minimum pour plus de réactivité
                fetchCitySuggestions(query);
            } else {
                document.getElementById('suggestions').style.display = 'none';
            }
        }, 200); // Réduit le délai à 200ms pour une meilleure réactivité
    });
    
    // Fermer les suggestions lorsqu'on clique ailleurs
    document.addEventListener('click', function(e) {
        if (e.target.id !== 'city-input' && e.target.className !== 'suggestion-item' && !e.target.closest('.suggestion-item')) {
            document.getElementById('suggestions').style.display = 'none';
        }
    });
}

// Fonction pour rechercher des suggestions de villes
async function fetchCitySuggestions(query) {
    try {
        // Vérifier le cache d'abord
        if (citiesCache[query]) {
            displaySuggestions(citiesCache[query]);
            return;
        }
        
        // Utiliser l'API Nominatim pour rechercher des lieux avec priorité aux villes
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=10&addressdetails=1&featureType=city`;
        
        // Afficher un indicateur de chargement
        document.getElementById('suggestions').innerHTML = '<div class="suggestion-item">Recherche en cours...</div>';
        document.getElementById('suggestions').style.display = 'block';
        
        const response = await fetch(url);
        const data = await response.json();
        
        // Mettre en cache les résultats
        citiesCache[query] = data;
        
        // Trier les résultats
        const sortedData = sortCitiesByRelevance(data, query);
        
        displaySuggestions(sortedData);
    } catch (error) {
        console.error("Erreur lors de la recherche de villes:", error);
        document.getElementById('suggestions').innerHTML = '<div class="suggestion-item">Erreur de recherche</div>';
    }
}

// Fonction pour trier les villes par pertinence (grandes villes en premier)
function sortCitiesByRelevance(places, query) {
    return places.sort((a, b) => {
        // Vérifier si les villes sont dans notre base de données de grandes villes
        const cityNameA = a.name || a.display_name.split(',')[0].trim();
        const cityNameB = b.name || b.display_name.split(',')[0].trim();
        
        // Donner la priorité aux correspondances exactes
        const exactMatchA = cityNameA.toLowerCase() === query.toLowerCase();
        const exactMatchB = cityNameB.toLowerCase() === query.toLowerCase();
        
        if (exactMatchA && !exactMatchB) return -1;
        if (!exactMatchA && exactMatchB) return 1;
        
        // Ensuite, prioriser les grandes villes connues
        const popA = majorCities[cityNameA] || 0;
        const popB = majorCities[cityNameB] || 0;
        
        if (popA !== popB) {
            return popB - popA; // Trier par population décroissante
        }
        
        // Si les deux villes ne sont pas dans notre base ou ont la même population,
        // prioriser celles dont le type est "city" ou "town"
        const isTypeA = a.type === "city" || a.type === "town";
        const isTypeB = b.type === "city" || b.type === "town";
        
        if (isTypeA && !isTypeB) return -1;
        if (!isTypeA && isTypeB) return 1;
        
        // Ensuite par importance (si disponible)
        if (a.importance && b.importance) {
            return b.importance - a.importance;
        }
        
        return 0;
    });
}

// Obtenir une estimation de la population pour l'affichage
function getPopulationEstimate(place) {
    const cityName = place.name || place.display_name.split(',')[0].trim();
    
    // Si nous connaissons la ville dans notre base de données
    if (majorCities[cityName]) {
        return formatPopulation(majorCities[cityName]);
    }
    
    // Sinon, on fait une estimation basée sur l'importance de Nominatim
    if (place.importance) {
        const estimatedPop = Math.round(place.importance * 1000000);
        if (estimatedPop > 10000) {
            return formatPopulation(estimatedPop);
        }
    }
    
    return null; // Pas d'information de population
}

// Formater le nombre de population
function formatPopulation(number) {
    if (number >= 1000000) {
        return (number / 1000000).toFixed(1) + "M";
    } else if (number >= 1000) {
        return (number / 1000).toFixed(0) + "k";
    }
    return number.toString();
}

// Afficher les suggestions
function displaySuggestions(places) {
    const suggestionsElement = document.getElementById('suggestions');
    
    if (places.length === 0) {
        suggestionsElement.innerHTML = '<div class="suggestion-item">Aucun résultat trouvé</div>';
        suggestionsElement.style.display = 'block';
        return;
    }
    
    let html = '';
    
    places.forEach(place => {
        const cityName = place.name || place.display_name.split(',')[0].trim();
        const region = place.display_name.split(',').slice(1, 3).join(',').trim();
        const populationInfo = getPopulationEstimate(place);
        
        let displayText = `<span>${cityName}</span>`;
        if (region) {
            displayText += `<small style="color:#666;"> ${region}</small>`;
        }
        
        let popHtml = '';
        if (populationInfo) {
            popHtml = `<span class="population-badge">${populationInfo}</span>`;
        }
        
        html += `<div class="suggestion-item" 
                    data-lat="${place.lat}" 
                    data-lon="${place.lon}" 
                    data-name="${place.display_name}">
                    ${displayText} ${popHtml}
                </div>`;
    });
    
    suggestionsElement.innerHTML = html;
    suggestionsElement.style.display = 'block';
    
    // Ajouter des écouteurs d'événements pour chaque suggestion
    document.querySelectorAll('.suggestion-item').forEach(item => {
        item.addEventListener('click', function() {
            const lat = this.getAttribute('data-lat');
            const lon = this.getAttribute('data-lon');
            const name = this.getAttribute('data-name');
            
            // Mettre à jour l'entrée et les coordonnées
            document.getElementById('city-input').value = name.split(',')[0].trim();
            currentLatitude = parseFloat(lat);
            currentLongitude = parseFloat(lon);
            currentCity = name;
            
            // Cacher les suggestions
            document.getElementById('suggestions').style.display = 'none';
            
            // Rechercher la météo pour cette ville
            getWeather();
        });
    });
}

// Fonction pour rechercher une ville spécifique
function searchCity() {
    const query = document.getElementById('city-input').value.trim();
    
    if (query.length === 0) return;
    
    document.getElementById('status').textContent = "Recherche de la ville...";
    
    // Utiliser l'API Nominatim pour obtenir les coordonnées
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&addressdetails=1`;
    
    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data.length === 0) {
                document.getElementById('status').textContent = "Ville non trouvée. Veuillez essayer avec un autre nom.";
                return;
            }
            
            // Mettre à jour les coordonnées globales
            currentLatitude = parseFloat(data[0].lat);
            currentLongitude = parseFloat(data[0].lon);
            currentCity = data[0].display_name;
            
            // Rechercher la météo avec ces coordonnées
            getWeather();
        })
        .catch(error => {
            document.getElementById('status').textContent = "Erreur lors de la recherche de la ville : " + error.message;
            console.error("Erreur lors de la recherche de la ville:", error);
        });
}