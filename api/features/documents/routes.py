from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import List
import os
import shutil
import asyncio
from datetime import datetime

from models.database import get_db, Document, User
from api.auth.jwt_handler import get_current_active_user
from .schemas import DocumentCreate, DocumentResponse, DocumentList, UploadStatus
from PathRAG import PathRAG

# Initialize PathRAG
rag = PathRAG(working_dir="./data")

# Create uploads directory if it doesn't exist
UPLOAD_DIR = "./uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

router = APIRouter(
    prefix="/documents",
    tags=["Documents"],
    dependencies=[Depends(get_current_active_user)]
)

# In-memory storage for upload progress
upload_status = {}

async def process_document(file_path: str, document_id: int, db: Session):
    try:
        # Update status to processing
        upload_status[document_id]["status"] = "processing"
        upload_status[document_id]["progress"] = 50
        
        # Extract text from file
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            content = f.read()
        
        # Insert into PathRAG
        await rag.ainsert(content)
        
        # Update status to completed
        upload_status[document_id]["status"] = "completed"
        upload_status[document_id]["progress"] = 100
        
    except Exception as e:
        # Update status to failed
        upload_status[document_id]["status"] = "failed"
        upload_status[document_id]["message"] = str(e)
        
        # Update document in database
        document = db.query(Document).filter(Document.id == document_id).first()
        if document:
            document.status = "failed"
            db.commit()

@router.get("/", response_model=DocumentList)
async def get_documents(db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    documents = db.query(Document).filter(Document.user_id == current_user.id).all()
    return {"documents": documents}

@router.post("/", response_model=DocumentResponse)
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Validate file type
    content_type = file.content_type
    allowed_types = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/markdown"]
    
    if content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="File type not supported. Only PDF, DOCX, and MD files are allowed.")
    
    # Create file path
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    file_path = os.path.join(UPLOAD_DIR, f"{current_user.id}_{timestamp}_{file.filename}")
    
    # Save file
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Get file size
    file_size = os.path.getsize(file_path)
    
    # Create document record
    db_document = Document(
        user_id=current_user.id,
        filename=file.filename,
        content_type=content_type,
        file_path=file_path,
        file_size=file_size
    )
    db.add(db_document)
    db.commit()
    db.refresh(db_document)
    
    # Initialize upload status
    upload_status[db_document.id] = {
        "filename": file.filename,
        "content_type": content_type,
        "progress": 25,
        "status": "uploading"
    }
    
    # Process document in background
    background_tasks.add_task(process_document, file_path, db_document.id, db)
    
    return db_document

@router.get("/{document_id}", response_model=DocumentResponse)
async def get_document(document_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    document = db.query(Document).filter(Document.id == document_id, Document.user_id == current_user.id).first()
    if document is None:
        raise HTTPException(status_code=404, detail="Document not found")
    return document

@router.get("/{document_id}/status", response_model=UploadStatus)
async def get_document_status(document_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    # Check if document exists and belongs to user
    document = db.query(Document).filter(Document.id == document_id, Document.user_id == current_user.id).first()
    if document is None:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Get upload status
    status = upload_status.get(document_id, {
        "filename": document.filename,
        "content_type": document.content_type,
        "progress": 100,
        "status": "completed"
    })
    
    return UploadStatus(**status)
