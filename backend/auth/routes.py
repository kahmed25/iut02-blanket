"""
Authentication routes for OAuth login, token management, and user info
"""
from fastapi import APIRouter, HTTPException, Response, Request, Depends
from fastapi.responses import RedirectResponse, JSONResponse
from typing import Optional
from datetime import datetime

from auth.schemas import TokenResponse, TokenRefreshRequest, TokenVerifyResponse, UserResponse, LogoutRequest
from auth.jwt_handler import create_access_token, create_refresh_token, verify_token
from auth.oauth_handlers import get_oauth_provider
from auth.models import db
from auth.auth_config import FRONTEND_URL, ACCESS_TOKEN_EXPIRE_MINUTES

# Create router
router = APIRouter(prefix="/auth", tags=["authentication"])

# In-memory state storage (for local dev - in production, use Redis or DynamoDB)
oauth_states = {}


@router.get("/login/{provider}")
async def initiate_oauth_login(provider: str):
    """
    Initiate OAuth login flow for specified provider
    
    Args:
        provider: OAuth provider name ("google", "facebook", "amazon")
    
    Returns:
        Redirect to OAuth provider's authorization page
    """
    oauth_provider = get_oauth_provider(provider)
    
    if not oauth_provider:
        raise HTTPException(status_code=400, detail=f"Unsupported provider: {provider}")
    
    # Check if provider credentials are configured
    if not oauth_provider.client_id or not oauth_provider.client_secret:
        raise HTTPException(
            status_code=500,
            detail=f"{provider.capitalize()} OAuth credentials not configured. Please set environment variables."
        )
    
    # Generate state for CSRF protection
    state = oauth_provider.generate_state()
    oauth_states[state] = provider  # Store state temporarily
    
    # Get authorization URL
    auth_url = oauth_provider.get_authorization_url(state)
    
    return RedirectResponse(url=auth_url)


@router.get("/callback/{provider}")
async def oauth_callback(provider: str, code: str, state: Optional[str] = None):
    """
    Handle OAuth callback from provider
    
    Args:
        provider: OAuth provider name
        code: Authorization code from provider
        state: State parameter for CSRF protection
    
    Returns:
        Redirect to frontend with tokens
    """
    # Verify state (CSRF protection)
    if state and state in oauth_states:
        expected_provider = oauth_states.pop(state)
        if expected_provider != provider:
            raise HTTPException(status_code=400, detail="Invalid state parameter")
    
    oauth_provider = get_oauth_provider(provider)
    if not oauth_provider:
        raise HTTPException(status_code=400, detail=f"Unsupported provider: {provider}")
    
    # Exchange code for access token
    access_token = oauth_provider.exchange_code_for_token(code)
    if not access_token:
        raise HTTPException(status_code=400, detail="Failed to exchange code for token")
    
    # Get user info from provider
    user_info = oauth_provider.get_user_info(access_token)
    if not user_info:
        raise HTTPException(status_code=400, detail="Failed to get user info from provider")
    
    # Check if user exists, if not create new user
    existing_user = db.get_user_by_provider(provider, user_info["provider_id"])
    
    if existing_user:
        user = existing_user
        db.update_last_login(user["user_id"])
    else:
        # Create new user
        user = db.create_user(
            email=user_info["email"],
            username=user_info.get("username"),
            provider=provider,
            provider_id=user_info["provider_id"]
        )
    
    # Generate JWT tokens
    token_data = {
        "sub": user["user_id"],
        "email": user["email"],
        "provider": provider
    }
    
    jwt_access_token = create_access_token(token_data)
    jwt_refresh_token = create_refresh_token(token_data)
    
    # Store refresh token in database
    db.create_session(user["user_id"], jwt_refresh_token)
    
    # Redirect to frontend with tokens
    redirect_url = f"{FRONTEND_URL}/auth/success?access_token={jwt_access_token}&refresh_token={jwt_refresh_token}"
    return RedirectResponse(url=redirect_url)


@router.post("/refresh", response_model=TokenResponse)
async def refresh_access_token(request: TokenRefreshRequest):
    """
    Refresh access token using refresh token
    
    Args:
        request: TokenRefreshRequest containing refresh_token
    
    Returns:
        New access and refresh tokens
    """
    # Verify refresh token
    payload = verify_token(request.refresh_token, token_type="refresh")
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")
    
    # Verify session exists in database
    session = db.get_session_by_token(request.refresh_token)
    if not session:
        raise HTTPException(status_code=401, detail="Session not found or expired")
    
    user_id = payload.get("sub")
    user = db.get_user_by_id(user_id)
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Generate new tokens
    token_data = {
        "sub": user["user_id"],
        "email": user["email"],
        "provider": user["provider"]
    }
    
    new_access_token = create_access_token(token_data)
    new_refresh_token = create_refresh_token(token_data)
    
    # Delete old session and create new one
    db.delete_session_by_token(request.refresh_token)
    db.create_session(user["user_id"], new_refresh_token)
    
    return TokenResponse(
        access_token=new_access_token,
        refresh_token=new_refresh_token,
        expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )


@router.post("/logout")
async def logout(request: LogoutRequest):
    """
    Logout user by invalidating refresh token
    
    Args:
        request: LogoutRequest containing optional refresh_token
    
    Returns:
        Success message
    """
    if request.refresh_token:
        db.delete_session_by_token(request.refresh_token)
    
    return {"message": "Logged out successfully"}


@router.get("/me", response_model=UserResponse)
async def get_current_user(request: Request):
    """
    Get current user information from access token
    
    Args:
        request: FastAPI request object
    
    Returns:
        Current user information
    """
    # Get token from Authorization header
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authorization header")
    
    token = auth_header.split(" ")[1]
    
    # Verify token
    payload = verify_token(token, token_type="access")
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired access token")
    
    user_id = payload.get("sub")
    user = db.get_user_by_id(user_id)
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Parse assigned_projects from JSON string if needed
    assigned_projects = user.get("assigned_projects", [])
    if isinstance(assigned_projects, str):
        import json
        try:
            assigned_projects = json.loads(assigned_projects) if assigned_projects else []
        except:
            assigned_projects = []
    
    return UserResponse(
        user_id=user["user_id"],
        email=user["email"],
        username=user.get("username"),
        provider=user["provider"],
        role=user.get("role", "user"),
        assigned_projects=assigned_projects,
        created_at=datetime.fromisoformat(user["created_at"]),
        last_login=datetime.fromisoformat(user["last_login"])
    )


@router.post("/verify", response_model=TokenVerifyResponse)
async def verify_access_token(request: Request):
    """
    Verify if access token is valid
    
    Args:
        request: FastAPI request object
    
    Returns:
        Token verification result
    """
    # Get token from Authorization header
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return TokenVerifyResponse(valid=False)
    
    token = auth_header.split(" ")[1]
    
    # Verify token
    payload = verify_token(token, token_type="access")
    if not payload:
        return TokenVerifyResponse(valid=False)
    
    return TokenVerifyResponse(
        valid=True,
        user_id=payload.get("sub"),
        email=payload.get("email")
    )


@router.get("/providers")
async def get_available_providers():
    """
    Get list of configured OAuth providers
    
    Returns:
        List of available providers with configuration status
    """
    from auth.auth_config import GOOGLE_CLIENT_ID, FACEBOOK_APP_ID, AMAZON_CLIENT_ID
    
    providers = []
    
    if GOOGLE_CLIENT_ID:
        providers.append({"name": "google", "display_name": "Google", "configured": True})
    else:
        providers.append({"name": "google", "display_name": "Google", "configured": False})
    
    if FACEBOOK_APP_ID:
        providers.append({"name": "facebook", "display_name": "Facebook", "configured": True})
    else:
        providers.append({"name": "facebook", "display_name": "Facebook", "configured": False})
    
    if AMAZON_CLIENT_ID:
        providers.append({"name": "amazon", "display_name": "Amazon", "configured": True})
    else:
        providers.append({"name": "amazon", "display_name": "Amazon", "configured": False})
    
    return {"providers": providers}
