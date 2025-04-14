// Gestionnaire de fichier CSV pour les utilisateurs
class UserDataManager {
    constructor() {
        this.users = [];
        this.currentUser = null;
    }
    
    // Charger les données utilisateurs depuis un CSV
    async loadUserDataFromCSV(csvURL) {
        try {
            const response = await fetch(csvURL);
            const csvText = await response.text();
            this.parseCSV(csvText);
            return true;
        } catch (error) {
            console.error("Erreur lors du chargement du CSV:", error);
            return false;
        }
    }
    
    // Parser le CSV et construire l'objet utilisateurs
    parseCSV(csvText) {
        // Séparation des lignes
        const lines = csvText.split('\n');
        
        // Récupération des en-têtes
        const headers = lines[0].split(',');
        
        // Traitement des données
        for (let i = 1; i < lines.length; i++) {
            // Ignorer les lignes vides
            if (!lines[i].trim()) continue;
            
            const values = lines[i].split(',');
            const user = {};
            
            // Création de l'objet utilisateur
            for (let j = 0; j < headers.length; j++) {
                user[headers[j].trim()] = values[j].trim();
            }
            
            // J'ai corrigé la structure des résidences pour utiliser correctement les coordonnées
            const primary = {
                name: user.primary_residence,
                latitude: parseFloat(user.primary_lat),
                longitude: parseFloat(user.primary_lon)
            };
            
            // Création des résidences secondaires seulement si elles existent
            const secondary = [];
            
            if (user.secondary_residence1 && user.secondary_residence1.trim()) {
                secondary.push({
                    name: user.secondary_residence1,
                    latitude: parseFloat(user.secondary1_lat),
                    longitude: parseFloat(user.secondary1_lon)
                });
            }
            
            if (user.secondary_residence2 && user.secondary_residence2.trim()) {
                secondary.push({
                    name: user.secondary_residence2,
                    latitude: parseFloat(user.secondary2_lat),
                    longitude: parseFloat(user.secondary2_lon)
                });
            }
            
            // Assurer que l'utilisateur a une structure correcte pour ses résidences
            user.residences = {
                primary: primary,
                secondary: secondary
            };
            
            // Ajouter l'utilisateur à la liste
            this.users.push(user);
        }
    }
    
    // Le reste du code reste inchangé...
    
    // Récupérer un utilisateur par son ID
    getUserById(userId) {
        return this.users.find(user => user.id === userId);
    }
    
    // Définir l'utilisateur courant
    setCurrentUser(userId) {
        const user = this.getUserById(userId);
        if (user) {
            this.currentUser = user;
            return true;
        }
        return false;
    }
    
    // Récupérer les résidences de l'utilisateur courant
    getCurrentUserResidences() {
        if (!this.currentUser) return null;
        
        return {
            primary: this.currentUser.residences.primary,
            secondary: this.currentUser.residences.secondary
        };
    }
    
    // Mettre à jour les résidences d'un utilisateur
    updateUserResidences(userId, primaryResidence, secondaryResidence1, secondaryResidence2) {
        const user = this.getUserById(userId);
        if (!user) return false;
        
        user.residences = {
            primary: primaryResidence,
            secondary: [secondaryResidence1, secondaryResidence2].filter(Boolean)
        };
        
        return true;
    }
}

// Exporter l'instance unique
const userManager = new UserDataManager();