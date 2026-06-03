// js/ui.js
class WeatherUI {
    constructor() {
        this.currentWeatherEl = document.getElementById('currentWeather');
        this.forecastEl = document.getElementById('forecast');
        this.searchInput = document.getElementById('searchInput');
        this.unitToggle = document.getElementById('unitToggle');
        this.currentUnit = 'celsius';
    }
    
    displayCurrentWeather(weatherData) {
        const temp = this.convertTemp(weatherData.main.temp);
        const feelsLike = this.convertTemp(weatherData.main.feels_like);
        
        // Read from storage layer to determine active star design styles
        const isFav = typeof AppStorage !== 'undefined' ? AppStorage.isFavorite(weatherData.name) : false;
        const starIcon = isFav ? '★' : '☆';
        const starClass = isFav ? 'fav-active' : 'fav-inactive';

        const html = `
            <div class="weather-card">
                <div class="card-header">
                    <h2>${weatherData.name}, ${weatherData.sys.country}</h2>
                    <button id="favBtn" class="fav-star-btn ${starClass}" data-city="${weatherData.name}">
                        ${starIcon}
                    </button>
                </div>
                <div class="weather-main">
                    <div class="temperature">
                        ${temp}°${this.currentUnit === 'celsius' ? 'C' : 'F'}
                    </div>
                    <div class="weather-condition">
                        <i class="wi wi-owm-${weatherData.weather[0].id}"></i>
                        <span>${weatherData.weather[0].description}</span>
                    </div>
                </div>
                <div class="weather-details">
                    <div class="detail">
                        <span>Feels like:</span>
                        <span>${feelsLike}°${this.currentUnit === 'celsius' ? 'C' : 'F'}</span>
                    </div>
                    <div class="detail">
                        <span>Humidity:</span>
                        <span>${weatherData.main.humidity}%</span>
                    </div>
                    <div class="detail">
                        <span>Wind:</span>
                        <span>${weatherData.wind.speed} m/s</span>
                    </div>
                    <div class="detail">
                        <span>Pressure:</span>
                        <span>${weatherData.main.pressure} hPa</span>
                    </div>
                </div>
            </div>
        `;
        
        this.currentWeatherEl.innerHTML = html;
    }
    
    displayForecast(forecastData) {
        const dailyForecast = this.groupForecastByDay(forecastData.list);
        
        let html = '<div class="forecast-container">';
        
        dailyForecast.slice(0, 5).forEach(day => {
            const date = new Date(day.dt * 1000);
            const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
            const tempMin = this.convertTemp(day.main.temp_min);
            const tempMax = this.convertTemp(day.main.temp_max);
            
            html += `
                <div class="forecast-day">
                    <div class="day-name">${dayName}</div>
                    <i class="wi wi-owm-${day.weather[0].id}"></i>
                    <div class="temps">
                        <span class="temp-max">${tempMax}°</span>
                        <span class="temp-min">${tempMin}°</span>
                    </div>
                    <div class="condition">${day.weather[0].description}</div>
                </div>
            `;
        });
        
        html += '</div>';
        this.forecastEl.innerHTML = html;
    }

    // --- NEW: Render Saved Favorites Bar Track Row ---
    displayFavoritesBar(favoritesList) {
        const barContainer = document.getElementById('favoritesBar');
        if (!barContainer) return;

        if (favoritesList.length === 0) {
            barContainer.innerHTML = '<span class="no-favs-msg">No favorite cities saved yet.</span>';
            return;
        }

        let html = '<div class="fav-chips-wrapper">';
        favoritesList.forEach(city => {
            html += `
                <div class="fav-chip" data-city="${city}">
                    <span class="chip-name">📍 ${city}</span>
                </div>
            `;
        });
        html += '</div>';
        barContainer.innerHTML = html;
    }
    
    convertTemp(temp) {
        return this.currentUnit === 'celsius' ? Math.round(temp) : Math.round((temp * 9/5) + 32);
    }
    
    groupForecastByDay(forecastList) {
        const days = {};
        forecastList.forEach(item => {
            const date = new Date(item.dt * 1000).toDateString();
            if (!days[date]) days[date] = item;
        });
        return Object.values(days);
    }
    
    showLoading() {
        this.currentWeatherEl.innerHTML = '<div class="loading">Loading weather data...</div>';
        this.forecastEl.innerHTML = '';
    }
    
    showError(message) {
        this.currentWeatherEl.innerHTML = `<div class="error"><p>${message}</p></div>`;
    }
    
    toggleUnit() {
        this.currentUnit = this.currentUnit === 'celsius' ? 'fahrenheit' : 'celsius';
        this.unitToggle.textContent = `Switch to °${this.currentUnit === 'celsius' ? 'F' : 'C'}`;
    }
}