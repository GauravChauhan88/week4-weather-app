// js/app.js
document.addEventListener('DOMContentLoaded', () => {
    // Check if configuration engine exists, fallback to placeholder string
    const API_KEY = typeof CONFIG !== 'undefined' ? CONFIG.API_KEY : 'YOUR_OPENWEATHERMAP_API_KEY';
    
    const weatherService = new WeatherService(API_KEY);
    const ui = new WeatherUI();
    
    let lastFetchedData = null;
    let lastFetchedForecast = null;
    let debounceTimer; // Controls autocomplete search pacing

    // DOM Elements
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const unitToggleBtn = document.getElementById('unitToggle');
    const locationBtn = document.getElementById('locationBtn');
    const autocompleteResults = document.getElementById('autocompleteResults');

    // --- Core Pipeline: Fetch and Render Weather ---
    async function fetchAndRenderWeather(city) {
        if (!city) return;
        ui.showLoading();
        autocompleteResults.innerHTML = ''; // Instantly collapse suggestions dropdown
        
        try {
            lastFetchedData = await weatherService.getCurrentWeather(city);
            lastFetchedForecast = await weatherService.getForecast(city);
            
            renderAll();
            
            // Sync with history tracking
            if (typeof AppStorage !== 'undefined') {
                AppStorage.saveCity(city);
            } else {
                localStorage.setItem('lastSearchedCity', city);
            }
        } catch (error) {
            ui.showError(`Could not fetch weather data for "${city}". Please check the spelling or your API key configuration.`);
        }
    }

    // Forces UI elements to draw matching current memory metrics state
    function renderAll() {
        if (lastFetchedData) ui.displayCurrentWeather(lastFetchedData);
        if (lastFetchedForecast) ui.displayForecast(lastFetchedForecast);
    }

    // --- Favorites Management UI Sync ---
    function refreshFavoritesUI() {
        if (typeof AppStorage !== 'undefined') {
            const list = AppStorage.getFavorites();
            ui.displayFavoritesBar(list);
        }
    }

    // --- Autocomplete Event Stream Handler ---
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim();
        
        // Reset timer loop as long as the user continues actively typing characters
        clearTimeout(debounceTimer);
        
        if (query.length < 3) {
            autocompleteResults.innerHTML = '';
            return;
        }

        // Fire request to endpoint only after user stops entering keystrokes for 300ms
        debounceTimer = setTimeout(async () => {
            const suggestions = await weatherService.getCitySuggestions(query);
            autocompleteResults.innerHTML = ''; // Wipe stale rows
            
            if (suggestions.length === 0) return;

            // Generate dropdown rows on the fly
            suggestions.forEach(city => {
                const item = document.createElement('div');
                item.className = 'autocomplete-item';
                
                // Formats context display matching geolocation outputs cleanly
                const stateDisplay = city.state ? `, ${city.state}` : '';
                item.textContent = `${city.name}${stateDisplay}, ${city.country}`;
                
                // Click capture updates values and automatically launches weather fetch
                item.addEventListener('click', () => {
                    searchInput.value = city.name;
                    fetchAndRenderWeather(city.name);
                });
                
                autocompleteResults.appendChild(item);
            });
        }, 300);
    });

    // --- Global Click Interceptor / Delegation Panel ---
    document.addEventListener('click', (e) => {
        // 1. Close suggestion track panel if client clicks anywhere outside search area elements
        if (!e.target.closest('.search-box')) {
            autocompleteResults.innerHTML = '';
        }

        // 2. Check if user clicked the favorite star button inside the weather card
        const favBtn = e.target.closest('#favBtn');
        if (favBtn) {
            const targetCity = favBtn.getAttribute('data-city');
            if (AppStorage.isFavorite(targetCity)) {
                AppStorage.removeFavorite(targetCity);
            } else {
                AppStorage.addFavorite(targetCity);
            }
            // Force re-rendering to sync star icon appearance states immediately
            if (lastFetchedData) ui.displayCurrentWeather(lastFetchedData);
            refreshFavoritesUI();
            return;
        }

        // 3. Check if user clicked a pill chip button in the favorites row bar
        const favChip = e.target.closest('.fav-chip');
        if (favChip) {
            const targetCity = favChip.getAttribute('data-city');
            searchInput.value = targetCity;
            fetchAndRenderWeather(targetCity);
            return;
        }
    });

    // --- Standard Application Action Interaction Hooks ---
    searchBtn.addEventListener('click', () => {
        fetchAndRenderWeather(searchInput.value.trim());
    });

    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            fetchAndRenderWeather(searchInput.value.trim());
        }
    });

    unitToggleBtn.addEventListener('click', () => {
        ui.toggleUnit();
        renderAll(); // Dynamically transforms active layouts instantly
    });

    locationBtn.addEventListener('click', () => {
        if (navigator.geolocation) {
            ui.showLoading();
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const lat = position.coords.latitude;
                    const lon = position.coords.longitude;
                    try {
                        const response = await fetch(
                            `${weatherService.baseUrl}/weather?lat=${lat}&lon=${lon}&units=metric&appid=${weatherService.apiKey}`
                        );
                        const data = await response.json();
                        fetchAndRenderWeather(data.name);
                    } catch (err) {
                        ui.showError("Failed matching coordinate telemetry data to a local city profile.");
                    }
                },
                () => ui.showError("Device location sensor permissions denied.")
            );
        } else {
            ui.showError("Geolocation tracking features are not supported by this browser layer.");
        }
    });

    // --- Initialization Engine Boot Cycle ---
    // Load favorites row
    refreshFavoritesUI();

    // Hydrate startup baseline from storage or generic default profile string target
    const storedCity = (typeof AppStorage !== 'undefined' ? AppStorage.getCity() : null) || 
                       localStorage.getItem('lastSearchedCity') || 
                       'Delhi';
    
    searchInput.value = storedCity;
    fetchAndRenderWeather(storedCity);
});