from pydantic import BaseModel
from datetime import datetime

class LocationBase(BaseModel):
    latitude: float
    longitude: float
    accuracy: float
    address: str

class LocationCreate(LocationBase):
    pass

class LocationResponse(LocationBase):
    id: int
    user_id: int
    timestamp: datetime
    
    class Config:
        from_attributes = True

class LocationHistory(LocationBase):
    id: int
    timestamp: datetime
    
    class Config:
        from_attributes = True