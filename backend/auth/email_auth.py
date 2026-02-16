"""
Email authentication routes for username/password login
"""
import uuid
import hashlib
import secrets
import boto3
from botocore.exceptions import ClientError
from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, HTTPException, Request, Depends

from auth.schemas import (
    EmailLoginRequest, EmailRegisterRequest, ForgotPasswordRequest,
    VerifyEmailRequest, ResetPasswordRequest, ChangePasswordRequest,
    TokenResponse
)
from auth.jwt_handler import create_access_token, create_refresh_token, verify_token
from auth.models import db
from auth.auth_config import (
    FRONTEND_URL, ACCESS_TOKEN_EXPIRE_MINUTES,
    ROLE_USER, ROLE_SUPER_ADMIN, is_super_admin
)

# Create router
router = APIRouter(prefix="/auth/email", tags=["email-authentication"])

# In-memory storage for verification codes and reset tokens (use Redis/DynamoDB in production)
verification_codes = {}  # {email: {"code": "123456", "expires": datetime, "username": "...", "password_hash": "..."}}
password_reset_tokens = {}  # {token: {"email": "...", "expires": datetime}}

# AWS SES Email configuration
import os
AWS_REGION = os.getenv("AWS_REGION", "ap-southeast-1")
SES_FROM_EMAIL = os.getenv("SES_FROM_EMAIL", "login@devopz.ai")
SES_FROM_NAME = os.getenv("SES_FROM_NAME", "IUT02 Care")
EMAIL_ENABLED = os.getenv("EMAIL_ENABLED", "false").lower() == "true"
ENVIRONMENT = os.getenv("ENVIRONMENT", "local")

# Initialize SES client
if ENVIRONMENT == "aws":
    ses_client = boto3.client('ses', region_name=AWS_REGION)
else:
    ses_client = None


def hash_password(password: str) -> str:
    """Hash password using SHA-256 with salt"""
    salt = secrets.token_hex(16)
    password_hash = hashlib.sha256((password + salt).encode()).hexdigest()
    return f"{salt}${password_hash}"


def verify_password(password: str, stored_hash: str) -> bool:
    """Verify password against stored hash"""
    try:
        salt, password_hash = stored_hash.split("$")
        return hashlib.sha256((password + salt).encode()).hexdigest() == password_hash
    except:
        return False


def generate_verification_code() -> str:
    """Generate a 6-digit verification code"""
    return str(secrets.randbelow(900000) + 100000)


def generate_reset_token() -> str:
    """Generate a secure reset token"""
    return secrets.token_urlsafe(32)


def send_email(to_email: str, subject: str, body: str) -> bool:
    """Send email using AWS SES"""
    if not EMAIL_ENABLED or ENVIRONMENT == "local":
        print(f"[EMAIL DEBUG] To: {to_email}")
        print(f"[EMAIL DEBUG] From: {SES_FROM_EMAIL}")
        print(f"[EMAIL DEBUG] Subject: {subject}")
        print(f"[EMAIL DEBUG] Body: {body}")
        return True
    
    if not ses_client:
        print(f"[EMAIL ERROR] SES client not initialized")
        return False
    
    try:
        response = ses_client.send_email(
            Destination={
                'ToAddresses': [to_email]
            },
            Message={
                'Body': {
                    'Html': {
                        'Charset': 'UTF-8',
                        'Data': body
                    }
                },
                'Subject': {
                    'Charset': 'UTF-8',
                    'Data': subject
                }
            },
            Source=f"{SES_FROM_NAME} <{SES_FROM_EMAIL}>"
        )
        print(f"[EMAIL SUCCESS] Sent email to {to_email}, MessageId: {response['MessageId']}")
        return True
    except ClientError as e:
        error_code = e.response['Error']['Code']
        error_message = e.response['Error']['Message']
        print(f"[EMAIL ERROR] SES ClientError {error_code}: {error_message}")
        return False
    except Exception as e:
        print(f"[EMAIL ERROR] Failed to send email: {e}")
        return False


@router.post("/login")
async def email_login(request: EmailLoginRequest):
    """
    Login with email and password
    """
    # Find user by email with provider 'email'
    user = db.get_user_by_provider("email", request.email)
    
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Check if email is verified
    if not user.get("email_verified", False):
        raise HTTPException(status_code=401, detail="Please verify your email first")
    
    # Verify password
    stored_hash = user.get("password_hash", "")
    if not verify_password(request.password, stored_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Update last login
    db.update_last_login(user["user_id"])
    
    # Generate JWT tokens
    token_data = {
        "sub": user["user_id"],
        "email": user["email"],
        "provider": "email"
    }
    
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)
    
    # Store session
    db.create_session(user["user_id"], refresh_token)
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )


@router.post("/register")
async def email_register(request: EmailRegisterRequest):
    """
    Register with email and password. Sends verification code to email.
    """
    # Check if user already exists
    existing_user = db.get_user_by_provider("email", request.email)
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Also check if email is used by OAuth
    existing_oauth = db.get_user_by_email(request.email)
    if existing_oauth:
        raise HTTPException(
            status_code=400, 
            detail=f"This email is already registered with {existing_oauth.get('provider', 'another provider')}. Please use that method to login."
        )
    
    # Validate password
    if len(request.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")
    
    # Generate verification code
    code = generate_verification_code()
    password_hash = hash_password(request.password)
    
    # Store pending registration
    verification_codes[request.email] = {
        "code": code,
        "expires": datetime.utcnow() + timedelta(hours=1),
        "username": request.username,
        "password_hash": password_hash
    }
    
    # Send verification email
    subject = "Verify your IUT02 Care account"
    body = f"""
    <html>
    <body style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Welcome to IUT02 Care!</h2>
        <p>Hi {request.username},</p>
        <p>Your verification code is:</p>
        <div style="background-color: #f0f0f0; padding: 20px; text-align: center; font-size: 32px; letter-spacing: 5px; font-weight: bold; margin: 20px 0;">
            {code}
        </div>
        <p>This code will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
        <br>
        <p>Best regards,<br>IUT02 Care Team</p>
    </body>
    </html>
    """
    
    send_email(request.email, subject, body)
    
    return {"message": "Verification code sent to your email"}


@router.post("/verify")
async def verify_email(request: VerifyEmailRequest):
    """
    Verify email with code and create user account
    """
    pending = verification_codes.get(request.email)
    
    if not pending:
        raise HTTPException(status_code=400, detail="No pending verification for this email")
    
    if datetime.utcnow() > pending["expires"]:
        del verification_codes[request.email]
        raise HTTPException(status_code=400, detail="Verification code expired")
    
    if pending["code"] != request.code:
        raise HTTPException(status_code=400, detail="Invalid verification code")
    
    # Create user
    user_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()
    role = ROLE_SUPER_ADMIN if is_super_admin(request.email) else ROLE_USER
    
    # Use create_email_user method if available, otherwise fall back to modified create_user
    try:
        user = db.create_email_user(
            email=request.email,
            username=pending["username"],
            password_hash=pending["password_hash"]
        )
    except AttributeError:
        # Fallback: create user with email as provider_id and store password_hash separately
        user = db.create_user(
            email=request.email,
            username=pending["username"],
            provider="email",
            provider_id=request.email
        )
        # Update with password hash and email_verified flag
        db.update_email_user_fields(user["user_id"], pending["password_hash"], True)
    
    # Clean up verification code
    del verification_codes[request.email]
    
    # Generate tokens and log user in
    token_data = {
        "sub": user["user_id"],
        "email": user["email"],
        "provider": "email"
    }
    
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)
    
    db.create_session(user["user_id"], refresh_token)
    
    return {
        "message": "Email verified successfully",
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60
    }


@router.post("/forgot-password")
async def forgot_password(request: ForgotPasswordRequest):
    """
    Send password reset link to email
    """
    user = db.get_user_by_provider("email", request.email)
    
    if not user:
        # Don't reveal if email exists or not
        return {"message": "If your email is registered, you will receive a password reset link"}
    
    # Generate reset token
    token = generate_reset_token()
    password_reset_tokens[token] = {
        "email": request.email,
        "user_id": user["user_id"],
        "expires": datetime.utcnow() + timedelta(hours=1)
    }
    
    # Send reset email
    reset_url = f"{FRONTEND_URL}/reset-password?token={token}"
    subject = "Reset your IUT02 Care password"
    body = f"""
    <html>
    <body style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Password Reset Request</h2>
        <p>Hi {user.get('username', 'there')},</p>
        <p>We received a request to reset your password. Click the button below to reset it:</p>
        <div style="text-align: center; margin: 30px 0;">
            <a href="{reset_url}" style="background-color: #10b981; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                Reset Password
            </a>
        </div>
        <p>Or copy this link: {reset_url}</p>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
        <br>
        <p>Best regards,<br>IUT02 Care Team</p>
    </body>
    </html>
    """
    
    send_email(request.email, subject, body)
    
    return {"message": "If your email is registered, you will receive a password reset link"}


@router.post("/reset-password")
async def reset_password(request: ResetPasswordRequest):
    """
    Reset password using token
    """
    token_data = password_reset_tokens.get(request.token)
    
    if not token_data:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")
    
    if datetime.utcnow() > token_data["expires"]:
        del password_reset_tokens[request.token]
        raise HTTPException(status_code=400, detail="Reset token has expired")
    
    if len(request.new_password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")
    
    # Update password
    new_hash = hash_password(request.new_password)
    try:
        db.update_user_password(token_data["user_id"], new_hash)
    except AttributeError:
        db.update_email_user_fields(token_data["user_id"], new_hash, True)
    
    # Clean up token
    del password_reset_tokens[request.token]
    
    return {"message": "Password reset successfully. You can now login with your new password."}


@router.post("/change-password")
async def change_password(request_data: ChangePasswordRequest, request: Request):
    """
    Change password for logged-in user
    """
    # Get token from Authorization header
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authorization header")
    
    token = auth_header.split(" ")[1]
    payload = verify_token(token, token_type="access")
    
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired access token")
    
    user_id = payload.get("sub")
    user = db.get_user_by_id(user_id)
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Only email users can change password
    if user.get("provider") != "email":
        raise HTTPException(status_code=400, detail="Password change is only available for email accounts")
    
    # Verify current password
    if not verify_password(request_data.current_password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Current password is incorrect")
    
    if len(request_data.new_password) < 8:
        raise HTTPException(status_code=400, detail="New password must be at least 8 characters")
    
    # Update password
    new_hash = hash_password(request_data.new_password)
    try:
        db.update_user_password(user_id, new_hash)
    except AttributeError:
        db.update_email_user_fields(user_id, new_hash, True)
    
    return {"message": "Password changed successfully"}
