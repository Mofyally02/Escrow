# ESCROW Testing & Debugging Guide

**Complete guide for testing, debugging, and troubleshooting the ESCROW platform**

---

## Table of Contents

1. [Testing Overview](#testing-overview)
2. [Backend Testing](#backend-testing)
3. [Frontend Testing](#frontend-testing)
4. [Database Testing](#database-testing)
5. [API Testing](#api-testing)
6. [Common Issues & Solutions](#common-issues--solutions)
7. [Debugging Procedures](#debugging-procedures)

---

## Testing Overview

### Test Types

- **Unit Tests**: Individual components and functions
- **Integration Tests**: API endpoints and database operations
- **End-to-End Tests**: Complete user flows
- **Security Tests**: Authentication, authorization, rate limiting

### Test Coverage Goals

- Backend: 80%+ coverage
- Critical paths: 100% coverage
- Authentication flows: 100% coverage

---

## Backend Testing

### Quick Component Test

**Script:** `apps/backend/quick_test.sh`

Tests:
- Model imports
- Server import
- Security utilities
- Database table creation

```bash
cd apps/backend
bash quick_test.sh
```

**Expected Output:**
```
✅ Models imported successfully
✅ Server imports successfully
✅ 15 routes configured
✅ Password hashing works
✅ OTP generation works
```

### Database Connection Test

**Script:** `apps/backend/test_db_connection.py`

Tests:
- Database connection
- Table existence
- Enum existence

```bash
cd apps/backend
python3 test_db_connection.py
```

**Expected Output:**
```
✅ Database connection successful
✅ Found 5 tables
✅ All required auth tables present!
✅ Found 3 enums
```

### Unit Tests

**Location:** `apps/backend/tests/`

**Run Tests:**
```bash
cd apps/backend
pytest tests/ -v
```

**Test Files:**
- `test_health.py` - Health check endpoint
- `test_auth.py` - Authentication endpoints (to be implemented)

**Example Test:**
```python
def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"
```

### Integration Tests

**Test API Endpoints:**
```bash
cd apps/backend
python3 test_api.py
```

Tests:
- Health check
- User registration
- OTP verification
- Login
- Token refresh
- Get current user

---

## Frontend Testing

### Development Server

**Start Server:**
```bash
cd apps/frontend
npm run dev
```

**Verify:**
- http://localhost:3000 loads
- http://localhost:3000/api/health returns OK

### Type Checking

```bash
cd apps/frontend
npm run type-check
```

### Linting

```bash
cd apps/frontend
npm run lint
```

---

## Database Testing

### Verify PostgreSQL is Running

```bash
pg_isready -h localhost -p 5432
```

**Expected:** `localhost:5432 - accepting connections`

### Check Database Connection

```bash
psql -U escrow -d escrow_dev -c "SELECT version();"
```

### List Tables

```bash
psql -U escrow -d escrow_dev -c "\dt"
```

**Expected Tables:**
- users
- otp_codes
- refresh_tokens
- audit_logs
- alembic_version

### Verify Table Structure

```bash
# Check users table
psql -U escrow -d escrow_dev -c "\d users"

# Check indexes
psql -U escrow -d escrow_dev -c "\di"

# Check enums
psql -U escrow -d escrow_dev -c "SELECT typname FROM pg_type WHERE typname IN ('role', 'otptype', 'auditaction');"
```

### Test Migration

```bash
cd apps/backend

# Check current migration
alembic current

# Verify migration file
python3 verify_migration.py
```

---

## API Testing

### Using Swagger UI

**Access:** http://localhost:8000/docs

**Steps:**
1. Start backend server
2. Open Swagger UI in browser
3. Click on endpoint to expand
4. Click "Try it out"
5. Fill in request body
6. Click "Execute"
7. Review response

### Using curl

**1. Health Check:**
```bash
curl http://localhost:8000/health
```

**2. Register User:**
```bash
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "phone": "+1234567890",
    "password": "Test1234",
    "full_name": "Test User"
  }'
```

**Expected Response:**
```json
{
  "message": "Registration successful. Please verify your email and phone with the OTP codes sent.",
  "success": true
}
```

**Note:** In development mode, OTP codes are logged to server console.

**3. Verify Email OTP:**
```bash
curl -X POST http://localhost:8000/api/v1/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "code": "123456"
  }'
```

Replace `123456` with actual OTP from server logs.

**4. Verify Phone OTP:**
```bash
curl -X POST http://localhost:8000/api/v1/auth/verify-phone \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+1234567890",
    "code": "123456"
  }'
```

**5. Login:**
```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email_or_phone": "test@example.com",
    "password": "Test1234"
  }'
```

**Expected Response:**
```json
{
  "access_token": "eyJ...",
  "refresh_token": "abc123...",
  "token_type": "bearer",
  "expires_in": 900
}
```

**6. Get Current User:**
```bash
curl -X GET http://localhost:8000/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**7. Refresh Token:**
```bash
curl -X POST http://localhost:8000/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_token": "YOUR_REFRESH_TOKEN"
  }'
```

**8. Logout:**
```bash
curl -X POST http://localhost:8000/api/v1/auth/logout \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_token": "YOUR_REFRESH_TOKEN"
  }'
```

### Automated API Tests

**Script:** `apps/backend/test_api.py`

```bash
cd apps/backend
python3 test_api.py
```

Tests all endpoints automatically:
- Health check
- User registration
- OTP verification
- Login
- Token refresh
- Get current user
- Security features

---

## Common Issues & Solutions

### Issue: PostgreSQL Connection Refused

**Error:**
```
psycopg2.OperationalError: connection to server at "localhost" (127.0.0.1), port 5432 failed: Connection refused
```

**Solutions:**

1. **Check if PostgreSQL is running:**
   ```bash
   pg_isready -h localhost -p 5432
   ```

2. **Start PostgreSQL:**
   ```bash
   # macOS
   brew services start postgresql@14
   # Or
   pg_ctl -D /usr/local/var/postgresql@14 start
   
   # Docker
   cd infra && docker-compose up -d postgres
   ```

3. **Check PostgreSQL status:**
   ```bash
   pg_ctl -D /usr/local/var/postgresql@14 status
   ```

4. **Restart PostgreSQL:**
   ```bash
   pg_ctl -D /usr/local/var/postgresql@14 restart
   ```

### Issue: Database Does Not Exist

**Error:**
```
psycopg2.OperationalError: database "escrow_dev" does not exist
```

**Solution:**
```bash
# Create database
psql -U postgres -c "CREATE DATABASE escrow_dev;"

# Create user
psql -U postgres -c "CREATE USER escrow WITH PASSWORD 'escrow_dev_password';"

# Grant privileges
psql -U postgres -d escrow_dev -c "GRANT ALL PRIVILEGES ON DATABASE escrow_dev TO escrow;"
psql -U postgres -d escrow_dev -c "GRANT ALL ON SCHEMA public TO escrow;"
```

### Issue: Migration Fails

**Error:**
```
alembic.util.exc.CommandError: Target database is not up to date
```

**Solutions:**

1. **Check current migration:**
   ```bash
   alembic current
   ```

2. **Apply migrations:**
   ```bash
   alembic upgrade head
   ```

3. **If tables exist but migration tracking is missing:**
   ```bash
   # Stamp the database with current migration
   alembic stamp head
   ```

### Issue: Module Not Found

**Error:**
```
ModuleNotFoundError: No module named 'slowapi'
```

**Solution:**
```bash
cd apps/backend
pip install -r requirements.txt
```

### Issue: Argon2 Backend Missing

**Error:**
```
passlib.exc.MissingBackendError: argon2: no backends available
```

**Solution:**
```bash
pip install argon2-cffi
```

### Issue: Rate Limit Exceeded

**Error:**
```
429 Too Many Requests
```

**Solution:**
- Wait 1 minute and try again
- Rate limits: 3 requests/minute for auth endpoints
- This is a security feature, not a bug

### Issue: Account Locked

**Error:**
```
Account is locked. Please try again later.
```

**Solution:**
- Account locks after 5 failed login attempts
- Lockout duration: 30 minutes
- Wait for lockout to expire or contact admin

### Issue: OTP Codes Not Received

**In Development Mode:**
- OTP codes are logged to server console
- Check server logs for OTP codes
- Not sent via email/SMS in dev mode

**In Production:**
- Configure OTP providers in `.env`:
  - `RESEND_API_KEY` for email
  - `AFRICAS_TALKING_API_KEY` for SMS

### Issue: CORS Errors

**Error:**
```
Access to fetch at 'http://localhost:8000/api/v1/auth/register' from origin 'http://localhost:3000' has been blocked by CORS policy
```

**Solution:**
- Check `CORS_ORIGINS` in backend `.env`
- Ensure frontend URL is included:
  ```
  CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
  ```

---

## Debugging Procedures

### Backend Debugging

**1. Enable Debug Mode:**
```env
DEBUG=true
ENVIRONMENT=development
```

**2. Check Server Logs:**
- Server logs show all requests
- OTP codes logged in dev mode
- Errors include stack traces

**3. Database Debugging:**
```bash
# Check database connection
python3 test_db_connection.py

# Check tables
psql -U escrow -d escrow_dev -c "\dt"

# Check recent audit logs
psql -U escrow -d escrow_dev -c "SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 10;"
```

**4. API Debugging:**
- Use Swagger UI for interactive testing
- Check response status codes
- Review error messages
- Check audit logs for security events

### Frontend Debugging

**1. Browser DevTools:**
- Network tab: Check API requests
- Console: Check for errors
- Application tab: Check localStorage/sessionStorage

**2. Check API Connection:**
```bash
# Test API from frontend
curl http://localhost:8000/health
```

**3. Environment Variables:**
- Check `.env.local` exists
- Verify `NEXT_PUBLIC_API_BASE_URL` is set
- Restart dev server after changing env vars

### Database Debugging

**1. Check PostgreSQL Status:**
```bash
pg_ctl -D /usr/local/var/postgresql@14 status
```

**2. View Server Logs:**
```bash
tail -f /usr/local/var/postgresql@14/server.log
```

**3. Check Connection:**
```bash
psql -U escrow -d escrow_dev -c "SELECT 1;"
```

**4. Verify Tables:**
```bash
psql -U escrow -d escrow_dev -c "\d+ users"
```

### Migration Debugging

**1. Check Migration Status:**
```bash
alembic current
alembic history
```

**2. Verify Migration File:**
```bash
python3 verify_migration.py
```

**3. Test Migration:**
```bash
# Dry run (offline mode)
alembic upgrade head --sql
```

---

## Testing Checklist

### Pre-Deployment Testing

- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] Database migrations work
- [ ] API endpoints respond correctly
- [ ] Authentication flows work
- [ ] Rate limiting works
- [ ] Account lockout works
- [ ] OTP delivery works (in production)
- [ ] Audit logging works
- [ ] CORS configured correctly
- [ ] Environment variables set
- [ ] PostgreSQL connection stable

### Security Testing

- [ ] Password hashing works (Argon2)
- [ ] JWT tokens expire correctly
- [ ] Refresh token rotation works
- [ ] OTP expiration works
- [ ] Account lockout works
- [ ] Rate limiting works
- [ ] Audit logs capture all events
- [ ] SQL injection protection (SQLAlchemy)
- [ ] XSS protection (input validation)

---

## Debug Tools

### Backend

**Scripts:**
- `quick_test.sh` - Quick component test
- `test_db_connection.py` - Database connection test
- `test_api.py` - API endpoint test
- `verify_migration.py` - Migration verification

**Commands:**
```bash
# Check server
curl http://localhost:8000/health

# Check database
psql -U escrow -d escrow_dev -c "\dt"

# Check migrations
alembic current
```

### Frontend

**Commands:**
```bash
# Type check
npm run type-check

# Lint
npm run lint

# Build test
npm run build
```

---

## Performance Testing

### Load Testing

**Using Apache Bench:**
```bash
# Test registration endpoint
ab -n 100 -c 10 -p register.json -T application/json http://localhost:8000/api/v1/auth/register
```

### Database Performance

**Check Query Performance:**
```sql
-- Enable query timing
\timing

-- Test query
SELECT * FROM users WHERE email = 'test@example.com';
```

**Check Indexes:**
```sql
-- List indexes
\di

-- Check index usage
SELECT * FROM pg_stat_user_indexes;
```

---

## Troubleshooting Workflow

1. **Identify the Issue**
   - Check error message
   - Check server logs
   - Check database logs

2. **Reproduce the Issue**
   - Test with minimal data
   - Check if issue is consistent
   - Note exact steps to reproduce

3. **Check Common Issues**
   - Review this guide
   - Check environment variables
   - Verify services are running

4. **Debug Step by Step**
   - Test individual components
   - Check database state
   - Verify API responses

5. **Fix and Verify**
   - Apply fix
   - Test again
   - Verify related functionality

---

**Last Updated**: December 2025  
**Status**: Active - Updated with Phase 1 testing procedures

