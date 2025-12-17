"""
User profile API endpoints.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.v1.dependencies import get_current_user, require_admin
from app.models.user import User
from app.schemas.user import UserInDB

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me", response_model=UserInDB)
async def get_me(current_user: User = Depends(get_current_user)):
    """Get current user profile (alias for /auth/me)"""
    return current_user

