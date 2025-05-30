import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MetroLine, Station, TrainPosition } from '../types';
import { fetchMapboxToken } from '../services/api';

const DEFAULT_TOKEN = 'pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw';

interface MapProps {
  metroLines: MetroLine[];
  stations: Station[];
  trainPositions: TrainPosition[];
  visibleLines: string[];
  onStationClick: (station: Station) => void;
  onTrainHover: (train: TrainPosition | null) => void;
}

const Map = ({
  metroLines,
  stations,
  trainPositions,
  visibleLines,
  onStationClick,
  onTrainHover,
}: MapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const trainMarkers = useRef<{ [key: string]: mapboxgl.Marker }>({});
  const [prevPositions, setPrevPositions] = useState<{ [key: string]: [number, number] }>({});
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);
  const [isTokenLoaded, setIsTokenLoaded] = useState(false);
  
  useEffect(() => {
    const loadToken = async () => {
      try {
        const token = await fetchMapboxToken();
        const finalToken = token || DEFAULT_TOKEN;
        setMapboxToken(finalToken);
        mapboxgl.accessToken = finalToken;
        setIsTokenLoaded(true);
        console.log('Mapbox token loaded successfully');
      } catch (error) {
        console.error('Error loading Mapbox token:', error);
        mapboxgl.accessToken = DEFAULT_TOKEN;
        setIsTokenLoaded(true);
      }
    };
    loadToken();
  }, []);

  useEffect(() => {
    if (!mapContainer.current || !isTokenLoaded) return;

    console.log('Initializing map with token:', mapboxToken ? `${mapboxToken.substring(0, 4)}...${mapboxToken.substring(mapboxToken.length - 4)}` : 'default');
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11', // Use dark theme as specified
      center: [4.9041, 52.3676], // Amsterdam center
      zoom: 13,
    });
    
    map.current.on('error', (e) => {
      console.error('Mapbox error:', e.error);
    });

    map.current.on('load', () => {
      map.current?.addControl(new mapboxgl.NavigationControl(), 'top-right');
    });

    return () => {
      map.current?.remove();
    };
  }, []);

  useEffect(() => {
    if (!map.current || !map.current.loaded() || metroLines.length === 0) return;

    metroLines.forEach((line) => {
      const sourceId = `line-${line.id}`;
      const layerId = `line-layer-${line.id}`;

      if (!map.current?.getSource(sourceId)) {
        const geojson = {
          type: 'Feature',
          properties: {
            color: line.color,
            name: line.name,
          },
          geometry: {
            type: 'LineString',
            coordinates: line.shape,
          },
        };

        map.current?.addSource(sourceId, {
          type: 'geojson',
          data: geojson as any,
        });

        map.current?.addLayer({
          id: layerId,
          type: 'line',
          source: sourceId,
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
            visibility: visibleLines.includes(line.id) ? 'visible' : 'none',
          },
          paint: {
            'line-color': `#${line.color}`,
            'line-width': 6,
            'line-opacity': 0.9,
            'line-blur': 0.5,
          },
        });
      } else {
        map.current?.setLayoutProperty(
          layerId,
          'visibility',
          visibleLines.includes(line.id) ? 'visible' : 'none'
        );
      }
    });
  }, [metroLines, visibleLines]);

  useEffect(() => {
    if (!map.current || !map.current.loaded() || stations.length === 0) return;

    const stationElements = document.querySelectorAll('.station-marker');
    stationElements.forEach((el) => el.remove());

    stations.forEach((station) => {
      const el = document.createElement('div');
      el.className = 'station-marker';
      el.style.cssText = `
        width: 14px;
        height: 14px;
        background-color: #ffffff;
        border-radius: 50%;
        border: 3px solid #1f2937;
        cursor: pointer;
        z-index: 5;
        box-shadow: 0 0 8px 2px rgba(255,255,255,0.4);
        transition: transform 0.2s ease, box-shadow 0.2s ease;
      `;

      new mapboxgl.Marker(el)
        .setLngLat([station.longitude, station.latitude])
        .addTo(map.current!);

      el.addEventListener('click', () => {
        onStationClick(station);
      });

      el.addEventListener('mouseenter', () => {
        el.style.transform = 'scale(1.3)';
        el.style.boxShadow = '0 0 12px 4px rgba(255,255,255,0.6)';
      });

      el.addEventListener('mouseleave', () => {
        el.style.transform = 'scale(1)';
        el.style.boxShadow = '0 0 8px 2px rgba(255,255,255,0.4)';
      });
    });
  }, [stations, onStationClick]);

  useEffect(() => {
    if (!map.current || !map.current.loaded() || trainPositions.length === 0) return;

    const currentPositions: { [key: string]: [number, number] } = {};
    
    trainPositions.forEach((train) => {
      const currentPosition: [number, number] = [train.longitude, train.latitude];
      currentPositions[train.id] = currentPosition;
      
      const prevPosition = prevPositions[train.id] || currentPosition;
      
      if (!trainMarkers.current[train.id]) {
        const el = document.createElement('div');
        el.className = 'train-marker';
        
        const metroLine = metroLines.find(line => line.id === train.route_id);
        const color = metroLine ? `#${metroLine.color}` : '#FFFFFF';
        
        el.style.cssText = `
          background-color: ${color};
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
        
        const marker = new mapboxgl.Marker(el)
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
        
        trainMarkers.current[train.id] = marker;
      }
      
      if (prevPosition[0] !== currentPosition[0] || prevPosition[1] !== currentPosition[1]) {
        animateMarker(
          trainMarkers.current[train.id],
          prevPosition,
          currentPosition
        );
      }
    });
    
    Object.keys(trainMarkers.current).forEach((trainId) => {
      if (!trainPositions.some((train) => train.id === trainId)) {
        trainMarkers.current[trainId].remove();
        delete trainMarkers.current[trainId];
      }
    });
    
    setPrevPositions(currentPositions);
  }, [trainPositions, metroLines, onTrainHover]); // Removed prevPositions from dependencies

  const animateMarker = (
    marker: mapboxgl.Marker,
    prevPosition: [number, number],
    currentPosition: [number, number]
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
    <div ref={mapContainer} className="w-full h-full rounded-lg overflow-hidden" />
  );
};

export default Map;
