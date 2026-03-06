import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { authApi } from "@/lib/api";

export interface AuthUser {
  id: number;
  email: string;
  name: string;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  isChecked: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  loginWithToken: (token: string) => Promise<void>;
  register: (name: string, email: string, password: string, confirmPassword: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_KEY = "token";
const USER_KEY = "user";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: localStorage.getItem(TOKEN_KEY),
    isLoading: false,
    isChecked: false,
  });

  const setUserAndToken = useCallback((user: AuthUser | null, token: string | null) => {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
      if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    }
    setState((s) => ({ ...s, user, token, isLoading: false }));
  }, []);

  useEffect(() => {
    const token = state.token;
    if (!token) {
      setState((s) => ({ ...s, isChecked: true, user: null }));
      return;
    }
    const stored = localStorage.getItem(USER_KEY);
    if (stored) {
      try {
        setState((s) => ({ ...s, user: JSON.parse(stored) as AuthUser, isChecked: true }));
      } catch {
        localStorage.removeItem(USER_KEY);
      }
    }
    authApi
      .me()
      .then(({ user }) => setState((s) => ({ ...s, user, isChecked: true })))
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        setState((s) => ({ ...s, user: null, token: null, isChecked: true }));
      });
  }, [state.token]);

  const login = useCallback(
    async (email: string, password: string) => {
      setState((s) => ({ ...s, isLoading: true }));
      const { token, user } = await authApi.login({ email, password });
      setUserAndToken(user, token);
    },
    [setUserAndToken]
  );

  const loginWithToken = useCallback(
    async (token: string) => {
      setState((s) => ({ ...s, isLoading: true }));
      localStorage.setItem(TOKEN_KEY, token);
      const { user } = await authApi.me();
      if (user) {
        localStorage.setItem(USER_KEY, JSON.stringify(user));
        setState((s) => ({ ...s, user, token, isLoading: false }));
      } else {
        localStorage.removeItem(TOKEN_KEY);
        setState((s) => ({ ...s, isLoading: false }));
      }
    },
    []
  );

  const register = useCallback(
    async (name: string, email: string, password: string, confirmPassword: string) => {
      setState((s) => ({ ...s, isLoading: true }));
      const { token, user } = await authApi.register({ name, email, password, confirmPassword });
      setUserAndToken(user, token);
    },
    [setUserAndToken]
  );

  const logout = useCallback(() => {
    setUserAndToken(null, null);
  }, [setUserAndToken]);

  const value: AuthContextValue = {
    ...state,
    login,
    loginWithToken,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
