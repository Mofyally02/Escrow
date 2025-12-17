#!/bin/bash

# Create Alembic migration script

set -e

if [ -z "$1" ]; then
    echo "Usage: ./scripts/create_migration.sh <migration_message>"
    exit 1
fi

cd apps/backend

if [ ! -d "venv" ]; then
    echo "❌ Virtual environment not found. Run setup.sh first."
    exit 1
fi

source venv/bin/activate

echo "📝 Creating migration: $1"
alembic revision --autogenerate -m "$1"

echo "✅ Migration created!"
echo "📋 Review the migration file in apps/backend/alembic/versions/"
echo "🚀 Apply with: alembic upgrade head"

