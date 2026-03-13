from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class AdminBase(BaseModel):
    username: str
    name: str
    role: str = "admin"

class AdminCreate(AdminBase):
    password: str

class AdminLoginRequest(BaseModel):
    username: str
    password: str

class AdminResponse(AdminBase):
    id: int
    is_active: bool
    last_login: Optional[datetime] = None
    created_at: datetime
    
    class Config:
        from_attributes = True
