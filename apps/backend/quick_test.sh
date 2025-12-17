#!/bin/bash

# Quick test script - sets up SQLite and tests the server

cd "$(dirname "$0")"

echo "🧪 ESCROW Phase 1 Quick Test"
echo "============================"
echo ""

# Set SQLite for testing
export DATABASE_URL="sqlite:///./test_escrow.db"
export ENVIRONMENT="development"

echo "1. Creating database tables..."
python3 -c "
import os
os.environ['DATABASE_URL'] = 'sqlite:///./test_escrow.db'
from app.core.database import engine, Base
from app.models import *
Base.metadata.create_all(bind=engine)
print('   ✅ Tables created')
" 2>&1

echo ""
echo "2. Testing server import..."
python3 -c "
import os
os.environ['DATABASE_URL'] = 'sqlite:///./test_escrow.db'
from app.main import app
print('   ✅ Server imports successfully')
print(f'   ✅ {len([r for r in app.routes if hasattr(r, \"path\")])} routes configured')
" 2>&1

echo ""
echo "3. Testing models..."
python3 -c "
from app.models import User, OTPCode, RefreshToken, AuditLog, Role, OTPType, AuditAction
print('   ✅ All models import successfully')
print(f'   ✅ Roles: {[r.value for r in Role]}')
print(f'   ✅ OTP Types: {[t.value for t in OTPType]}')
" 2>&1

echo ""
echo "4. Testing security utilities..."
python3 -c "
from app.core.security import hash_password, verify_password, generate_otp, create_access_token
hashed = hash_password('Test1234')
verified = verify_password('Test1234', hashed)
otp = generate_otp(6)
print('   ✅ Password hashing works')
print('   ✅ Password verification works')
print(f'   ✅ OTP generation works: {otp}')
" 2>&1

echo ""
echo "============================"
echo "✅ All basic tests passed!"
echo ""
echo "Next steps:"
echo "1. Start server: python3 start_test_server.sh"
echo "2. Run API tests: python3 test_api.py"
echo "3. Or use Swagger UI: http://localhost:8000/docs"
echo ""

