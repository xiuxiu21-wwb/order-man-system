from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class BindingBase(BaseModel):
    elder_id: int
    family_id: int
    relation: str

class BindingCreate(BindingBase):
    pass

class BindingUpdate(BaseModel):
    status: Optional[str] = None

class BindingResponse(BindingBase):
    id: int
    status: str
    request_time: datetime
    confirm_time: Optional[datetime] = None
    cancel_time: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class BindingListResponse(BaseModel):
    id: int
    elder_id: int
    elder_name: str
    family_id: int
    family_name: str
    relation: str
    status: str
    request_time: datetime
    confirm_time: Optional[datetime] = None
    
    class Config:
        from_attributes = True
