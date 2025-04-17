/**
 * Climatomètre BUT1 R&T - Gestion de la météo
 * Ce script gère les fonctionnalités liées à la météo.
 * Il récupère et affiche les données météorologiques.
 * @author Groupe 3 (Sephora, Natanaël, Tom)
 * @version 1.0.0
 */
class WeatherManager {
    constructor() {
        this.currentWeather = null;
        this.forecast = null;
        this.currentLocation = null;
    }

    async getWeather(latitude, longitude) {
        try {
            // Récupération de la météo actuelle
            const currentResponse = await fetch(
                `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m&timezone=auto`
            );
            const currentData = await currentResponse.json();

            // Récupération des prévisions sur 7 jours
            const forecastResponse = await fetch(
                `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto`
            );
            const forecastData = await forecastResponse.json();

            this.currentWeather = currentData.current;
            this.forecast = forecastData.daily;
            this.currentLocation = { latitude, longitude };

            // Synchroniser après la mise à jour des données météo
            try {
                await fetch('http://localhost/php/sync.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
            } catch (syncError) {
                console.error('Erreur lors de la synchronisation:', syncError);
            }

            return {
                current: this.currentWeather,
                forecast: this.forecast
            };
        } catch (error) {
            console.error('Erreur lors de la récupération des données météo:', error);
            throw error;
        }
    }

    getWeatherIcon(weatherCode) {
        // Conversion des codes météo Open-Meteo en icônes
        const weatherIcons = {
            0: '☀️',  // Ciel dégagé
            1: '🌤️',  // Légèrement nuageux
            2: '⛅',  // Partiellement nuageux
            3: '☁️',  // Couvert
            45: '🌫️', // Brouillard
            48: '🌫️', // Brouillard givrant
            51: '🌧️', // Bruine légère
            53: '🌧️', // Bruine modérée
            55: '🌧️', // Bruine dense
            61: '🌧️', // Pluie légère
            63: '🌧️', // Pluie modérée
            65: '🌧️', // Pluie forte
            71: '🌨️', // Neige légère
            73: '🌨️', // Neige modérée
            75: '🌨️', // Neige forte
            77: '🌨️', // Grains de neige
            80: '🌧️', // Averses légères
            81: '🌧️', // Averses modérées
            82: '🌧️', // Averses fortes
            85: '🌨️', // Averses de neige légères
            86: '🌨️', // Averses de neige fortes
            95: '⛈️', // Orage
            96: '⛈️', // Orage avec grêle légère
            99: '⛈️'  // Orage avec grêle forte
        };

        return weatherIcons[weatherCode] || '❓';
    }

    formatTemperature(temp) {
        return `${Math.round(temp)}°C`;
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
    }
} 