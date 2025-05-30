import { useEffect, useRef, useState } from 'react';
import { MetroLine, Station, TrainPosition } from '../types';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || '';
const DARK_STYLE = 'mapbox://styles/mapbox/dark-v11';

interface MapProps {
  metroLines: MetroLine[];
  stations: Station[];
  trainPositions: TrainPosition[];
  visibleLines: string[];
  onStationClick: (station: Station) => void;
  onTrainHover: (train: TrainPosition | null) => void;
}

declare global {
  interface Window {
    mapboxgl: any;
  }
}

const MapTiler = ({
  metroLines,
  stations,
  trainPositions,
  visibleLines,
  onStationClick,
  onTrainHover,
}: MapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const trainMarkers = useRef<{ [key: string]: any }>({});
  const [prevPositions, setPrevPositions] = useState<{ [key: string]: [number, number] }>({});
  const [mapInitialized, setMapInitialized] = useState(false);

  useEffect(() => {
    if (!mapContainer.current || mapInitialized) return;

    const initMap = () => {
      try {
        if (!window.mapboxgl) {
          console.error('Mapbox GL JS is not loaded from CDN');
          return;
        }

        window.mapboxgl.accessToken = MAPBOX_TOKEN;
        console.log('Initializing map with Mapbox dark style, token:', MAPBOX_TOKEN.substring(0, 8) + '...');
        
        map.current = new window.mapboxgl.Map({
          container: mapContainer.current,
          style: DARK_STYLE,
          center: [4.9041, 52.3676], // Amsterdam center
          zoom: 13,
          minZoom: 10,
          maxZoom: 17,
          attributionControl: true,
        });
        
        console.log('Map container dimensions:', {
          width: mapContainer.current?.clientWidth || 0,
          height: mapContainer.current?.clientHeight || 0
        });
        
        map.current.on('error', (e: any) => {
          console.error('Map error:', e.error);
        });

        map.current.on('load', () => {
          console.log('Map loaded successfully');
          map.current.addControl(new window.mapboxgl.NavigationControl(), 'top-right');
          setMapInitialized(true);
        });
      } catch (error) {
        console.error('Error initializing map:', error);
      }
    };

    initMap();

    return () => {
      map.current?.remove();
    };
  }, [mapInitialized]);

  useEffect(() => {
    if (!map.current || !mapInitialized || !map.current.loaded()) return;

    console.log('Adding metro lines to map');
    
    metroLines.forEach(line => {
      const layerId = `line-${line.id}`;
      if (map.current.getLayer(layerId)) {
        map.current.removeLayer(layerId);
      }
      if (map.current.getSource(layerId)) {
        map.current.removeSource(layerId);
      }
    });

    metroLines
      .filter(line => visibleLines.includes(line.id))
      .forEach(line => {
        const layerId = `line-${line.id}`;
        
        const geojson = {
          type: 'Feature',
          properties: {
            color: line.color,
            name: line.name,
          },
          geometry: {
            type: 'LineString',
            coordinates: line.shape || [],
          },
        };
        
        map.current.addSource(layerId, {
          type: 'geojson',
          data: geojson as any,
        });
        
        map.current.addLayer({
          id: layerId,
          type: 'line',
          source: layerId,
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
          },
          paint: {
            'line-color': `#${line.color}`,
            'line-width': 6,
            'line-opacity': 0.9,
            'line-blur': 0.5,
          },
        });
      });
  }, [metroLines, visibleLines, mapInitialized]);

  useEffect(() => {
    if (!map.current || !mapInitialized || !map.current.loaded() || stations.length === 0) return;

    console.log('Adding stations to map');
    
    const stationElements = document.querySelectorAll('.station-marker');
    stationElements.forEach((el) => el.remove());
    
    stations.forEach((station) => {
      const el = document.createElement('div');
      el.className = 'station-marker';
      el.style.cssText = `
        width: 16px;
        height: 16px;
        background-color: #ffffff;
        border-radius: 50%;
        border: 3px solid #1f2937;
        cursor: pointer;
        z-index: 5;
        box-shadow: 0 0 10px 3px rgba(255,255,255,0.5);
        transition: transform 0.2s ease, box-shadow 0.2s ease;
      `;

      new window.mapboxgl.Marker(el)
        .setLngLat([station.longitude, station.latitude])
        .addTo(map.current!);

      el.addEventListener('click', () => {
        onStationClick(station);
      });

      el.addEventListener('mouseenter', () => {
        el.style.transform = 'scale(1.3)';
        el.style.boxShadow = '0 0 15px 5px rgba(255,255,255,0.7)';
      });

      el.addEventListener('mouseleave', () => {
        el.style.transform = 'scale(1)';
        el.style.boxShadow = '0 0 10px 3px rgba(255,255,255,0.5)';
      });
    });
  }, [stations, onStationClick, mapInitialized]);

  useEffect(() => {
    if (!map.current || !mapInitialized || !map.current.loaded() || trainPositions.length === 0) return;
    
    console.log('Updating train positions:', trainPositions.length);
    
    const currentPositions: { [key: string]: [number, number] } = {};
    
    trainPositions.forEach(train => {
      const trainId = train.id;
      const position: [number, number] = [train.longitude, train.latitude];
      currentPositions[trainId] = position;
      
      const line = metroLines.find(l => l.id === train.route_id);
      const color = line ? line.color : 'FFFFFF';
      
      const prevPosition = prevPositions[trainId] || position;
      
      if (trainMarkers.current[trainId]) {
        const marker = trainMarkers.current[trainId];
        animateMarker(marker, prevPosition, position, 2000);
      } else {
        const el = document.createElement('div');
        el.className = 'train-marker';
        
        el.style.cssText = `
          background-color: #${color};
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: 4px solid #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 0 15px 3px rgba(255,255,255,0.5);
          z-index: 10;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        `;
        
        const textSpan = document.createElement('span');
        textSpan.textContent = train.route_id;
        textSpan.style.cssText = `
          color: white;
          font-weight: bold;
          font-size: 16px;
          text-shadow: 0 0 4px rgba(0, 0, 0, 0.8);
          letter-spacing: 0.5px;
        `;
        el.appendChild(textSpan);
        
        const marker = new window.mapboxgl.Marker(el)
          .setLngLat(prevPosition)
          .addTo(map.current!);
        
        el.addEventListener('mouseenter', () => {
          el.style.transform = 'scale(1.2)';
          el.style.boxShadow = '0 0 20px 5px rgba(255,255,255,0.7)';
          onTrainHover(train);
        });
        
        el.addEventListener('mouseleave', () => {
          el.style.transform = 'scale(1)';
          el.style.boxShadow = '0 0 15px 3px rgba(255,255,255,0.5)';
          onTrainHover(null);
        });
        
        trainMarkers.current[trainId] = marker;
      }
    });
    
    Object.keys(trainMarkers.current).forEach(id => {
      if (!currentPositions[id]) {
        trainMarkers.current[id].remove();
        delete trainMarkers.current[id];
      }
    });
    
    setPrevPositions(currentPositions);
  }, [trainPositions, metroLines, prevPositions, onTrainHover, mapInitialized]);

  const animateMarker = (
    marker: any,
    prevPosition: [number, number],
    currentPosition: [number, number],
    _duration: number = 2000  // Prefix with underscore to indicate unused parameter
  ) => {
    const steps = 60; // 60 frames for smooth animation
    let step = 0;
    
    const lngDiff = (currentPosition[0] - prevPosition[0]) / steps;
    const latDiff = (currentPosition[1] - prevPosition[1]) / steps;
    
    const easeInOutQuad = (t: number): number => {
      return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    };
    
    const animate = () => {
      if (step < steps) {
        const easeStep = easeInOutQuad(step / steps) * steps;
        const newLng = prevPosition[0] + lngDiff * easeStep;
        const newLat = prevPosition[1] + latDiff * easeStep;
        marker.setLngLat([newLng, newLat]);
        step++;
        requestAnimationFrame(animate);
      } else {
        marker.setLngLat(currentPosition);
      }
    };
    
    requestAnimationFrame(animate);
  };

  return (
    <div 
      ref={mapContainer} 
      className="w-full h-full rounded-lg overflow-hidden" 
      style={{
        position: 'relative',
        minHeight: '500px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
      }} 
    />
  );
};

export default MapTiler;
