// Configuration
const WEATHER_MANAGER = new WeatherManager();
const BASE_URL = 'https://rt-projet.pu-pm.univ-fcomte.fr/users/tdavid';

// État de l'application
let currentStudent = null;
let currentResidence = 'main';
let studentsData = [];
let groupsData = [];

// Éléments DOM
const studentSearch = document.getElementById('student-search');
const searchButton = document.getElementById('search-button');
const residenceButtons = document.querySelectorAll('.residence-button');
const weatherInfo = document.querySelector('.weather-info');
const dailyForecast = document.querySelector('.daily-forecast');
const climateStats = document.querySelector('.climate-stats');
const studentInfo = document.getElementById('student-info');

// Gestionnaires d'événements
searchButton.addEventListener('click', handleSearch);
residenceButtons.forEach(button => {
    button.addEventListener('click', () => handleResidenceChange(button));
});

// Chargement initial des données
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await loadStudentsData();
        
        // Récupérer l'email de l'étudiant connecté
        const userEmail = sessionStorage.getItem('userEmail');
        if (userEmail) {
            // Trouver l'étudiant dans les données
            currentStudent = studentsData.find(s => s.email === userEmail);
            if (currentStudent) {
                updateStudentDisplay();
                // Vérifier si l'étudiant a des résidences
                if (currentStudent.main || currentStudent.secondary) {
                    updateWeatherDisplay();
                } else {
                    showError('Aucune résidence trouvée pour cet utilisateur');
                }
            } else {
                showError('Étudiant non trouvé');
            }
        }
    } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        showError('Erreur lors du chargement des données des étudiants');
    }
});

// Fonctions principales
async function loadStudentsData() {
    try {
        const response = await fetch(`${BASE_URL}/data/students.json`);
        if (!response.ok) {
            throw new Error('Erreur lors du chargement des données');
        }
        const data = await response.json();
        
        // Stocker les données des groupes
        groupsData = data.groups || [];
        
        // Combiner les étudiants et les admins dans un seul tableau
        studentsData = [...(data.students || []), ...(data.admins || [])];
        
        // Synchroniser avec la base de données
        await syncWithDatabase();
        
        // Mettre à jour l'interface
        updateStudentsList();
    } catch (error) {
        console.error('Erreur:', error);
        showError('Erreur lors du chargement des données');
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
        // Sauvegarder dans le fichier JSON via PHP
        const response = await fetch(`${BASE_URL}/php/save_json.php`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(studentsData)
        });
        
        if (!response.ok) {
            throw new Error('Erreur lors de la sauvegarde');
        }

        // Synchroniser avec la base de données
        await syncWithDatabase();
    } catch (error) {
        console.error('Erreur:', error);
        showError('Erreur lors de la sauvegarde des données');
    }
}

// Fonction pour synchroniser avec la base de données
async function syncWithDatabase() {
    try {
        const response = await fetch(`${BASE_URL}/php/sync.php`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(studentsData)
        });
        
        if (!response.ok) {
            throw new Error('Erreur lors de la synchronisation avec la base de données');
        }
    } catch (error) {
        console.error('Erreur de synchronisation:', error);
        showError('Erreur lors de la synchronisation avec la base de données');
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
            // Ne pas mettre à jour l'affichage météo si l'utilisateur n'a pas de résidence
            if (student.main || student.secondary) {
                updateWeatherDisplay();
            } else {
                showError('Aucune résidence trouvée pour cet utilisateur');
            }
            // Synchroniser après la recherche
            await syncWithDatabase();
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
        // Synchroniser après la mise à jour de la météo
        await syncWithDatabase();
    } catch (error) {
        showError('Erreur lors de la récupération des données météo');
        console.error(error);
    }
}

function updateStudentDisplay() {
    const studentInfo = document.querySelector('.student-info');
    if (!studentInfo || !currentStudent) return;

    const group = currentStudent.group_id ? 
        groupsData.find(g => g.id === currentStudent.group_id) : null;

    studentInfo.innerHTML = `
        <h3>${currentStudent.name}</h3>
        <p>Email: ${currentStudent.email}</p>
        ${group ? `<p>Groupe: ${group.name}</p>` : ''}
        ${currentStudent.main ? 
            `<p>Résidence principale: ${currentStudent.main.location.name}</p>` : ''}
        ${currentStudent.secondary ? 
            `<p>Résidence secondaire: ${currentStudent.secondary.location.name}</p>` : ''}
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
// Ajoutez cette section après vos autres gestionnaires d'événements
document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = {
        email: document.getElementById('identifier').value,
        password: document.getElementById('password').value
    };

    try {
        const response = await fetch(`${BASE_URL}/php/login.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                action: 'login',
                ...formData 
            })
        });

        const data = await response.json();
        
        if (data.success) {
            window.location.href = 'index.html';
        } else {
            showError(data.message || 'Erreur de connexion');
        }
    } catch (error) {
        showError('Erreur réseau');
        console.error('Erreur:', error);
    }
});