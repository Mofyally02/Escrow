"""
Authentication API endpoints.
Handles registration, login, token refresh, and logout.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional
from app.core.database import get_db
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    get_refresh_token_expiry,
    get_token_expiry
)
from app.core.events import AuditLogger
from app.models.audit_log import AuditAction
from app.core.config import settings
from app.models.user import User
from app.models.refresh_token import RefreshToken
from app.utils.observability import logger
from app.schemas.auth import (
    RegisterRequest,
    LoginRequest,
    TokenResponse,
    RefreshTokenRequest,
    UserResponse,
    UpdateProfileRequest,
    MessageResponse
)
from app.crud.user import (
    get_user_by_email,
    get_user_by_phone,
    get_user_by_email_or_phone,
    create_user,
    update_user,
    increment_failed_login_attempts,
    reset_failed_login_attempts,
    lock_user_account,
    verify_email,
    verify_phone
)
from app.api.v1.dependencies import get_current_user
from slowapi import Limiter
from slowapi.util import get_remote_address
from app.core.config import settings
from app.schemas.user import UserCreate

router = APIRouter(tags=["Authentication"])

# Rate limiter - will be initialized in main.py and accessed via request.app.state.limiter
# For now, create a local instance for decorators
limiter = Limiter(key_func=get_remote_address)


def get_client_ip(request: Request) -> Optional[str]:
    """Extract client IP address from request"""
    if request.client:
        return request.client.host
    return None


def get_user_agent(request: Request) -> Optional[str]:
    """Extract user agent from request"""
    return request.headers.get("user-agent")


@router.post("/register", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
async def register(
    request: Request,
    request_data: RegisterRequest,
    db: Session = Depends(get_db)
):
    """
    Register a new user account.
    Creates user account with email and password.
    """
    # Check if email already exists
    if get_user_by_email(db, request_data.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Check if phone already exists
    if get_user_by_phone(db, request_data.phone):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Phone number already registered"
        )
    
    # Create user
    user_data = UserCreate(
        email=request_data.email,
        phone=request_data.phone,
        full_name=request_data.full_name,
        password=request_data.password
    )
    user = create_user(db, user_data)
    
    # Log registration
    ip_address = get_client_ip(request)
    user_agent = get_user_agent(request)
    AuditLogger.log_register(db, user.id, user.email, ip_address, user_agent)
    
    return MessageResponse(
        message="Registration successful. You can now login with your email and password.",
        success=True
    )


@router.post("/login", response_model=TokenResponse)
@limiter.limit(f"{settings.RATE_LIMIT_AUTH_PER_MINUTE}/minute")
async def login(
    request: Request,
    request_data: LoginRequest,
    db: Session = Depends(get_db)
):
    """
    Login with email and password.
    Validates that the user exists in the database and the password matches.
    Returns access and refresh tokens upon successful authentication.
    """
    try:
        ip_address = get_client_ip(request)
        user_agent = get_user_agent(request)
        
        # Check if user exists in database by email
        user = get_user_by_email(db, request_data.email)
        
        if not user:
            AuditLogger.log_login_failed(
                db, request_data.email, "User not found", ip_address, user_agent
            )
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        # Check if account is locked
        if user.is_account_locked:
            AuditLogger.log_login_failed(
                db, request_data.email, "Account locked", ip_address, user_agent
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is locked. Please try again later."
            )
        
        # Verify password matches for this specific user account
        password_valid = verify_password(request_data.password, user.hashed_password)
        
        if not password_valid:
            increment_failed_login_attempts(db, user)
            
            # Lock account after max attempts
            if user.failed_login_attempts >= settings.MAX_LOGIN_ATTEMPTS:
                lock_user_account(db, user, settings.ACCOUNT_LOCKOUT_MINUTES)
                AuditLogger.log_account_locked(
                    db, user.id, "Max login attempts exceeded", ip_address
                )
            
            AuditLogger.log_login_failed(
                db, request_data.email, "Invalid password", ip_address, user_agent
            )
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        # Password is correct - return tokens directly
        
        # Reset failed login attempts
        reset_failed_login_attempts(db, user)
        
        # Update last login
        user.last_login_at = datetime.utcnow()
        db.commit()
        
        # Create tokens
        access_token = create_access_token(data={"sub": str(user.id), "email": user.email, "role": user.role.value})
        refresh_token_value = create_refresh_token()
        refresh_token_expiry = get_refresh_token_expiry()
        
        # Store refresh token
        refresh_token = RefreshToken(
            user_id=user.id,
            token=refresh_token_value,
            expires_at=refresh_token_expiry,
            device_info=user_agent,
            ip_address=ip_address
        )
        db.add(refresh_token)
        db.commit()
        
        # Log successful login
        AuditLogger.log_login(db, user.id, ip_address, user_agent)
        
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token_value,
            token_type="bearer",
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in login endpoint: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred during login"
        )


@router.post("/refresh", response_model=TokenResponse)
@limiter.limit(f"{settings.RATE_LIMIT_PER_MINUTE}/minute")
async def refresh_token(
    request: Request,
    request_data: RefreshTokenRequest,
    db: Session = Depends(get_db)
):
    """Refresh access token using refresh token"""
    refresh_token = db.query(RefreshToken).filter(
        RefreshToken.token == request_data.refresh_token,
        RefreshToken.is_revoked == False,
        RefreshToken.expires_at > datetime.utcnow()
    ).first()
    
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token"
        )
    
    user = refresh_token.user
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )
    
    # Revoke old refresh token
    refresh_token.is_revoked = True
    
    # Create new tokens
    access_token = create_access_token(data={"sub": str(user.id), "email": user.email, "role": user.role.value})
    refresh_token_value = create_refresh_token()
    refresh_token_expiry = get_refresh_token_expiry()
    
    # Store new refresh token
    new_refresh_token = RefreshToken(
        user_id=user.id,
        token=refresh_token_value,
        expires_at=refresh_token_expiry,
        device_info=get_user_agent(request),
        ip_address=get_client_ip(request)
    )
    db.add(new_refresh_token)
    db.commit()
    
    # Log token refresh
    AuditLogger.log_token_refreshed(db, user.id, get_client_ip(request))
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token_value,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )


@router.post("/logout", response_model=MessageResponse)
async def logout(
    request_data: RefreshTokenRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Logout and revoke refresh token"""
    refresh_token = db.query(RefreshToken).filter(
        RefreshToken.token == request_data.refresh_token,
        RefreshToken.user_id == current_user.id,
        RefreshToken.is_revoked == False
    ).first()
    
    if refresh_token:
        refresh_token.is_revoked = True
        db.commit()
    
    AuditLogger.log_logout(db, current_user.id, get_client_ip(request))
    
    return MessageResponse(message="Logged out successfully", success=True)


@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(
    current_user: User = Depends(get_current_user)
):
    """Get current user profile"""
    return current_user


@router.patch("/me", response_model=UserResponse)
async def update_current_user_profile(
    request_data: UpdateProfileRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update current user profile"""
    from app.schemas.user import UserUpdate
    
    user_data = UserUpdate(
        full_name=request_data.full_name,
        phone=request_data.phone
    )
    
    updated_user = update_user(db, current_user.id, user_data)
    if not updated_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return updated_user
