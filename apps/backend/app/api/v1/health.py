"""
Health check and monitoring endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from datetime import datetime
from typing import Dict, Any
from app.core.database import get_db
from app.core.config import settings

router = APIRouter()


@router.get("/health")
async def health_check() -> Dict[str, Any]:
    """
    Basic health check endpoint.
    Returns 200 if service is running.
    """
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "service": "escrow-backend",
        "version": "1.0.0"
    }


@router.get("/health/detailed")
async def detailed_health_check(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    Detailed health check including database connectivity.
    """
    health_status = {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "service": "escrow-backend",
        "version": "1.0.0",
        "checks": {}
    }
    
    # Database check
    try:
        db.execute(text("SELECT 1"))
        health_status["checks"]["database"] = {
            "status": "healthy",
            "message": "Database connection successful"
        }
    except Exception as e:
        health_status["status"] = "unhealthy"
        health_status["checks"]["database"] = {
            "status": "unhealthy",
            "message": str(e)
        }
    
    # Environment check
    health_status["checks"]["environment"] = {
        "status": "healthy",
        "environment": settings.ENVIRONMENT,
        "debug": settings.DEBUG
    }
    
    return health_status


@router.get("/metrics")
async def metrics(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    Basic metrics endpoint (for Prometheus scraping).
    In production, use proper Prometheus client library.
    """
    metrics_data = {
        "timestamp": datetime.utcnow().isoformat(),
        "metrics": {}
    }
    
    try:
        # Transaction metrics
        from app.models.transaction import Transaction, TransactionState
        
        total_transactions = db.query(Transaction).count()
        pending = db.query(Transaction).filter(Transaction.state == TransactionState.PENDING).count()
        completed = db.query(Transaction).filter(Transaction.state == TransactionState.COMPLETED).count()
        refunded = db.query(Transaction).filter(Transaction.state == TransactionState.REFUNDED).count()
        
        metrics_data["metrics"]["transactions"] = {
            "total": total_transactions,
            "pending": pending,
            "completed": completed,
            "refunded": refunded
        }
        
        # Listing metrics
        from app.models.listing import Listing, ListingState
        
        total_listings = db.query(Listing).count()
        approved = db.query(Listing).filter(Listing.state == ListingState.APPROVED).count()
        sold = db.query(Listing).filter(Listing.state == ListingState.SOLD).count()
        
        metrics_data["metrics"]["listings"] = {
            "total": total_listings,
            "approved": approved,
            "sold": sold
        }
        
        # User metrics
        from app.models.user import User
        
        total_users = db.query(User).count()
        verified_users = db.query(User).filter(
            User.is_email_verified == True,
            User.is_phone_verified == True
        ).count()
        
        metrics_data["metrics"]["users"] = {
            "total": total_users,
            "verified": verified_users
        }
        
    except Exception as e:
        metrics_data["error"] = str(e)
    
    return metrics_data


@router.get("/readiness")
async def readiness_check(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    Kubernetes readiness probe endpoint.
    Returns 200 if service is ready to accept traffic.
    """
    try:
        # Check database
        db.execute(text("SELECT 1"))
        
        return {
            "status": "ready",
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Service not ready: {str(e)}"
        )


@router.get("/liveness")
async def liveness_check() -> Dict[str, Any]:
    """
    Kubernetes liveness probe endpoint.
    Returns 200 if service is alive.
    """
    return {
        "status": "alive",
        "timestamp": datetime.utcnow().isoformat()
    }

