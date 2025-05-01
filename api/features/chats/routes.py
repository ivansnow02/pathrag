from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from models.database import get_db, Chat, User
from api.auth.jwt_handler import get_current_active_user
from .schemas import ChatCreate, ChatResponse, ChatList
from PathRAG import PathRAG, QueryParam

# Initialize PathRAG
rag = PathRAG(working_dir="./data")

router = APIRouter(
    prefix="/chats",
    tags=["Chats"],
    dependencies=[Depends(get_current_active_user)]
)

@router.get("/", response_model=ChatList)
async def get_chats(db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    chats = db.query(Chat).filter(Chat.user_id == current_user.id).all()
    return {"chats": chats}

@router.post("/", response_model=ChatResponse)
async def create_chat(chat: ChatCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    # Query PathRAG
    response = await rag.aquery(chat.message, param=QueryParam(mode="hybrid"))
    
    # Create chat record
    db_chat = Chat(
        user_id=current_user.id,
        message=chat.message,
        response=response
    )
    db.add(db_chat)
    db.commit()
    db.refresh(db_chat)
    return db_chat

@router.get("/{chat_id}", response_model=ChatResponse)
async def get_chat(chat_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    chat = db.query(Chat).filter(Chat.id == chat_id, Chat.user_id == current_user.id).first()
    if chat is None:
        raise HTTPException(status_code=404, detail="Chat not found")
    return chat
