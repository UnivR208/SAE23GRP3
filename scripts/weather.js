class WeatherManager {
    constructor() {
        this.currentWeather = null;
        this.forecast = null;
        this.currentLocation = null;
    }

    async getWeather(latitude, longitude) {
        try {
            // Récupération de la météo actuelle et des prévisions via OpenWeatherMap
            const apiKey = '89ac09b35488a8cef29448b959249aa1';
            const response = await fetch(
                `https://api.openweathermap.org/data/2.5/onecall?lat=${latitude}&lon=${longitude}&exclude=minutely,hourly&units=metric&lang=fr&appid=${apiKey}`
            );
            
            if (!response.ok) {
                throw new Error('Erreur lors de la récupération des données météo');
            }
            
            const data = await response.json();
            
            this.currentWeather = data.current;
            this.forecast = data.daily;
            this.currentLocation = { latitude, longitude };

            return {
                current: this.currentWeather,
                forecast: this.forecast
            };
        } catch (error) {
            console.error('Erreur lors de la récupération des données météo:', error);
            throw error;
        }
    }

    getWeatherDescription(weather) {
        if (!weather || !weather.weather || !weather.weather[0]) {
            return '?';
        }
        return weather.weather[0].description;
    }

    getWeatherIcon(weather) {
        if (!weather || !weather.weather || !weather.weather[0]) {
            return '❓';
        }
        
        return `<img src="https://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png" alt="${weather.weather[0].description}">`;
    }

    formatTemperature(temp) {
        return `${Math.round(temp)}°C`;
    }

    formatDate(timestamp) {
        const date = new Date(timestamp * 1000);
        return date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
    }
} 