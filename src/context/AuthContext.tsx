import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getStoredToken, setStoredToken, clearStoredToken } from '../Services/api';
import { verifyOtp } from '../Services/mobile-api';
import { mobile_siteConfig } from '../Services/mobile-siteConfig';
import type { AuthUser } from '../types';

const TOKEN_KEY = '@school_app_token';
const USER_KEY = '@school_app_user';

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isLoggedIn: boolean;
  isReady: boolean;
}

interface AuthContextType extends AuthState {
  login: (mobile: string, otp: string) => Promise<boolean>;
  logout: () => Promise<void>;
  setUser: (user: AuthUser | null) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isLoggedIn: false,
    isReady: false,
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [token, userJson] = await Promise.all([
          getStoredToken(),
          AsyncStorage.getItem(USER_KEY),
        ]);
        if (token) {
          await AsyncStorage.setItem(mobile_siteConfig.MOB_ACCESS_TOKEN_KEY, JSON.stringify(token));
        }
        if (!cancelled) {
          const user = userJson ? (JSON.parse(userJson) as AuthUser) : null;
          setState({
            token,
            user,
            isLoggedIn: !!(token || user?.mobile),
            isReady: true,
          });
        }
      } catch {
        if (!cancelled) setState((s) => ({ ...s, isReady: true }));
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const login = useCallback(async (mobile: string, otp: string): Promise<boolean> => {
    const m = mobile.replace(/\D/g, '');
    if (m.length < 10) return false;
    if (otp.length < 4) return false;
    try {
      const res = await verifyOtp(mobile, otp) as { token?: string; user?: AuthUser; message?: string };
      const token = res?.token;
      const user = res?.user ?? { mobile: m };
      if (!token) return false;
      await Promise.all([
        setStoredToken(token),
        AsyncStorage.setItem(USER_KEY, JSON.stringify(user)),
        AsyncStorage.setItem(mobile_siteConfig.MOB_ACCESS_TOKEN_KEY, JSON.stringify(token)),
      ]);
      setState({ token, user, isLoggedIn: true, isReady: true });
      return true;
    } catch {
      return false;
    }
  }, []);

  const logout = useCallback(async () => {
    await clearStoredToken();
    await AsyncStorage.removeItem(USER_KEY);
    await AsyncStorage.removeItem(mobile_siteConfig.MOB_ACCESS_TOKEN_KEY);
    setState({ token: null, user: null, isLoggedIn: false, isReady: true });
  }, []);

  const setUser = useCallback((user: AuthUser | null) => {
    setState((s) => ({ ...s, user }));
    if (user) AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
  }, []);

  const value: AuthContextType = {
    ...state,
    login,
    logout,
    setUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
