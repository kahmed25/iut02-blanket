"""
Authentication configuration for both local and AWS environments
"""
import os
from pathlib import Path
from typing import Literal

# Environment detection
ENVIRONMENT = os.getenv("ENVIRONMENT", "local")  # "local" or "aws"

# JWT Configuration
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "dev-secret-key-change-in-production-use-openssl-rand-hex-32")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "15"))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))

# OAuth Provider Configuration
# Google OAuth
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")
GOOGLE_REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:3000/auth/callback/google")

# Facebook OAuth
FACEBOOK_APP_ID = os.getenv("FACEBOOK_APP_ID", os.getenv("FACEBOOK_CLIENT_ID", ""))
FACEBOOK_APP_SECRET = os.getenv("FACEBOOK_APP_SECRET", os.getenv("FACEBOOK_CLIENT_SECRET", ""))
FACEBOOK_REDIRECT_URI = os.getenv("FACEBOOK_REDIRECT_URI", "http://localhost:8000/auth/callback/facebook")

# Amazon OAuth
AMAZON_CLIENT_ID = os.getenv("AMAZON_CLIENT_ID", "")
AMAZON_CLIENT_SECRET = os.getenv("AMAZON_CLIENT_SECRET", "")
AMAZON_REDIRECT_URI = os.getenv("AMAZON_REDIRECT_URI", "http://localhost:3000/auth/callback/amazon")

# Database Configuration
if ENVIRONMENT == "local":
    # SQLite for local development
    DB_TYPE: Literal["sqlite", "dynamodb"] = "sqlite"
    SQLITE_DB_PATH = Path(__file__).parent.parent / "auth.db"
else:
    # DynamoDB for AWS
    DB_TYPE = "dynamodb"
    DYNAMODB_REGION = os.getenv("DYNAMODB_REGION", "us-east-1")
    DYNAMODB_USERS_TABLE = os.getenv("DYNAMODB_USERS_TABLE", "iut02-users")
    DYNAMODB_SESSIONS_TABLE = os.getenv("DYNAMODB_SESSIONS_TABLE", "iut02-sessions")

# Frontend URL for redirects
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

# Session Configuration
SESSION_COOKIE_NAME = "iut02_session"
SESSION_COOKIE_SECURE = ENVIRONMENT != "local"  # HTTPS only in production
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = "lax"

# Security
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:8000").split(",")

# =============================================================================
# Phase 5: Fund Management Configuration
# =============================================================================

# Super Admin (hardcoded - auto-assigned on login)
SUPER_ADMIN_EMAIL = os.getenv("SUPER_ADMIN_EMAIL", "khahmed.rashed@gmail.com")

# User Roles
ROLE_SUPER_ADMIN = "super_admin"
ROLE_ADMIN = "admin"
ROLE_FUND_ADMIN = "fund_admin"
ROLE_USER = "user"

VALID_ROLES = [ROLE_SUPER_ADMIN, ROLE_ADMIN, ROLE_FUND_ADMIN, ROLE_USER]

# Fund Management Database (Phase 5)
if ENVIRONMENT == "local":
    SQLITE_FUND_DB_PATH = Path(__file__).parent.parent / "fund_management.db"
else:
    DYNAMODB_PROJECTS_TABLE = os.getenv("DYNAMODB_PROJECTS_TABLE", "iut02-projects")
    DYNAMODB_CONTRIBUTIONS_TABLE = os.getenv("DYNAMODB_CONTRIBUTIONS_TABLE", "iut02-contributions")
    DYNAMODB_SETTINGS_TABLE = os.getenv("DYNAMODB_SETTINGS_TABLE", "iut02-settings")
    DYNAMODB_MEDIA_TABLE = os.getenv("DYNAMODB_MEDIA_TABLE", "iut02-media")
    DYNAMODB_DISTRIBUTIONS_TABLE = os.getenv("DYNAMODB_DISTRIBUTIONS_TABLE", "iut02-distributions")

# S3 Media Storage (Phase 6+)
S3_MEDIA_BUCKET = os.getenv("S3_MEDIA_BUCKET", "iut02-media-uploads")
S3_REGION = os.getenv("S3_REGION", "ap-southeast-1")

# Supported Currencies
SUPPORTED_CURRENCIES = ["BDT", "USD", "CAD", "AUD", "EUR"]
DEFAULT_CURRENCY = os.getenv("DEFAULT_CURRENCY", "BDT")

# Payment Modes
PAYMENT_MODES = ["Mobile Money", "Cash", "Bank Transfer", "Bkash", "Nagad", "Offline", "Stripe", "PayPal"]

# Data Source Mode
DATA_SOURCE_MODE = os.getenv("DATA_SOURCE_MODE", "excel")  # "excel" or "dynamic"

# Stripe Configuration (Phase 5)
STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY", "")
STRIPE_PUBLISHABLE_KEY = os.getenv("STRIPE_PUBLISHABLE_KEY", "")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET", "")


def is_super_admin(email: str) -> bool:
    """Check if email belongs to super admin"""
    return email and email.lower() == SUPER_ADMIN_EMAIL.lower()
