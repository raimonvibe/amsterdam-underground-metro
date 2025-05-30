from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, List

from ..services.gtfs_service import GTFSService
from ..services.redis_service import RedisService
from ..models.metro import MetroLine, Station, TrainPosition

router = APIRouter(prefix="/api", tags=["metro"])

def get_services():
    redis_service = RedisService()
    gtfs_service = GTFSService(redis_service=redis_service)
    return {"redis": redis_service, "gtfs": gtfs_service}

@router.get("/metro-lines", response_model=List[MetroLine])
async def get_metro_lines(
    services: Dict = Depends(get_services),
    force_refresh: bool = False
):
    """Get all Amsterdam metro lines."""
    try:
        metro_lines = services["gtfs"].get_metro_lines(force_refresh=force_refresh)
        return list(metro_lines.values())
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching metro lines: {str(e)}")

@router.get("/stations", response_model=List[Station])
async def get_stations(
    services: Dict = Depends(get_services),
    force_refresh: bool = False
):
    """Get all stations for Amsterdam metro lines."""
    try:
        stations = services["gtfs"].get_stations(force_refresh=force_refresh)
        return list(stations.values())
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching stations: {str(e)}")

@router.get("/train-positions", response_model=List[TrainPosition])
async def get_train_positions(services: Dict = Depends(get_services)):
    """Get current train positions for Amsterdam metro."""
    try:
        redis = services["redis"]
        cached_positions = redis.get_data("train_positions")
        
        if cached_positions:
            return [TrainPosition.model_validate(pos) for pos in cached_positions]
        
        positions = services["gtfs"].get_train_positions()
        return positions
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching train positions: {str(e)}")
