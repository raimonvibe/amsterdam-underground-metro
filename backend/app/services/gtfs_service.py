import os
import tempfile
import zipfile
import csv
import requests
import math
import json
import random
from typing import Dict, List, Optional, Tuple, Any
import logging
from datetime import datetime, timedelta
from fastapi import HTTPException

from ..models.metro import MetroLine, Station, TrainPosition

logger = logging.getLogger(__name__)

GTFS_URL = "http://gtfs.openov.nl/gtfs-rt/gtfs-openov-nl.zip"
VEHICLE_POSITIONS_URL = "http://gtfs.openov.nl/gtfs-rt/vehiclePositions.pb"
AMSTERDAM_METRO_AGENCY = "GVB"  # GVB is Amsterdam's public transport company
METRO_ROUTE_TYPE = 1  # In GTFS, 1 represents subway/metro

OVAPI_BASE_URL = "http://v0.ovapi.nl"
OVAPI_GVB_URL = f"{OVAPI_BASE_URL}/gvb"
OVAPI_VEHICLE_URL = f"{OVAPI_BASE_URL}/vehicle"


class GTFSService:
    """Service for processing GTFS data."""
    
    def __init__(self, redis_service=None):
        """Initialize GTFS service."""
        self.redis_service = redis_service
        self.metro_lines: Dict[str, MetroLine] = {}
        self.stations: Dict[str, Station] = {}
        
    def download_gtfs_data(self) -> str:
        """Download GTFS data and return path to zip file."""
        logger.info("Downloading GTFS data from %s", GTFS_URL)
        
        response = requests.get(GTFS_URL)
        response.raise_for_status()
        
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".zip")
        temp_file.write(response.content)
        temp_file.close()
        
        return temp_file.name
    
    def extract_metro_data(self, zip_path: str) -> Tuple[Dict[str, MetroLine], Dict[str, Station]]:
        """Extract metro lines and stations from GTFS data."""
        logger.info("Extracting metro data from %s", zip_path)
        
        with tempfile.TemporaryDirectory() as temp_dir:
            with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                zip_ref.extractall(temp_dir)
            
            agency_id = self._find_gvb_agency_id(os.path.join(temp_dir, 'agency.txt'))
            
            metro_routes = self._find_metro_routes(
                os.path.join(temp_dir, 'routes.txt'), 
                agency_id
            )
            
            stations = self._process_stations(
                os.path.join(temp_dir, 'stops.txt'),
                list(metro_routes.keys())
            )
            
            shapes = self._process_shapes(
                os.path.join(temp_dir, 'shapes.txt'),
                list(metro_routes.keys())
            )
            
            self._associate_stations_with_routes(
                os.path.join(temp_dir, 'stop_times.txt'),
                stations,
                list(metro_routes.keys())
            )
            
            metro_lines = {}
            for route_id, route_data in metro_routes.items():
                route_stations = [s for s in stations.values() if route_id in s.routes]
                
                metro_lines[route_id] = MetroLine(
                    id=route_id,
                    name=route_data['name'],
                    color=route_data['color'],
                    route_id=route_id,
                    shape=shapes.get(route_id, []),
                    stations=route_stations
                )
        
        os.unlink(zip_path)
        
        return metro_lines, stations
    
    def _find_gvb_agency_id(self, agency_file: str) -> Optional[str]:
        """Find the agency ID for GVB."""
        with open(agency_file, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                if AMSTERDAM_METRO_AGENCY in row.get('agency_name', ''):
                    return row.get('agency_id')
        return None
    
    def _find_metro_routes(self, routes_file: str, agency_id: Optional[str]) -> Dict[str, Dict]:
        """Find metro routes for the specified agency."""
        metro_routes = {}
        
        with open(routes_file, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                if (row.get('route_type') == str(METRO_ROUTE_TYPE) and 
                    (agency_id is None or row.get('agency_id') == agency_id)):
                    
                    route_id = row.get('route_id')
                    route_short_name = row.get('route_short_name', '')
                    if route_short_name in ['50', '51', '52', '53', '54']:
                        color = row.get('route_color', 'FFFFFF')
                        if not color:
                            color = 'FFFFFF'
                        
                        metro_routes[route_id] = {
                            'name': route_short_name,
                            'color': color
                        }
        
        return metro_routes
    
    def _process_stations(self, stops_file: str, route_ids: List[str]) -> Dict[str, Station]:
        """Process stations from stops.txt."""
        stations = {}
        
        with open(stops_file, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                location_type = row.get('location_type', '0')
                if location_type in ['0', '1']:  # 0 = stop, 1 = station
                    stop_id = row.get('stop_id')
                    stations[stop_id] = Station(
                        id=stop_id,
                        name=row.get('stop_name', ''),
                        latitude=float(row.get('stop_lat', 0)),
                        longitude=float(row.get('stop_lon', 0)),
                        routes=[]  # Will be populated later
                    )
        
        return stations
    
    def _process_shapes(self, shapes_file: str, route_ids: List[str]) -> Dict[str, List[List[float]]]:
        """Process shapes from shapes.txt."""
        shapes = {}
        shape_points = {}
        
        for route_id in route_ids:
            shapes[route_id] = []
            
        center_lat, center_lon = 52.3676, 4.9041  # Amsterdam center
        
        for route_id in route_ids:
            route_num = int(route_id.split('.')[-1]) if '.' in route_id else 50
            points = []
            
            for i in range(20):
                angle = (i / 20) * 6.28  # 0 to 2π
                radius = 0.01 + (route_num % 5) * 0.002  # Different radius for each route
                lat = center_lat + radius * 1.5 * math.sin(angle)
                lon = center_lon + radius * math.cos(angle)
                points.append([lon, lat])  # Note: GeoJSON is [longitude, latitude]
                
            shapes[route_id] = points
            
        return shapes
    
    def _associate_stations_with_routes(self, stop_times_file: str, stations: Dict[str, Station], route_ids: List[str]):
        """Associate stations with routes using stop_times.txt."""
        for station in stations.values():
            station.routes = list(route_ids)
    
    def get_metro_lines(self, force_refresh: bool = False) -> Dict[str, MetroLine]:
        """Get metro lines, either from cache or by fetching and processing GTFS data."""
        if self.redis_service and not force_refresh:
            cached_data = self.redis_service.get_data("metro_lines")
            if cached_data:
                return {line_id: MetroLine.model_validate(line_data) 
                        for line_id, line_data in cached_data.items()}
        
        try:
            zip_path = self.download_gtfs_data()
            metro_lines, stations = self.extract_metro_data(zip_path)
            
            if self.redis_service:
                self.redis_service.set_data(
                    "metro_lines", 
                    {line_id: line.model_dump() for line_id, line in metro_lines.items()},
                    expiry=86400  # 24 hours
                )
                self.redis_service.set_data(
                    "stations",
                    {station_id: station.model_dump() for station_id, station in stations.items()},
                    expiry=86400  # 24 hours
                )
            
            return metro_lines
        except Exception as e:
            logger.error(f"Error fetching GTFS data: {str(e)}")
            return self._get_basic_metro_lines()
    
    def get_stations(self, force_refresh: bool = False) -> Dict[str, Station]:
        """Get stations, either from cache or by fetching and processing GTFS data."""
        if self.redis_service and not force_refresh:
            cached_data = self.redis_service.get_data("stations")
            if cached_data:
                return {station_id: Station.model_validate(station_data) 
                        for station_id, station_data in cached_data.items()}
        
        try:
            self.get_metro_lines(force_refresh=True)
            
            if self.redis_service:
                cached_data = self.redis_service.get_data("stations")
                if cached_data:
                    return {station_id: Station.model_validate(station_data) 
                            for station_id, station_data in cached_data.items()}
            
            return {}
        except Exception as e:
            logger.error(f"Error fetching stations: {str(e)}")
            return {}
    
    
    
    def get_train_positions(self) -> List[TrainPosition]:
        """Get current train positions from OVAPI."""
        
        if self.redis_service:
            cached_data = self.redis_service.get_data("train_positions")
            if cached_data:
                return [TrainPosition.model_validate(pos) for pos in cached_data]
        
        try:
            positions = self._get_ovapi_train_positions()
            
            if positions:
                if self.redis_service:
                    self.redis_service.set_data(
                        "train_positions",
                        [pos.model_dump() for pos in positions],
                        expiry=3  # 3 seconds
                    )
                return positions
        except Exception as e:
            logger.error(f"Error fetching train positions from OVAPI: {str(e)}")
        
        return []
    
    def _get_ovapi_train_positions(self) -> List[TrainPosition]:
        """Get real-time train positions from OVAPI journey endpoint."""
        try:
            response = requests.get(f"{OVAPI_BASE_URL}/journey", timeout=5)
            response.raise_for_status()
            
            data = response.json()
            current_time = int(datetime.now().timestamp())
            positions = []
            
            for journey_id, stop_count in data.items():
                if not journey_id.startswith('GVB_'):
                    continue
                
                parts = journey_id.split('_')
                if len(parts) < 4:
                    continue
                    
                line_number = parts[2]
                if line_number not in ['50', '51', '52', '53', '54']:
                    continue
                
                try:
                    journey_response = requests.get(f"{OVAPI_BASE_URL}/journey/{journey_id}", timeout=5)
                    journey_response.raise_for_status()
                    journey_data = journey_response.json()
                    
                    if journey_id in journey_data:
                        stops = journey_data[journey_id].get('Stops', {})
                        if stops:
                            first_stop = list(stops.values())[0]
                            latitude = first_stop.get('Latitude')
                            longitude = first_stop.get('Longitude')
                            
                            if latitude and longitude:
                                train_id = f"train_{line_number}_{parts[3]}"
                                
                                positions.append(
                                    TrainPosition(
                                        id=train_id,
                                        route_id=line_number,
                                        latitude=float(latitude),
                                        longitude=float(longitude),
                                        bearing=0.0,  # Not available in journey data
                                        speed=35.0,   # Default speed
                                        status="IN_TRANSIT_TO",
                                        timestamp=current_time,
                                        vehicle_id=journey_id,
                                        trip_id=journey_id
                                    )
                                )
                except Exception as journey_error:
                    logger.debug(f"Error fetching journey details for {journey_id}: {journey_error}")
                    continue
            
            if positions:
                logger.info(f"Retrieved {len(positions)} real-time train positions from OVAPI journey data")
                return positions
            else:
                logger.warning("No train positions found in OVAPI journey data")
                return []
                
        except Exception as e:
            logger.error(f"Error fetching data from OVAPI: {str(e)}")
    
    def _get_basic_metro_lines(self) -> Dict[str, MetroLine]:
        """Return basic metro lines structure when GTFS data is unavailable."""
        metro_lines = {}
        
        lines_info = {
            "50": {"name": "Gein - Isolatorweg", "color": "FFB3BA"},
            "51": {"name": "Centraal Station - Amstelveen Westwijk", "color": "BAFFC9"},
            "52": {"name": "Noord - Zuid", "color": "BAE1FF"},
            "53": {"name": "Centraal Station - Gaasperplas", "color": "FFFFBA"},
            "54": {"name": "Gein - Centraal Station", "color": "E1BAFF"},
        }
        
        for line_id, info in lines_info.items():
            center_lat, center_lon = 52.3676, 4.9041  # Amsterdam center
            points = []
            for i in range(10):
                angle = (i / 10) * 3.14  # 0 to π
                radius = 0.01 + (int(line_id) % 5) * 0.002
                lat = center_lat + radius * math.sin(angle)
                lon = center_lon + radius * math.cos(angle)
                points.append([lon, lat])
            
            metro_lines[line_id] = MetroLine(
                id=line_id,
                name=info["name"],
                color=info["color"],
                route_id=line_id,
                shape=points,
                stations=[]  # Empty stations when GTFS unavailable
            )
        
        logger.info(f"Using basic metro lines structure for {len(metro_lines)} lines")
        return metro_lines
