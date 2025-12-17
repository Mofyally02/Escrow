# ESCROW Development Guide

**Complete step-by-step guide for building the ESCROW platform**

This document covers the complete development process from foundation setup through all phases.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Phase 0: Foundation Setup](#phase-0-foundation-setup)
3. [Phase 1: Authentication & Identity Verification](#phase-1-authentication--identity-verification)
4. [Database Setup & Configuration](#database-setup--configuration)
5. [Backend Architecture](#backend-architecture)
6. [Frontend Architecture](#frontend-architecture)
7. [Environment Configuration](#environment-configuration)
8. [Development Workflow](#development-workflow)

---

## Project Overview

ESCROW is a trust-first, admin-moderated escrow marketplace for buying and selling established freelance accounts (Upwork, Fiverr, Freelancer.com, etc.).

### Tech Stack

**Frontend:**
- Next.js 15 (App Router)
- TypeScript 5
- Tailwind CSS 3.4

**Backend:**
- Python 3.12
- FastAPI 0.115
- SQLAlchemy 2.0
- Alembic (migrations)
- PostgreSQL 16

**Infrastructure:**
- Docker & Docker Compose
- GitHub Actions (CI/CD)
- Cloudflare (deployment target)

**Payment Providers:**
- Paystack (primary)
- M-Pesa Till (planned)

---

## Phase 0: Foundation Setup

### Completed: December 2025

#### 1. Monorepo Structure

Created monorepo with Turborepo for efficient development:

```
Escrow/
├── apps/
│   ├── frontend/          # Next.js 15 App Router
│   └── backend/           # FastAPI Python
├── infra/                 # Docker & deployment configs
├── scripts/               # Development helpers
├── .github/workflows/     # CI/CD pipelines
└── README.md
```

#### 2. Frontend Setup (Next.js 15)

**Location:** `apps/frontend/`

**Created:**
- TypeScript configuration (`tsconfig.json`)
- Tailwind CSS setup (`tailwind.config.ts`, `postcss.config.js`)
- App Router structure (`app/` directory)
- Basic health check endpoint
- API client utilities (`lib/api.ts`)

**Key Files:**
- `app/layout.tsx` - Root layout
- `app/page.tsx` - Home page
- `app/globals.css` - Global styles
- `next.config.mjs` - Next.js configuration

#### 3. Backend Setup (FastAPI)

**Location:** `apps/backend/`

**Created:**
- FastAPI application structure
- SQLAlchemy 2.0 models
- Alembic migrations configured
- Core configuration system
- Database connection setup
- Health check endpoint

**Project Structure:**
```
apps/backend/
├── app/
│   ├── api/v1/           # API routes
│   ├── core/              # Config, security, database
│   ├── models/            # SQLAlchemy models
│   ├── schemas/           # Pydantic schemas
│   ├── crud/              # Database operations
│   ├── utils/              # Helpers
│   └── main.py            # FastAPI app entry
├── alembic/               # Database migrations
└── tests/                 # Test suite
```

#### 4. Docker Configuration

**Location:** `infra/`

**Created:**
- `docker-compose.yml` - Full Docker setup with PostgreSQL, backend, frontend
- `Dockerfile.backend` - Multi-stage backend image
- `Dockerfile.frontend` - Multi-stage frontend image

**Services:**
- PostgreSQL 16 (port 5432)
- Backend API (port 8000)
- Frontend (port 3000)

#### 5. CI/CD Pipeline

**Location:** `.github/workflows/ci.yml`

**Configured:**
- Frontend linting and type checking
- Backend linting (ruff, black, mypy)
- Docker image builds
- Test execution

#### 6. Initial Database Models

**Created Models:**
- `User` - User accounts with roles
- `Listing` - Account listings
- `CredentialVault` - Encrypted credentials
- `Transaction` - Escrow payments
- `Contract` - Digital contracts

**Base Model:**
- `Timestamped` - Base class with id, created_at, updated_at

---

## Phase 1: Authentication & Identity Verification

### Completed: December 2025

#### 1. Database Models

**Location:** `apps/backend/app/models/`

**Created/Updated:**

**User Model** (`user.py`):
- Email, phone, password (hashed)
- Role enum (buyer, seller, admin, super_admin)
- Verification status (email, phone)
- Security fields (failed_login_attempts, account_locked_until, last_login_at)
- Relationships to OTP codes, refresh tokens, audit logs

**OTPCode Model** (`otp_code.py`):
- User ID, code (6 digits)
- OTP type (email, phone)
- Expiration, usage tracking
- Attempt counter

**RefreshToken Model** (`refresh_token.py`):
- User ID, token (unique)
- Expiration, revocation status
- Device info, IP address tracking

**AuditLog Model** (`audit_log.py`):
- User ID (nullable for failed logins)
- Action enum (16 action types)
- IP address, user agent
- Details (JSON), success status

#### 2. Security Utilities

**Location:** `apps/backend/app/core/security.py`

**Implemented:**
- **Argon2 Password Hashing** - GPU-resistant password hashing
- **JWT Token Generation** - Access tokens (15 min) + Refresh tokens (30 days)
- **OTP Generation** - 6-digit secure random codes
- **Token Verification** - Secure JWT verification with type checking

**Key Functions:**
- `hash_password()` - Argon2 hashing
- `verify_password()` - Password verification
- `create_access_token()` - JWT access token
- `create_refresh_token()` - Secure random refresh token
- `verify_token()` - JWT verification

#### 3. OTP Delivery Service

**Location:** `apps/backend/app/core/otp.py`

**Implemented:**
- **Email OTP**: Resend.com (primary) + SMTP fallback
- **SMS OTP**: Africa's Talking (primary) + Twilio fallback
- **Development Mode**: Logs OTP codes instead of sending

**Key Methods:**
- `send_email_otp()` - Send email via Resend or SMTP
- `send_sms_otp()` - Send SMS via Africa's Talking or Twilio

#### 4. Audit Logging System

**Location:** `apps/backend/app/core/events.py`

**Implemented:**
- Immutable audit trail for all security events
- 16 action types tracked
- IP address and user agent logging
- Success/failure tracking

**Key Methods:**
- `log_register()` - User registration
- `log_login()` - Successful login
- `log_login_failed()` - Failed login attempts
- `log_otp_sent()` - OTP delivery
- `log_otp_verified()` - OTP verification
- `log_account_locked()` - Account lockout

#### 5. Authentication API Endpoints

**Location:** `apps/backend/app/api/v1/auth.py`

**Endpoints:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | User registration with OTP |
| POST | `/api/v1/auth/verify-email` | Email OTP verification |
| POST | `/api/v1/auth/verify-phone` | Phone OTP verification |
| POST | `/api/v1/auth/login` | Login with credentials |
| POST | `/api/v1/auth/refresh` | Refresh access token |
| POST | `/api/v1/auth/logout` | Logout and revoke token |
| GET | `/api/v1/auth/me` | Get current user profile |
| PATCH | `/api/v1/auth/me` | Update user profile |

**Features:**
- Rate limiting on all auth endpoints (3 requests/minute)
- Account lockout after 5 failed login attempts
- OTP expiration (5 minutes)
- OTP attempt limiting (3 max attempts)
- Comprehensive error handling

#### 6. Role-Based Access Control

**Location:** `apps/backend/app/api/v1/dependencies.py`

**Implemented:**
- `get_current_user` - JWT authentication dependency
- `require_role()` - Factory for role-based access control
- Pre-configured dependencies:
  - `require_admin` - Admin or Super Admin
  - `require_super_admin` - Super Admin only
  - `require_seller` - Seller, Admin, or Super Admin
  - `require_buyer` - All roles

#### 7. Pydantic Schemas

**Location:** `apps/backend/app/schemas/`

**Created:**
- `auth.py` - Register, login, verify, token responses
- `user.py` - User creation, update, response schemas
- `token.py` - Token response schemas

**Validation:**
- Password strength (min 8 chars, uppercase, lowercase, digit)
- Email format validation
- Phone number format validation
- OTP code format (6 digits)

#### 8. CRUD Operations

**Location:** `apps/backend/app/crud/user.py`

**Implemented:**
- `get_user_by_id()` - Get user by ID
- `get_user_by_email()` - Get user by email
- `get_user_by_phone()` - Get user by phone
- `get_user_by_email_or_phone()` - Flexible lookup
- `create_user()` - Create new user
- `update_user()` - Update user information
- `increment_failed_login_attempts()` - Track failed logins
- `lock_user_account()` - Lock account after max attempts
- `verify_email()` / `verify_phone()` - Mark as verified

---

## Database Setup & Configuration

### PostgreSQL Configuration

**Status:** ✅ Configured and Running

**Database Details:**
- **Database**: `escrow_dev`
- **User**: `escrow`
- **Password**: `escrow_dev_password`
- **Host**: `localhost` (or `postgres` for Docker)
- **Port**: `5432`

**Connection String:**
```
postgresql+psycopg2://escrow:escrow_dev_password@localhost:5432/escrow_dev
```

### Database Migration

**Migration File:** `apps/backend/alembic/versions/20241201_phase1_auth_tables.py`

**Revision ID:** `phase1_auth_001`

**Tables Created:**
1. **users** - User accounts (12 columns)
   - Email (unique), phone (unique)
   - Password (hashed), full_name
   - Role enum, verification status
   - Security fields

2. **otp_codes** - OTP verification (8 columns)
   - User ID, code, type (email/phone)
   - Expiration, usage tracking

3. **refresh_tokens** - JWT refresh tokens (9 columns)
   - User ID, token (unique)
   - Expiration, revocation
   - Device info, IP address

4. **audit_logs** - Security audit trail (9 columns)
   - User ID, action enum
   - IP address, user agent
   - Details, success status

**Enums Created:**
- `role`: buyer, seller, admin, super_admin
- `otptype`: email, phone
- `auditaction`: 16 action types

**Indexes:**
- `ix_users_email` (unique)
- `ix_users_phone` (unique)
- `ix_otp_codes_user_id`
- `ix_refresh_tokens_token` (unique)
- `ix_audit_logs_user_id`
- `ix_audit_logs_action`

### Running Migrations

```bash
cd apps/backend

# Check current migration status
alembic current

# Apply all pending migrations
alembic upgrade head

# Create new migration
alembic revision --autogenerate -m "description"

# Rollback one migration
alembic downgrade -1
```

### Starting PostgreSQL

**Option 1: Local PostgreSQL (macOS)**
```bash
# Start PostgreSQL 14
brew services start postgresql@14

# Or manually
pg_ctl -D /usr/local/var/postgresql@14 start
```

**Option 2: Docker Compose**
```bash
cd infra
docker-compose up -d postgres
```

**Option 3: Setup Script**
```bash
cd apps/backend
./setup_postgresql.sh
```

### Verifying Database

```bash
# Check PostgreSQL is running
pg_isready -h localhost -p 5432

# Connect to database
psql -U escrow -d escrow_dev

# List tables
\dt

# Describe table
\d users
```

---

## Backend Architecture

### Project Structure

```
apps/backend/
├── app/
│   ├── api/v1/              # API version 1 routes
│   │   ├── auth.py          # Authentication endpoints
│   │   ├── users.py         # User profile endpoints
│   │   ├── dependencies.py  # Auth dependencies
│   │   └── router.py        # Router aggregation
│   ├── core/                 # Core functionality
│   │   ├── config.py        # Settings (Pydantic)
│   │   ├── database.py      # Database connection
│   │   ├── security.py      # Password, JWT, OTP
│   │   ├── otp.py           # OTP delivery service
│   │   └── events.py        # Audit logging
│   ├── models/               # SQLAlchemy models
│   │   ├── base.py          # Base model (Timestamped)
│   │   ├── user.py          # User model
│   │   ├── otp_code.py      # OTP model
│   │   ├── refresh_token.py # Refresh token model
│   │   └── audit_log.py     # Audit log model
│   ├── schemas/              # Pydantic schemas
│   │   ├── auth.py          # Auth request/response
│   │   └── user.py          # User schemas
│   ├── crud/                 # Database operations
│   │   └── user.py          # User CRUD
│   ├── utils/                # Utilities
│   └── main.py               # FastAPI app
├── alembic/                   # Database migrations
│   ├── env.py
│   └── versions/
├── tests/                     # Test suite
└── requirements.txt           # Dependencies
```

### Key Components

**1. FastAPI Application** (`app/main.py`)
- CORS middleware
- Rate limiting (slowapi)
- API router inclusion
- Health check endpoint

**2. Database Connection** (`app/core/database.py`)
- SQLAlchemy engine with connection pooling
- PostgreSQL enforcement (SQLite only for testing)
- Session management

**3. Configuration** (`app/core/config.py`)
- Pydantic BaseSettings
- Environment variable loading
- Default values for development

**4. Security** (`app/core/security.py`)
- Argon2 password hashing
- JWT token generation/verification
- OTP generation

**5. OTP Service** (`app/core/otp.py`)
- Email delivery (Resend/SMTP)
- SMS delivery (Africa's Talking/Twilio)
- Development mode logging

**6. Audit Logging** (`app/core/events.py`)
- Immutable event logging
- IP address tracking
- User agent tracking
- Success/failure tracking

---

## Frontend Architecture

### Project Structure

```
apps/frontend/
├── app/                      # Next.js App Router
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Home page
│   ├── globals.css          # Global styles
│   └── api/                 # API routes (proxy)
│       └── health/          # Health check
├── lib/                      # Utilities
│   └── api.ts               # API client
├── components/               # React components (future)
├── public/                   # Static assets
└── package.json
```

### Key Components

**1. Next.js Configuration** (`next.config.mjs`)
- React strict mode
- Environment variables
- API base URL configuration

**2. TypeScript Configuration** (`tsconfig.json`)
- Strict mode enabled
- Path aliases (`@/*`)
- Next.js plugin

**3. Tailwind CSS** (`tailwind.config.ts`)
- Content paths configured
- Custom theme (future)

**4. API Client** (`lib/api.ts`)
- Fetch wrapper
- Error handling
- Type-safe requests

---

## Environment Configuration

### Backend Environment Variables

**File:** `apps/backend/.env`

```env
# Application
ENVIRONMENT=development
DEBUG=true

# Database (PostgreSQL required)
DATABASE_URL=postgresql+psycopg2://escrow:escrow_dev_password@localhost:5432/escrow_dev

# JWT
JWT_SECRET_KEY=your-secret-key-change-in-prod
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=30

# OTP Settings
OTP_LENGTH=6
OTP_EXPIRE_MINUTES=5
OTP_MAX_ATTEMPTS=3

# Account Security
MAX_LOGIN_ATTEMPTS=5
ACCOUNT_LOCKOUT_MINUTES=30

# Rate Limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_PER_MINUTE=5
RATE_LIMIT_AUTH_PER_MINUTE=3

# CORS
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# URLs
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:8000

# Email (Resend.com)
RESEND_API_KEY=
RESEND_FROM_EMAIL=noreply@escrow.com

# SMS (Africa's Talking)
AFRICAS_TALKING_API_KEY=
AFRICAS_TALKING_USERNAME=
AFRICAS_TALKING_SENDER_ID=ESCROW

# SMS Fallback (Twilio)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
```

### Frontend Environment Variables

**File:** `apps/frontend/.env.local`

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

---

## Development Workflow

### Starting Development

**1. Start PostgreSQL:**
```bash
# Option 1: Local
brew services start postgresql@14

# Option 2: Docker
cd infra && docker-compose up -d postgres
```

**2. Run Migrations:**
```bash
cd apps/backend
alembic upgrade head
```

**3. Start Backend:**
```bash
cd apps/backend
python3 -m uvicorn app.main:app --reload
```

**4. Start Frontend:**
```bash
cd apps/frontend
npm run dev
```

### Common Commands

**Backend:**
```bash
# Run migrations
alembic upgrade head

# Create migration
alembic revision --autogenerate -m "description"

# Run tests
pytest tests/ -v

# Lint
ruff check .
black .

# Type check
mypy app
```

**Frontend:**
```bash
# Development server
npm run dev

# Build
npm run build

# Lint
npm run lint

# Type check
npm run type-check
```

### Code Organization

**Backend:**
- Models in `app/models/`
- API routes in `app/api/v1/`
- Business logic in `app/crud/`
- Utilities in `app/utils/`
- Schemas in `app/schemas/`

**Frontend:**
- Pages in `app/`
- Components in `components/`
- Utilities in `lib/`
- Types in `types/`

---

## Current Status

### ✅ Phase 0: COMPLETE

**Verified:** December 2025

- ✅ Monorepo structure with Turborepo
- ✅ Next.js 15 frontend skeleton (TypeScript, Tailwind CSS)
- ✅ FastAPI backend skeleton (SQLAlchemy 2.0, Alembic)
- ✅ Docker Compose configuration
- ✅ GitHub Actions CI/CD pipeline
- ✅ Initial database models (User, Listing, CredentialVault, Transaction, Contract)
- ✅ Documentation structure

### ✅ Phase 1: COMPLETE

**Verified:** December 2025

- ✅ Database models: User, OTPCode, RefreshToken, AuditLog
- ✅ Security utilities: Argon2 hashing, JWT tokens, OTP generation
- ✅ OTP delivery: Email (Resend/SMTP) + SMS (Africa's Talking/Twilio)
- ✅ Authentication API: 8 endpoints (register, verify, login, refresh, logout, me)
- ✅ Role-based access control: 4 role dependencies
- ✅ Rate limiting: slowapi on all auth endpoints
- ✅ Audit logging: 16 action types tracked
- ✅ Pydantic schemas: Request/response validation
- ✅ CRUD operations: User management with security helpers
- ✅ Database migration: Applied successfully (phase1_auth_001)
- ✅ PostgreSQL: Configured and running with all tables created

### ✅ Database: CONFIGURED

**Verified:** December 2025

- ✅ PostgreSQL 14.20 running and accepting connections
- ✅ Database `escrow_dev` created
- ✅ User `escrow` created with privileges
- ✅ Migration `phase1_auth_001` applied
- ✅ All 4 auth tables created (users, otp_codes, refresh_tokens, audit_logs)
- ✅ All 3 enums created (role, otptype, auditaction)
- ✅ All indexes created (6 indexes)

### 🚧 Next Steps

- **Frontend Integration**: Connect frontend to auth API
- **Comprehensive Tests**: Write full test suite
- **Phase 2**: Seller Submission + Admin Dashboard

---

**Last Updated**: December 2025  
**Status**: ✅ Phase 0 & Phase 1 Complete and Verified  
**Ready for**: Phase 2 Development

