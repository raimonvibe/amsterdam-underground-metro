# Amsterdam Underground Metro Tracker

A real-time visualization application for Amsterdam's metro system featuring a dark-themed map with colorful metro lines and animated train movements. The application displays live metro positions on a sleek dark mode map.

![Amsterdam Metro Tracker Screenshot](https://app.devin.ai/attachments/079b0e04-93c8-4df4-a22f-8af3271e6fe5/localhost_5173_235638.png)

## Features

- **Dark Mode Map**: Sleek dark-themed Mapbox GL JS map with enhanced contrast and visibility
- **Live Metro Positions**: Real-time metro positions from OVAPI (Dutch public transport API)
- **Interactive Elements**:
  - Colorful metro lines (50-54) with route-specific styling
  - Enhanced station markers with hover effects and information popups
  - Animated train position markers with smooth transitions
  - Line visibility toggles for customized viewing
- **Responsive Design**: Adapts to different screen sizes and devices
- **Real-time Updates**: Positions refresh every 3 seconds

## Technology Stack

### Frontend
- React with TypeScript
- Vite for build tooling
- TailwindCSS for styling
- Mapbox GL JS for map visualization

### Backend
- FastAPI for API endpoints
- Redis for caching and token management
- OVAPI integration for real-time metro data

## Setup Instructions

### Prerequisites
- Node.js 16+
- Python 3.10+
- Redis (optional, falls back to in-memory cache)
- Mapbox account and access token

### Environment Variables

#### Frontend
Create a `.env` file in the frontend directory:
```
VITE_MAPBOX_TOKEN=your_mapbox_token_here
```

#### Backend
Create a `.env` file in the backend directory:
```
MAPBOX_ACCESS_TOKEN=your_mapbox_token_here
REDIS_PASSWORD=your_redis_password_here (optional)
```

### Installation

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

#### Backend
```bash
cd backend
poetry install
poetry run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Data Sources

The application uses the following data sources:

1. **OVAPI**: Primary source for real-time metro positions (https://v0.ovapi.nl)
2. **Mock Data**: Fallback when OVAPI is unavailable or for development purposes
3. **OpenStreetMap**: Geographical data for the map base layer

## Architecture

### Data Flow
1. Backend fetches real-time data from OVAPI
2. Data is processed and cached in Redis
3. Frontend requests data via API endpoints
4. Map renders metro lines, stations, and train positions
5. Positions update every 3 seconds with smooth animations

### Map Rendering
- Dark mode Mapbox GL JS implementation
- Custom styling for metro lines, stations, and trains
- Enhanced visual effects for better user experience
- Optimized for performance with large datasets

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Mapbox for their excellent mapping platform
- OVAPI for providing real-time public transport data
- OpenStreetMap contributors for the map data
