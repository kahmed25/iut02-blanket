#!/bin/bash

echo "🚀 Starting IUT02 Backend Server with Authentication..."
echo ""
echo "Backend will be available at: http://localhost:8000"
echo "API Documentation: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

cd "$(dirname "$0")"
python3 -m uvicorn app:app --reload --host 127.0.0.1 --port 8000
