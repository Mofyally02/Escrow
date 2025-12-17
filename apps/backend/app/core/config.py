from pydantic_settings import BaseSettings
from pydantic import Field
from typing import List
import os


class Settings(BaseSettings):
    # Application
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    TESTING: bool = False  # Set to True in tests to disable token expiry
    
    # Database (PostgreSQL required - use localhost for local dev, postgres for Docker)
    DATABASE_URL: str = "postgresql+psycopg2://escrow:escrow_dev_password@localhost:5432/escrow_dev"
    
    # JWT - Single source of truth, reads from env vars with defaults
    # Using Field() ensures Pydantic reads from environment variables at runtime
    # Note: Pydantic Settings caches values, use reload_settings() to refresh
    JWT_SECRET_KEY: str = Field(
        default="super-secret-dev-key-change-in-prod",
        env="JWT_SECRET_KEY",
        description="JWT secret key for token signing. MUST be set in production."
    )
    JWT_ALGORITHM: str = Field(
        default="HS256",
        env="JWT_ALGORITHM",
        description="JWT algorithm for token signing"
    )
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(
        default=15,
        env="JWT_ACCESS_TOKEN_EXPIRE_MINUTES",
        description="Access token expiry time in minutes"
    )  # 15 minutes for access token
    REFRESH_TOKEN_EXPIRE_DAYS: int = Field(
        default=30,
        env="JWT_REFRESH_TOKEN_EXPIRE_DAYS",
        description="Refresh token expiry time in days"
    )  # 30 days for refresh token
    
    # OTP Settings
    OTP_LENGTH: int = 6
    OTP_EXPIRE_MINUTES: int = 5
    OTP_MAX_ATTEMPTS: int = 3
    
    # Account Security
    MAX_LOGIN_ATTEMPTS: int = 5
    ACCOUNT_LOCKOUT_MINUTES: int = 30
    PASSWORD_MIN_LENGTH: int = 8
    
    # Rate Limiting
    RATE_LIMIT_ENABLED: bool = True
    RATE_LIMIT_PER_MINUTE: int = 5
    RATE_LIMIT_AUTH_PER_MINUTE: int = 3
    
    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]
    
    # Frontend/Backend URLs
    FRONTEND_URL: str = "http://localhost:3000"
    BACKEND_URL: str = "http://localhost:8000"
    
    # Email (Resend.com)
    RESEND_API_KEY: str = ""
    RESEND_FROM_EMAIL: str = "noreply@escrow.com"
    RESEND_FROM_NAME: str = "ESCROW"
    
    # SMS (Africa's Talking)
    AFRICAS_TALKING_API_KEY: str = ""
    AFRICAS_TALKING_USERNAME: str = ""
    AFRICAS_TALKING_SENDER_ID: str = "ESCROW"
    
    # SMS Fallback (Twilio)
    TWILIO_ACCOUNT_SID: str = ""
    TWILIO_AUTH_TOKEN: str = ""
    TWILIO_PHONE_NUMBER: str = ""
    
    # SMTP Fallback (for email)
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_USE_TLS: bool = True
    
    # Paystack
    PAYSTACK_SECRET_KEY: str = ""
    PAYSTACK_PUBLIC_KEY: str = ""
    
    # M-Pesa (for future)
    MPESA_CONSUMER_KEY: str = ""
    MPESA_CONSUMER_SECRET: str = ""
    MPESA_TILL_NUMBER: str = ""
    
    # Platform Commission
    PLATFORM_COMMISSION_PERCENT: int = 10  # 10% default commission
    
    # Encryption
    ENCRYPTION_PEPPER: str = ""  # Server-side pepper for credential encryption
    
    # Observability
    SENTRY_DSN: str = ""  # Sentry DSN for error tracking
    ENABLE_SENTRY: bool = False
    
    # File Upload (Cloudinary or S3)
    CLOUDINARY_CLOUD_NAME: str = ""
    CLOUDINARY_API_KEY: str = ""
    CLOUDINARY_API_SECRET: str = ""
    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    AWS_S3_BUCKET: str = ""
    AWS_REGION: str = "us-east-1"
    
    class Config:
        env_file = ".env"
        case_sensitive = True


# Create settings instance - will be reloaded if env vars change
settings = Settings()


def reload_settings():
    """Reload settings from environment (useful for tests)"""
    global settings
    settings = Settings()
    return settings

