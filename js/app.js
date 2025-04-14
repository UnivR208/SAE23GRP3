// Fichier app.js modifié pour gérer les résidences d'utilisateurs
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

// Initialiser l'application avec les données d'utilisateur
async function initApp() {
    try {
        // J'ai modifié le nom du fichier CSV pour correspondre à celui fourni
        const csvLoaded = await userManager.loadUserDataFromCSV('./userManager.csv');
        if (!csvLoaded) {
            document.getElementById('status').textContent = "Erreur de chargement des données utilisateurs";
            return;
        }
        
        // Pour démonstration, on prend l'ID utilisateur depuis l'URL ou on utilise un ID par défaut
        const urlParams = new URLSearchParams(window.location.search);
        const userId = urlParams.get('userId') || "1"; // ID par défaut si non spécifié
        
        // Définir l'utilisateur courant
        if (!userManager.setCurrentUser(userId)) {
            document.getElementById('status').textContent = "Utilisateur non trouvé";
            return;
        }
        
        // Initialiser le gestionnaire de résidences avec les données utilisateur
        const userResidences = userManager.getCurrentUserResidences();
        residenceManager.initFromUserData(userResidences);
        
        // Initialiser l'interface
        initializeResidenceInterface();
        
        // Charger la météo pour la résidence principale
        loadWeatherForActiveResidence();
        
        // Ajouter la gestion admin si nécessaire (à protéger par authentification)
        if (urlParams.get('admin') === 'true') {
            initAdminInterface();
        }
    } catch (error) {
        console.error("Erreur d'initialisation de l'application:", error);
        document.getElementById('status').textContent = "Erreur d'initialisation: " + error.message;
    }
}
// Initialiser l'interface pour les résidences
function initializeResidenceInterface() {
    // Créer les sélecteurs de résidence
    const residences = residenceManager.getAllResidences();
    const residenceSelector = document.getElementById('residence-selector');
    
    // Vider le conteneur
    residenceSelector.innerHTML = '';
    
    // Ajouter la résidence principale
    if (residences.primary) {
        const primaryBtn = createResidenceButton(residences.primary.name, 0, true);
        residenceSelector.appendChild(primaryBtn);
    }
    
    // Ajouter les résidences secondaires
    residences.secondary.forEach((residence, index) => {
        if (residence) {
            const secondaryBtn = createResidenceButton(residence.name, index + 1, false);
            residenceSelector.appendChild(secondaryBtn);
        }
    });
}

// Créer un bouton pour une résidence
function createResidenceButton(name, index, isPrimary) {
    const button = document.createElement('button');
    button.textContent = isPrimary ? `${name} (Principale)` : name;
    button.className = 'residence-button';
    button.dataset.index = index;
    
    // Ajouter la gestion de clic
    button.addEventListener('click', () => {
        // Mettre à jour la résidence active
        residenceManager.activeResidenceIndex = index;
        
        // Mettre à jour les classes CSS
        document.querySelectorAll('.residence-button').forEach(btn => {
            btn.classList.remove('active');
        });
        button.classList.add('active');
        
        // Charger la météo
        loadWeatherForActiveResidence();
    });
    
    return button;
}

// Charger la météo pour la résidence active
function loadWeatherForActiveResidence() {
    const residence = residenceManager.getActiveResidence();
    
    if (!residence) {
        document.getElementById('status').textContent = "Aucune résidence sélectionnée";
        return;
    }
    
    // Utiliser les fonctions existantes avec les coordonnées de la résidence
    currentLatitude = residence.latitude;
    currentLongitude = residence.longitude;
    currentCity = residence.name;
    
    // Charger la météo
    getWeather();
}

// Interface admin pour gérer les résidences (à protéger par authentification)
function initAdminInterface() {
    const adminPanel = document.createElement('div');
    adminPanel.id = 'admin-panel';
    adminPanel.className = 'admin-panel';
    
    adminPanel.innerHTML = `
        <h3>Gestion des résidences</h3>
        <div class="admin-section">
            <h4>Résidence principale</h4>
            <div id="primary-residence-editor"></div>
        </div>
        <div class="admin-section">
            <h4>Résidences secondaires (scolaires)</h4>
            <div id="secondary-residences-editor"></div>
        </div>
        <button id="save-residences">Enregistrer les modifications</button>
    `;
    
    document.body.appendChild(adminPanel);
    
    // Initialiser les éditeurs de résidences
    initResidenceEditors();
    
    // Gérer l'enregistrement
    document.getElementById('save-residences').addEventListener('click', saveResidenceChanges);
}

// Initialiser les éditeurs de résidences
function initResidenceEditors() {
    const residences = residenceManager.getAllResidences();
    
    // Éditeur de résidence principale
    const primaryEditor = document.getElementById('primary-residence-editor');
    primaryEditor.appendChild(createResidenceEditor('primary', 0, residences.primary));
    
    // Éditeurs de résidences secondaires
    const secondaryEditor = document.getElementById('secondary-residences-editor');
    residences.secondary.forEach((residence, index) => {
        secondaryEditor.appendChild(createResidenceEditor('secondary', index, residence));
    });
}

// Créer un éditeur pour une résidence
function createResidenceEditor(type, index, residence) {
    const editor = document.createElement('div');
    editor.className = 'residence-editor';
    editor.dataset.type = type;
    editor.dataset.index = index;
    
    editor.innerHTML = `
        <input type="text" class="city-input" placeholder="Nom de la ville" 
               value="${residence ? residence.name : ''}" autocomplete="off">
        <div class="suggestions" style="display:none;"></div>
        <div class="coordinates">
            <input type="hidden" class="lat-input" value="${residence ? residence.latitude : ''}">
            <input type="hidden" class="lon-input" value="${residence ? residence.longitude : ''}">
        </div>
    `;
    
    // Ajouter l'autocomplétion à l'entrée
    const cityInput = editor.querySelector('.city-input');
    cityInput.addEventListener('input', function(e) {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            const query = e.target.value.trim();
            if (query.length > 1) {
                fetchCitySuggestions(query, editor.querySelector('.suggestions'));
            } else {
                editor.querySelector('.suggestions').style.display = 'none';
            }
        }, 200);
    });
    
    return editor;
}

// Enregistrer les modifications des résidences
function saveResidenceChanges() {
    const currentUserId = userManager.currentUser.id;
    let primaryResidence = null;
    const secondaryResidences = [null, null];
    
    // Récupérer la résidence principale
    const primaryEditor = document.querySelector('[data-type="primary"]');
    if (primaryEditor) {
        const cityName = primaryEditor.querySelector('.city-input').value.trim();
        const lat = primaryEditor.querySelector('.lat-input').value;
        const lon = primaryEditor.querySelector('.lon-input').value;
        
        if (cityName && lat && lon) {
            primaryResidence = {
                name: cityName,
                latitude: parseFloat(lat),
                longitude: parseFloat(lon)
            };
        }
    }
    
    // Vérifier que la résidence principale est définie
    if (!primaryResidence) {
        alert('La résidence principale est obligatoire.');
        return;
    }
    
    // Récupérer les résidences secondaires
    document.querySelectorAll('[data-type="secondary"]').forEach((editor) => {
        const index = parseInt(editor.dataset.index);
        const cityName = editor.querySelector('.city-input').value.trim();
        const lat = editor.querySelector('.lat-input').value;
        const lon = editor.querySelector('.lon-input').value;
        
        if (cityName && lat && lon && index >= 0 && index < 2) {
            secondaryResidences[index] = {
                name: cityName,
                latitude: parseFloat(lat),
                longitude: parseFloat(lon)
            };
        }
    });
    
    // Mettre à jour les résidences de l'utilisateur
    userManager.updateUserResidences(
        currentUserId, 
        primaryResidence, 
        secondaryResidences[0], 
        secondaryResidences[1]
    );
    
    // Mettre à jour le gestionnaire de résidences
    residenceManager.residences.primary = primaryResidence;
    residenceManager.residences.secondary = secondaryResidences;
    
    // Reconstruire l'interface
    initializeResidenceInterface();
    
    // Charger la météo pour la résidence active
    loadWeatherForActiveResidence();
    
    // Notification
    alert('Résidences enregistrées avec succès');
}

// Recherche de suggestions de villes (adapté du code existant)
async function fetchCitySuggestions(query, suggestionContainer) {
    try {
        // Vérifier le cache d'abord
        if (citiesCache[query]) {
            displaySuggestions(citiesCache[query], suggestionContainer);
            return;
        }
        
        // Utiliser l'API Nominatim
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=10&addressdetails=1&featureType=city`;
        
        // Afficher un indicateur de chargement
        suggestionContainer.innerHTML = '<div class="suggestion-item">Recherche en cours...</div>';
        suggestionContainer.style.display = 'block';
        
        const response = await fetch(url);
        const data = await response.json();
        
        // Mettre en cache les résultats
        citiesCache[query] = data;
        
        // Trier les résultats
        const sortedData = sortCitiesByRelevance(data, query);
        
        // Afficher
        displaySuggestions(sortedData, suggestionContainer);
    } catch (error) {
        console.error("Erreur lors de la recherche de villes:", error);
        suggestionContainer.innerHTML = '<div class="suggestion-item">Erreur de recherche</div>';
    }
}

// Fonction pour trier les villes (inchangée)
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

// Obtenir une estimation de la population pour l'affichage (inchangée)
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

// Formater le nombre de population (inchangée)
function formatPopulation(number) {
    if (number >= 1000000) {
        return (number / 1000000).toFixed(1) + "M";
    } else if (number >= 1000) {
        return (number / 1000).toFixed(0) + "k";
    }
    return number.toString();
}

// Afficher les suggestions (modifiée pour fonctionner avec les éditeurs)
function displaySuggestions(places, suggestionContainer) {
    if (places.length === 0) {
        suggestionContainer.innerHTML = '<div class="suggestion-item">Aucun résultat trouvé</div>';
        suggestionContainer.style.display = 'block';
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
    
    suggestionContainer.innerHTML = html;
    suggestionContainer.style.display = 'block';
    
    // Ajouter des écouteurs d'événements pour chaque suggestion
    const editorContainer = suggestionContainer.closest('.residence-editor');
    suggestionContainer.querySelectorAll('.suggestion-item').forEach(item => {
        item.addEventListener('click', function() {
            const lat = this.getAttribute('data-lat');
            const lon = this.getAttribute('data-lon');
            const name = this.getAttribute('data-name');
            
            // Mettre à jour l'entrée et les coordonnées dans l'éditeur
            editorContainer.querySelector('.city-input').value = name.split(',')[0].trim();
            editorContainer.querySelector('.lat-input').value = lat;
            editorContainer.querySelector('.lon-input').value = lon;
            
            // Cacher les suggestions
            suggestionContainer.style.display = 'none';
        });
    });
}

// Exposer le gestionnaire pour les événements DOM
window.onload = initApp;