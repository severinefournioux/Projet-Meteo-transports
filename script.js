// Les API Open-Meteo et Nominatim ne nécessitent PAS de clé pour une utilisation non commerciale
const OPEN_METEO_API_URL = 'https://api.open-meteo.com/v1/forecast';
const NOMINATIM_API_URL = 'https://nominatim.openstreetmap.org/search';

// Sélecteurs inchangés...
const cityInput = document.getElementById('city-input');
const searchButton = document.getElementById('search-button');
const cityNameElement = document.getElementById('city-name');
const tempElement = document.getElementById('temperature');
const descriptionElement = document.getElementById('description');
const iconElement = document.getElementById('weather-icon');
const humidityElement = document.getElementById('humidity');
const windSpeedElement = document.getElementById('wind-speed');

// --- 1. FONCTION DE GÉOCODAGE (Nom de la ville -> Lat/Lon) ---

async function getCoordinates(city) {
    // Construction de l'URL pour Nominatim
    // format=json pour obtenir une réponse JSON
    // limit=1 pour obtenir seulement le meilleur résultat
    const geocodingUrl = `${NOMINATIM_API_URL}?q=${city}&format=json&limit=1`;

    try {
        const response = await fetch(geocodingUrl);
        const data = await response.json();

        if (data.length === 0) {
            throw new Error(`Coordonnées non trouvées pour la ville: ${city}`);
        }

        // Nominatim retourne 'lat' et 'lon'
        const lat = data[0].lat;
        const lon = data[0].lon;
        const displayName = data[0].display_name.split(',')[0]; // Nom propre de la ville

        return { lat, lon, name: displayName };

    } catch (error) {
        console.error('Erreur de géocodage:', error);
        throw new Error(`Impossible de localiser "${city}".`);
    }
}

// --- 2. NOUVELLE FONCTION PRINCIPALE DE RÉCUPÉRATION DES DONNÉES ---

/**
 * Récupère les données météo pour des coordonnées données.
 */
async function getWeatherData(lat, lon, cityName) {
    // Paramètres : latitude, longitude, et les variables météo souhaitées
    const weatherUrl = `${OPEN_METEO_API_URL}?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m&timezone=auto`;

    try {
        const response = await fetch(weatherUrl);
        if (!response.ok) {
            throw new Error(`Erreur réseau Open-Meteo (${response.status})`);
        }

        const data = await response.json();
        
        // Open-Meteo ne fournit pas de 'description' ou 'icône' comme OpenWeatherMap,
        // nous allons donc simplifier l'affichage.
        displayWeatherData(data, cityName);

    } catch (error) {
        cityNameElement.textContent = 'Erreur de Météo';
        tempElement.textContent = error.message;
        descriptionElement.textContent = '';
        iconElement.style.display = 'none';
        console.error('Erreur lors de la récupération des données météo:', error);
    }
}

// --- 3. FONCTION D'AFFICHAGE MISE À JOUR ---

function displayWeatherData(data, cityName) {
    // Open-Meteo structure les données différemment
    const current = data.current;

    // Affichage des informations de base
    cityNameElement.textContent = cityName;
    tempElement.textContent = `${Math.round(current.temperature_2m)}°C`;
    
    // Simplification pour Open-Meteo (car pas de description facile)
    descriptionElement.textContent = `Données Météo Actuelles`; 
    
    // Affichage des détails
    humidityElement.textContent = `${current.relative_humidity_2m}%`;
    windSpeedElement.textContent = `${(current.wind_speed_10m).toFixed(1)} km/h`; 

    // Gestion de l'icône : Masquée ou mise à jour manuellement si vous ajoutez une logique complexe
    iconElement.style.display = 'none'; 
}


// --- 4. GESTIONNAIRE DE RECHERCHE MISE À JOUR ---

async function handleSearch() {
    const city = cityInput.value.trim();
    if (!city) {
        alert('Veuillez entrer un nom de ville.');
        return;
    }

    try {
        // Étape 1 : Obtenir les coordonnées
        const locationData = await getCoordinates(city);
        
        // Étape 2 : Obtenir la météo avec les coordonnées
        await getWeatherData(locationData.lat, locationData.lon, locationData.name);
        
        cityInput.value = '';

    } catch (error) {
        cityNameElement.textContent = 'Erreur de Recherche';
        tempElement.textContent = error.message;
        descriptionElement.textContent = '';
        console.error('Erreur complète de recherche:', error);
    }
}

// --- ÉCOUTEURS D'ÉVÉNEMENTS (Pas de changement) ---
searchButton.addEventListener('click', handleSearch);

cityInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') { 
        handleSearch();
    }
});

// Optionnel : Lancer la recherche pour une ville par défaut
// Pour cela, nous devons utiliser handleSearch
handleSearch('Paris');
