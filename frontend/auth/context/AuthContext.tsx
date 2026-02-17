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
      if (currentUser) {
        setUser(currentUser);
        return currentUser;
      }
      return null;
    } catch (error) {
      console.error('AuthContext: Error refreshing user:', error);
      setUser(null);
      return null;
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
      const token = tokenService.getAccessToken();
      console.log('AuthContext: Checking authentication');
      console.log('AuthContext: Token from localStorage:', token ? `${token.substring(0, 20)}...` : 'null');

      if (token) {
        console.log('AuthContext: Token found, fetching user data...');
        try {
          const fetchedUser = await authService.getCurrentUser();
          console.log('AuthContext: User data fetched:', fetchedUser);
          if (fetchedUser) {
            setUser(fetchedUser);
            console.log('AuthContext: User state set successfully');
          }
        } catch (err) {
          console.error('AuthContext: Error fetching user:', err);
        }
      } else {
        console.log('AuthContext: No token in localStorage');
      }

      setLoading(false);
    };

    initAuth();
  }, []);

  const value: AuthContextType = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    logout,
    refreshUser,
  };

  console.log('AuthContext render: loading=', loading, 'isAuthenticated=', !!user);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
