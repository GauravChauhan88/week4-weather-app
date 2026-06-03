// js/storage.js
const AppStorage = {
    // Current Search Session History Management
    saveCity: (city) => localStorage.setItem('lastSearchedCity', city),
    getCity: () => localStorage.getItem('lastSearchedCity'),

    // --- NEW: Favorites Tracking Storage Engines ---
    getFavorites: () => {
        const favs = localStorage.getItem('weatherFavorites');
        return favs ? JSON.parse(favs) : []; // Convert raw string back to a clean JS Array
    },

    addFavorite: (city) => {
        const favs = AppStorage.getFavorites();
        const formattedCity = city.trim();
        if (!favs.includes(formattedCity)) {
            favs.push(formattedCity);
            localStorage.setItem('weatherFavorites', JSON.stringify(favs));
        }
    },

    removeFavorite: (city) => {
        let favs = AppStorage.getFavorites();
        favs = favs.filter(f => f.toLowerCase() !== city.trim().toLowerCase());
        localStorage.setItem('weatherFavorites', JSON.stringify(favs));
    },

    isFavorite: (city) => {
        const favs = AppStorage.getFavorites();
        return favs.some(f => f.toLowerCase() === city.trim().toLowerCase());
    }
};