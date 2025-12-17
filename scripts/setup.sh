#!/bin/bash

# ESCROW Project Setup Script
# This script sets up the development environment

set -e

echo "🚀 Setting up ESCROW project..."

# Check prerequisites
echo "📋 Checking prerequisites..."

if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+"
    exit 1
fi

if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.12+"
    exit 1
fi

if ! command -v docker &> /dev/null; then
    echo "⚠️  Docker is not installed. Docker Compose setup will be skipped."
fi

echo "✅ Prerequisites check passed"

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Setup backend
echo "🐍 Setting up backend..."
cd apps/backend

if [ ! -d "venv" ]; then
    python3 -m venv venv
fi

source venv/bin/activate
pip install -r requirements.txt

# Setup frontend
echo "⚛️  Setting up frontend..."
cd ../frontend
npm install

cd ../..

# Copy environment files
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env
    echo "⚠️  Please edit .env with your configuration"
fi

echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env with your configuration"
echo "2. Start services with: cd infra && docker-compose up -d"
echo "3. Run migrations: docker-compose exec backend alembic upgrade head"
echo ""
echo "Or run locally:"
echo "- Backend: cd apps/backend && source venv/bin/activate && uvicorn app.main:app --reload"
echo "- Frontend: cd apps/frontend && npm run dev"

