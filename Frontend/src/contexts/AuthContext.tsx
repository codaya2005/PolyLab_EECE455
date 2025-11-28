import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { getProfile, logout as apiLogout, UserProfile } from "@/lib/api";

type AuthState = {
  user: UserProfile | null;
  loading: boolean;
  refresh: () => Promise<UserProfile | null>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async (): Promise<UserProfile | null> => {
    try {
      const u = await getProfile();
      setUser(u);
      return u;
    } catch {
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiLogout();
    } catch {
      // ignore network errors on logout
    } finally {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    // Try to hydrate user on load; if it fails, continue unauthenticated
    refresh();
  }, [refresh]);

  return (
    <AuthContext.Provider value={{ user, loading, refresh, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
