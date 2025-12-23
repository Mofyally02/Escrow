"""
CRUD operations for User model.
"""
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Optional
from app.models.user import User
from app.core.security import hash_password
from app.schemas.user import UserCreate, UserUpdate


def get_user_by_id(db: Session, user_id: int) -> Optional[User]:
    """Get user by ID"""
    return db.query(User).filter(User.id == user_id).first()


def get_user_by_email(db: Session, email: str) -> Optional[User]:
    """Get user by email"""
    return db.query(User).filter(User.email == email).first()


def get_user_by_phone(db: Session, phone: str) -> Optional[User]:
    """Get user by phone"""
    return db.query(User).filter(User.phone == phone).first()


def get_user_by_email_or_phone(db: Session, email_or_phone: str) -> Optional[User]:
    """Get user by email or phone"""
    return db.query(User).filter(
        or_(User.email == email_or_phone, User.phone == email_or_phone)
    ).first()


def create_user(db: Session, user_data: UserCreate) -> User:
    """Create a new user"""
    # #region agent log
    import json, time
    log_data = {"location":"app/crud/user.py:34","message":"create_user called","data":{"email":user_data.email,"phone":user_data.phone,"full_name":user_data.full_name},"timestamp":int(time.time()*1000),"sessionId":"auth-verification","runId":"pre-fix","hypothesisId":"A"}
    with open("/Users/mofyally/Documents/AI Projects/.cursor/debug.log", "a") as f: f.write(json.dumps(log_data) + "\n")
    # #endregion
    hashed_password = hash_password(user_data.password)
    
    db_user = User(
        email=user_data.email,
        phone=user_data.phone,
        full_name=user_data.full_name,
        hashed_password=hashed_password
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    # #region agent log
    log_data = {"location":"app/crud/user.py:48","message":"User created in database","data":{"user_id":str(db_user.id),"email":db_user.email,"created":True},"timestamp":int(time.time()*1000),"sessionId":"auth-verification","runId":"pre-fix","hypothesisId":"A"}
    with open("/Users/mofyally/Documents/AI Projects/.cursor/debug.log", "a") as f: f.write(json.dumps(log_data) + "\n")
    # #endregion
    return db_user


def update_user(db: Session, user_id: int, user_data: UserUpdate) -> Optional[User]:
    """Update user information"""
    db_user = get_user_by_id(db, user_id)
    
    if not db_user:
        return None
    
    if user_data.full_name is not None:
        db_user.full_name = user_data.full_name
    if user_data.phone is not None:
        db_user.phone = user_data.phone
    
    db.commit()
    db.refresh(db_user)
    
    return db_user


def increment_failed_login_attempts(db: Session, user: User) -> User:
    """Increment failed login attempts"""
    user.failed_login_attempts += 1
    db.commit()
    db.refresh(user)
    return user


def reset_failed_login_attempts(db: Session, user: User) -> User:
    """Reset failed login attempts"""
    user.failed_login_attempts = 0
    user.account_locked_until = None
    db.commit()
    db.refresh(user)
    return user


def lock_user_account(db: Session, user: User, lockout_minutes: int = 30) -> User:
    """Lock user account for specified minutes"""
    from datetime import datetime, timedelta
    user.account_locked_until = datetime.utcnow() + timedelta(minutes=lockout_minutes)
    db.commit()
    db.refresh(user)
    return user


def verify_email(db: Session, user: User) -> User:
    """Mark user's email as verified"""
    user.is_email_verified = True
    db.commit()
    db.refresh(user)
    return user


def verify_phone(db: Session, user: User) -> User:
    """Mark user's phone as verified"""
    user.is_phone_verified = True
    db.commit()
    db.refresh(user)
    return user


def suspend_user(db: Session, user: User) -> User:
    """Suspend user account"""
    user.is_active = False
    db.commit()
    db.refresh(user)
    return user


def unsuspend_user(db: Session, user: User) -> User:
    """Unsuspend user account"""
    user.is_active = True
    db.commit()
    db.refresh(user)
    return user


def delete_user(db: Session, user: User) -> bool:
    """
    Delete user account and all associated data.
    Returns True if successful, False otherwise.
    """
    import logging
    logger = logging.getLogger(__name__)
    try:
        db.delete(user)
        db.commit()
        return True
    except Exception as e:
        db.rollback()
        logger.error(f"Error deleting user {user.id}: {str(e)}")
        return False
