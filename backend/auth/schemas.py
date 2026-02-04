"""
Pydantic schemas for authentication requests and responses
"""
from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class UserBase(BaseModel):
    email: Optional[str] = None
    username: Optional[str] = None


class UserCreate(UserBase):
    provider: str  # "google", "facebook", "amazon"
    provider_id: str


class UserResponse(UserBase):
    user_id: str
    provider: str
    role: str = "user"
    assigned_projects: list = []
    created_at: datetime
    last_login: datetime

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int  # seconds


class TokenRefreshRequest(BaseModel):
    refresh_token: str


class TokenVerifyResponse(BaseModel):
    valid: bool
    user_id: Optional[str] = None
    email: Optional[str] = None


class OAuthCallbackRequest(BaseModel):
    code: str
    state: Optional[str] = None


class LogoutRequest(BaseModel):
    refresh_token: Optional[str] = None
