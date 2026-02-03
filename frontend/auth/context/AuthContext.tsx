'use client';

import React, { createContext, useState, useEffect, useCallback } from 'react';
import { authService, User } from '../services/authService';
import { tokenService } from '../services/tokenService';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (provider: string) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      console.log('AuthContext: Calling authService.getCurrentUser()');
      const currentUser = await authService.getCurrentUser();
      console.log('AuthContext: Got user:', currentUser);
      setUser(currentUser);
    } catch (error) {
      console.error('AuthContext: Error refreshing user:', error);
      setUser(null);
    }
  }, []);

  const login = (provider: string) => {
    authService.startOAuthLogin(provider);
  };

  const logout = async () => {
    try {
      await authService.logout();
      setUser(null);
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  // Check for existing session on mount
  useEffect(() => {
    const initAuth = async () => {
      const hasToken = tokenService.hasAccessToken();
      console.log('AuthContext: Checking authentication, hasToken:', hasToken);
      
      if (hasToken) {
        console.log('AuthContext: Token found, fetching user data...');
        await refreshUser();
      } else {
        console.log('AuthContext: No token found');
      }
      
      setLoading(false);
      console.log('AuthContext: Loading complete');
    };

    initAuth();
  }, [refreshUser]);

  const value: AuthContextType = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
