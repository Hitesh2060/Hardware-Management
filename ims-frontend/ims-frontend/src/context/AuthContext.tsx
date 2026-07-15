import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { authApi } from '@/api/auth';
import { api, setAccessToken } from '@/lib/api';
import type { User } from '@/types';

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (code: string) => boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// SECURITY NOTE: the access token lives only in memory (see lib/api.ts),
// never localStorage/sessionStorage — that would be readable by any XSS
// payload. The refresh token is an httpOnly cookie the browser attaches
// automatically; JS on this page never sees it. On a hard refresh we lose
// the in-memory access token, so we silently call /auth/refresh-token once
// on mount to get a new one from the cookie.
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [permissions, setPermissions] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.post('/auth/refresh-token');
        setAccessToken(data.data.accessToken);
        const me = await authApi.me();
        setUser(me);
        setPermissions((me as any).permissions || []);
      } catch {
        setAccessToken(null);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  async function login(email: string, password: string) {
    const { accessToken, user: loggedInUser } = await authApi.login(email, password);
    setAccessToken(accessToken);
    setUser(loggedInUser);
    const me = await authApi.me();
    setPermissions((me as any).permissions || []);
  }

  async function logout() {
    try {
      await authApi.logout();
    } finally {
      setAccessToken(null);
      setUser(null);
      setPermissions([]);
    }
  }

  function hasPermission(code: string) {
    return permissions.includes(code);
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
