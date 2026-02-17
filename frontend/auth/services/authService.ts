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
  getAuthHeader(): { Authorization: string } | Record<string, never> {
    const token = tokenService.getAccessToken();
    if (!token) {
      return {};
    }
    return { Authorization: `Bearer ${token}` };
  },

  // Email Authentication Methods

  /**
   * Login with email and password
   */
  async emailLogin(email: string, password: string): Promise<{ success: boolean; message?: string }> {
    try {
      console.log('[emailLogin] Calling API:', `${API_URL}/auth/email/login`);
      const response = await fetch(`${API_URL}/auth/email/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      console.log('[emailLogin] Response status:', response.status);

      if (!response.ok) {
        console.log('[emailLogin] Login failed:', data.detail);
        return { success: false, message: data.detail || 'Login failed' };
      }

      // Store tokens
      console.log('[emailLogin] Storing tokens...');
      tokenService.setTokens(data.access_token, data.refresh_token);

      // Verify tokens were stored
      const storedToken = tokenService.getAccessToken();
      console.log('[emailLogin] Token stored successfully:', !!storedToken);
      console.log('[emailLogin] Stored token preview:', storedToken ? storedToken.substring(0, 30) + '...' : 'null');

      return { success: true };
    } catch (error) {
      console.error('[emailLogin] Error:', error);
      return { success: false, message: 'Network error. Please try again.' };
    }
  },

  /**
   * Register with email, username, and password
   */
  async emailRegister(email: string, username: string, password: string): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await fetch(`${API_URL}/auth/email/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, message: data.detail || 'Registration failed' };
      }

      return { success: true, message: data.message };
    } catch (error) {
      console.error('Email register error:', error);
      return { success: false, message: 'Network error. Please try again.' };
    }
  },

  /**
   * Request password reset
   */
  async forgotPassword(email: string): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await fetch(`${API_URL}/auth/email/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, message: data.detail || 'Failed to send reset link' };
      }

      return { success: true, message: data.message };
    } catch (error) {
      console.error('Forgot password error:', error);
      return { success: false, message: 'Network error. Please try again.' };
    }
  },

  /**
   * Verify email with code
   */
  async verifyEmail(email: string, code: string): Promise<{ success: boolean; message?: string }> {
    try {
      console.log('[authService.verifyEmail] Sending verification request for:', email);
      const response = await fetch(`${API_URL}/auth/email/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, code }),
      });

      const data = await response.json();
      console.log('[authService.verifyEmail] Response:', { status: response.status, hasToken: !!data.access_token, userId: data.user_id });

      if (!response.ok) {
        console.error('[authService.verifyEmail] Error:', data.detail);
        return { success: false, message: data.detail || 'Verification failed' };
      }

      // If login tokens are returned, store them
      if (data.access_token) {
        console.log('[authService.verifyEmail] Storing tokens...');
        tokenService.setTokens(data.access_token, data.refresh_token);
        console.log('[authService.verifyEmail] Tokens stored, verifying...');
        const storedToken = tokenService.getAccessToken();
        console.log('[authService.verifyEmail] Token stored successfully:', !!storedToken);
      }

      return { success: true, message: data.message };
    } catch (error) {
      console.error('[authService.verifyEmail] Network error:', error);
      return { success: false, message: 'Network error. Please try again.' };
    }
  },

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await fetch(`${API_URL}/auth/email/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, new_password: newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, message: data.detail || 'Password reset failed' };
      }

      return { success: true, message: data.message };
    } catch (error) {
      console.error('Reset password error:', error);
      return { success: false, message: 'Network error. Please try again.' };
    }
  },

  /**
   * Change password (for logged-in users)
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; message?: string }> {
    const token = tokenService.getAccessToken();
    if (!token) {
      return { success: false, message: 'Not authenticated' };
    }

    try {
      const response = await fetch(`${API_URL}/auth/email/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, message: data.detail || 'Password change failed' };
      }

      return { success: true, message: data.message };
    } catch (error) {
      console.error('Change password error:', error);
      return { success: false, message: 'Network error. Please try again.' };
    }
  },
};
