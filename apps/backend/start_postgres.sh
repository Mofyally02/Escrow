#!/bin/bash

# Start PostgreSQL for ESCROW project

echo "🗄️  Starting PostgreSQL for ESCROW"
echo "===================================="
echo ""

# Check if Docker Compose is available
if command -v docker-compose &> /dev/null || command -v docker &> /dev/null; then
    echo "✅ Docker found"
    echo ""
    echo "Starting PostgreSQL via Docker Compose..."
    cd "$(dirname "$0")/../../infra"
    
    if docker-compose ps postgres 2>/dev/null | grep -q "Up"; then
        echo "✅ PostgreSQL is already running in Docker"
    else
        docker-compose up -d postgres
        echo "⏳ Waiting for PostgreSQL to be ready..."
        sleep 5
        
        if docker-compose ps postgres 2>/dev/null | grep -q "Up"; then
            echo "✅ PostgreSQL started successfully"
        else
            echo "❌ Failed to start PostgreSQL"
            exit 1
        fi
    fi
    
    echo ""
    echo "Database connection:"
    echo "  Host: postgres (for Docker) or localhost (for local connection)"
    echo "  Port: 5432"
    echo "  Database: escrow_dev"
    echo "  User: escrow"
    echo ""
    echo "To connect from host machine, use:"
    echo "  DATABASE_URL=postgresql+psycopg2://escrow:escrow_dev_password@localhost:5432/escrow_dev"
    echo ""
    exit 0
fi

# Check if PostgreSQL is installed locally
if command -v psql &> /dev/null; then
    echo "✅ PostgreSQL is installed"
    echo ""
    
    # Check if it's running
    if pg_isready -h localhost -p 5432 &> /dev/null; then
        echo "✅ PostgreSQL is already running"
        exit 0
    fi
    
    # Try to start PostgreSQL
    echo "Attempting to start PostgreSQL..."
    
    # macOS with Homebrew
    if command -v brew &> /dev/null; then
        echo "Starting via Homebrew services..."
        brew services start postgresql@16 2>/dev/null || brew services start postgresql 2>/dev/null || {
            echo "⚠️  Could not start via Homebrew"
            echo "Try manually: brew services start postgresql@16"
        }
    fi
    
    # Linux
    if command -v systemctl &> /dev/null; then
        echo "Starting via systemd..."
        sudo systemctl start postgresql 2>/dev/null || {
            echo "⚠️  Could not start via systemd"
            echo "Try manually: sudo systemctl start postgresql"
        }
    fi
    
    # Wait a bit and check
    sleep 3
    if pg_isready -h localhost -p 5432 &> /dev/null; then
        echo "✅ PostgreSQL started successfully"
    else
        echo "❌ PostgreSQL is not running"
        echo ""
        echo "Please start PostgreSQL manually:"
        echo "  macOS: brew services start postgresql@16"
        echo "  Linux: sudo systemctl start postgresql"
        exit 1
    fi
else
    echo "❌ PostgreSQL is not installed"
    echo ""
    echo "Install PostgreSQL:"
    echo "  macOS: brew install postgresql@16"
    echo "  Linux: sudo apt-get install postgresql-16"
    echo ""
    echo "Or use Docker Compose:"
    echo "  cd infra && docker-compose up -d postgres"
    exit 1
fi

