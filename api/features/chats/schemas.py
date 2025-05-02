from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

# Thread schemas
class ThreadBase(BaseModel):
    title: Optional[str] = None

class ThreadCreate(ThreadBase):
    pass

class ThreadResponse(ThreadBase):
    id: int
    uuid: str
    user_id: int
    title: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

class ThreadList(BaseModel):
    threads: List[ThreadResponse]

    class Config:
        orm_mode = True

# Chat schemas
class ChatBase(BaseModel):
    message: str
    role: str = "user"

class ChatCreate(ChatBase):
    thread_id: Optional[int] = None
    thread_uuid: Optional[str] = None

class ChatResponse(ChatBase):
    id: int
    user_id: int
    thread_id: int
    created_at: datetime

    class Config:
        orm_mode = True

class ChatList(BaseModel):
    chats: List[ChatResponse]

    class Config:
        orm_mode = True

class ThreadWithChats(ThreadResponse):
    chats: List[ChatResponse] = []

    class Config:
        orm_mode = True
