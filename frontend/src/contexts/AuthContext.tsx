import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  apiLogin,
  apiRegister,
  apiLogout,
  apiMe,
  apiForgotPassword,
  apiResetPassword,
} from "../lib/api/auth";
import { getToken, clearToken } from "../lib/api/client";
import type { MockUser } from "../lib/mock/users";

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

type AuthContextValue = {
  user: MockUser | null;
  status: AuthStatus;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: { name: string; email: string; password: string }) => Promise<void>;
  logout: () => void;
  requestPasswordReset: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
  updateProfile: (patch: Partial<MockUser>) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<MockUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  // ── Hidratação de sessão ─────────────────────────────────────────────────────
  // Tenta GET /api/auth/me com o token em localStorage.
  // O client.ts faz refresh automático se o access token estiver expirado.
  // Se tudo falhar → unauthenticated.
  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      if (!getToken()) {
        setStatus("unauthenticated");
        return;
      }
      try {
        const me = await apiMe();
        if (!cancelled) {
          setUser(me);
          setStatus("authenticated");
        }
      } catch {
        if (!cancelled) {
          clearToken();
          setUser(null);
          setStatus("unauthenticated");
        }
      }
    }

    void hydrate();
    return () => { cancelled = true; };
  }, []);

  // ── Logout forçado pelo client (refresh falhou durante navegação) ─────────────
  useEffect(() => {
    function handleForcedLogout() {
      setUser(null);
      setStatus("unauthenticated");
    }
    window.addEventListener("auth:logout", handleForcedLogout);
    return () => window.removeEventListener("auth:logout", handleForcedLogout);
  }, []);

  // ── Ações ────────────────────────────────────────────────────────────────────

  const login = useCallback(async (email: string, password: string) => {
    const u = await apiLogin(email, password);
    setUser(u);
    setStatus("authenticated");
  }, []);

  const register = useCallback(
    async (payload: { name: string; email: string; password: string }) => {
      const u = await apiRegister(payload);
      setUser(u);
      setStatus("authenticated");
    },
    [],
  );

  const logout = useCallback(async () => {
    try {
      await apiLogout();
    } finally {
      setUser(null);
      setStatus("unauthenticated");
    }
  }, []);

  const requestPasswordReset = useCallback(async (email: string) => {
    await apiForgotPassword(email);
  }, []);

  const resetPassword = useCallback(async (token: string, newPassword: string) => {
    await apiResetPassword(token, newPassword);
  }, []);

  // Otimista local — será substituído quando /api/users/me for implementado
  const updateProfile = useCallback((patch: Partial<MockUser>) => {
    setUser((prev) => (prev ? { ...prev, ...patch } : prev));
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      status,
      login,
      register,
      logout,
      requestPasswordReset,
      resetPassword,
      updateProfile,
    }),
    [user, status, login, register, logout, requestPasswordReset, resetPassword, updateProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de <AuthProvider>");
  return ctx;
}
