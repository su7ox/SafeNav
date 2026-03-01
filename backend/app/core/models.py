from sqlalchemy import Column, Integer, String, DateTime, JSON, ForeignKey, Float, Boolean
from datetime import datetime
from app.core.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)

class ScanHistory(Base):
    __tablename__ = "scan_history"

    id = Column(Integer, primary key=True, index=True)
    url = Column(String, index=True, nullable=False)
    risk_score = Column(Float, nullable=False)
    verdict = Column(String, nullable=False)
    
    # JSON column for deeply nested dictionaries
    details = Column(JSON, nullable=False) 
    reasoning = Column(JSON, nullable=False)
    
    scan_time = Column(DateTime, default=datetime.utcnow)
    
    # Added the ForeignKey here to link directly to the users table
    user_email = Column(String, ForeignKey("users.email"), index=True, nullable=False)
    
    # Changed to a proper Boolean column
    is_guest = Column(Boolean, default=False)