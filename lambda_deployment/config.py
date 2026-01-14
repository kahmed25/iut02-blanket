"""
Configuration settings for the application
"""
import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Base directory
BASE_DIR = Path(__file__).parent.parent

# Cache directory for downloaded files
# Use /tmp in Lambda (only writable directory), otherwise use project .cache
import os as _os
if _os.environ.get('AWS_LAMBDA_FUNCTION_NAME'):
    CACHE_DIR = Path("/tmp/.cache")
else:
    CACHE_DIR = BASE_DIR / ".cache"
CACHE_DIR.mkdir(exist_ok=True)

# Excel file configuration
EXCEL_SOURCE_TYPE = os.getenv("EXCEL_SOURCE_TYPE", "local")  # "local" or "url"
EXCEL_FILE_PATH = BASE_DIR / "i.02 blanket distribution 2026.xlsx"
EXCEL_URL = os.getenv("EXCEL_URL", "https://raw.githubusercontent.com/kahmed25/iut02-blanket/dev/i.02%20blanket%20distribution%202026.xlsx")

# Images configuration
IMAGES_SOURCE_TYPE = os.getenv("IMAGES_SOURCE_TYPE", "local")  # "local" or "url"
IMAGES_DIR = BASE_DIR / "images"
IMAGES_BASE_URL = os.getenv("IMAGES_BASE_URL", "https://raw.githubusercontent.com/kahmed25/iut02-blanket/dev/images")

# Cache settings
CACHE_EXPIRATION_SECONDS = int(os.getenv("CACHE_EXPIRATION_SECONDS", "300"))  # 5 minutes default

# API settings
API_HOST = os.getenv("API_HOST", "localhost")
API_PORT = int(os.getenv("API_PORT", "8000"))

# CORS settings
CORS_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:3001",
]

