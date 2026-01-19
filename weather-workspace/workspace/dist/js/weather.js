// Weather forecast application main file
class WeatherApp {
    constructor() {
        this.apiKey = '4ed92e052ecc917a0d1dd78bce539faf'; // 请替换为您的API密钥
        this.currentWeather = null;
        this.forecast = null;
        this.locationInfo = null;

        // WMO天气代码到描述和图标的映射
        this.weatherCodeMap = {
            0: { description: 'Clear sky', icon: '01d', main: 'Clear' },
            1: { description: 'Mainly clear', icon: '02d', main: 'Clear' },
            2: { description: 'Partly cloudy', icon: '03d', main: 'Clouds' },
            3: { description: 'Overcast', icon: '04d', main: 'Clouds' },
            45: { description: 'Fog', icon: '50d', main: 'Fog' },
            48: { description: 'Depositing rime fog', icon: '50d', main: 'Fog' },
            51: { description: 'Light drizzle', icon: '10d', main: 'Rain' },
            53: { description: 'Moderate drizzle', icon: '10d', main: 'Rain' },
            55: { description: 'Dense drizzle', icon: '10d', main: 'Rain' },
            56: { description: 'Light freezing drizzle', icon: '13d', main: 'Rain' },
            57: { description: 'Dense freezing drizzle', icon: '13d', main: 'Rain' },
            61: { description: 'Slight rain', icon: '10d', main: 'Rain' },
            63: { description: 'Moderate rain', icon: '10d', main: 'Rain' },
            65: { description: 'Heavy rain', icon: '10d', main: 'Rain' },
            66: { description: 'Light freezing rain', icon: '13d', main: 'Rain' },
            67: { description: 'Heavy freezing rain', icon: '13d', main: 'Rain' },
            71: { description: 'Slight snow fall', icon: '13d', main: 'Snow' },
            73: { description: 'Moderate snow fall', icon: '13d', main: 'Snow' },
            75: { description: 'Heavy snow fall', icon: '13d', main: 'Snow' },
            77: { description: 'Snow grains', icon: '13d', main: 'Snow' },
            80: { description: 'Slight rain showers', icon: '09d', main: 'Rain' },
            81: { description: 'Moderate rain showers', icon: '09d', main: 'Rain' },
            82: { description: 'Violent rain showers', icon: '09d', main: 'Rain' },
            85: { description: 'Slight snow showers', icon: '13d', main: 'Snow' },
            86: { description: 'Heavy snow showers', icon: '13d', main: 'Snow' },
            95: { description: 'Thunderstorm', icon: '11d', main: 'Thunderstorm' },
            96: { description: 'Thunderstorm with slight hail', icon: '11d', main: 'Thunderstorm' },
            99: { description: 'Thunderstorm with heavy hail', icon: '11d', main: 'Thunderstorm' }
        };

        this.init();
    }

    init() {
        this.bindEvents();
        this.showCurrentLocationWeather();
    }

    bindEvents() {
        // 搜索按钮事件
        document.getElementById('search-btn').addEventListener('click', () => {
            this.searchLocation();
        });

        // 输入框回车事件
        document.getElementById('location-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.searchLocation();
            }
        });

        // 当前位置按钮事件
        document.getElementById('current-location-btn').addEventListener('click', () => {
            this.showCurrentLocationWeather();
        });
    }

    // Get current location weather
    async showCurrentLocationWeather() {
        this.showLoading();

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const { latitude, longitude } = position.coords;
                    const locationInfo = await this.fetchLocationInfo(latitude, longitude);
                    if (locationInfo) {
                        this.locationInfo = locationInfo;
                    }
                    await this.getWeatherByCoords(latitude, longitude);
                },
                (error) => {
                    console.error('Geolocation error:', error);
                    this.showError('Unable to get your location. Please allow location access or search manually.');
                }
            );
        } else {
            this.showError('Geolocation is not supported by your browser.');
        }
    }

    // Get weather by coordinates
    async getWeatherByCoords(lat, lon) {
        try {
            this.showLoading();

            // 使用Open-Meteo API获取当前天气和7天预报
            const response = await fetch(
                `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,pressure_msl,wind_speed_10m,visibility&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto&forecast_days=8`
            );

            if (!response.ok) {
                throw new Error('天气数据获取失败');
            }

            const data = await response.json();

            // 转换数据格式以保持与原有代码兼容
            this.currentWeather = this.convertCurrentWeatherData(data, lat, lon);
            this.forecast = this.convertForecastData(data);

            this.displayWeather();
            this.updateBackgroundEffect();

        } catch (error) {
            console.error('Failed to get weather data:', error);
            this.showError('Failed to get weather data. Please try again later.');
        }
    }

    // Search location
    async searchLocation() {
        const locationInput = document.getElementById('location-input');
        const query = locationInput.value.trim();

        if (!query) {
            this.showError('Please enter a city name');
            return;
        }

        try {
            this.showLoading();

            // Use free geocoding service (Nominatim - OpenStreetMap)
            const geoResponse = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&accept-language=en&q=${encodeURIComponent(query)}&limit=1&addressdetails=1`
            );

            if (!geoResponse.ok) {
                throw new Error('Geocoding failed');
            }

            const geoData = await geoResponse.json();

            if (geoData.length === 0) {
                throw new Error('Location not found');
            }

            const location = geoData[0];
            const lat = parseFloat(location.lat);
            const lon = parseFloat(location.lon);

            // Store location information for display
            this.locationInfo = {
                name: location.display_name.split(',')[0], // Get city name (English from accept-language)
                country: location.address?.country || 'Unknown',
                lat: lat,
                lon: lon
            };

            await this.getWeatherByCoords(lat, lon);

        } catch (error) {
            console.error('Location search failed:', error);
            this.showError('Location not found. Please check the name and try again.');
        }
    }

    // Fetch location details (English) via reverse geocoding
    async fetchLocationInfo(lat, lon) {
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1&accept-language=en`
            );

            if (!response.ok) {
                throw new Error('Reverse geocoding failed');
            }

            const data = await response.json();
            const primaryLabel = data.address?.city
                || data.address?.town
                || data.address?.village
                || data.address?.state
                || data.display_name?.split(',')[0]
                || 'Current Location';

            return {
                name: primaryLabel,
                country: data.address?.country || 'Unknown',
                lat,
                lon
            };
        } catch (error) {
            console.warn('Reverse geocoding failed:', error);
            return null;
        }
    }

    // 处理预报数据，生成7天预报
    processForecastData(data) {
        const dailyForecasts = {};
        const today = new Date().toDateString();

        data.list.forEach(item => {
            const date = new Date(item.dt * 1000);
            const dateKey = date.toDateString();

            // 跳过今天
            if (dateKey === today) return;

            if (!dailyForecasts[dateKey]) {
                dailyForecasts[dateKey] = {
                    date: date,
                    temps: [],
                    weather: item.weather[0],
                    precipitation: 0
                };
            }

            dailyForecasts[dateKey].temps.push(item.main.temp);
            if (item.rain && item.rain['3h']) {
                dailyForecasts[dateKey].precipitation += item.rain['3h'];
            }
        });

        // 转换为数组并计算每日最高/最低温度
        return Object.values(dailyForecasts).slice(0, 7).map(day => ({
            date: day.date,
            temp_min: Math.min(...day.temps),
            temp_max: Math.max(...day.temps),
            weather: day.weather,
            precipitation: day.precipitation
        }));
    }

    // Display weather data
    displayWeather() {
        this.hideLoading();
        this.hideError();

        // Display current location
        const locationName = document.getElementById('location-name');
        const locationDetails = document.getElementById('location-details');

        locationName.textContent = this.currentWeather.name;
        locationDetails.textContent = `${this.currentWeather.sys.country}`;

        // Display current weather
        const currentIcon = document.getElementById('current-icon');
        const currentTemp = document.getElementById('current-temp');
        const currentDescription = document.getElementById('current-description');
        const feelsLike = document.getElementById('feels-like');

        currentIcon.src = `https://openweathermap.org/img/wn/${this.currentWeather.weather[0].icon}@2x.png`;
        currentTemp.textContent = Math.round(this.currentWeather.main.temp);
        currentDescription.textContent = this.currentWeather.weather[0].description;
        feelsLike.textContent = `Feels like: ${Math.round(this.currentWeather.main.feels_like)}°C`;

        // Display detailed information
        document.getElementById('humidity').textContent = `${this.currentWeather.main.humidity}%`;
        document.getElementById('wind-speed').textContent = `${this.currentWeather.wind.speed} m/s`;
        document.getElementById('pressure').textContent = `${this.currentWeather.main.pressure} hPa`;
        document.getElementById('visibility').textContent = `${(this.currentWeather.visibility / 1000).toFixed(1)} km`;

        // Display 7-day forecast
        this.displayForecast();
    }

    // 显示7天预报
    displayForecast() {
        const forecastContainer = document.getElementById('forecast-container');
        forecastContainer.innerHTML = '';

        this.forecast.forEach(day => {
            const forecastItem = document.createElement('div');
            forecastItem.className = 'forecast-item';

            const date = day.date.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric'
            });

            forecastItem.innerHTML = `
                <div class="forecast-date">${date}</div>
                <div class="forecast-icon">
                    <img src="https://openweathermap.org/img/wn/${day.weather.icon}.png" alt="${day.weather.description}">
                </div>
                <div class="forecast-temp">${Math.round(day.temp_min)}° / ${Math.round(day.temp_max)}°</div>
                <div class="forecast-description">${day.weather.description}</div>
                <div class="forecast-precipitation">${day.precipitation > 0 ? `Precipitation: ${day.precipitation.toFixed(1)}mm` : ''}</div>
            `;

            forecastContainer.appendChild(forecastItem);
        });
    }

    // Update background effects
    updateBackgroundEffect() {
        const rainContainer = document.getElementById('rain-container');
        const sunContainer = document.getElementById('sun-container');

        // 清除现有特效
        rainContainer.innerHTML = '';
        sunContainer.innerHTML = '';

        const weatherMain = this.currentWeather.weather[0].main.toLowerCase();

        if (weatherMain.includes('rain') || weatherMain.includes('drizzle')) {
            // 雨天特效
            rainContainer.style.opacity = '1';
            sunContainer.style.opacity = '0';
            this.createRainEffect();
        } else if (weatherMain.includes('clear') || weatherMain.includes('sun')) {
            // 晴天特效
            rainContainer.style.opacity = '0';
            sunContainer.style.opacity = '1';
            this.createSunEffect();
        } else {
            // 默认晴天
            rainContainer.style.opacity = '0';
            sunContainer.style.opacity = '1';
            this.createSunEffect();
        }
    }

    // Create rain effect
    createRainEffect() {
        const rainContainer = document.getElementById('rain-container');

        for (let i = 0; i < 100; i++) {
            const rainDrop = document.createElement('div');
            rainDrop.className = 'rain-drop';

            // 随机位置和大小
            rainDrop.style.left = Math.random() * 100 + '%';
            rainDrop.style.width = (Math.random() * 2 + 1) + 'px';
            rainDrop.style.height = (Math.random() * 20 + 10) + 'px';
            rainDrop.style.animationDuration = (Math.random() * 2 + 1) + 's';
            rainDrop.style.animationDelay = Math.random() * 2 + 's';

            rainContainer.appendChild(rainDrop);
        }
    }

    // Create sun effect
    createSunEffect() {
        const sunContainer = document.getElementById('sun-container');

        for (let i = 0; i < 5; i++) {
            const sunRay = document.createElement('div');
            sunRay.className = 'sun-ray';

            // 随机位置
            sunRay.style.top = (Math.random() * 50 + 10) + '%';
            sunRay.style.left = (Math.random() * 80 + 10) + '%';
            sunRay.style.width = (Math.random() * 100 + 50) + 'px';
            sunRay.style.height = (Math.random() * 100 + 50) + 'px';
            sunRay.style.animationDelay = (Math.random() * 2) + 's';

            sunContainer.appendChild(sunRay);
        }
    }

    // Show loading state
    showLoading() {
        document.getElementById('loading').style.display = 'block';
        document.getElementById('current-weather').style.display = 'none';
        document.getElementById('forecast').style.display = 'none';
    }

    // Hide loading state
    hideLoading() {
        document.getElementById('loading').style.display = 'none';
        document.getElementById('current-weather').style.display = 'block';
        document.getElementById('forecast').style.display = 'block';
    }

    // Show error message
    showError(message) {
        const errorElement = document.getElementById('error-message');
        errorElement.textContent = message;
        errorElement.style.display = 'block';
        this.hideLoading();
    }

    // Hide error message
    hideError() {
        document.getElementById('error-message').style.display = 'none';
    }

    // Convert current weather data to compatible format
    convertCurrentWeatherData(data, lat, lon) {
        const weatherInfo = this.weatherCodeMap[data.current.weather_code] || this.weatherCodeMap[0];

        return {
            name: this.locationInfo?.name || 'Current Location',
            sys: {
                country: this.locationInfo?.country || 'Unknown'
            },
            coord: {
                lat: lat,
                lon: lon
            },
            main: {
                temp: data.current.temperature_2m,
                feels_like: data.current.apparent_temperature,
                humidity: data.current.relative_humidity_2m,
                pressure: Math.round(data.current.pressure_msl)
            },
            weather: [{
                main: weatherInfo.main,
                description: weatherInfo.description,
                icon: weatherInfo.icon
            }],
            wind: {
                speed: data.current.wind_speed_10m
            },
            visibility: data.current.visibility || 10000 // 默认10km能见度
        };
    }

    // Convert forecast data to compatible format
    convertForecastData(data) {
        const forecasts = [];

        // 从明天开始的7天预报
        for (let i = 1; i <= 7; i++) {
            const weatherInfo = this.weatherCodeMap[data.daily.weather_code[i]] || this.weatherCodeMap[0];
            const date = new Date(data.daily.time[i]);

            forecasts.push({
                date: date,
                temp_min: data.daily.temperature_2m_min[i],
                temp_max: data.daily.temperature_2m_max[i],
                weather: {
                    main: weatherInfo.main,
                    description: weatherInfo.description,
                    icon: weatherInfo.icon
                },
                precipitation: data.daily.precipitation_sum[i] || 0
            });
        }

        return forecasts;
    }
}

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
    new WeatherApp();
});