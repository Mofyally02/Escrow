"""
Admin endpoints for user management.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.api.v1.dependencies import require_admin
from app.models.user import User
from app.models.audit_log import AuditLog, AuditAction
from app.crud import user as user_crud
from app.schemas.auth import UserResponse
from app.schemas.admin import SuspendUserRequest, DeleteUserRequest
from app.core.events import AuditLogger
from app.core.email import send_account_suspended_email
from app.utils.request_utils import get_client_ip, get_user_agent

router = APIRouter()


@router.get("", response_model=List[UserResponse])
async def get_all_users(
    request: Request,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Get all users in the system (admin only).
    """
    users = db.query(User).order_by(User.created_at.desc()).offset(skip).limit(limit).all()
    return users


@router.post("/{user_id}/verify-email", response_model=UserResponse)
async def verify_user_email(
    request: Request,
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Manually verify a user's email address (admin only).
    Temporary feature until OTP system is in place.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    if user.is_email_verified:
        return user
    
    # Mark email as verified
    user_crud.verify_email(db, user)
    
    # Create audit log
    audit_log = AuditLog(
        user_id=user.id,
        action=AuditAction.EMAIL_VERIFIED,
        details=f"Email verified manually by admin {current_user.email}",
        ip_address=get_client_ip(request),
        user_agent=get_user_agent(request)
    )
    db.add(audit_log)
    db.commit()
    db.refresh(user)
    
    return user


@router.post("/{user_id}/verify-phone", response_model=UserResponse)
async def verify_user_phone(
    request: Request,
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Manually verify a user's phone number (admin only).
    Temporary feature until OTP system is in place.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    if user.is_phone_verified:
        return user
    
    # Mark phone as verified
    user_crud.verify_phone(db, user)
    
    # Create audit log
    audit_log = AuditLog(
        user_id=user.id,
        action=AuditAction.PHONE_VERIFIED,
        details=f"Phone verified manually by admin {current_user.email}",
        ip_address=get_client_ip(request),
        user_agent=get_user_agent(request)
    )
    db.add(audit_log)
    db.commit()
    db.refresh(user)
    
    return user


@router.post("/{user_id}/verify-both", response_model=UserResponse)
async def verify_user_both(
    request: Request,
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Manually verify both email and phone for a user (admin only).
    Temporary feature until OTP system is in place.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    updated = False
    
    # Verify email if not already verified
    if not user.is_email_verified:
        user_crud.verify_email(db, user)
        updated = True
    
    # Verify phone if not already verified
    if not user.is_phone_verified:
        user_crud.verify_phone(db, user)
        updated = True
    
    if updated:
        # Create audit log
        audit_log = AuditLog(
            user_id=user.id,
            action=AuditAction.EMAIL_VERIFIED,  # Using email_verified as primary action
            details=f"Email and phone verified manually by admin {current_user.email}",
            ip_address=get_client_ip(request),
            user_agent=get_user_agent(request)
        )
        db.add(audit_log)
        
        # Also log phone verification separately
        audit_log_phone = AuditLog(
            user_id=user.id,
            action=AuditAction.PHONE_VERIFIED,
            details=f"Phone verified manually by admin {current_user.email}",
            ip_address=get_client_ip(request),
            user_agent=get_user_agent(request)
        )
        db.add(audit_log_phone)
        
        db.commit()
        db.refresh(user)
    
    return user


@router.post("/{user_id}/suspend", response_model=UserResponse)
async def suspend_user_account(
    request: Request,
    user_id: int,
    suspend_data: SuspendUserRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Suspend a user account (admin only).
    Sends email notification to the user with suspension reason and support link.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Prevent suspending admin accounts
    if user.role.value in ['admin', 'super_admin']:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot suspend admin accounts"
        )
    
    if not user.is_active:
        return user  # Already suspended
    
    # Suspend user
    user_crud.suspend_user(db, user)
    
    # Send suspension email
    from app.core.config import settings
    support_link = f"{settings.FRONTEND_URL}/support"
    email_sent = send_account_suspended_email(
        user_email=user.email,
        user_name=user.full_name,
        reason=suspend_data.reason,
        support_link=support_link
    )
    
    # Create audit log
    details = f"Account suspended by admin {current_user.email}. Reason: {suspend_data.reason}"
    if suspend_data.notes:
        details += f" Notes: {suspend_data.notes}"
    if not email_sent:
        details += " (Email notification failed to send)"
    
    audit_log = AuditLog(
        user_id=user.id,
        action=AuditAction.ACCOUNT_LOCKED,
        details=details,
        ip_address=get_client_ip(request),
        user_agent=get_user_agent(request)
    )
    db.add(audit_log)
    db.commit()
    db.refresh(user)
    
    return user


@router.post("/{user_id}/unsuspend", response_model=UserResponse)
async def unsuspend_user_account(
    request: Request,
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Unsuspend a user account (admin only).
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    if user.is_active:
        return user  # Already active
    
    # Unsuspend user
    user_crud.unsuspend_user(db, user)
    
    # Create audit log
    audit_log = AuditLog(
        user_id=user.id,
        action=AuditAction.ACCOUNT_UNLOCKED,
        details=f"Account unsuspended by admin {current_user.email}",
        ip_address=get_client_ip(request),
        user_agent=get_user_agent(request)
    )
    db.add(audit_log)
    db.commit()
    db.refresh(user)
    
    return user


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user_account(
    request: Request,
    user_id: int,
    delete_data: DeleteUserRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Delete a user account permanently (admin only).
    This action cannot be undone and will delete all associated data.
    """
    if not delete_data.confirm:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Deletion must be confirmed"
        )
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Prevent deleting admin accounts
    if user.role.value in ['admin', 'super_admin']:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot delete admin accounts"
        )
    
    # Prevent deleting own account
    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account"
        )
    
    # Create audit log before deletion
    details = f"Account deleted by admin {current_user.email}. Reason: {delete_data.reason}"
    audit_log = AuditLog(
        user_id=user.id,
        action=AuditAction.ACCOUNT_LOCKED,  # Using account_locked as closest action
        details=details,
        ip_address=get_client_ip(request),
        user_agent=get_user_agent(request)
    )
    db.add(audit_log)
    db.commit()
    
    # Delete user (cascade will handle related data)
    success = user_crud.delete_user(db, user)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete user account"
        )
    
    return None

