from typing import List, Optional
from pydantic import BaseModel


class Station(BaseModel):
    """Model for a metro station."""
    id: str
    name: str
    latitude: float
    longitude: float
    routes: List[str]


class MetroLine(BaseModel):
    """Model for a metro line."""
    id: str
    name: str
    color: str
    route_id: str
    shape: List[List[float]]  # List of [longitude, latitude] coordinates
    stations: List[Station]


class TrainPosition(BaseModel):
    """Model for a train position."""
    id: str
    route_id: str
    latitude: float
    longitude: float
    bearing: Optional[float] = None
    speed: Optional[float] = None
    status: Optional[str] = None
    timestamp: int
    vehicle_id: str
    trip_id: Optional[str] = None
