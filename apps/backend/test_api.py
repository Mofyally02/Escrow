"""
Test script for Phase 1 Authentication API
Tests all endpoints to ensure everything works correctly.
"""
import requests
import json
from datetime import datetime

BASE_URL = "http://localhost:8000"
API_BASE = f"{BASE_URL}/api/v1"

# Test data
test_email = f"test_{int(datetime.now().timestamp())}@example.com"
test_phone = f"+1234567890{int(datetime.now().timestamp()) % 10000}"
test_password = "Test1234"
test_full_name = "Test User"

print("=" * 60)
print("ESCROW Phase 1 API Testing")
print("=" * 60)
print()

# Test 1: Health Check
print("1. Testing Health Check...")
try:
    response = requests.get(f"{BASE_URL}/health", timeout=5)
    if response.status_code == 200:
        print(f"   ✅ Health check passed: {response.json()}")
    else:
        print(f"   ❌ Health check failed: {response.status_code}")
except Exception as e:
    print(f"   ❌ Health check error: {str(e)}")
    print("   ⚠️  Make sure the server is running: uvicorn app.main:app --reload")
    exit(1)

print()

# Test 2: API Docs
print("2. Testing API Documentation...")
try:
    response = requests.get(f"{BASE_URL}/docs", timeout=5)
    if response.status_code == 200:
        print(f"   ✅ Swagger docs accessible")
    else:
        print(f"   ⚠️  Swagger docs returned: {response.status_code}")
except Exception as e:
    print(f"   ⚠️  Could not access docs: {str(e)}")

print()

# Test 3: Register User
print("3. Testing User Registration...")
print(f"   Email: {test_email}")
print(f"   Phone: {test_phone}")
try:
    register_data = {
        "email": test_email,
        "phone": test_phone,
        "password": test_password,
        "full_name": test_full_name
    }
    response = requests.post(
        f"{API_BASE}/auth/register",
        json=register_data,
        timeout=10
    )
    if response.status_code == 201:
        result = response.json()
        print(f"   ✅ Registration successful: {result.get('message')}")
        print(f"   ℹ️  In dev mode, check server logs for OTP codes")
    else:
        print(f"   ❌ Registration failed: {response.status_code}")
        print(f"   Response: {response.text}")
except Exception as e:
    print(f"   ❌ Registration error: {str(e)}")

print()

# Test 4: Get OTP from logs (in dev mode, OTPs are logged)
print("4. OTP Verification Test...")
print("   ⚠️  In development mode, OTP codes are logged to console.")
print("   ⚠️  Check the server logs for the OTP codes.")
print("   ⚠️  For this test, we'll skip OTP verification.")
print("   ℹ️  In production with configured providers, OTPs are sent via email/SMS")

print()

# Test 5: Login (will fail if email/phone not verified, but tests the endpoint)
print("5. Testing Login Endpoint...")
try:
    login_data = {
        "email_or_phone": test_email,
        "password": test_password
    }
    response = requests.post(
        f"{API_BASE}/auth/login",
        json=login_data,
        timeout=10
    )
    if response.status_code == 200:
        result = response.json()
        print(f"   ✅ Login successful!")
        print(f"   ✅ Access token received: {result.get('access_token')[:20]}...")
        print(f"   ✅ Refresh token received: {result.get('refresh_token')[:20]}...")
        access_token = result.get('access_token')
        refresh_token = result.get('refresh_token')
    elif response.status_code == 401:
        print(f"   ⚠️  Login failed (expected if email/phone not verified)")
        print(f"   Response: {response.json().get('detail')}")
        access_token = None
        refresh_token = None
    else:
        print(f"   ❌ Login failed: {response.status_code}")
        print(f"   Response: {response.text}")
        access_token = None
        refresh_token = None
except Exception as e:
    print(f"   ❌ Login error: {str(e)}")
    access_token = None
    refresh_token = None

print()

# Test 6: Get Current User (if logged in)
if access_token:
    print("6. Testing Get Current User...")
    try:
        headers = {"Authorization": f"Bearer {access_token}"}
        response = requests.get(
            f"{API_BASE}/auth/me",
            headers=headers,
            timeout=10
        )
        if response.status_code == 200:
            user = response.json()
            print(f"   ✅ User profile retrieved:")
            print(f"      - ID: {user.get('id')}")
            print(f"      - Email: {user.get('email')}")
            print(f"      - Name: {user.get('full_name')}")
            print(f"      - Role: {user.get('role')}")
        else:
            print(f"   ❌ Get user failed: {response.status_code}")
            print(f"   Response: {response.text}")
    except Exception as e:
        print(f"   ❌ Get user error: {str(e)}")
else:
    print("6. Skipping Get Current User (not logged in)")

print()

# Test 7: Refresh Token (if we have a refresh token)
if refresh_token:
    print("7. Testing Token Refresh...")
    try:
        refresh_data = {"refresh_token": refresh_token}
        response = requests.post(
            f"{API_BASE}/auth/refresh",
            json=refresh_data,
            timeout=10
        )
        if response.status_code == 200:
            result = response.json()
            print(f"   ✅ Token refresh successful!")
            print(f"   ✅ New access token received")
        else:
            print(f"   ❌ Token refresh failed: {response.status_code}")
            print(f"   Response: {response.text}")
    except Exception as e:
        print(f"   ❌ Token refresh error: {str(e)}")
else:
    print("7. Skipping Token Refresh (no refresh token)")

print()

# Test 8: Test Invalid Login
print("8. Testing Invalid Login (Security Test)...")
try:
    invalid_login = {
        "email_or_phone": test_email,
        "password": "WrongPassword123"
    }
    response = requests.post(
        f"{API_BASE}/auth/login",
        json=invalid_login,
        timeout=10
    )
    if response.status_code == 401:
        print(f"   ✅ Invalid login correctly rejected")
    else:
        print(f"   ⚠️  Unexpected response: {response.status_code}")
except Exception as e:
    print(f"   ❌ Error: {str(e)}")

print()

# Test 9: Test Rate Limiting (if applicable)
print("9. Testing Rate Limiting...")
print("   ℹ️  Rate limiting is configured but may not be visible in single requests")
print("   ℹ️  Try making multiple rapid requests to test rate limiting")

print()

print("=" * 60)
print("Testing Complete!")
print("=" * 60)
print()
print("Next Steps:")
print("1. Check server logs for OTP codes (in dev mode)")
print("2. Verify email and phone with OTP codes")
print("3. Test full authentication flow")
print("4. Review audit logs in database")
print()

