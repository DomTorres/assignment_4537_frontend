import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/AuthService';
import { User } from '../models/User';

/**
 * AuthContext provides authentication state to the entire component tree.
 * This is the single source of truth for the current user session.
 */
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true); // true during session restore

  /** Attempt to restore a saved session on mount */
  useEffect(() => {
    const session = authService.restoreSession();
    if (session) {
      setUser(session.user);
      setToken(session.token);
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email, password) => {
    const { user: u, token: t } = await authService.login(email, password);
    setUser(u);
    setToken(t);
    return u;
  }, []);

  const register = useCallback(async (name, email, password) => {
    const { user: u, token: t } = await authService.register(name, email, password);
    setUser(u);
    setToken(t);
    return u;
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
    setToken(null);
  }, []);

  /**
   * Merge partial updates into the current user and always keep a proper User instance.
   * Call with just the changed fields: refreshUser({ apiCallsUsed: 5 })
   */
  const refreshUser = useCallback((updates) => {
    setUser((prev) => {
      if (!prev) return prev;
      return new User({ ...prev, ...updates });
    });
  }, []);

  const value = {
    user,
    token,
    loading,
    isAuthenticated: Boolean(user && token),
    login,
    register,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/** Hook — access auth context anywhere in the tree */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
