from fastapi import Depends
from sqlalchemy.orm import Session
from app.core.database import get_db

# Common dependencies
def get_database() -> Session:
    """Get database session"""
    return Depends(get_db)

