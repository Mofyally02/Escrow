"""
Comprehensive tests for authentication endpoints
"""
import pytest
from fastapi import status
from app.models.user import User
from app.crud.user import get_user_by_email, verify_email_otp, verify_phone_otp


class TestRegistration:
    """Test user registration"""
    
    def test_register_success(self, client, db):
        """Test successful user registration"""
        response = client.post(
            "/api/v1/auth/register",
            json={
                "email": "newuser@example.com",
                "phone": "1234567890",
                "password": "securepass123",
                "full_name": "New User"
            }
        )
        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["message"] == "Registration successful. Please verify your email and phone."
        assert "user_id" in data
        
        # Verify user was created
        user = get_user_by_email(db, "newuser@example.com")
        assert user is not None
        assert user.email == "newuser@example.com"
        assert not user.is_email_verified
        assert not user.is_phone_verified
    
    def test_register_duplicate_email(self, client, test_user):
        """Test registration with duplicate email"""
        response = client.post(
            "/api/v1/auth/register",
            json={
                "email": "test@example.com",
                "phone": "9999999999",
                "password": "securepass123",
                "full_name": "Duplicate User"
            }
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "already registered" in response.json()["detail"]
    
    def test_register_invalid_email(self, client):
        """Test registration with invalid email"""
        response = client.post(
            "/api/v1/auth/register",
            json={
                "email": "invalid-email",
                "phone": "1234567890",
                "password": "securepass123",
                "full_name": "Test User"
            }
        )
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    
    def test_register_short_password(self, client):
        """Test registration with short password"""
        response = client.post(
            "/api/v1/auth/register",
            json={
                "email": "user@example.com",
                "phone": "1234567890",
                "password": "short",
                "full_name": "Test User"
            }
        )
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


class TestOTPVerification:
    """Test OTP verification"""
    
    def test_verify_email_otp_success(self, client, test_user, db):
        """Test successful email OTP verification"""
        # Use the OTP stored in the user
        otp = test_user.email_otp
        response = client.post(
            "/api/v1/auth/verify-email",
            json={
                "email": "test@example.com",
                "otp": otp
            }
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["verified"] is True
        assert data["email_verified"] is True
        
        # Verify user is now email verified
        user = get_user_by_email(db, "test@example.com")
        assert user.is_email_verified
    
    def test_verify_email_otp_invalid(self, client, test_user):
        """Test email OTP verification with invalid OTP"""
        response = client.post(
            "/api/v1/auth/verify-email",
            json={
                "email": "test@example.com",
                "otp": "000000"
            }
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "Invalid or expired" in response.json()["detail"]
    
    def test_verify_phone_otp_success(self, client, test_user, db):
        """Test successful phone OTP verification"""
        otp = test_user.phone_otp
        response = client.post(
            "/api/v1/auth/verify-phone",
            json={
                "phone": "1234567890",
                "otp": otp
            }
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["verified"] is True
        assert data["phone_verified"] is True


class TestLogin:
    """Test user login"""
    
    def test_login_success(self, client, verified_user):
        """Test successful login"""
        response = client.post(
            "/api/v1/auth/login",
            json={
                "email_or_phone": "verified@example.com",
                "password": "testpassword123"
            }
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"
    
    def test_login_invalid_credentials(self, client, verified_user):
        """Test login with invalid password"""
        response = client.post(
            "/api/v1/auth/login",
            json={
                "email_or_phone": "verified@example.com",
                "password": "wrongpassword"
            }
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_login_unverified_user(self, client, test_user):
        """Test login with unverified user (should still work)"""
        response = client.post(
            "/api/v1/auth/login",
            json={
                "email_or_phone": "test@example.com",
                "password": "testpassword123"
            }
        )
        # Login should work even if not verified
        assert response.status_code == status.HTTP_200_OK


class TestTokenRefresh:
    """Test token refresh"""
    
    def test_refresh_token_success(self, client, verified_user):
        """Test successful token refresh"""
        # First login
        login_response = client.post(
            "/api/v1/auth/login",
            json={
                "email_or_phone": "verified@example.com",
                "password": "testpassword123"
            }
        )
        refresh_token = login_response.json()["refresh_token"]
        
        # Refresh token
        response = client.post(
            "/api/v1/auth/refresh",
            json={"refresh_token": refresh_token}
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        # New refresh token should be different (token rotation)
        assert data["refresh_token"] != refresh_token
    
    def test_refresh_token_invalid(self, client):
        """Test refresh with invalid token"""
        response = client.post(
            "/api/v1/auth/refresh",
            json={"refresh_token": "invalid_token"}
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


class TestUserProfile:
    """Test user profile endpoints"""
    
    def test_get_current_user(self, client, verified_user):
        """Test getting current user profile"""
        # Login first
        login_response = client.post(
            "/api/v1/auth/login",
            json={
                "email_or_phone": "verified@example.com",
                "password": "testpassword123"
            }
        )
        token = login_response.json()["access_token"]
        
        # Get profile
        response = client.get(
            "/api/v1/auth/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["email"] == "verified@example.com"
        assert data["is_email_verified"] is True
    
    def test_get_current_user_unauthorized(self, client):
        """Test getting profile without token"""
        response = client.get("/api/v1/auth/me")
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_update_profile(self, client, verified_user):
        """Test updating user profile"""
        # Login first
        login_response = client.post(
            "/api/v1/auth/login",
            json={
                "email_or_phone": "verified@example.com",
                "password": "testpassword123"
            }
        )
        token = login_response.json()["access_token"]
        
        # Update profile
        response = client.patch(
            "/api/v1/auth/me",
            headers={"Authorization": f"Bearer {token}"},
            json={"full_name": "Updated Name"}
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["full_name"] == "Updated Name"

