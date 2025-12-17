# ESCROW Backend API

**Freelance Account Marketplace - Escrow Platform Backend**

Complete backend implementation for the ESCROW platform, providing secure authentication, listing management, escrow transactions, and credential vault functionality.

## 📁 Project Structure

```
apps/backend/
├── app/
│   ├── __init__.py
│   ├── main.py                          # FastAPI application entry point
│   │
│   ├── api/                             # API endpoints
│   │   └── v1/
│   │       ├── __init__.py
│   │       ├── router.py                # Main API router (includes all v1 routes)
│   │       ├── auth.py                  # Authentication endpoints (register, login, refresh)
│   │       ├── users.py                 # User profile endpoints
│   │       ├── listings.py              # Seller listing endpoints
│   │       ├── admin_listings.py       # Admin moderation endpoints
│   │       ├── catalog.py              # Public catalog endpoints (read-only)
│   │       ├── transactions.py         # Transaction endpoints (buyer)
│   │       ├── contracts.py            # Contract generation and signing
│   │       ├── credentials.py          # Credential reveal endpoint (one-time)
│   │       ├── admin_transactions.py   # Admin transaction management
│   │       ├── health.py               # Health check and monitoring endpoints
│   │       ├── dependencies.py         # Authentication and authorization dependencies
│   │       └── webhooks/
│   │           ├── __init__.py
│   │           └── paystack.py          # Paystack webhook handler
│   │
│   ├── core/                            # Core application logic
│   │   ├── __init__.py
│   │   ├── config.py                    # Application settings (Pydantic BaseSettings)
│   │   ├── database.py                 # SQLAlchemy engine and session management
│   │   ├── security.py                  # Password hashing, JWT, OTP generation
│   │   ├── otp.py                       # OTP delivery (SMS via Africa's Talking, Email via Resend)
│   │   ├── events.py                    # Audit logging system
│   │   ├── encryption.py                # AES-256-GCM encryption for credentials
│   │   ├── payment.py                   # Paystack payment integration
│   │   ├── payout.py                    # Payout orchestration and commission calculation
│   │   ├── pdf_generator.py             # PDF contract generation (WeasyPrint)
│   │   └── performance.py               # Performance measurement utilities
│   │
│   ├── models/                          # SQLAlchemy database models
│   │   ├── __init__.py
│   │   ├── base.py                      # Base model with timestamps
│   │   ├── user.py                      # User model with roles
│   │   ├── otp_code.py                  # OTP code storage
│   │   ├── refresh_token.py             # JWT refresh token storage
│   │   ├── audit_log.py                 # Immutable audit log
│   │   ├── listing.py                   # Listing model with state machine
│   │   ├── credential_vault.py          # Encrypted credential storage
│   │   ├── listing_proof.py             # Proof file storage
│   │   ├── transaction.py              # Transaction model with escrow states
│   │   ├── contract.py                 # Digital contract storage
│   │   └── payment_event.py            # Payment webhook event tracking
│   │
│   ├── schemas/                         # Pydantic validation schemas
│   │   ├── __init__.py
│   │   ├── auth.py                      # Authentication request/response schemas
│   │   ├── user.py                      # User data schemas
│   │   ├── listing.py                   # Listing operation schemas
│   │   ├── credential.py                # Credential operation schemas
│   │   ├── catalog.py                   # Public catalog schemas
│   │   ├── transaction.py               # Transaction schemas
│   │   ├── contract.py                 # Contract schemas
│   │   └── credential_reveal.py        # Credential reveal schemas
│   │
│   ├── crud/                            # Database CRUD operations
│   │   ├── __init__.py
│   │   ├── user.py                      # User CRUD operations
│   │   ├── listing.py                  # Listing CRUD operations
│   │   ├── refresh_token.py            # Refresh token CRUD
│   │   ├── catalog.py                   # Public catalog queries
│   │   ├── transaction.py               # Transaction CRUD operations
│   │   └── escrow_completion.py        # Escrow completion and payout operations
│   │
│   ├── middleware/                      # Custom middleware
│   │   ├── __init__.py
│   │   ├── rate_limit.py                # Rate limiting middleware
│   │   └── security.py                  # Security headers middleware
│   │
│   ├── utils/                           # Utility functions
│   │   ├── __init__.py
│   │   ├── file_validator.py           # File upload validation
│   │   ├── request_utils.py             # Request helper functions
│   │   └── observability.py             # Logging and error tracking utilities
│   │
│   └── dependencies.py                  # Global FastAPI dependencies
│
├── alembic/                             # Database migrations
│   ├── __init__.py
│   ├── env.py                           # Alembic environment configuration
│   ├── script.py.mako                   # Migration template
│   └── versions/                        # Migration files
│       ├── 20241201_phase1_auth_tables.py
│       ├── 20241216_phase2_listing_tables.py
│       ├── 20241216_phase3_transaction_updates.py
│       ├── 20241216_phase4_payout_fields.py
│       └── 20241216_phase5_performance_indexes.py
│
├── tests/                               # Test suite
│   ├── __init__.py
│   ├── conftest.py                      # Pytest configuration and fixtures
│   └── test_health.py                   # Health check tests
│
├── alembic.ini                          # Alembic configuration
├── pyproject.toml                       # Project configuration (Ruff, Black)
├── requirements.txt                     # Python dependencies
├── README.md                            # This file
├── BETA_LAUNCH_CHECKLIST.md            # Beta launch checklist
└── RUNBOOKS.md                          # Internal runbooks

```

## 🚀 Quick Start

### Prerequisites

- **Python 3.11 - 3.13** (recommended: Python 3.13 for latest features)
- PostgreSQL 16+
- Virtual environment (recommended)

**⚠️ Important**: 
- **Python 3.13** is fully supported with updated dependencies (FastAPI 0.124.4+, Pydantic 2.12.5+)
- **Python 3.14** is **not yet supported** due to compatibility issues with:
  - `pydantic-core` (Rust build failures)
  - `psycopg2-binary` (wheel build failures)
- **Python 3.11** is the minimum supported version

**Verify your Python version:**
```bash
python3 --version
# Should show: Python 3.11.x, 3.12.x, or 3.13.x
```

### Installation

1. **Navigate to backend directory:**
   ```bash
   cd apps/backend
   ```

2. **Create and activate virtual environment with Python 3.13 (recommended) or 3.11:**
   ```bash
   # Use Python 3.13 (recommended) or 3.11
   python3.13 -m venv venv  # or python3.11 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   
   # Verify Python version
   python --version
   # Should show: Python 3.11.x, 3.12.x, or 3.13.x
   ```
   
   **If Python 3.13 is not installed:**
   ```bash
   # macOS (Homebrew) - Python 3.13
   brew install python@3.13
   
   # macOS (Homebrew) - Python 3.11 (minimum)
   brew install python@3.11
   
   # Ubuntu/Debian - Python 3.13
   sudo apt-get install python3.13 python3.13-venv
   
   # Or use pyenv
   pyenv install 3.13.0
   pyenv local 3.13.0
   ```

3. **Verify Python version before installing:**
   ```bash
   python3 check_python_version.py
   # Should show: ✅ Python 3.11.x, 3.12.x, or 3.13.x is compatible
   ```

4. **Upgrade pip and install dependencies:**
   ```bash
   pip install --upgrade pip setuptools wheel
   pip install -r requirements.txt
   ```
   
   **Important**: This installs all required packages including:
   - FastAPI 0.124.4, Uvicorn 0.34.0 (web framework)
   - SQLAlchemy 2.0.36, Alembic 1.14.0 (database)
   - Pydantic 2.12.5 (validation)
   - Cryptography 43.0.3 (encryption)
   - Paystack integration dependencies
   - Testing tools (pytest)
   - Observability (Sentry, Prometheus)

5. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```
   
   **Minimum required variables:**
   ```bash
   DATABASE_URL=postgresql+psycopg2://escrow:password@localhost:5432/escrow_dev
   JWT_SECRET_KEY=your-secret-key-here
   ENCRYPTION_PEPPER=your-encryption-pepper
   ```

6. **Set up PostgreSQL database:**
   ```bash
   # Create database and user
   createdb escrow_dev
   createuser escrow
   # Or use the setup script:
   ./setup_postgresql.sh
   ```

7. **Run database migrations:**
   ```bash
   alembic upgrade head
   ```
   
   This creates all required tables:
   - Users, OTP codes, refresh tokens, audit logs
   - Listings, credential vaults, listing proofs
   - Transactions, contracts, payment events

### Starting the Backend

**Before starting, verify installation:**
```bash
# Run comprehensive test suite
python3 run_all_tests.py
```

**Development mode (with auto-reload):**
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Production mode:**
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

**Using Docker Compose:**
```bash
cd ../../infra
docker-compose up backend
```

**Verify server is running:**
```bash
# Check health endpoint
curl http://localhost:8000/api/v1/health

# Or visit in browser
open http://localhost:8000/docs
```

The API will be available at:
- **API**: http://localhost:8000
- **Swagger Docs**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **Health Check**: http://localhost:8000/api/v1/health
- **Metrics**: http://localhost:8000/api/v1/metrics

## 🧪 Testing

### Run All Tests

**Quick test (verifies all components):**
```bash
python3 run_all_tests.py
```

**Using pytest:**
```bash
pytest tests/ -v
```

**With coverage:**
```bash
pytest tests/ --cov=app --cov-report=html
```

### Test Individual Components

```bash
# Test health endpoints
pytest tests/test_health.py -v

# Test authentication
pytest tests/test_auth.py -v

# Test with specific markers
pytest -m "not slow" -v
```

## 📊 API Endpoints Overview

### Authentication (`/api/v1/auth`)
- `POST /register` - User registration
- `POST /verify-email` - Verify email OTP
- `POST /verify-phone` - Verify phone OTP
- `POST /login` - User login
- `POST /refresh` - Refresh access token
- `POST /logout` - Invalidate refresh token
- `GET /me` - Get current user profile

### Listings (`/api/v1/listings`)
- `POST /` - Create listing (Seller)
- `GET /` - Get my listings (Seller)
- `GET /{id}` - Get listing details (Seller)
- `PATCH /{id}` - Update listing (Seller)
- `POST /{id}/submit` - Submit for review (Seller)
- `POST /{id}/proofs` - Add proof file (Seller)
- `GET /{id}/proofs` - Get listing proofs (Seller)
- `DELETE /{id}` - Delete listing (Seller)

### Admin Listings (`/api/v1/admin/listings`)
- `GET /` - Get listings for review (Admin)
- `GET /{id}` - Get listing details (Admin)
- `POST /{id}/approve` - Approve listing (Admin)
- `POST /{id}/reject` - Reject listing (Admin)
- `POST /{id}/request-info` - Request more info (Admin)
- `POST /{id}/state` - Change listing state (Admin)

### Public Catalog (`/api/v1/catalog`)
- `GET /` - Browse approved listings (Public)
- `GET /{id}` - Get listing details (Public)

### Transactions (`/api/v1/transactions`)
- `POST /` - Initiate purchase (Buyer)
- `GET /` - Get my transactions (Buyer)
- `GET /{id}` - Get transaction details (Buyer)
- `POST /{id}/confirm-access` - Confirm access & trigger payout (Buyer)

### Contracts (`/api/v1/contracts`)
- `POST /{transaction_id}/generate` - Generate contract PDF (Buyer)
- `POST /{transaction_id}/sign` - Sign contract (Buyer)
- `GET /{transaction_id}` - Get contract (Buyer)

### Credentials (`/api/v1/transactions/{id}/reveal`)
- `POST /` - Reveal credentials (one-time only) (Buyer)

### Admin Transactions (`/api/v1/admin/transactions`)
- `GET /` - List all transactions (Super Admin)
- `GET /{id}` - Get transaction details (Super Admin)
- `POST /{id}/release` - Force release funds (Super Admin)
- `POST /{id}/refund` - Process refund (Super Admin)

### Health & Monitoring (`/api/v1/health`)
- `GET /health` - Basic health check
- `GET /health/detailed` - Detailed health with DB check
- `GET /metrics` - Prometheus-compatible metrics
- `GET /readiness` - Kubernetes readiness probe
- `GET /liveness` - Kubernetes liveness probe

### Webhooks (`/api/v1/webhooks/paystack`)
- `POST /` - Paystack webhook handler

## 🔐 Security Features

- **Password Hashing**: Argon2id (memory-hard, side-channel resistant)
- **JWT Authentication**: Access tokens (15 min) + Refresh tokens (30 days)
- **OTP Verification**: Email and SMS verification required
- **Rate Limiting**: Per-endpoint rate limits (slowapi)
- **Security Headers**: HSTS, CSP, X-Frame-Options, etc.
- **Encryption**: AES-256-GCM for credential storage
- **Audit Logging**: Immutable audit trail for all actions
- **Role-Based Access**: Buyer, Seller, Admin, Super Admin

## 🗄️ Database Schema

### Core Tables
- `users` - User accounts with roles
- `otp_codes` - OTP verification codes
- `refresh_tokens` - JWT refresh tokens
- `audit_logs` - Immutable audit trail

### Listing Tables
- `listings` - Freelance account listings
- `credential_vaults` - Encrypted credentials (AES-256-GCM)
- `listing_proofs` - Proof files (screenshots, earnings)

### Transaction Tables
- `transactions` - Escrow transactions with state machine
- `contracts` - Digital contracts (PDF storage)
- `payment_events` - Paystack webhook events

### Enums
- `Role` - User roles (buyer, seller, admin, super_admin)
- `ListingState` - Listing states (draft, under_review, approved, reserved, sold)
- `TransactionState` - Transaction states (pending, funds_held, contract_signed, credentials_released, completed, refunded, disputed)
- `PaymentEventType` - Payment event types
- `ProofType` - Proof file types
- `AuditAction` - Audit log action types

## 🔧 Configuration

Key environment variables (see `.env.example`):

```bash
# Database
DATABASE_URL=postgresql+psycopg2://escrow:password@localhost:5432/escrow_dev

# JWT
JWT_SECRET_KEY=your-secret-key
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=30

# OTP
OTP_LENGTH=6
OTP_EXPIRE_MINUTES=5

# Paystack
PAYSTACK_SECRET_KEY=sk_test_...
PAYSTACK_PUBLIC_KEY=pk_test_...

# Email (Resend)
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=noreply@escrow.com

# SMS (Africa's Talking)
AFRICAS_TALKING_API_KEY=...
AFRICAS_TALKING_USERNAME=...

# Encryption
ENCRYPTION_PEPPER=server-side-pepper

# Platform Commission
PLATFORM_COMMISSION_PERCENT=10

# Observability
SENTRY_DSN=https://...
ENABLE_SENTRY=true
ENVIRONMENT=production
```

## 📈 Performance

- **Database Indexes**: 23 indexes on frequently queried fields
- **Query Optimization**: Optimized joins and filters
- **Caching Ready**: Structure for Redis caching (future)
- **Connection Pooling**: SQLAlchemy connection pooling

## 🐛 Debugging

**Check database connection:**
```bash
python3 test_db_connection.py
```

**Verify migrations:**
```bash
alembic current
alembic history
```

**View API documentation:**
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## 📝 Development Workflow

1. **Create migration:**
   ```bash
   alembic revision --autogenerate -m "description"
   ```

2. **Apply migration:**
   ```bash
   alembic upgrade head
   ```

3. **Run tests:**
   ```bash
   python3 run_all_tests.py
   ```

4. **Start development server:**
   ```bash
   uvicorn app.main:app --reload
   ```

## 🚨 Troubleshooting

**WeasyPrint import error (macOS):**
```bash
# Install WeasyPrint system dependencies
./setup_weasyprint_macos.sh

# Or manually:
brew install cairo pango gdk-pixbuf libffi glib
pip install --force-reinstall weasyprint
```

**Python version error (pydantic-core/psycopg2-binary build failures):**
```bash
# Check Python version
python3 check_python_version.py

# If not Python 3.11-3.13, install Python 3.13 (recommended):
# macOS:
brew install python@3.13
python3.13 -m venv venv
source venv/bin/activate

# Ubuntu/Debian:
sudo apt-get install python3.13 python3.13-venv
python3.13 -m venv venv
source venv/bin/activate

# Or use Python 3.11 (minimum supported):
# macOS:
brew install python@3.11
python3.11 -m venv venv
source venv/bin/activate

# Then reinstall dependencies
pip install --upgrade pip setuptools wheel
pip install -r requirements.txt
```

**ModuleNotFoundError:**
```bash
# Ensure you're in the virtual environment
source venv/bin/activate

# Upgrade pip first
pip install --upgrade pip setuptools wheel

# Install dependencies
pip install -r requirements.txt
```

**Database connection error:**
- Check PostgreSQL is running: `pg_isready`
- Verify DATABASE_URL in .env
- Check database exists: `psql -l | grep escrow`

**Migration errors:**
- Check current migration: `alembic current`
- Rollback if needed: `alembic downgrade -1`
- Re-apply: `alembic upgrade head`

**Port already in use:**
```bash
# Find process using port 8000
lsof -i :8000
# Kill process
kill -9 <PID>
```

## 📚 Additional Documentation

- **Beta Launch Checklist**: `BETA_LAUNCH_CHECKLIST.md`
- **Internal Runbooks**: `RUNBOOKS.md`
- **Development Guide**: `../../DEVELOPMENT.md`
- **Testing Guide**: `../../TESTING_AND_DEBUGGING.md`

## 🔗 Related Projects

- **Frontend**: `apps/frontend/` (Next.js 15 + TypeScript)
- **Infrastructure**: `infra/` (Docker Compose, deployment configs)

## 📄 License

Proprietary - ESCROW Platform

---

**Version**: 1.0.0  
**Last Updated**: December 2025  
**Status**: Production Ready (Beta Launch Phase)

