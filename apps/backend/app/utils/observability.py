"""
Observability utilities for logging, error tracking, and metrics.
"""
import logging
import sys
from typing import Optional, Dict, Any
from datetime import datetime
from app.core.config import settings

# Configure structured logging
logging.basicConfig(
    level=logging.INFO if not settings.DEBUG else logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)

logger = logging.getLogger("escrow")


def setup_sentry():
    """
    Initialize Sentry for error tracking.
    Only enabled if SENTRY_DSN is configured.
    """
    if settings.ENABLE_SENTRY and settings.SENTRY_DSN:
        try:
            import sentry_sdk
            from sentry_sdk.integrations.fastapi import FastApiIntegration
            from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration
            
            sentry_sdk.init(
                dsn=settings.SENTRY_DSN,
                environment=settings.ENVIRONMENT,
                integrations=[
                    FastApiIntegration(),
                    SqlalchemyIntegration(),
                ],
                traces_sample_rate=0.1 if settings.ENVIRONMENT == "production" else 1.0,
                profiles_sample_rate=0.1 if settings.ENVIRONMENT == "production" else 1.0,
            )
            logger.info("Sentry initialized successfully")
        except ImportError:
            logger.warning("Sentry SDK not installed. Install with: pip install sentry-sdk")
        except Exception as e:
            logger.error(f"Failed to initialize Sentry: {e}")


def log_security_event(
    event_type: str,
    user_id: Optional[int] = None,
    ip_address: Optional[str] = None,
    details: Optional[Dict[str, Any]] = None
):
    """
    Log security-related events for monitoring.
    """
    logger.warning(
        f"SECURITY_EVENT: {event_type}",
        extra={
            "event_type": event_type,
            "user_id": user_id,
            "ip_address": ip_address,
            "details": details or {},
            "timestamp": datetime.utcnow().isoformat()
        }
    )


def log_performance_metric(
    operation: str,
    duration_ms: float,
    success: bool = True,
    metadata: Optional[Dict[str, Any]] = None
):
    """
    Log performance metrics.
    """
    logger.info(
        f"PERFORMANCE: {operation}",
        extra={
            "operation": operation,
            "duration_ms": duration_ms,
            "success": success,
            "metadata": metadata or {},
            "timestamp": datetime.utcnow().isoformat()
        }
    )


def log_business_event(
    event_type: str,
    transaction_id: Optional[int] = None,
    listing_id: Optional[int] = None,
    amount: Optional[int] = None,
    metadata: Optional[Dict[str, Any]] = None
):
    """
    Log business events (transactions, listings, etc.).
    """
    logger.info(
        f"BUSINESS_EVENT: {event_type}",
        extra={
            "event_type": event_type,
            "transaction_id": transaction_id,
            "listing_id": listing_id,
            "amount": amount,
            "metadata": metadata or {},
            "timestamp": datetime.utcnow().isoformat()
        }
    )

