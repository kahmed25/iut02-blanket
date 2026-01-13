"""
Configuration settings for the application
"""
import os
from pathlib import Path

# Base directory
BASE_DIR = Path(__file__).parent.parent

# Excel file path (local for Phase 1)
EXCEL_FILE_PATH = BASE_DIR / "i.02 blanket distribution 2026.xlsx"

# Images directory (local for Phase 1)
IMAGES_DIR = BASE_DIR / "images"

# API settings
API_HOST = os.getenv("API_HOST", "localhost")
API_PORT = int(os.getenv("API_PORT", "8000"))

# CORS settings
CORS_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:3001",
]

