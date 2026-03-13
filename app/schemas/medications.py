from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class MedicationBase(BaseModel):
    name: str
    dosage: str
    frequency: str
    times: str
    start_date: datetime
    end_date: Optional[datetime] = None

class MedicationCreate(MedicationBase):
    user_id: int

class MedicationResponse(MedicationBase):
    id: int
    user_id: int
    
    class Config:
        from_attributes = True

class ReminderBase(BaseModel):
    medication_id: int
    scheduled_time: datetime

class ReminderCreate(ReminderBase):
    pass

class ReminderResponse(ReminderBase):
    id: int
    status: str
    
    class Config:
        from_attributes = True