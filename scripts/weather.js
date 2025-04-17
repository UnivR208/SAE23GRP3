class WeatherManager {
    constructor() {
        this.currentWeather = null;
        this.forecast = null;
        this.currentLocation = null;
    }

    async getWeather(latitude, longitude) {
        try {
            // Récupération de la météo actuelle et des prévisions via Open-Meteo
            const response = await fetch(
                `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_direction_10m,pressure_msl&hourly=temperature_2m,precipitation_probability,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,sunrise,sunset,uv_index_max,wind_speed_10m_max&timezone=auto`
            );
            
            if (!response.ok) {
                throw new Error('Erreur lors de la récupération des données météo');
            }
            
            const data = await response.json();
            
            // Transformer les données pour qu'elles soient compatibles avec l'interface existante
            this.currentWeather = {
                temp: data.current.temperature_2m,
                feels_like: data.current.apparent_temperature,
                humidity: data.current.relative_humidity_2m,
                wind_speed: data.current.wind_speed_10m,
                wind_deg: data.current.wind_direction_10m,
                pressure: data.current.pressure_msl,
                weather: [{
                    id: data.current.weather_code,
                    main: this.getWeatherMainFromCode(data.current.weather_code),
                    description: this.getWeatherDescriptionFromCode(data.current.weather_code),
                    icon: this.getWeatherIconFromCode(data.current.weather_code)
                }]
            };
            
            // Formater les prévisions quotidiennes
            this.forecast = [];
            for (let i = 0; i < data.daily.time.length; i++) {
                this.forecast.push({
                    dt: new Date(data.daily.time[i]).getTime() / 1000,
                    sunrise: new Date(data.daily.sunrise[i]).getTime() / 1000,
                    sunset: new Date(data.daily.sunset[i]).getTime() / 1000,
                    temp: {
                        day: data.daily.temperature_2m_max[i],
                        min: data.daily.temperature_2m_min[i],
                        max: data.daily.temperature_2m_max[i]
                    },
                    weather: [{
                        id: data.daily.weather_code[i],
                        main: this.getWeatherMainFromCode(data.daily.weather_code[i]),
                        description: this.getWeatherDescriptionFromCode(data.daily.weather_code[i]),
                        icon: this.getWeatherIconFromCode(data.daily.weather_code[i])
                    }],
                    pop: data.daily.precipitation_probability_max[i] / 100, // Convertir le pourcentage en décimal
                    uvi: data.daily.uv_index_max[i],
                    wind_speed: data.daily.wind_speed_10m_max[i],
                    precipitation: data.daily.precipitation_sum[i]
                });
            }
            
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
    
    getWeatherDescriptionFromCode(code) {
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
    
    getWeatherMainFromCode(code) {
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

    getWeatherIcon(weather) {
        if (!weather || !weather.weather || !weather.weather[0]) {
            return '❓';
        }
        
        return `<img src="https://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png" alt="${weather.weather[0].description}">`;
    }
    
    getWeatherIconFromCode(code) {
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

    formatTemperature(temp) {
        return `${Math.round(temp)}°C`;
    }

    formatDate(timestamp) {
        const date = new Date(timestamp * 1000);
        return date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
    }
    
    formatWindSpeed(speed) {
        return `${Math.round(speed)} km/h`;
    }
    
    formatUVIndex(uvi) {
        if (uvi < 3) return `${uvi} (Faible)`;
        if (uvi < 6) return `${uvi} (Modéré)`;
        if (uvi < 8) return `${uvi} (Élevé)`;
        if (uvi < 11) return `${uvi} (Très élevé)`;
        return `${uvi} (Extrême)`;
    }
    
    formatPrecipitation(amount) {
        return `${amount} mm`;
    }
} 