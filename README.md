# ESCROW – Freelance Account Marketplace

**Trust-first, admin-moderated escrow marketplace for buying and selling established freelance accounts.**

## 🎯 Project Overview

ESCROW is a secure marketplace platform that enables buyers and sellers to transact freelance accounts (Upwork, Fiverr, Freelancer.com, etc.) with:
- **100% admin-vetted listings** (no open posting)
- **Escrow-protected payments** (funds held until buyer confirms access)
- **Encrypted credential storage** (AES-256-GCM, one-time reveal)
- **Digital contract e-signature** (legally binding)
- **Zero chargeback risk** for sellers, **zero non-delivery risk** for buyers

## 🏗️ Architecture

### Tech Stack

**Frontend:**
- Next.js 15 (App Router)
- TypeScript 5
- Tailwind CSS 3.4
- TanStack Query (planned)

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

## 📁 Project Structure

```
Escrow/
├── apps/
│   ├── frontend/          # Next.js 15 application
│   └── backend/           # FastAPI application
├── infra/                 # Docker & deployment configs
├── scripts/               # Development helpers
├── .github/               # GitHub Actions workflows
└── README.md
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm 9+
- Python 3.12+
- Docker & Docker Compose
- PostgreSQL 16 (or use Docker)

### Option 1: Docker Compose (Recommended)

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Mofyally02/Escrow.git
   cd Escrow
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start all services:**
   ```bash
   cd infra
   docker-compose up -d
   ```

4. **Run database migrations:**
   ```bash
   docker-compose exec backend alembic upgrade head
   ```

5. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs

### Option 2: Local Development (Without Docker)

#### Backend Setup

1. **Create virtual environment:**
   ```bash
   cd apps/backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Set up PostgreSQL database:**
   ```bash
   createdb escrow_dev
   ```

4. **Configure environment:**
   ```bash
   cp ../../.env.example .env
   # Edit .env with your DATABASE_URL
   ```

5. **Run migrations:**
   ```bash
   alembic upgrade head
   ```

6. **Start backend server:**
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

#### Frontend Setup

1. **Install dependencies:**
   ```bash
   cd apps/frontend
   npm install
   ```

2. **Set up environment:**
   ```bash
   cp ../../.env.example .env.local
   # Edit .env.local with NEXT_PUBLIC_API_BASE_URL
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

4. **Access frontend:**
   - http://localhost:3000

## 🗄️ Database Schema

### Core Models

- **User** - Authentication and role management (buyer, seller, admin, super_admin)
- **Listing** - Account listings with state machine (draft → under_review → approved → sold)
- **CredentialVault** - Encrypted account credentials (AES-256-GCM)
- **Transaction** - Escrow payment tracking
- **Contract** - Digital contract with e-signature

### Database Migrations

Migrations are managed with Alembic:

```bash
# Create a new migration
cd apps/backend
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head

# Rollback
alembic downgrade -1
```

## 🧪 Testing

### Backend Tests

```bash
cd apps/backend
pytest tests/ -v
```

### Frontend Tests

```bash
cd apps/frontend
npm test
```

## 🔧 Development Scripts

### Root Level (Monorepo)

```bash
npm run dev          # Start all services in dev mode
npm run build        # Build all apps
npm run lint         # Lint all apps
npm run test         # Run all tests
npm run type-check   # Type check all apps
```

### Backend

```bash
cd apps/backend
alembic upgrade head     # Run migrations
alembic revision --autogenerate -m "message"  # Create migration
pytest tests/ -v        # Run tests
ruff check .            # Lint
black .                 # Format
mypy app                # Type check
```

### Frontend

```bash
cd apps/frontend
npm run dev         # Development server
npm run build       # Production build
npm run start       # Start production server
npm run lint        # ESLint
npm run type-check  # TypeScript check
```

## 📋 Phase 0 Checklist

- [x] Monorepo structure initialized
- [x] Turborepo configured
- [x] Next.js 15 + TypeScript skeleton
- [x] FastAPI structured project
- [x] Docker Compose setup
- [x] PostgreSQL schema (initial models)
- [x] Alembic migrations configured
- [x] GitHub Actions CI pipeline
- [x] Environment configuration
- [x] Comprehensive README

## 🗺️ Roadmap

### Phase 0: Foundation (Weeks 1-2) ✅
- Repository setup, CI/CD, Docker, PostgreSQL schema, Next.js + FastAPI skeleton

### Phase 1: Auth & Identity (Weeks 3-5)
- JWT + Refresh tokens, Email/SMS OTP, KYC-lite

### Phase 2: Seller Submission + Admin Dashboard (Weeks 6-9)
- Submission forms, encrypted credential vault, admin review workflow

### Phase 3: Buyer Catalog + Escrow Engine (Weeks 10-14)
- Public catalog, Paystack escrow, contract generation & e-signing

### Phase 4: Secure Handover + Release (Weeks 15-17)
- One-time credential reveal, buyer confirmation flow, payout trigger

### Phase 5: Beta Launch & Hardening (Weeks 18-22)
- Audit logging, rate limiting, penetration testing

### Phase 6: Mobile Prep & Analytics (Weeks 23-26)
- Responsive PWA, analytics dashboard

## 🔐 Security

- **Credential Encryption**: AES-256-GCM at rest
- **One-time Reveal**: Credentials self-destruct after 5 minutes
- **JWT Authentication**: Secure token-based auth with refresh tokens
- **Audit Logging**: Immutable logs of all admin actions
- **CORS Protection**: Configured for production domains

## 📝 Environment Variables

See `.env.example` for all required environment variables:

- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET_KEY` - Secret for JWT signing
- `PAYSTACK_SECRET_KEY` - Paystack API secret
- `PAYSTACK_PUBLIC_KEY` - Paystack public key
- `FRONTEND_URL` - Frontend URL for CORS
- `BACKEND_URL` - Backend API URL

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is proprietary and confidential.

## 📚 Documentation

- **[DEVELOPMENT.md](DEVELOPMENT.md)** - Complete development guide (Phase 0, Phase 1, database setup, architecture)
- **[TESTING_AND_DEBUGGING.md](TESTING_AND_DEBUGGING.md)** - Testing procedures, debugging guide, troubleshooting
- **[DOCUMENTATION_INDEX.md](DOCUMENTATION_INDEX.md)** - Documentation index and quick links

## 🚧 Status

**Phase 1 Complete** - Authentication & Identity Verification ready. Database configured with PostgreSQL.

**Current Phase**: Ready for Phase 2 (Seller Submission + Admin Dashboard)

---

**Built with ❤️ for the freelance community**
