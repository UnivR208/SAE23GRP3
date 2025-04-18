// Classe pour gérer les données météo avec Open-Meteo
class WeatherManager {
    constructor() {
        this.baseUrl = 'https://api.open-meteo.com/v1';
        this.cache = new Map();
        this.cacheTimeout = 30 * 60 * 1000; // 30 minutes
    }

    async getWeatherData(location) {
        const cacheKey = `${location.lat},${location.lon}`;
        const cachedData = this.getFromCache(cacheKey);
        
        if (cachedData) {
            console.log('Données météo récupérées depuis le cache pour:', location);
            return cachedData;
        }

        try {
            console.log('Récupération des données météo depuis l\'API pour:', location);
            // Récupération des données actuelles
            const currentResponse = await fetch(
                `${this.baseUrl}/forecast?latitude=${location.lat}&longitude=${location.lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation,weather_code&hourly=temperature_2m,precipitation_probability,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto`
            );

            if (!currentResponse.ok) {
                throw new Error(`Erreur API météo: ${currentResponse.status}`);
            }

            const data = await currentResponse.json();
            console.log('Données météo reçues de l\'API:', data);
            
            // Vérification de la structure des données
            if (!data.current || !data.daily) {
                throw new Error('Structure des données météo invalide');
            }

            this.saveToCache(cacheKey, data);
            return data;
        } catch (error) {
            console.error('Erreur lors de la récupération des données météo:', error);
            throw error;
        }
    }

    getFromCache(key) {
        const cached = this.cache.get(key);
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.data;
        }
        this.cache.delete(key);
        return null;
    }

    saveToCache(key, data) {
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }

    // Méthodes utilitaires pour le traitement des données météo
    static formatTemperature(temp) {
        return `${Math.round(temp)}°C`;
    }

    static formatWindSpeed(speed) {
        return `${Math.round(speed)} km/h`;
    }

    static getWeatherIcon(weatherCode) {
        console.log('Récupération de l\'icône pour le code météo:', weatherCode);
        // Mapping des codes météo Open-Meteo vers les icônes
        const weatherIcons = {
            0: '☀️', // Clear sky
            1: '🌤️', // Mainly clear
            2: '⛅', // Partly cloudy
            3: '☁️', // Overcast
            45: '🌫️', // Fog
            48: '🌫️', // Depositing rime fog
            51: '🌧️', // Drizzle: Light
            53: '🌧️', // Drizzle: Moderate
            55: '🌧️', // Drizzle: Dense
            61: '🌧️', // Rain: Slight
            63: '🌧️', // Rain: Moderate
            65: '🌧️', // Rain: Heavy
            71: '🌨️', // Snow fall: Slight
            73: '🌨️', // Snow fall: Moderate
            75: '🌨️', // Snow fall: Heavy
            77: '🌨️', // Snow grains
            80: '🌧️', // Rain showers: Slight
            81: '🌧️', // Rain showers: Moderate
            82: '🌧️', // Rain showers: Violent
            85: '🌨️', // Snow showers: Slight
            86: '🌨️', // Snow showers: Heavy
            95: '⛈️', // Thunderstorm: Slight or moderate
            96: '⛈️', // Thunderstorm with slight hail
            99: '⛈️'  // Thunderstorm with heavy hail
        };
        const icon = weatherIcons[weatherCode] || '❓';
        console.log('Icône sélectionnée:', icon);
        return icon;
    }

    static getWeatherDescription(weatherCode) {
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
        return descriptions[weatherCode] || 'Conditions inconnues';
    }

    // Méthode pour calculer les statistiques météo d'un groupe
    static calculateGroupStats(weatherDataArray) {
        if (!weatherDataArray.length) return null;

        const stats = {
            avgTemp: 0,
            minTemp: Infinity,
            maxTemp: -Infinity,
            avgHumidity: 0,
            avgWindSpeed: 0
        };

        weatherDataArray.forEach(data => {
            const temp = data.current.temperature_2m;
            stats.avgTemp += temp;
            stats.minTemp = Math.min(stats.minTemp, temp);
            stats.maxTemp = Math.max(stats.maxTemp, temp);
            stats.avgHumidity += data.current.relative_humidity_2m;
            stats.avgWindSpeed += data.current.wind_speed_10m;
        });

        const count = weatherDataArray.length;
        stats.avgTemp = stats.avgTemp / count;
        stats.avgHumidity = stats.avgHumidity / count;
        stats.avgWindSpeed = stats.avgWindSpeed / count;

        return stats;
    }
}

// Export pour utilisation dans d'autres fichiers
window.WeatherManager = WeatherManager; 