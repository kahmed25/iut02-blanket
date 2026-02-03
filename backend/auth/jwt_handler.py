"""
JWT token generation and validation
"""
from datetime import datetime, timedelta
from typing import Optional, Dict
from jose import JWTError, jwt
from auth.auth_config import (
    JWT_SECRET_KEY,
    JWT_ALGORITHM,
    ACCESS_TOKEN_EXPIRE_MINUTES,
    REFRESH_TOKEN_EXPIRE_DAYS
)


def create_access_token(data: Dict[str, str], expires_delta: Optional[timedelta] = None) -> str:
    """
    Create JWT access token
    
    Args:
        data: Dictionary containing user data to encode
        expires_delta: Optional custom expiration time
    
    Returns:
        Encoded JWT token
    """
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({
        "exp": expire,
        "iat": datetime.utcnow(),
        "type": "access"
    })
    
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    return encoded_jwt


def create_refresh_token(data: Dict[str, str]) -> str:
    """
    Create JWT refresh token (longer lived)
    
    Args:
        data: Dictionary containing user data to encode
    
    Returns:
        Encoded JWT refresh token
    """
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    
    to_encode.update({
        "exp": expire,
        "iat": datetime.utcnow(),
        "type": "refresh"
    })
    
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    return encoded_jwt


def verify_token(token: str, token_type: str = "access") -> Optional[Dict[str, str]]:
    """
    Verify and decode JWT token
    
    Args:
        token: JWT token to verify
        token_type: Expected token type ("access" or "refresh")
    
    Returns:
        Decoded token payload if valid, None otherwise
    """
    try:
        print(f"[JWT] Verifying {token_type} token...", flush=True)
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        print(f"[JWT] Token decoded successfully", flush=True)
        
        # Verify token type
        token_payload_type = payload.get("type")
        print(f"[JWT] Token type in payload: {token_payload_type}, expected: {token_type}", flush=True)
        if token_payload_type != token_type:
            print(f"[JWT] Token type mismatch!", flush=True)
            return None
        
        # Check expiration
        exp = payload.get("exp")
        if exp:
            exp_time = datetime.utcfromtimestamp(exp)
            now = datetime.utcnow()
            print(f"[JWT] Token expires at: {exp_time} (UTC), now: {now} (UTC), expired: {exp_time < now}", flush=True)
            if exp_time < now:
                print(f"[JWT] Token is expired!", flush=True)
                return None
        
        print(f"[JWT] Token is valid!", flush=True)
        return payload
    except JWTError as e:
        print(f"[JWT] JWT Error: {e}", flush=True)
        return None


def decode_token(token: str) -> Optional[Dict[str, str]]:
    """
    Decode JWT token without verification (for debugging)
    
    Args:
        token: JWT token to decode
    
    Returns:
        Decoded token payload if parseable, None otherwise
    """
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM], options={"verify_signature": False})
        return payload
    except JWTError:
        return None
