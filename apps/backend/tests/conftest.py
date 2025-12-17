"""
Pytest configuration and fixtures
"""
import os
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from app.core.database import Base, get_db
from app.core.config import settings
from app.main import app
from app.models.user import User, Role
from app.crud.user import create_user, get_password_hash


@pytest.fixture(autouse=True)
def override_jwt_config(monkeypatch):
    """
    Override JWT configuration for tests to ensure deterministic behavior.
    This fixture runs automatically for all tests.
    """
    # Set test environment variables
    monkeypatch.setenv("JWT_SECRET_KEY", "test-secret-key-for-pytest-only")
    monkeypatch.setenv("JWT_ALGORITHM", "HS256")
    monkeypatch.setenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", "60")
    
    # Reload settings to pick up new values
    from app.core.config import reload_settings
    reload_settings()
    
    # Enable test mode (disables token expiry)
    from app.core.config import settings
    settings.TESTING = True
    
    yield
    
    # Cleanup
    monkeypatch.delenv("JWT_SECRET_KEY", raising=False)
    monkeypatch.delenv("JWT_ALGORITHM", raising=False)
    monkeypatch.delenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", raising=False)
    settings.TESTING = False

# Test database URL (in-memory SQLite for speed)
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db():
    """Create a fresh database for each test"""
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db):
    """Create a test client with database override"""
    def override_get_db():
        try:
            yield db
        finally:
            pass
    
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def test_user(db):
    """Create a test user"""
    user = create_user(
        db=db,
        email="test@example.com",
        phone="1234567890",
        password="testpassword123",
        full_name="Test User",
        role=Role.BUYER
    )
    return user


@pytest.fixture
def verified_user(db):
    """Create a verified test user"""
    user = create_user(
        db=db,
        email="verified@example.com",
        phone="9876543210",
        password="testpassword123",
        full_name="Verified User",
        role=Role.BUYER
    )
    user.is_email_verified = True
    user.is_phone_verified = True
    db.commit()
    return user


@pytest.fixture
def admin_user(db):
    """Create an admin test user"""
    user = create_user(
        db=db,
        email="admin@example.com",
        phone="5555555555",
        password="adminpassword123",
        full_name="Admin User",
        role=Role.ADMIN
    )
    user.is_email_verified = True
    user.is_phone_verified = True
    db.commit()
    return user

