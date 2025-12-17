from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

# Ensure PostgreSQL is used (not SQLite for production)
if settings.DATABASE_URL.startswith("sqlite"):
    logger.warning("SQLite detected! PostgreSQL is required for production. Using SQLite only for testing.")
    # SQLite doesn't support pool_size
    engine = create_engine(
        settings.DATABASE_URL,
        connect_args={"check_same_thread": False},  # Needed for SQLite
        echo=False
    )
elif not settings.DATABASE_URL.startswith("postgresql"):
    raise ValueError(
        f"Invalid DATABASE_URL. PostgreSQL is required. "
        f"Current URL starts with: {settings.DATABASE_URL.split('://')[0]}"
    )
else:
    # PostgreSQL configuration (required for production)
    engine = create_engine(
        settings.DATABASE_URL,
        pool_pre_ping=True,
        pool_size=10,
        max_overflow=20,
        echo=False
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """Dependency for getting database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

