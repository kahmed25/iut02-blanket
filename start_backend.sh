#!/bin/bash
# Start the FastAPI backend server

cd "$(dirname "$0")"
source venv/bin/activate
cd backend
python app.py

