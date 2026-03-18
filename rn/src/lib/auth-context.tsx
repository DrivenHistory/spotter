"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { auth as authApi } from "./api";

interface User {
  email: string;
  name: string;
}

interface AuthCtx {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, username: string, password: string, confirmPassword: string) => Promise<void>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  checkSession: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkSession = useCallback(async () => {
    try {
      const { session } = await authApi.me();
      setUser(session);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { checkSession(); }, [checkSession]);

  const login = async (email: string, password: string) => {
    setError(null);
    setIsLoading(true);
    try {
      await authApi.login(email, password);
      await checkSession();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Login failed");
      setIsLoading(false);
    }
  };

  const signup = async (email: string, username: string, password: string, confirmPassword: string) => {
    setError(null);
    setIsLoading(true);
    try {
      await authApi.signup(email, username, password, confirmPassword);
      await checkSession();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Signup failed");
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try { await authApi.logout(); } catch { /* clear anyway */ }
    setUser(null);
  };

  const deleteAccount = async () => {
    await authApi.deleteAccount();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, isLoading, error, login, signup, logout, deleteAccount, checkSession, clearError: () => setError(null) }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
