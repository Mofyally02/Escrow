"""
Authentication API endpoints.
Handles registration, login, OTP verification, token refresh, and logout.
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
    generate_otp,
    get_token_expiry
)
from app.core.otp import OTPService
from app.core.events import AuditLogger
from app.models.audit_log import AuditAction
from app.core.config import settings
from app.models.user import User
from app.models.otp_code import OTPCode, OTPType
from app.models.refresh_token import RefreshToken
from app.schemas.auth import (
    RegisterRequest,
    VerifyOTPRequest,
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

router = APIRouter(prefix="/auth", tags=["Authentication"])

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
    Sends OTP codes to both email and phone for verification.
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
    
    # Generate OTP codes
    email_otp = generate_otp(settings.OTP_LENGTH)
    phone_otp = generate_otp(settings.OTP_LENGTH)
    
    # Store OTP codes in database
    email_otp_code = OTPCode(
        user_id=user.id,
        code=email_otp,
        otp_type=OTPType.EMAIL,
        expires_at=datetime.utcnow() + timedelta(minutes=settings.OTP_EXPIRE_MINUTES)
    )
    phone_otp_code = OTPCode(
        user_id=user.id,
        code=phone_otp,
        otp_type=OTPType.PHONE,
        expires_at=datetime.utcnow() + timedelta(minutes=settings.OTP_EXPIRE_MINUTES)
    )
    
    db.add(email_otp_code)
    db.add(phone_otp_code)
    db.commit()
    
    # Send OTP codes
    ip_address = get_client_ip(request)
    user_agent = get_user_agent(request)
    
    email_sent = await OTPService.send_email_otp(user.email, email_otp, user.full_name)
    phone_sent = await OTPService.send_sms_otp(user.phone, phone_otp)
    
    # Log events
    AuditLogger.log_register(db, user.id, user.email, ip_address, user_agent)
    if email_sent:
        AuditLogger.log_otp_sent(db, user.id, "email", ip_address)
    if phone_sent:
        AuditLogger.log_otp_sent(db, user.id, "phone", ip_address)
    
    return MessageResponse(
        message="Registration successful. Please verify your email and phone with the OTP codes sent.",
        success=True
    )


@router.post("/verify-email", response_model=MessageResponse)
@limiter.limit(f"{settings.RATE_LIMIT_AUTH_PER_MINUTE}/minute")
async def verify_email_otp(
    request: Request,
    request_data: VerifyOTPRequest,
    db: Session = Depends(get_db)
):
    """Verify email OTP code"""
    if not request_data.email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email is required"
        )
    
    user = get_user_by_email(db, request_data.email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    if user.is_email_verified:
        return MessageResponse(message="Email already verified", success=True)
    
    # Get latest unused OTP code
    otp_code = db.query(OTPCode).filter(
        OTPCode.user_id == user.id,
        OTPCode.otp_type == OTPType.EMAIL,
        OTPCode.is_used == False,
        OTPCode.expires_at > datetime.utcnow()
    ).order_by(OTPCode.created_at.desc()).first()
    
    if not otp_code:
        AuditLogger.log_otp_failed(
            db, user.id, "email", "No valid OTP code found",
            get_client_ip(request)
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired OTP code"
        )
    
    # Check attempts
    if otp_code.attempts >= settings.OTP_MAX_ATTEMPTS:
        AuditLogger.log_otp_failed(
            db, user.id, "email", "Max attempts exceeded",
            get_client_ip(request)
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maximum OTP verification attempts exceeded"
        )
    
    # Verify code
    if otp_code.code != request_data.code:
        otp_code.attempts += 1
        db.commit()
        AuditLogger.log_otp_failed(
            db, user.id, "email", "Invalid code",
            get_client_ip(request)
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid OTP code"
        )
    
    # Mark OTP as used and verify email
    otp_code.is_used = True
    verify_email(db, user)
    
    AuditLogger.log_otp_verified(db, user.id, "email", get_client_ip(request))
    
    return MessageResponse(message="Email verified successfully", success=True)


@router.post("/verify-phone", response_model=MessageResponse)
@limiter.limit(f"{settings.RATE_LIMIT_AUTH_PER_MINUTE}/minute")
async def verify_phone_otp(
    request: Request,
    request_data: VerifyOTPRequest,
    db: Session = Depends(get_db)
):
    """Verify phone OTP code"""
    if not request_data.phone:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Phone is required"
        )
    
    user = get_user_by_phone(db, request_data.phone)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    if user.is_phone_verified:
        return MessageResponse(message="Phone already verified", success=True)
    
    # Get latest unused OTP code
    otp_code = db.query(OTPCode).filter(
        OTPCode.user_id == user.id,
        OTPCode.otp_type == OTPType.PHONE,
        OTPCode.is_used == False,
        OTPCode.expires_at > datetime.utcnow()
    ).order_by(OTPCode.created_at.desc()).first()
    
    if not otp_code:
        AuditLogger.log_otp_failed(
            db, user.id, "phone", "No valid OTP code found",
            get_client_ip(request)
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired OTP code"
        )
    
    # Check attempts
    if otp_code.attempts >= settings.OTP_MAX_ATTEMPTS:
        AuditLogger.log_otp_failed(
            db, user.id, "phone", "Max attempts exceeded",
            get_client_ip(request)
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maximum OTP verification attempts exceeded"
        )
    
    # Verify code
    if otp_code.code != request_data.code:
        otp_code.attempts += 1
        db.commit()
        AuditLogger.log_otp_failed(
            db, user.id, "phone", "Invalid code",
            get_client_ip(request)
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid OTP code"
        )
    
    # Mark OTP as used and verify phone
    otp_code.is_used = True
    verify_phone(db, user)
    
    AuditLogger.log_otp_verified(db, user.id, "phone", get_client_ip(request))
    
    return MessageResponse(message="Phone verified successfully", success=True)


@router.post("/login", response_model=TokenResponse)
@limiter.limit(f"{settings.RATE_LIMIT_AUTH_PER_MINUTE}/minute")
async def login(
    request: Request,
    request_data: LoginRequest,
    db: Session = Depends(get_db)
):
    """Login with email/phone and password. Returns access and refresh tokens."""
    user = get_user_by_email_or_phone(db, request_data.email_or_phone)
    
    ip_address = get_client_ip(request)
    user_agent = get_user_agent(request)
    
    if not user:
        AuditLogger.log_login_failed(
            db, request_data.email_or_phone, "User not found", ip_address, user_agent
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email/phone or password"
        )
    
    # Check if account is locked
    if user.is_account_locked:
        AuditLogger.log_login_failed(
            db, request_data.email_or_phone, "Account locked", ip_address, user_agent
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is locked. Please try again later."
        )
    
    # Verify password
    if not verify_password(request_data.password, user.hashed_password):
        increment_failed_login_attempts(db, user)
        
        # Lock account after max attempts
        if user.failed_login_attempts >= settings.MAX_LOGIN_ATTEMPTS:
            lock_user_account(db, user, settings.ACCOUNT_LOCKOUT_MINUTES)
            AuditLogger.log_account_locked(
                db, user.id, "Max login attempts exceeded", ip_address
            )
        
        AuditLogger.log_login_failed(
            db, request_data.email_or_phone, "Invalid password", ip_address, user_agent
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email/phone or password"
        )
    
    # Reset failed attempts on successful login
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
