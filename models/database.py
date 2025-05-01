from sqlalchemy import create_engine, Column, Integer, String, Text, ForeignKey, DateTime, Float
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
import datetime
import os

# Create SQLite database engine
DATABASE_URL = "sqlite:///./pathrag.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

# Create session
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create base class for models
Base = declarative_base()

# Define User model
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    theme = Column(String, nullable=True, default="blue")

    # Relationships
    chats = relationship("Chat", back_populates="user")
    documents = relationship("Document", back_populates="user")

# Define Chat model
class Chat(Base):
    __tablename__ = "chats"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    message = Column(Text)
    response = Column(Text)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="chats")

# Define Document model
class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    filename = Column(String)
    content_type = Column(String)
    file_path = Column(String)
    file_size = Column(Integer)
    uploaded_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="documents")

# Create tables
def create_tables():
    Base.metadata.create_all(bind=engine)

# Get database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
