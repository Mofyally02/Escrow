#!/bin/bash

# Setup PostgreSQL database for ESCROW project

echo "🗄️  ESCROW PostgreSQL Database Setup"
echo "======================================"
echo ""

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL is not installed."
    echo "   Install PostgreSQL: https://www.postgresql.org/download/"
    exit 1
fi

echo "✅ PostgreSQL is installed"
echo ""

# Database configuration
DB_NAME="escrow_dev"
DB_USER="escrow"
DB_PASSWORD="escrow_dev_password"
DB_HOST="localhost"
DB_PORT="5432"

# Detect PostgreSQL superuser (macOS Homebrew uses current user, Linux uses 'postgres')
CURRENT_USER=$(whoami)
if psql -h $DB_HOST -p $DB_PORT -U $CURRENT_USER -lqt &>/dev/null; then
    PG_SUPERUSER=$CURRENT_USER
elif psql -h $DB_HOST -p $DB_PORT -U postgres -lqt &>/dev/null; then
    PG_SUPERUSER="postgres"
else
    echo "❌ Cannot connect to PostgreSQL."
    echo "   Tried users: $CURRENT_USER, postgres"
    echo "   Please ensure PostgreSQL is running and you have access."
    exit 1
fi

echo "Database Configuration:"
echo "  Name: $DB_NAME"
echo "  User: $DB_USER"
echo "  Host: $DB_HOST"
echo "  Port: $DB_PORT"
echo "  PostgreSQL Superuser: $PG_SUPERUSER"
echo ""

# Check if database exists
if psql -h $DB_HOST -p $DB_PORT -U $PG_SUPERUSER -lqt | cut -d \| -f 1 | grep -qw $DB_NAME; then
    echo "⚠️  Database '$DB_NAME' already exists"
    read -p "Do you want to drop and recreate it? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Dropping existing database..."
        psql -h $DB_HOST -p $DB_PORT -U $PG_SUPERUSER -c "DROP DATABASE IF EXISTS $DB_NAME;"
    else
        echo "Using existing database"
    fi
fi

# Create database if it doesn't exist
if ! psql -h $DB_HOST -p $DB_PORT -U $PG_SUPERUSER -lqt | cut -d \| -f 1 | grep -qw $DB_NAME; then
    echo "Creating database '$DB_NAME'..."
    psql -h $DB_HOST -p $DB_PORT -U $PG_SUPERUSER -c "CREATE DATABASE $DB_NAME;" || {
        echo "❌ Failed to create database"
        exit 1
    }
    
    # Create user if it doesn't exist
    echo "Creating user '$DB_USER'..."
    psql -h $DB_HOST -p $DB_PORT -U $PG_SUPERUSER -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';" 2>/dev/null || echo "User already exists"
    
    # Grant privileges
    echo "Granting privileges..."
    psql -h $DB_HOST -p $DB_PORT -U $PG_SUPERUSER -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;" || {
        echo "⚠️  Warning: Failed to grant database privileges"
    }
    psql -h $DB_HOST -p $DB_PORT -U $PG_SUPERUSER -d $DB_NAME -c "GRANT ALL ON SCHEMA public TO $DB_USER;" || {
        echo "⚠️  Warning: Failed to grant schema privileges"
    }
    
    echo "✅ Database created successfully"
else
    echo "✅ Database already exists"
fi

echo ""
echo "======================================"
echo "Next Steps:"
echo "1. Update .env file with DATABASE_URL:"
echo "   DATABASE_URL=postgresql+psycopg2://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME"
echo ""
echo "2. Run migrations:"
echo "   cd apps/backend"
echo "   alembic upgrade head"
echo ""
echo "3. Verify tables:"
echo "   psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c '\dt'"
echo ""

