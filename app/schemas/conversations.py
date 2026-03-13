from pydantic import BaseModel
from datetime import datetime

class ConversationBase(BaseModel):
    message: str

class ConversationCreate(ConversationBase):
    pass

class ConversationResponse(ConversationBase):
    id: int
    user_id: int
    response: str
    timestamp: datetime
    
    class Config:
        from_attributes = True