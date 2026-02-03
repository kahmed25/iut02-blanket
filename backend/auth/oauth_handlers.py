"""
OAuth 2.0 handlers for Google, Facebook, and Amazon
"""
import secrets
import requests
from typing import Dict, Optional, Tuple
from urllib.parse import urlencode
from auth.auth_config import (
    GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI,
    FACEBOOK_APP_ID, FACEBOOK_APP_SECRET, FACEBOOK_REDIRECT_URI,
    AMAZON_CLIENT_ID, AMAZON_CLIENT_SECRET, AMAZON_REDIRECT_URI
)


class OAuthProvider:
    """Base OAuth provider class"""
    
    def __init__(self, client_id: str, client_secret: str, redirect_uri: str):
        self.client_id = client_id
        self.client_secret = client_secret
        self.redirect_uri = redirect_uri
    
    def generate_state(self) -> str:
        """Generate a random state for CSRF protection"""
        return secrets.token_urlsafe(32)
    
    def get_authorization_url(self, state: str) -> str:
        """Get OAuth authorization URL - must be implemented by subclass"""
        raise NotImplementedError
    
    def exchange_code_for_token(self, code: str) -> Optional[str]:
        """Exchange authorization code for access token - must be implemented by subclass"""
        raise NotImplementedError
    
    def get_user_info(self, access_token: str) -> Optional[Dict]:
        """Get user info from provider - must be implemented by subclass"""
        raise NotImplementedError


class GoogleOAuthProvider(OAuthProvider):
    """Google OAuth 2.0 provider"""
    
    AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
    TOKEN_URL = "https://oauth2.googleapis.com/token"
    USER_INFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo"
    
    def __init__(self):
        super().__init__(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI)
    
    def get_authorization_url(self, state: str) -> str:
        """Get Google OAuth authorization URL"""
        params = {
            "client_id": self.client_id,
            "redirect_uri": self.redirect_uri,
            "response_type": "code",
            "scope": "openid email profile",
            "state": state,
            "access_type": "offline",
            "prompt": "consent"
        }
        return f"{self.AUTH_URL}?{urlencode(params)}"
    
    def exchange_code_for_token(self, code: str) -> Optional[str]:
        """Exchange authorization code for access token"""
        data = {
            "code": code,
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "redirect_uri": self.redirect_uri,
            "grant_type": "authorization_code"
        }
        
        try:
            response = requests.post(self.TOKEN_URL, data=data, timeout=10)
            response.raise_for_status()
            token_data = response.json()
            return token_data.get("access_token")
        except Exception as e:
            print(f"Error exchanging Google code for token: {e}")
            return None
    
    def get_user_info(self, access_token: str) -> Optional[Dict]:
        """Get user info from Google"""
        headers = {"Authorization": f"Bearer {access_token}"}
        
        try:
            response = requests.get(self.USER_INFO_URL, headers=headers, timeout=10)
            response.raise_for_status()
            user_data = response.json()
            
            return {
                "provider_id": user_data.get("id"),
                "email": user_data.get("email"),
                "username": user_data.get("name"),
                "provider": "google"
            }
        except Exception as e:
            print(f"Error getting Google user info: {e}")
            return None


class FacebookOAuthProvider(OAuthProvider):
    """Facebook OAuth 2.0 provider"""
    
    AUTH_URL = "https://www.facebook.com/v18.0/dialog/oauth"
    TOKEN_URL = "https://graph.facebook.com/v18.0/oauth/access_token"
    USER_INFO_URL = "https://graph.facebook.com/me"
    
    def __init__(self):
        super().__init__(FACEBOOK_APP_ID, FACEBOOK_APP_SECRET, FACEBOOK_REDIRECT_URI)
    
    def get_authorization_url(self, state: str) -> str:
        """Get Facebook OAuth authorization URL"""
        params = {
            "client_id": self.client_id,
            "redirect_uri": self.redirect_uri,
            "response_type": "code",
            "scope": "public_profile email",
            "state": state
        }
        return f"{self.AUTH_URL}?{urlencode(params)}"
    
    def exchange_code_for_token(self, code: str) -> Optional[str]:
        """Exchange authorization code for access token"""
        params = {
            "code": code,
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "redirect_uri": self.redirect_uri
        }
        
        try:
            response = requests.get(self.TOKEN_URL, params=params, timeout=10)
            response.raise_for_status()
            token_data = response.json()
            return token_data.get("access_token")
        except Exception as e:
            print(f"Error exchanging Facebook code for token: {e}")
            return None
    
    def get_user_info(self, access_token: str) -> Optional[Dict]:
        """Get user info from Facebook"""
        params = {
            "fields": "id,name,email",
            "access_token": access_token
        }
        
        try:
            response = requests.get(self.USER_INFO_URL, params=params, timeout=10)
            response.raise_for_status()
            user_data = response.json()
            
            return {
                "provider_id": user_data.get("id"),
                "email": user_data.get("email"),
                "username": user_data.get("name"),
                "provider": "facebook"
            }
        except Exception as e:
            print(f"Error getting Facebook user info: {e}")
            return None


class AmazonOAuthProvider(OAuthProvider):
    """Amazon (Login with Amazon) OAuth 2.0 provider"""
    
    AUTH_URL = "https://www.amazon.com/ap/oa"
    TOKEN_URL = "https://api.amazon.com/auth/o2/token"
    USER_INFO_URL = "https://api.amazon.com/user/profile"
    
    def __init__(self):
        super().__init__(AMAZON_CLIENT_ID, AMAZON_CLIENT_SECRET, AMAZON_REDIRECT_URI)
    
    def get_authorization_url(self, state: str) -> str:
        """Get Amazon OAuth authorization URL"""
        params = {
            "client_id": self.client_id,
            "redirect_uri": self.redirect_uri,
            "response_type": "code",
            "scope": "profile postal_code",
            "state": state
        }
        return f"{self.AUTH_URL}?{urlencode(params)}"
    
    def exchange_code_for_token(self, code: str) -> Optional[str]:
        """Exchange authorization code for access token"""
        data = {
            "grant_type": "authorization_code",
            "code": code,
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "redirect_uri": self.redirect_uri
        }
        
        try:
            response = requests.post(self.TOKEN_URL, data=data, timeout=10)
            response.raise_for_status()
            token_data = response.json()
            return token_data.get("access_token")
        except Exception as e:
            print(f"Error exchanging Amazon code for token: {e}")
            return None
    
    def get_user_info(self, access_token: str) -> Optional[Dict]:
        """Get user info from Amazon"""
        headers = {"Authorization": f"Bearer {access_token}"}
        
        try:
            response = requests.get(self.USER_INFO_URL, headers=headers, timeout=10)
            response.raise_for_status()
            user_data = response.json()
            
            return {
                "provider_id": user_data.get("user_id"),
                "email": user_data.get("email"),
                "username": user_data.get("name"),
                "provider": "amazon"
            }
        except Exception as e:
            print(f"Error getting Amazon user info: {e}")
            return None


# Provider factory
def get_oauth_provider(provider_name: str) -> Optional[OAuthProvider]:
    """
    Get OAuth provider instance by name
    
    Args:
        provider_name: Name of the provider ("google", "facebook", "amazon")
    
    Returns:
        OAuthProvider instance or None if provider not found
    """
    providers = {
        "google": GoogleOAuthProvider,
        "facebook": FacebookOAuthProvider,
        "amazon": AmazonOAuthProvider
    }
    
    provider_class = providers.get(provider_name.lower())
    if provider_class:
        return provider_class()
    return None
