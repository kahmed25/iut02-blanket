/**
 * Authentication service for API communication
 */

import { tokenService } from './tokenService';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface User {
  user_id: string;
  email: string;
  username?: string;
  provider: string;
  role: 'super_admin' | 'admin' | 'fund_admin' | 'user';
  assigned_projects: string[];
  created_at: string;
  last_login: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface OAuthProvider {
  name: string;
  display_name: string;
  configured: boolean;
}

export const authService = {
  /**
   * Get API base URL
   */
  getApiUrl(): string {
    return API_URL;
  },

  /**
   * Start OAuth login flow
   */
  startOAuthLogin(provider: string): void {
    window.location.href = `${API_URL}/auth/login/${provider}`;
  },

  /**
   * Get current user information
   */
  async getCurrentUser(): Promise<User | null> {
    const token = tokenService.getAccessToken();
    console.log('authService.getCurrentUser: Token exists?', !!token);
    
    if (!token) {
      console.log('authService.getCurrentUser: No token, returning null');
      return null;
    }

    try {
      console.log('authService.getCurrentUser: Fetching from', `${API_URL}/auth/me`);
      const response = await fetch(`${API_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('authService.getCurrentUser: Response status', response.status);

      if (!response.ok) {
        console.log('authService.getCurrentUser: Response not OK');
        if (response.status === 401) {
          console.log('authService.getCurrentUser: 401 Unauthorized, trying to refresh');
          // Token expired, try to refresh
          const refreshed = await this.refreshToken();
          if (refreshed) {
            console.log('authService.getCurrentUser: Token refreshed, retrying');
            return this.getCurrentUser();
          }
          console.log('authService.getCurrentUser: Token refresh failed');
        }
        const errorText = await response.text();
        console.error('authService.getCurrentUser: Error response:', errorText);
        throw new Error('Failed to get user info');
      }

      const data = await response.json();
      console.log('authService.getCurrentUser: Success, got user:', data);
      return data;
    } catch (error) {
      console.error('authService.getCurrentUser: Exception:', error);
      return null;
    }
  },

  /**
   * Refresh access token
   */
  async refreshToken(): Promise<boolean> {
    const refreshToken = tokenService.getRefreshToken();
    if (!refreshToken) {
      return false;
    }

    try {
      const response = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!response.ok) {
        tokenService.clearTokens();
        return false;
      }

      const data: TokenResponse = await response.json();
      tokenService.setTokens(data.access_token, data.refresh_token);
      return true;
    } catch (error) {
      console.error('Error refreshing token:', error);
      tokenService.clearTokens();
      return false;
    }
  },

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    const refreshToken = tokenService.getRefreshToken();

    try {
      await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      tokenService.clearTokens();
    }
  },

  /**
   * Verify if access token is valid
   */
  async verifyToken(): Promise<boolean> {
    const token = tokenService.getAccessToken();
    if (!token) {
      return false;
    }

    try {
      const response = await fetch(`${API_URL}/auth/verify`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      return data.valid === true;
    } catch (error) {
      console.error('Error verifying token:', error);
      return false;
    }
  },

  /**
   * Get list of available OAuth providers
   */
  async getAvailableProviders(): Promise<OAuthProvider[]> {
    try {
      const response = await fetch(`${API_URL}/auth/providers`);
      if (!response.ok) {
        throw new Error('Failed to get providers');
      }

      const data = await response.json();
      return data.providers || [];
    } catch (error) {
      console.error('Error getting providers:', error);
      return [];
    }
  },

  /**
   * Get authorization header for authenticated requests
   */
  getAuthHeader(): { Authorization: string } | {} {
    const token = tokenService.getAccessToken();
    if (!token) {
      return {};
    }
    return { Authorization: `Bearer ${token}` };
  },
};
