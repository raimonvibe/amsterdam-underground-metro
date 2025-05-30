# Amsterdam Underground Metro Tracker

A real-time visualization application for Amsterdam's metro system featuring a dark-themed map with colorful metro lines and animated train movements.

## Current Status

**Note: This application currently uses mockup data for metro lines, stations, and train positions.**

The application generates simulated circular routes for metro lines 50-54, with mock stations and train positions placed around Amsterdam's center coordinates. The backend attempts to fetch real GTFS data but falls back to these mockups when external data is unavailable.

### Current Issues

1. **Data Source Integration**: We're working on integrating with the OVAPI (Dutch public transport API) to replace mockup data with real-time information.
2. **Mapbox Token Security**: Implementing secure token management to avoid exposing Mapbox tokens in client-side code.
3. **Performance Optimization**: Optimizing animation performance for smoother train movements.

## Technology Stack

### Frontend
- React with TypeScript
- Vite for build tooling
- TailwindCSS for styling
- Mapbox GL JS for map visualization

### Backend
- FastAPI for API endpoints
- Redis for caching
- GTFS data integration (in progress)

## Setup Instructions

### Prerequisites
- Node.js 16+
- Python 3.10+
- Redis (optional, falls back to in-memory cache)

### Environment Variables

#### Frontend
Create a `.env` file in the frontend directory:
```
VITE_BACKEND_API_URL=http://localhost:8000
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
poetry run fastapi dev app/main.py
```

## Features

- Dark-themed map visualization
- Colorful metro lines (50-54)
- Interactive station markers
- Animated train positions
- Line visibility toggles
