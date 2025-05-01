from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class DocumentBase(BaseModel):
    filename: str
    content_type: str

class DocumentCreate(DocumentBase):
    file_size: int
    file_path: str

class DocumentResponse(DocumentBase):
    id: int
    user_id: int
    file_size: int
    uploaded_at: datetime
    
    class Config:
        orm_mode = True

class DocumentList(BaseModel):
    documents: List[DocumentResponse]
    
    class Config:
        orm_mode = True

class UploadStatus(BaseModel):
    filename: str
    content_type: str
    progress: float  # 0-100 percentage
    status: str  # "processing", "completed", "failed"
    message: Optional[str] = None
