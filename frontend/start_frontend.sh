#!/bin/bash

echo "🚀 Starting IUT02 Frontend with Authentication..."
echo ""
echo "Frontend will be available at: http://localhost:3000"
echo "Login page: http://localhost:3000/login"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

cd "$(dirname "$0")"
npm run dev
