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
        
        // Si pas de cache valide, récupérer les données depuis l'API OpenWeatherMap
        try {
            const apiKey = '89ac09b35488a8cef29448b959249aa1'; // Clé API OpenWeatherMap
            const response = await fetch(
                `https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&exclude=minutely,hourly&units=metric&lang=fr&appid=${apiKey}`
            );
            
            if (!response.ok) {
                throw new Error('Erreur lors de la récupération des données météo');
            }
            
            const weatherData = await response.json();
            
            // Mettre en cache les données
            this.data.weather_cache[cityName] = {
                timestamp: now,
                data: {
                    current: weatherData.current,
                    forecast: weatherData.daily
                }
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

    /**
     * Réinitialise toutes les données (pour tests)
     */
    async resetData() {
        localStorage.removeItem(this.storageKey);
        return this.loadData();
    }
} 