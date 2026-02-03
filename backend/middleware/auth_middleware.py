"""
Authentication middleware for protecting routes with JWT
Phase 5: Added RBAC (Role-Based Access Control) support
"""
from fastapi import Request, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional, List, Dict, Any
from functools import wraps
import json

from auth.jwt_handler import verify_token
from auth.models import db
from auth.auth_config import (
    ROLE_SUPER_ADMIN, ROLE_ADMIN, ROLE_FUND_ADMIN, ROLE_USER,
    is_super_admin
)

security = HTTPBearer()


async def get_current_user_id(request: Request) -> Optional[str]:
    """
    Extract and verify user ID from JWT token in request
    
    Args:
        request: FastAPI request object
    
    Returns:
        User ID if token is valid, None otherwise
    """
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return None
    
    token = auth_header.split(" ")[1]
    payload = verify_token(token, token_type="access")
    
    if not payload:
        return None
    
    return payload.get("sub")


async def require_auth(request: Request) -> str:
    """
    Require authentication - raises exception if not authenticated
    
    Args:
        request: FastAPI request object
    
    Returns:
        User ID if authenticated
    
    Raises:
        HTTPException: If authentication fails
    """
    user_id = await get_current_user_id(request)
    
    if not user_id:
        raise HTTPException(
            status_code=401,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    # Verify user exists in database
    user = db.get_user_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=401,
            detail="User not found"
        )
    
    return user_id


def get_user_from_token(token: str) -> Optional[dict]:
    """
    Get user information from token
    
    Args:
        token: JWT access token
    
    Returns:
        User dict if token is valid and user exists, None otherwise
    """
    payload = verify_token(token, token_type="access")
    if not payload:
        return None
    
    user_id = payload.get("sub")
    if not user_id:
        return None
    
    return db.get_user_by_id(user_id)


# =============================================================================
# Phase 5: RBAC (Role-Based Access Control)
# =============================================================================

async def get_current_user(request: Request) -> Dict[str, Any]:
    """
    Get the current authenticated user with full details including role
    
    Args:
        request: FastAPI request object
    
    Returns:
        User dict with role information
    
    Raises:
        HTTPException: If authentication fails
    """
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    token = auth_header.split(" ")[1]
    payload = verify_token(token, token_type="access")
    
    if not payload:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    user_id = payload.get("sub")
    user = db.get_user_by_id(user_id)
    
    if not user:
        raise HTTPException(
            status_code=401,
            detail="User not found"
        )
    
    # Parse assigned_projects if it's a JSON string
    if isinstance(user.get('assigned_projects'), str):
        try:
            user['assigned_projects'] = json.loads(user['assigned_projects'])
        except (json.JSONDecodeError, TypeError):
            user['assigned_projects'] = []
    
    # Ensure role exists (default to 'user' for legacy records)
    if not user.get('role'):
        user['role'] = ROLE_USER
    
    # Auto-upgrade to super_admin if email matches (safety check)
    if is_super_admin(user.get('email')) and user['role'] != ROLE_SUPER_ADMIN:
        db.update_user_role(user_id, ROLE_SUPER_ADMIN)
        user['role'] = ROLE_SUPER_ADMIN
    
    return user


def require_role(*allowed_roles: str):
    """
    Dependency factory to require specific roles
    
    Usage:
        @app.get("/admin-only")
        async def admin_endpoint(user: dict = Depends(require_role(ROLE_ADMIN, ROLE_SUPER_ADMIN))):
            return {"message": "Admin access granted"}
    
    Args:
        allowed_roles: List of role strings that can access the endpoint
    
    Returns:
        Dependency function that validates user role
    """
    async def role_checker(request: Request) -> Dict[str, Any]:
        user = await get_current_user(request)
        
        if user['role'] not in allowed_roles:
            raise HTTPException(
                status_code=403,
                detail=f"Access denied. Required roles: {', '.join(allowed_roles)}"
            )
        
        return user
    
    return role_checker


def require_admin():
    """Shortcut for requiring admin or super_admin role"""
    return require_role(ROLE_SUPER_ADMIN, ROLE_ADMIN)


def require_super_admin():
    """Shortcut for requiring super_admin role only"""
    return require_role(ROLE_SUPER_ADMIN)


def require_fund_admin_or_above():
    """Shortcut for requiring fund_admin, admin, or super_admin role"""
    return require_role(ROLE_SUPER_ADMIN, ROLE_ADMIN, ROLE_FUND_ADMIN)


async def check_project_access(user: Dict[str, Any], project_id: str) -> bool:
    """
    Check if a user has access to a specific project
    
    - Super Admin and Admin have access to all projects
    - Fund Admin only has access to assigned projects
    - Regular users have no project management access
    
    Args:
        user: User dict with role and assigned_projects
        project_id: Project ID to check access for
    
    Returns:
        True if user has access, False otherwise
    """
    role = user.get('role', ROLE_USER)
    
    # Super Admin and Admin have full access
    if role in [ROLE_SUPER_ADMIN, ROLE_ADMIN]:
        return True
    
    # Fund Admin can only access assigned projects
    if role == ROLE_FUND_ADMIN:
        assigned = user.get('assigned_projects', [])
        return project_id in assigned
    
    # Regular users have no project management access
    return False


def require_project_access(project_id_param: str = "project_id"):
    """
    Dependency factory to require access to a specific project
    
    Usage:
        @app.post("/api/contributions")
        async def add_contribution(
            project_id: str,
            user: dict = Depends(require_project_access("project_id"))
        ):
            ...
    
    Args:
        project_id_param: Name of the path/query parameter containing project_id
    
    Returns:
        Dependency function that validates project access
    """
    async def project_access_checker(request: Request) -> Dict[str, Any]:
        user = await get_current_user(request)
        
        # Get project_id from path params or query params
        project_id = request.path_params.get(project_id_param) or request.query_params.get(project_id_param)
        
        if not project_id:
            raise HTTPException(
                status_code=400,
                detail=f"Missing {project_id_param} parameter"
            )
        
        if not await check_project_access(user, project_id):
            raise HTTPException(
                status_code=403,
                detail="Access denied. You don't have permission for this project."
            )
        
        return user
    
    return project_access_checker
