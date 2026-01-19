# Weather Forecast H5 Application

A modern weather forecast H5 application that supports geolocation, location search, and 7-day weather forecasts with dynamic background effects.

## Features

- 🌍 **Geolocation**: Automatically get current location weather
- 🔍 **Location Search**: Support city name search
- 📱 **Responsive Design**: Adapts to various device sizes
- 🎨 **Dynamic Effects**: Display rain or sunny background effects based on weather conditions
- 📊 **7-Day Forecast**: Show 7-day weather forecast
- ⚡ **Real-time Data**: Get real-time weather data using free Open-Meteo API
- 🔒 **No API Key Required**: Completely free, no registration or API key configuration needed

## Quick Start

### Direct Run

No configuration needed, just open `workspace/dist/index.html` in your browser to run the application!

### Or use the start script

```bash
cd weather-workspace
./start.sh
```

## 文件结构

```
weather-workspace/
├── README.md
└── workspace/
    └── dist/
        ├── index.html      # 主页面
        ├── css/
        │   └── style.css  # 样式文件
        └── js/
            └── weather.js # JavaScript逻辑
```

## Tech Stack

- **HTML5**: Semantic structure
- **CSS3**: Modern styles with animations and responsive design
- **Vanilla JavaScript**: Native JavaScript, no framework dependencies
- **Open-Meteo API**: Free weather data API
- **OpenStreetMap Nominatim**: Free geocoding service

## API Usage

The application uses the following free APIs:

- **Open-Meteo**: Weather data (no API key required)
  - `https://api.open-meteo.com/v1/forecast` - Current weather and 7-day forecast
- **OpenStreetMap Nominatim**: Geocoding (no API key required)
  - `https://nominatim.openstreetmap.org/search` - Location search

**Advantages**:
- ✅ Completely free, no API key restrictions
- ✅ Support global weather data
- ✅ High-precision forecast data
- ✅ No request rate limits (reasonable use)
- ✅ Support for non-commercial use

## Browser Support

- Chrome 70+
- Firefox 65+
- Safari 12+
- Edge 79+

Requires modern browsers that support the Geolocation API.

## Feature Description

### Geolocation
Click the "Current Location" button or the page will automatically get your location and display local weather when loading.

### Location Search
Enter a city name in the search box, press Enter or click the search button to view the weather for that city.

### Background Effects
- **Rainy Day**: Display dynamic raindrop effects
- **Sunny Day**: Display sunlight ray effects

### Weather Information
- Current temperature and feels-like temperature
- Weather description and icon
- Humidity, wind speed, pressure, visibility
- 7-day high/low temperature forecast

## Notes

1. The browser will request geolocation permission on first use
2. Ensure network connection is normal to get weather data
3. Open-Meteo API is designed for non-commercial use, please use reasonably
4. Geocoding service (Nominatim) has request rate limits, avoid frequent searches

## Custom Extensions

You can extend the following features as needed:

- Add more weather parameter displays
- Implement weather alert functions
- Add historical weather queries
- Support multiple languages
- Add weather maps

## License

MIT License