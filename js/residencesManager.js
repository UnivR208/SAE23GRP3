// Gestionnaire de résidences pour la météo
class ResidenceWeatherManager {
    constructor() {
        this.residences = {
            primary: null,
            secondary: []
        };
        this.activeResidenceIndex = 0; // 0 = primaire, 1-2 = secondaires
    }
    
    // Initialiser avec les données d'un utilisateur
    initFromUserData(userData) {
        if (!userData) return false;
        
        this.residences.primary = userData.primary;
        this.residences.secondary = userData.secondary || [];
        
        return true;
    }
    
    // Obtenir la résidence active
    getActiveResidence() {
        if (this.activeResidenceIndex === 0) {
            return this.residences.primary;
        } else {
            const secondaryIndex = this.activeResidenceIndex - 1;
            return this.residences.secondary[secondaryIndex];
        }
    }
    
    // Passer à la résidence suivante
    switchToNextResidence() {
        const totalResidences = 1 + this.residences.secondary.filter(Boolean).length;
        this.activeResidenceIndex = (this.activeResidenceIndex + 1) % totalResidences;
        return this.getActiveResidence();
    }
    
    // Définir une résidence
    setResidence(type, index, residenceData) {
        if (type === 'primary') {
            this.residences.primary = residenceData;
        } else if (type === 'secondary' && index >= 0 && index < 2) {
            this.residences.secondary[index] = residenceData;
        }
    }
    
    // Obtenir toutes les résidences
    getAllResidences() {
        return {
            primary: this.residences.primary,
            secondary: this.residences.secondary
        };
    }
    
    // Modifier une résidence existante
    updateResidence(type, index, cityName, lat, lon) {
        const residenceData = {
            name: cityName,
            latitude: parseFloat(lat),
            longitude: parseFloat(lon)
        };
        
        this.setResidence(type, index, residenceData);
    }
}

// Exporter l'instance unique
const residenceManager = new ResidenceWeatherManager();