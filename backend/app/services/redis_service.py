import json
import os
import logging
from typing import Any, Dict, List, Optional, TypeVar, Type, Union
from redis import Redis
from pydantic import BaseModel

T = TypeVar('T', bound=BaseModel)
logger = logging.getLogger(__name__)

class RedisService:
    """Service for interacting with Redis cache."""
    
    def __init__(self, host: str = "localhost", port: int = 6379, password: Optional[str] = None):
        """Initialize Redis connection."""
        try:
            self.redis = Redis(host=host, port=port, decode_responses=True)
            self.redis.ping()
            logger.info("Successfully connected to Redis")
        except Exception as e:
            logger.warning(f"Failed to connect to Redis: {str(e)}. Using in-memory fallback.")
            self.redis = None
    
    def set_data(self, key: str, data: Union[Dict, List, BaseModel], expiry: Optional[int] = None) -> bool:
        """Set data in Redis with optional expiry in seconds."""
        if self.redis is None:
            return False
            
        try:
            if isinstance(data, BaseModel):
                data = data.model_dump()
            
            serialized = json.dumps(data)
            result = self.redis.set(key, serialized)
            
            if expiry:
                self.redis.expire(key, expiry)
                
            return result
        except Exception as e:
            logger.error(f"Error setting data in Redis: {str(e)}")
            return False
    
    def get_data(self, key: str, model_class: Optional[Type[T]] = None) -> Optional[Union[Dict, List, T]]:
        """Get data from Redis and optionally convert to model instance."""
        if self.redis is None:
            return None
            
        try:
            data = self.redis.get(key)
            
            if not data:
                return None
                
            deserialized = json.loads(data)
            
            if model_class:
                return model_class.model_validate(deserialized)
                
            return deserialized
        except Exception as e:
            logger.error(f"Error getting data from Redis: {str(e)}")
            return None
    
    def delete_data(self, key: str) -> bool:
        """Delete data from Redis."""
        if self.redis is None:
            return False
            
        try:
            return bool(self.redis.delete(key))
        except Exception as e:
            logger.error(f"Error deleting data from Redis: {str(e)}")
            return False
            
    def set_mapbox_token(self, token: str) -> bool:
        """Securely store Mapbox token."""
        return self.set_data("mapbox_token", {"token": token}, expiry=86400)  # 24 hours
    
    def get_mapbox_token(self) -> Optional[str]:
        """Retrieve stored Mapbox token or fallback to environment variable."""
        cached_data = self.get_data("mapbox_token")
        if cached_data and isinstance(cached_data, dict):
            return cached_data.get("token")
        
        return os.getenv("MAPBOX_ACCESS_TOKEN")
    
    def delete_mapbox_token(self) -> bool:
        """Delete stored Mapbox token."""
        return self.delete_data("mapbox_token")
