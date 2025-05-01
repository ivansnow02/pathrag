from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class ChatBase(BaseModel):
    message: str

class ChatCreate(ChatBase):
    pass

class ChatResponse(ChatBase):
    id: int
    user_id: int
    response: str
    created_at: datetime
    
    class Config:
        orm_mode = True

class ChatList(BaseModel):
    chats: List[ChatResponse]
    
    class Config:
        orm_mode = True
