// js/weatherService.js
class WeatherService {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseUrl = 'https://api.openweathermap.org/data/2.5';
        this.cache = new Map();
        this.cacheDuration = 10 * 60 * 1000; // 10 minutes
    }
    
    // Core API Method: Fetch Current Weather
    async getCurrentWeather(city) {
        const cacheKey = `current_${city}`;
        const cached = this.getFromCache(cacheKey);
        if (cached) return cached;
        
        try {
            const response = await fetch(
                `${this.baseUrl}/weather?q=${city}&units=metric&appid=${this.apiKey}`
            );
            
            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }
            
            const data = await response.json();
            this.saveToCache(cacheKey, data);
            return data;
        } catch (error) {
            console.error('Error fetching current weather:', error);
            throw error;
        }
    }
    
    // Core API Method: Fetch 5-Day Forecast
    async getForecast(city) {
        const cacheKey = `forecast_${city}`;
        const cached = this.getFromCache(cacheKey);
        if (cached) return cached;
        
        try {
            const response = await fetch(
                `${this.baseUrl}/forecast?q=${city}&units=metric&appid=${this.apiKey}`
            );
            
            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }
            
            const data = await response.json();
            this.saveToCache(cacheKey, data);
            return data;
        } catch (error) {
            console.error('Error fetching forecast:', error);
            throw error;
        }
    }

    // New API Method: Autocomplete Geocoding Search
    async getCitySuggestions(query) {
        if (!query || query.length < 3) return []; // Guard clause to save API limits
        
        try {
            const response = await fetch(
                `https://api.openweathermap.org/geo/1.0/direct?q=${query}&limit=5&appid=${this.apiKey}`
            );
            
            if (!response.ok) {
                throw new Error(`Geocoding API Error: ${response.status}`);
            }
            return await response.json(); 
        } catch (error) {
            console.error('Error fetching city suggestions:', error);
            return [];
        }
    }
    
    // Cache Management Utilities
    getFromCache(key) {
        const cached = this.cache.get(key);
        if (cached && Date.now() - cached.timestamp < this.cacheDuration) {
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
    
    clearCache() {
        this.cache.clear();
    }
}