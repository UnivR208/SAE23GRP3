// Configuration
const WEATHER_MANAGER = new WeatherManager();

// État de l'application
let currentStudent = null;
let currentResidence = 'main';
let studentsData = [];

// Éléments DOM
const studentSearch = document.getElementById('student-search');
const searchButton = document.getElementById('search-button');
const residenceButtons = document.querySelectorAll('.residence-button');
const weatherInfo = document.querySelector('.weather-info');
const dailyForecast = document.querySelector('.daily-forecast');
const climateStats = document.querySelector('.climate-stats');

// Gestionnaires d'événements
searchButton.addEventListener('click', handleSearch);
residenceButtons.forEach(button => {
    button.addEventListener('click', () => handleResidenceChange(button));
});

// Chargement initial des données
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await loadStudentsData();
    } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        showError('Erreur lors du chargement des données des étudiants');
    }
});

// Fonctions principales
async function loadStudentsData() {
    try {
        // Essayer d'abord de charger depuis le JSON
        const jsonResponse = await fetch('data/students.json');
        if (jsonResponse.ok) {
            studentsData = await jsonResponse.json();
            return;
        }

        // Si le JSON n'existe pas, essayer le CSV
        const csvResponse = await fetch('data/students.csv');
        if (csvResponse.ok) {
            const csvText = await csvResponse.text();
            studentsData = parseCSV(csvText);
            // Sauvegarder en JSON pour la prochaine fois
            saveStudentsData();
        } else {
            throw new Error('Aucune donnée d\'étudiants trouvée');
        }
    } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        throw error;
    }
}

function parseCSV(csvText) {
    const lines = csvText.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    
    return lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim());
        const student = {};
        
        headers.forEach((header, index) => {
            if (values[index]) {
                if (header.includes('location')) {
                    student[header] = JSON.parse(values[index]);
                } else if (header.includes('date')) {
                    student[header] = values[index];
                } else {
                    student[header] = values[index];
                }
            }
        });
        
        return student;
    });
}

async function saveStudentsData() {
    try {
        const response = await fetch('data/students.json', {
            method: 'POST',
            headers: {
                'Content-Type': '/application/json',
            },
            body: JSON.stringify(studentsData)
        });
        
        if (!response.ok) {
            throw new Error('Erreur lors de la sauvegarde des données');
        }
    } catch (error) {
        console.error('Erreur lors de la sauvegarde des données:', error);
    }
}

async function handleSearch() {
    const searchTerm = studentSearch.value.trim().toLowerCase();
    if (!searchTerm) return;

    try {
        const student = studentsData.find(s => 
            s.name.toLowerCase().includes(searchTerm) ||
            s.email.toLowerCase().includes(searchTerm)
        );

        if (student) {
            currentStudent = student;
            updateStudentDisplay();
            updateWeatherDisplay();
        } else {
            showError('Étudiant non trouvé');
        }
    } catch (error) {
        showError('Erreur lors de la recherche');
        console.error(error);
    }
}

function handleResidenceChange(button) {
    residenceButtons.forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');
    currentResidence = button.dataset.residence;
    updateWeatherDisplay();
}

async function updateWeatherDisplay() {
    if (!currentStudent) return;

    const residence = currentStudent[currentResidence];
    if (!residence) {
        showError('Aucune résidence trouvée');
        return;
    }

    try {
        const weatherData = await WEATHER_MANAGER.getWeatherData(residence.location);
        updateCurrentWeather(weatherData);
        updateForecast(weatherData);
    } catch (error) {
        showError('Erreur lors de la récupération des données météo');
        console.error(error);
    }
}

function updateStudentDisplay() {
    // Mettre à jour l'affichage des informations de l'étudiant
    const studentInfo = document.querySelector('.student-info');
    if (!studentInfo) return;

    studentInfo.innerHTML = `
        <h3>${currentStudent.name}</h3>
        <p>Email: ${currentStudent.email}</p>
        <p>Résidence principale: ${currentStudent.main.location.name}</p>
        ${currentStudent.secondary ? `<p>Résidence secondaire: ${currentStudent.secondary.location.name}</p>` : ''}
    `;
}

function updateCurrentWeather(data) {
    const current = data.current;
    weatherInfo.innerHTML = `
        <div class="weather-card">
            <h4>Température</h4>
            <div class="weather-value">${WeatherManager.formatTemperature(current.temperature_2m)}</div>
        </div>
        <div class="weather-card">
            <h4>Humidité</h4>
            <div class="weather-value">${current.relative_humidity_2m}%</div>
        </div>
        <div class="weather-card">
            <h4>Vent</h4>
            <div class="weather-value">${WeatherManager.formatWindSpeed(current.wind_speed_10m)}</div>
        </div>
        <div class="weather-card">
            <h4>Conditions</h4>
            <div class="weather-value">
                ${WeatherManager.getWeatherIcon(current.weather_code)}
                ${WeatherManager.getWeatherDescription(current.weather_code)}
            </div>
        </div>
    `;
}

function updateForecast(data) {
    const daily = data.daily;
    dailyForecast.innerHTML = daily.time.map((date, index) => `
        <div class="day-card">
            <h3>${formatDate(date)}</h3>
            <div class="weather-icon">${WeatherManager.getWeatherIcon(daily.weather_code[index])}</div>
            <div class="temperature">${WeatherManager.formatTemperature(daily.temperature_2m_max[index])}</div>
            <div class="weather-details">
                <div>Min: ${WeatherManager.formatTemperature(daily.temperature_2m_min[index])}</div>
                <div>Précipitations: ${daily.precipitation_sum[index]}mm</div>
            </div>
        </div>
    `).join('');
}

// Fonctions utilitaires
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { weekday: 'short', month: 'short', day: 'numeric' });
}

function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    
    const container = document.querySelector('.container');
    container.insertBefore(errorDiv, container.firstChild);
    
    setTimeout(() => errorDiv.remove(), 5000);
} 