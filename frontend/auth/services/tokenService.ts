/**
 * Token service for managing access and refresh tokens
 */

const ACCESS_TOKEN_KEY = 'iut02_access_token';
const REFRESH_TOKEN_KEY = 'iut02_refresh_token';

export const tokenService = {
  /**
   * Store access token
   */
  setAccessToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(ACCESS_TOKEN_KEY, token);
    }
  },

  /**
   * Get access token
   */
  getAccessToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(ACCESS_TOKEN_KEY);
    }
    return null;
  },

  /**
   * Store refresh token
   */
  setRefreshToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(REFRESH_TOKEN_KEY, token);
    }
  },

  /**
   * Get refresh token
   */
  getRefreshToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(REFRESH_TOKEN_KEY);
    }
    return null;
  },

  /**
   * Store both tokens
   */
  setTokens(accessToken: string, refreshToken: string): void {
    console.log('[tokenService] setTokens called');
    console.log('[tokenService] typeof window:', typeof window);
    this.setAccessToken(accessToken);
    this.setRefreshToken(refreshToken);
    // Verify storage worked
    const stored = localStorage.getItem('iut02_access_token');
    console.log('[tokenService] Verified token in localStorage:', !!stored);
  },

  /**
   * Clear all tokens
   */
  clearTokens(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
    }
  },

  /**
   * Check if access token exists
   */
  hasAccessToken(): boolean {
    return !!this.getAccessToken();
  },

  /**
   * Decode JWT token payload without verification
   */
  decodeToken(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  },

  /**
   * Check if token is expired
   */
  isTokenExpired(token: string): boolean {
    const decoded = this.decodeToken(token);
    if (!decoded || !decoded.exp) {
      return true;
    }
    
    const currentTime = Date.now() / 1000;
    return decoded.exp < currentTime;
  },
};
