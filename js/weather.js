// Fonction pour obtenir les données météo
async function getWeather() {
    // Afficher un message de chargement
    document.getElementById('status').textContent = "Chargement des données météo...";
    
    // Afficher les informations sur la ville
    document.getElementById('city-info').textContent = `Prévisions pour : ${currentCity}`;
    
    // Construire l'URL de l'API avec tous les paramètres demandés
    const apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${currentLatitude}&longitude=${currentLongitude}&forecast_days=7&hourly=temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation,weather_code,uv_index&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,sunrise,sunset&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code,uv_index&timezone=auto`;
    
    try {
        // Faire la requête à l'API
        const response = await fetch(apiUrl);
        
        // Vérifier si la requête a réussi
        if (!response.ok) {
            throw new Error("Erreur réseau : " + response.status);
        }
        
        // Convertir la réponse en JSON
        const data = await response.json();
        
        // Afficher les résultats
        displayCurrentWeather(data);
        displayDailyForecast(data);
        displayHourlyForecast(data);
        
        // Effacer le message de chargement
        document.getElementById('status').textContent = "Données chargées avec succès";
        
        // Sauvegarder les dernières données météo dans le localStorage
        localStorage.setItem('lastWeatherData', JSON.stringify({
            city: currentCity,
            lat: currentLatitude,
            lon: currentLongitude,
            timestamp: new Date().getTime(),
            data: data
        }));
    } catch (error) {
        // Gérer les erreurs
        document.getElementById('status').textContent = "Erreur : " + error.message;
        console.error("Erreur lors de la récupération des données météo:", error);
    }
}

// Fonction pour convertir le code météo en description
function getWeatherDescription(code) {
    const weatherCodes = {
        0: "Ciel dégagé",
        1: "Principalement dégagé",
        2: "Partiellement nuageux",
        3: "Couvert",
        45: "Brouillard",
        48: "Brouillard givrant",
        51: "Bruine légère",
        53: "Bruine modérée",
        55: "Bruine dense",
        56: "Bruine verglaçante légère",
        57: "Bruine verglaçante dense",
        61: "Pluie légère",
        63: "Pluie modérée",
        65: "Pluie forte",
        66: "Pluie verglaçante légère",
        67: "Pluie verglaçante forte",
        71: "Neige légère",
        73: "Neige modérée",
        75: "Neige forte",
        77: "Grains de neige",
        80: "Averses de pluie légères",
        81: "Averses de pluie modérées",
        82: "Averses de pluie violentes",
        85: "Averses de neige légères",
        86: "Averses de neige fortes",
        95: "Orage",
        96: "Orage avec grêle légère",
        99: "Orage avec grêle forte"
    };
    
    return weatherCodes[code] || "Inconnu";
}

// Fonction pour obtenir une icône météo basée sur le code (optionnel, pourrait être implémenté plus tard)
function getWeatherIcon(code) {
    // Cette fonction pourrait retourner une classe CSS ou un emoji selon le code météo
    const icons = {
        0: "☀️", // Ciel dégagé
        1: "🌤️", // Principalement dégagé
        2: "⛅", // Partiellement nuageux
        3: "☁️", // Couvert
        45: "🌫️", // Brouillard
        48: "🌫️❄️", // Brouillard givrant
        51: "🌦️", // Bruine légère
        53: "🌦️", // Bruine modérée
        55: "🌧️", // Bruine dense
        56: "🌧️❄️", // Bruine verglaçante légère
        57: "🌧️❄️", // Bruine verglaçante dense
        61: "🌧️", // Pluie légère
        63: "🌧️", // Pluie modérée
        65: "🌧️", // Pluie forte
        66: "🌧️❄️", // Pluie verglaçante légère
        67: "🌧️❄️", // Pluie verglaçante forte
        71: "❄️", // Neige légère
        73: "❄️", // Neige modérée
        75: "❄️", // Neige forte
        77: "❄️", // Grains de neige
        80: "🌦️", // Averses de pluie légères
        81: "🌧️", // Averses de pluie modérées
        82: "🌧️", // Averses de pluie violentes
        85: "🌨️", // Averses de neige légères
        86: "🌨️", // Averses de neige fortes
        95: "⛈️", // Orage
        96: "⛈️", // Orage avec grêle légère
        99: "⛈️" // Orage avec grêle forte
    };
    
    return icons[code] || "❓";
}

// Fonction pour afficher la météo actuelle
function displayCurrentWeather(data) {
    const currentContainer = document.getElementById('current-weather');
    const current = data.current;
    
    if (!current) {
        currentContainer.innerHTML = "<p>Données actuelles non disponibles</p>";
        return;
    }
    
    const weatherDescription = getWeatherDescription(current.weather_code);
    const weatherIcon = getWeatherIcon(current.weather_code);
    
    let html = `
        <div class="current-weather">
            <h2>Météo actuelle ${weatherIcon}</h2>
            <p><strong>Température:</strong> ${current.temperature_2m}${data.current_units.temperature_2m}</p>
            <p><strong>Conditions:</strong> ${weatherDescription}</p>
            <p><strong>Humidité:</strong> ${current.relative_humidity_2m}${data.current_units.relative_humidity_2m}</p>
            <p><strong>Vitesse du vent:</strong> ${current.wind_speed_10m} ${data.current_units.wind_speed_10m}</p>
            <p><strong>Indice UV:</strong> ${current.uv_index}</p>
            <p><strong>Dernière mise à jour:</strong> ${new Date(current.time).toLocaleString('fr-FR')}</p>
        </div>
    `;
    
    currentContainer.innerHTML = html;
}

// Fonction pour afficher les prévisions journalières
function displayDailyForecast(data) {
    const dailyContainer = document.getElementById('daily-forecast');
    const daily = data.daily;
    
    if (!daily || !daily.time) {
        dailyContainer.innerHTML = "<p>Prévisions journalières non disponibles</p>";
        return;
    }
    
    let html = `<h2>Prévisions par jour</h2><div class="daily-forecast">`;
    
    for (let i = 0; i < daily.time.length; i++) {
        const date = new Date(daily.time[i]);
        const day = date.toLocaleDateString('fr-FR', { weekday: 'long' });
        const formattedDate = date.toLocaleDateString('fr-FR');
        const weatherDescription = getWeatherDescription(daily.weather_code[i]);
        const weatherIcon = getWeatherIcon(daily.weather_code[i]);
        
        html += `
            <div class="day-card">
                <h3>${day} ${weatherIcon}</h3>
                <p><strong>Date:</strong> ${formattedDate}</p>
                <p><strong>Conditions:</strong> ${weatherDescription}</p>
                <p><strong>Temp. min/max:</strong> ${daily.temperature_2m_min[i]}/${daily.temperature_2m_max[i]}${data.daily_units.temperature_2m_max}</p>
                <p><strong>Précipitations:</strong> ${daily.precipitation_sum[i]} ${data.daily_units.precipitation_sum}</p>
                <p><strong>Lever du soleil:</strong> ${new Date(daily.sunrise[i]).toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'})}</p>
                <p><strong>Coucher du soleil:</strong> ${new Date(daily.sunset[i]).toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'})}</p>
            </div>
        `;
    }
    
    html += `</div>`;
    dailyContainer.innerHTML = html;
}

// Fonction pour afficher les prévisions horaires
function displayHourlyForecast(data) {
    const hourlyContainer = document.getElementById('hourly-forecast');
    const hourly = data.hourly;
    
    if (!hourly || !hourly.time) {
        hourlyContainer.innerHTML = "<p>Prévisions horaires non disponibles</p>";
        return;
    }
    
    let html = `
        <h2>Prévisions heure par heure</h2>
        <table>
            <tr>
                <th>Date et heure</th>
                <th>Conditions</th>
                <th>Température (${data.hourly_units.temperature_2m})</th>
                <th>Précipitations (${data.hourly_units.precipitation})</th>
                <th>Humidité (${data.hourly_units.relative_humidity_2m})</th>
                <th>Vent (${data.hourly_units.wind_speed_10m})</th>
                <th>Indice UV</th>
            </tr>
    `;
    
    // Limite à 24 heures pour faciliter la lecture
    const limit = Math.min(24, hourly.time.length);
    
    for (let i = 0; i < limit; i++) {
        const dateTime = new Date(hourly.time[i]);
        const formattedDateTime = dateTime.toLocaleString('fr-FR');
        const weatherDescription = getWeatherDescription(hourly.weather_code[i]);
        const weatherIcon = getWeatherIcon(hourly.weather_code[i]);
        
        html += `
            <tr>
                <td>${formattedDateTime}</td>
                <td>${weatherIcon} ${weatherDescription}</td>
                <td>${hourly.temperature_2m[i]}</td>
                <td>${hourly.precipitation[i]}</td>
                <td>${hourly.relative_humidity_2m[i]}</td>
                <td>${hourly.wind_speed_10m[i]}</td>
                <td>${hourly.uv_index[i]}</td>
            </tr>
        `;
    }
    
    html += '</table>';
    
    if (hourly.time.length > limit) {
        html += `<p>Nota: ${hourly.time.length - limit} heures supplémentaires non affichées.</p>`;
    }
    
    hourlyContainer.innerHTML = html;
}

// Fonction pour charger les dernières données météo du localStorage (si disponibles)
function loadLastWeatherData() {
    const lastData = localStorage.getItem('lastWeatherData');
    
    if (lastData) {
        try {
            const parsedData = JSON.parse(lastData);
            const timestamp = parsedData.timestamp;
            const now = new Date().getTime();
            
            // Si les données ont moins de 30 minutes
            if (now - timestamp < 30 * 60 * 1000) {
                currentCity = parsedData.city;
                currentLatitude = parsedData.lat;
                currentLongitude = parsedData.lon;
                
                // Afficher les informations sur la ville
                document.getElementById('city-info').textContent = `Prévisions pour : ${currentCity} (données en cache)`;
                
                // Afficher les données
                displayCurrentWeather(parsedData.data);
                displayDailyForecast(parsedData.data);
                displayHourlyForecast(parsedData.data);
                
                document.getElementById('status').textContent = "Données chargées depuis le cache";
                
                return true;
            }
        } catch (error) {
            console.error("Erreur lors du chargement des données en cache:", error);
        }
    }
    
    return false;
}