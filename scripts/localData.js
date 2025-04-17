/**
 * LocalDataManager - Gère les opérations de données en local avec JSON
 * Remplace les appels PHP par des opérations locales
 */
class LocalDataManager {
    constructor() {
        this.storageKey = 'windy_data';
        this.data = null;
        this.loadData();
    }

    /**
     * Charge les données depuis localStorage ou depuis le fichier JSON initial
     */
    async loadData() {
        // Essayer de charger depuis localStorage d'abord
        const storedData = localStorage.getItem(this.storageKey);
        
        if (storedData) {
            this.data = JSON.parse(storedData);
            return this.data;
        }
        
        // Si pas de données en localStorage, charger depuis le fichier JSON
        try {
            const response = await fetch('/data/students.json');
            this.data = await response.json();
            this.saveData();
            return this.data;
        } catch (error) {
            console.error('Erreur lors du chargement des données:', error);
            // Initialiser avec des données vides
            this.data = { students: [], admins: [], weather_cache: {} };
            return this.data;
        }
    }

    /**
     * Sauvegarde les données dans localStorage
     */
    saveData() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.data));
    }

    /**
     * Authentifie un utilisateur
     * @param {string} email - Email de l'utilisateur
     * @param {string} password - Mot de passe de l'utilisateur
     * @returns {Object|null} - Les données de l'utilisateur ou null si échec
     */
    async authenticate(email, password) {
        await this.loadData();
        
        // Rechercher dans les étudiants
        const student = this.data.students.find(s => 
            s.email === email && s.password === password);
        
        if (student) {
            return {
                success: true,
                userId: student.id,
                userName: student.name,
                role: student.role
            };
        }
        
        // Rechercher dans les admins
        const admin = this.data.admins.find(a => 
            a.email === email && a.password === password);
        
        if (admin) {
            return {
                success: true,
                userId: admin.id,
                userName: admin.name,
                role: admin.role
            };
        }
        
        return { success: false, message: 'Identifiants incorrects' };
    }

    /**
     * Récupère les données d'un étudiant
     * @param {string} studentId - ID de l'étudiant
     * @returns {Object} - Données de l'étudiant
     */
    async getStudentData(studentId) {
        await this.loadData();
        
        const student = this.data.students.find(s => s.id === studentId);
        
        if (!student) {
            return { success: false, message: 'Étudiant non trouvé' };
        }
        
        return {
            success: true,
            student: {
                id: student.id,
                name: student.name,
                email: student.email,
                residences: student.residences || {
                    main: null,
                    secondary: null,
                    other: null
                }
            }
        };
    }

    /**
     * Ajoute ou met à jour une résidence pour un étudiant
     * @param {Object} params - Paramètres de la résidence
     * @returns {Object} - Résultat de l'opération
     */
    async addResidence(params) {
        await this.loadData();
        
        const { user_id, type, city_name, latitude, longitude, start_date, end_date } = params;
        
        const studentIndex = this.data.students.findIndex(s => s.id === user_id);
        
        if (studentIndex === -1) {
            return { success: false, message: 'Étudiant non trouvé' };
        }
        
        // S'assurer que l'objet residences existe
        if (!this.data.students[studentIndex].residences) {
            this.data.students[studentIndex].residences = {
                main: null,
                secondary: null,
                other: null
            };
        }
        
        // Mettre à jour la résidence
        this.data.students[studentIndex].residences[type] = {
            city_name,
            latitude,
            longitude,
            start_date,
            end_date
        };
        
        this.saveData();
        
        return { 
            success: true, 
            message: 'Résidence ajoutée avec succès',
            student: this.data.students[studentIndex]
        };
    }

    /**
     * Supprime une résidence pour un étudiant
     * @param {string} userId - ID de l'utilisateur
     * @param {string} type - Type de résidence (main, secondary, other)
     * @returns {Object} - Résultat de l'opération
     */
    async deleteResidence(userId, type) {
        await this.loadData();
        
        const studentIndex = this.data.students.findIndex(s => s.id === userId);
        
        if (studentIndex === -1) {
            return { success: false, message: 'Étudiant non trouvé' };
        }
        
        if (!this.data.students[studentIndex].residences) {
            return { success: false, message: 'Aucune résidence trouvée' };
        }
        
        this.data.students[studentIndex].residences[type] = null;
        
        this.saveData();
        
        return { 
            success: true, 
            message: 'Résidence supprimée avec succès',
            student: this.data.students[studentIndex]
        };
    }

    /**
     * Récupère ou met en cache les données météo
     * @param {string} cityName - Nom de la ville
     * @param {number} lat - Latitude
     * @param {number} lon - Longitude
     * @returns {Object} - Données météo
     */
    async getWeatherData(cityName, lat, lon) {
        await this.loadData();
        
        const now = Math.floor(Date.now() / 1000);
        const cacheExpiry = 3600; // 1 heure
        
        // Vérifier si nous avons des données en cache et si elles sont encore valides
        if (this.data.weather_cache[cityName] && 
            (now - this.data.weather_cache[cityName].timestamp) < cacheExpiry) {
            return {
                success: true,
                weather: this.data.weather_cache[cityName].data
            };
        }
        
        // Si pas de cache valide, récupérer les données depuis l'API Open-Meteo
        try {
            const response = await fetch(
                `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_direction_10m,pressure_msl&hourly=temperature_2m,precipitation_probability,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,sunrise,sunset,uv_index_max,wind_speed_10m_max&timezone=auto`
            );
            
            if (!response.ok) {
                throw new Error('Erreur lors de la récupération des données météo');
            }
            
            const weatherData = await response.json();
            
            // Transformer les données au format attendu par l'application
            const formattedData = {
                current: {
                    temp: weatherData.current.temperature_2m,
                    feels_like: weatherData.current.apparent_temperature,
                    humidity: weatherData.current.relative_humidity_2m,
                    wind_speed: weatherData.current.wind_speed_10m,
                    wind_deg: weatherData.current.wind_direction_10m,
                    pressure: weatherData.current.pressure_msl,
                    weather: [{
                        id: weatherData.current.weather_code,
                        main: this.getWeatherMain(weatherData.current.weather_code),
                        description: this.getWeatherDescription(weatherData.current.weather_code),
                        icon: this.getWeatherIcon(weatherData.current.weather_code)
                    }]
                },
                forecast: []
            };
            
            // Formater les prévisions quotidiennes
            for (let i = 0; i < weatherData.daily.time.length; i++) {
                formattedData.forecast.push({
                    dt: new Date(weatherData.daily.time[i]).getTime() / 1000,
                    sunrise: new Date(weatherData.daily.sunrise[i]).getTime() / 1000,
                    sunset: new Date(weatherData.daily.sunset[i]).getTime() / 1000,
                    temp: {
                        day: weatherData.daily.temperature_2m_max[i],
                        min: weatherData.daily.temperature_2m_min[i],
                        max: weatherData.daily.temperature_2m_max[i]
                    },
                    weather: [{
                        id: weatherData.daily.weather_code[i],
                        main: this.getWeatherMain(weatherData.daily.weather_code[i]),
                        description: this.getWeatherDescription(weatherData.daily.weather_code[i]),
                        icon: this.getWeatherIcon(weatherData.daily.weather_code[i])
                    }],
                    pop: weatherData.daily.precipitation_probability_max[i] / 100,
                    uvi: weatherData.daily.uv_index_max[i],
                    wind_speed: weatherData.daily.wind_speed_10m_max[i],
                    precipitation: weatherData.daily.precipitation_sum[i]
                });
            }
            
            // Mettre en cache les données
            this.data.weather_cache[cityName] = {
                timestamp: now,
                data: formattedData
            };
            
            this.saveData();
            
            return {
                success: true,
                weather: this.data.weather_cache[cityName].data
            };
        } catch (error) {
            console.error('Erreur météo:', error);
            
            // En cas d'erreur, renvoyer les données en cache même si elles sont périmées
            if (this.data.weather_cache[cityName]) {
                return {
                    success: true,
                    weather: this.data.weather_cache[cityName].data,
                    cached: true
                };
            }
            
            return { success: false, message: 'Impossible de récupérer les données météo' };
        }
    }

    // Méthodes d'aide pour le format Open-Meteo
    getWeatherDescription(code) {
        const descriptions = {
            0: 'Ciel dégagé',
            1: 'Principalement dégagé',
            2: 'Partiellement nuageux',
            3: 'Couvert',
            45: 'Brouillard',
            48: 'Brouillard givrant',
            51: 'Bruine légère',
            53: 'Bruine modérée',
            55: 'Bruine dense',
            61: 'Pluie légère',
            63: 'Pluie modérée',
            65: 'Forte pluie',
            71: 'Légère neige',
            73: 'Neige modérée',
            75: 'Forte neige',
            77: 'Grains de neige',
            80: 'Averses légères',
            81: 'Averses modérées',
            82: 'Forte averses',
            85: 'Légères averses de neige',
            86: 'Forte averses de neige',
            95: 'Orage',
            96: 'Orage avec grêle légère',
            99: 'Orage avec forte grêle'
        };
        return descriptions[code] || 'Conditions inconnues';
    }
    
    getWeatherMain(code) {
        if (code === 0 || code === 1) return 'Clear';
        if (code === 2 || code === 3) return 'Clouds';
        if (code === 45 || code === 48) return 'Fog';
        if (code >= 51 && code <= 55) return 'Drizzle';
        if (code >= 61 && code <= 65) return 'Rain';
        if (code >= 71 && code <= 77) return 'Snow';
        if (code >= 80 && code <= 82) return 'Rain';
        if (code >= 85 && code <= 86) return 'Snow';
        if (code >= 95) return 'Thunderstorm';
        return 'Unknown';
    }
    
    getWeatherIcon(code) {
        // Conversion des codes météo Open-Meteo vers codes d'icônes
        // similaires à ceux d'OpenWeatherMap
        const timeOfDay = new Date().getHours() >= 6 && new Date().getHours() < 18 ? 'd' : 'n';
        
        const iconMap = {
            0: `01${timeOfDay}`, // Clear sky
            1: `01${timeOfDay}`, // Mainly clear
            2: `02${timeOfDay}`, // Partly cloudy
            3: `04${timeOfDay}`, // Overcast
            45: `50${timeOfDay}`, // Fog
            48: `50${timeOfDay}`, // Depositing rime fog
            51: `09${timeOfDay}`, // Drizzle: Light
            53: `09${timeOfDay}`, // Drizzle: Moderate
            55: `09${timeOfDay}`, // Drizzle: Dense
            61: `10${timeOfDay}`, // Rain: Slight
            63: `10${timeOfDay}`, // Rain: Moderate
            65: `10${timeOfDay}`, // Rain: Heavy
            71: `13${timeOfDay}`, // Snow fall: Slight
            73: `13${timeOfDay}`, // Snow fall: Moderate
            75: `13${timeOfDay}`, // Snow fall: Heavy
            77: `13${timeOfDay}`, // Snow grains
            80: `09${timeOfDay}`, // Rain showers: Slight
            81: `09${timeOfDay}`, // Rain showers: Moderate
            82: `09${timeOfDay}`, // Rain showers: Violent
            85: `13${timeOfDay}`, // Snow showers: Slight
            86: `13${timeOfDay}`, // Snow showers: Heavy
            95: `11${timeOfDay}`, // Thunderstorm: Slight or moderate
            96: `11${timeOfDay}`, // Thunderstorm with slight hail
            99: `11${timeOfDay}`  // Thunderstorm with heavy hail
        };
        
        return iconMap[code] || `03${timeOfDay}`;
    }

    /**
     * Réinitialise toutes les données (pour tests)
     */
    async resetData() {
        localStorage.removeItem(this.storageKey);
        return this.loadData();
    }
} 