import React, { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { api } from '../api/client';
import { storeTokens, clearTokens, getToken, isTokenValid, refreshIfNeeded } from './tokens';
import type { AuthTokens } from './tokens';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (repId: string, signupSecret: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      const valid = await isTokenValid();
      setIsAuthenticated(valid);
    } catch {
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = useCallback(async (repId: string, signupSecret: string) => {
    const response = await api.issueToken({ rep_id: repId, signup_secret: signupSecret });
    // Server returns expires_in (seconds); convert to epoch ms for storage
    const tokens: AuthTokens = {
      token: response.token,
      expiresAt: Date.now() + (response.expires_in * 1000),
    };
    await storeTokens(tokens);
    setIsAuthenticated(true);
  }, []);

  const logout = useCallback(async () => {
    await clearTokens();
    setIsAuthenticated(false);
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
