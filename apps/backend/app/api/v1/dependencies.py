"""
Dependency injection for API routes.
Includes authentication, authorization, and role-based access control.
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.core.security import verify_token
from app.models.user import User, Role
from app.crud.user import get_user_by_id

# HTTP Bearer token security scheme
security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """
    Get current authenticated user from JWT token.
    Raises 401 if token is invalid or user not found.
    """
    token = credentials.credentials
    payload = verify_token(token)
    
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Check token type
    if payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_id: int = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user = get_user_by_id(db, user_id=user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )
    
    return user


def require_role(allowed_roles: List[Role]):
    """
    Dependency factory for role-based access control.
    Returns a dependency that checks if user has one of the allowed roles.
    """
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required roles: {[r.value for r in allowed_roles]}"
            )
        return current_user
    
    return role_checker


def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False)),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """
    Get current authenticated user from JWT token (optional).
    Returns None if no token provided or token is invalid.
    Used for endpoints that work with or without authentication.
    """
    if credentials is None:
        return None
    
    try:
        token = credentials.credentials
        payload = verify_token(token)
        
        if payload is None:
            return None
        
        # Check token type
        if payload.get("type") != "access":
            return None
        
        user_id: int = payload.get("sub")
        if user_id is None:
            return None
        
        user = get_user_by_id(db, user_id=user_id)
        if user is None or not user.is_active:
            return None
        
        return user
    except Exception:
        # Return None on any error (invalid token, etc.)
        return None


# Pre-configured role dependencies
require_admin = require_role([Role.ADMIN, Role.SUPER_ADMIN])
require_super_admin = require_role([Role.SUPER_ADMIN])
# Allow all authenticated users to access both buyer and seller routes
# Users can switch between buying and selling without needing separate accounts
require_seller = require_role([Role.BUYER, Role.SELLER, Role.ADMIN, Role.SUPER_ADMIN])
require_buyer = require_role([Role.BUYER, Role.SELLER, Role.ADMIN, Role.SUPER_ADMIN])
