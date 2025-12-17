"""
CRUD operations for RefreshToken model
"""
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime
from app.models.refresh_token import RefreshToken


def get_refresh_token(db: Session, token: str) -> Optional[RefreshToken]:
    """Get refresh token by token string"""
    return db.query(RefreshToken).filter(RefreshToken.token == token).first()


def create_refresh_token(
    db: Session,
    user_id: int,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None
) -> RefreshToken:
    """Create a new refresh token"""
    refresh_token = RefreshToken.create_token(
        user_id=user_id,
        ip_address=ip_address,
        user_agent=user_agent
    )
    
    db.add(refresh_token)
    db.commit()
    db.refresh(refresh_token)
    return refresh_token


def revoke_refresh_token(db: Session, token: RefreshToken) -> None:
    """Revoke a refresh token"""
    token.is_revoked = True
    token.revoked_at = datetime.utcnow()
    db.commit()


def revoke_all_user_tokens(db: Session, user_id: int) -> None:
    """Revoke all refresh tokens for a user"""
    tokens = db.query(RefreshToken).filter(
        RefreshToken.user_id == user_id,
        RefreshToken.is_revoked == False
    ).all()
    
    for token in tokens:
        token.is_revoked = True
        token.revoked_at = datetime.utcnow()
    
    db.commit()


def rotate_refresh_token(
    db: Session,
    old_token: RefreshToken,
    new_token: RefreshToken
) -> RefreshToken:
    """Rotate refresh token (mark old as rotated, create new)"""
    old_token.is_revoked = True
    old_token.rotated_at = datetime.utcnow()
    new_token.previous_token_id = old_token.id
    
    db.add(new_token)
    db.commit()
    db.refresh(new_token)
    return new_token

