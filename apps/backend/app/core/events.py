"""
Audit logging system for tracking all authentication and security events.
"""
from datetime import datetime
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from app.models.audit_log import AuditLog, AuditAction
from app.models.user import User
import json


class AuditLogger:
    """Service for logging audit events"""
    
    @staticmethod
    def log_event(
        db: Session,
        action: AuditAction,
        user_id: Optional[int] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
        success: bool = True
    ) -> AuditLog:
        """
        Log an audit event to the database.
        Returns the created AuditLog entry.
        """
        audit_log = AuditLog(
            user_id=user_id,
            action=action,
            ip_address=ip_address,
            user_agent=user_agent,
            details=json.dumps(details) if details else None,
            success=str(success).lower()
        )
        
        db.add(audit_log)
        db.commit()
        db.refresh(audit_log)
        
        return audit_log
    
    @staticmethod
    def log_register(
        db: Session,
        user_id: int,
        email: str,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> AuditLog:
        """Log user registration"""
        return AuditLogger.log_event(
            db=db,
            action=AuditAction.REGISTER,
            user_id=user_id,
            ip_address=ip_address,
            user_agent=user_agent,
            details={"email": email},
            success=True
        )
    
    @staticmethod
    def log_login(
        db: Session,
        user_id: int,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> AuditLog:
        """Log successful login"""
        return AuditLogger.log_event(
            db=db,
            action=AuditAction.LOGIN,
            user_id=user_id,
            ip_address=ip_address,
            user_agent=user_agent,
            success=True
        )
    
    @staticmethod
    def log_login_failed(
        db: Session,
        email_or_phone: str,
        reason: str,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> AuditLog:
        """Log failed login attempt"""
        return AuditLogger.log_event(
            db=db,
            action=AuditAction.LOGIN_FAILED,
            ip_address=ip_address,
            user_agent=user_agent,
            details={
                "email_or_phone": email_or_phone,
                "reason": reason
            },
            success=False
        )
    
    @staticmethod
    def log_otp_sent(
        db: Session,
        user_id: int,
        otp_type: str,
        ip_address: Optional[str] = None
    ) -> AuditLog:
        """Log OTP sent event"""
        return AuditLogger.log_event(
            db=db,
            action=AuditAction.OTP_SENT,
            user_id=user_id,
            ip_address=ip_address,
            details={"otp_type": otp_type},
            success=True
        )
    
    @staticmethod
    def log_otp_verified(
        db: Session,
        user_id: int,
        otp_type: str,
        ip_address: Optional[str] = None
    ) -> AuditLog:
        """Log OTP verification"""
        return AuditLogger.log_event(
            db=db,
            action=AuditAction.OTP_VERIFIED,
            user_id=user_id,
            ip_address=ip_address,
            details={"otp_type": otp_type},
            success=True
        )
    
    @staticmethod
    def log_otp_failed(
        db: Session,
        user_id: Optional[int],
        otp_type: str,
        reason: str,
        ip_address: Optional[str] = None
    ) -> AuditLog:
        """Log failed OTP verification"""
        return AuditLogger.log_event(
            db=db,
            action=AuditAction.OTP_FAILED,
            user_id=user_id,
            ip_address=ip_address,
            details={"otp_type": otp_type, "reason": reason},
            success=False
        )
    
    @staticmethod
    def log_logout(
        db: Session,
        user_id: int,
        ip_address: Optional[str] = None
    ) -> AuditLog:
        """Log user logout"""
        return AuditLogger.log_event(
            db=db,
            action=AuditAction.LOGOUT,
            user_id=user_id,
            ip_address=ip_address,
            success=True
        )
    
    @staticmethod
    def log_token_refreshed(
        db: Session,
        user_id: int,
        ip_address: Optional[str] = None
    ) -> AuditLog:
        """Log token refresh"""
        return AuditLogger.log_event(
            db=db,
            action=AuditAction.TOKEN_REFRESHED,
            user_id=user_id,
            ip_address=ip_address,
            success=True
        )
    
    @staticmethod
    def log_account_locked(
        db: Session,
        user_id: int,
        reason: str,
        ip_address: Optional[str] = None
    ) -> AuditLog:
        """Log account lockout"""
        return AuditLogger.log_event(
            db=db,
            action=AuditAction.ACCOUNT_LOCKED,
            user_id=user_id,
            ip_address=ip_address,
            details={"reason": reason},
            success=False
        )
    
    # Listing-related audit methods
    @staticmethod
    def log_listing_created(
        db: Session,
        user_id: int,
        listing_id: int,
        ip_address: Optional[str] = None
    ) -> AuditLog:
        """Log listing creation"""
        return AuditLogger.log_event(
            db=db,
            action=AuditAction.LISTING_CREATED,
            user_id=user_id,
            ip_address=ip_address,
            details={"listing_id": listing_id},
            success=True
        )
    
    @staticmethod
    def log_listing_submitted(
        db: Session,
        user_id: int,
        listing_id: int,
        ip_address: Optional[str] = None
    ) -> AuditLog:
        """Log listing submission for review"""
        return AuditLogger.log_event(
            db=db,
            action=AuditAction.LISTING_SUBMITTED,
            user_id=user_id,
            ip_address=ip_address,
            details={"listing_id": listing_id},
            success=True
        )
    
    @staticmethod
    def log_listing_approved(
        db: Session,
        admin_id: int,
        listing_id: int,
        ip_address: Optional[str] = None
    ) -> AuditLog:
        """Log listing approval"""
        return AuditLogger.log_event(
            db=db,
            action=AuditAction.LISTING_APPROVED,
            user_id=admin_id,
            ip_address=ip_address,
            details={"listing_id": listing_id},
            success=True
        )
    
    @staticmethod
    def log_listing_rejected(
        db: Session,
        admin_id: int,
        listing_id: int,
        reason: str,
        ip_address: Optional[str] = None
    ) -> AuditLog:
        """Log listing rejection"""
        return AuditLogger.log_event(
            db=db,
            action=AuditAction.LISTING_REJECTED,
            user_id=admin_id,
            ip_address=ip_address,
            details={"listing_id": listing_id, "reason": reason},
            success=False
        )
    
    @staticmethod
    def log_listing_state_changed(
        db: Session,
        user_id: int,
        listing_id: int,
        old_state: str,
        new_state: str,
        ip_address: Optional[str] = None
    ) -> AuditLog:
        """Log listing state change"""
        return AuditLogger.log_event(
            db=db,
            action=AuditAction.LISTING_STATE_CHANGED,
            user_id=user_id,
            ip_address=ip_address,
            details={
                "listing_id": listing_id,
                "old_state": old_state,
                "new_state": new_state
            },
            success=True
        )
    
    @staticmethod
    def log_credentials_stored(
        db: Session,
        user_id: int,
        listing_id: int,
        ip_address: Optional[str] = None
    ) -> AuditLog:
        """Log credential storage"""
        return AuditLogger.log_event(
            db=db,
            action=AuditAction.CREDENTIALS_STORED,
            user_id=user_id,
            ip_address=ip_address,
            details={"listing_id": listing_id},
            success=True
        )
    
    @staticmethod
    def log_credentials_revealed(
        db: Session,
        user_id: int,
        listing_id: int,
        ip_address: Optional[str] = None
    ) -> AuditLog:
        """Log credential reveal (one-time)"""
        return AuditLogger.log_event(
            db=db,
            action=AuditAction.CREDENTIALS_REVEALED,
            user_id=user_id,
            ip_address=ip_address,
            details={"listing_id": listing_id},
            success=True
        )
    
    @staticmethod
    def log_admin_review_started(
        db: Session,
        admin_id: int,
        listing_id: int,
        ip_address: Optional[str] = None
    ) -> AuditLog:
        """Log admin review start"""
        return AuditLogger.log_event(
            db=db,
            action=AuditAction.ADMIN_REVIEW_STARTED,
            user_id=admin_id,
            ip_address=ip_address,
            details={"listing_id": listing_id},
            success=True
        )
    
    @staticmethod
    def log_admin_request_info(
        db: Session,
        admin_id: int,
        listing_id: int,
        request_message: str,
        ip_address: Optional[str] = None
    ) -> AuditLog:
        """Log admin request for more information"""
        return AuditLogger.log_event(
            db=db,
            action=AuditAction.ADMIN_REQUEST_INFO,
            user_id=admin_id,
            ip_address=ip_address,
            details={
                "listing_id": listing_id,
                "request_message": request_message
            },
            success=True
        )
