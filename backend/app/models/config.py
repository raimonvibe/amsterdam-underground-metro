from pydantic import BaseModel, Field
from typing import Optional
import os

class MapboxConfig(BaseModel):
    """Configuration for Mapbox API."""
    access_token: str = Field(..., description="Mapbox access token")
    
class TokenRequest(BaseModel):
    """Request model for setting Mapbox token."""
    token: str = Field(..., min_length=1, description="Mapbox access token")
