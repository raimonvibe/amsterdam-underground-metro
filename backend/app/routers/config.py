from fastapi import APIRouter, Depends, HTTPException
from typing import Dict
import re
import os

from ..services.redis_service import RedisService
from ..models.config import TokenRequest

router = APIRouter(prefix="/api/config", tags=["config"])

def get_redis_service():
    return RedisService()

@router.post("/mapbox-token")
async def set_mapbox_token(
    token_request: TokenRequest,
    redis: RedisService = Depends(get_redis_service)
):
    """Securely store Mapbox access token."""
    token = token_request.token.strip()
    
    if not token.startswith('pk.'):
        raise HTTPException(status_code=400, detail="Invalid Mapbox token format")
    
    success = redis.set_mapbox_token(token)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to store token")
    
    return {"message": "Token stored successfully"}

@router.get("/mapbox-token")
async def get_mapbox_token(redis: RedisService = Depends(get_redis_service)):
    """Retrieve Mapbox access token."""
    token = redis.get_mapbox_token()
    if not token:
        raise HTTPException(status_code=404, detail="No token configured")
    
    masked_token = f"{token[:4]}...{token[-4:]}" if len(token) > 8 else "***"
    return {"token": token, "masked": masked_token}
