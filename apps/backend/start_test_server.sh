#!/bin/bash

# Start test server script
cd "$(dirname "$0")"

echo "🚀 Starting ESCROW Test Server..."
echo ""
echo "Server will start at: http://localhost:8000"
echo "API Docs: http://localhost:8000/docs"
echo "Health Check: http://localhost:8000/health"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found. Creating from defaults..."
    echo "   Using SQLite for testing (DATABASE_URL=sqlite:///./test_escrow.db)"
    echo ""
fi

# Start server
python3 -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

