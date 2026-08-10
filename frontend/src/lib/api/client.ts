/**
 * Camada de API — cliente HTTP base.
 *
 * - Injeta Authorization: Bearer <token> em toda requisição autenticada
 * - Sempre usa credentials: "include" (necessário para o cookie bp.refresh)
 * - Trata o formato de erro padrão { error: { code, message, details } }
 * - Refresh automático: ao receber 401, tenta POST /api/auth/refresh uma vez;
 *   se falhar, limpa o token e despacha o evento "auth:logout" para o AuthContext.
 */

const API_URL = (import.meta.env["VITE_API_URL"] as string | undefined) ?? "http://localhost:3001";

// ─── Token store ──────────────────────────────────────────────────────────────
// Mantido em memória + persistido em localStorage para sobreviver a reloads.

const TOKEN_KEY = "bp.token";

let _accessToken: string | null = null;

if (typeof window !== "undefined") {
  _accessToken = localStorage.getItem(TOKEN_KEY);
}

export function getToken(): string | null {
  return _accessToken;
}

export function setToken(token: string): void {
  _accessToken = token;
  if (typeof window !== "undefined") {
    localStorage.setItem(TOKEN_KEY, token);
  }
}

export function clearToken(): void {
  _accessToken = null;
  if (typeof window !== "undefined") {
    localStorage.removeItem(TOKEN_KEY);
  }
}

// ─── Erro tipado ──────────────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function parseApiError(res: Response): Promise<ApiError> {
  try {
    const body = (await res.json()) as {
      error?: { code?: string; message?: string; details?: unknown };
    };
    return new ApiError(
      body.error?.code ?? "UNKNOWN_ERROR",
      body.error?.message ?? "Erro desconhecido.",
      res.status,
      body.error?.details,
    );
  } catch {
    return new ApiError("NETWORK_ERROR", "Erro de rede ou resposta inválida.", res.status);
  }
}

// ─── Refresh automático ───────────────────────────────────────────────────────
// Garante que apenas uma chamada de refresh acontece por vez (sem corrida).

let _refreshPromise: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
  if (_refreshPromise) return _refreshPromise;

  _refreshPromise = (async () => {
    try {
      const res = await fetch(`${API_URL}/api/auth/refresh`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        clearToken();
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("auth:logout"));
        }
        return false;
      }
      const data = (await res.json()) as { token: string };
      setToken(data.token);
      return true;
    } catch {
      clearToken();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("auth:logout"));
      }
      return false;
    } finally {
      _refreshPromise = null;
    }
  })();

  return _refreshPromise;
}

// ─── Fetch principal ──────────────────────────────────────────────────────────

type FetchOptions = Omit<RequestInit, "credentials"> & {
  /** Se true, não injeta Authorization nem tenta refresh automático (ex.: login, register). */
  skipAuth?: boolean;
};

export async function apiFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { skipAuth = false, headers: extraHeaders, ...rest } = options;

  const buildHeaders = (token: string | null): Record<string, string> => ({
    // Só envia Content-Type: application/json quando há body — evita 400 do Fastify em PATCH sem body
    ...(rest.body !== undefined ? { "Content-Type": "application/json" } : {}),
    ...(extraHeaders as Record<string, string>),
    ...(!skipAuth && token ? { Authorization: `Bearer ${token}` } : {}),
  });

  const doFetch = (token: string | null) =>
    fetch(`${API_URL}${path}`, {
      ...rest,
      credentials: "include",
      headers: buildHeaders(token),
    });

  let res = await doFetch(_accessToken);

  // Tenta refresh uma vez em caso de 401 em rota protegida
  if (res.status === 401 && !skipAuth) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      res = await doFetch(_accessToken);
    } else {
      throw new ApiError(
        "UNAUTHORIZED",
        "Sessão expirada. Faça login novamente.",
        401,
      );
    }
  }

  if (!res.ok) {
    throw await parseApiError(res);
  }

  // 204 No Content — sem body
  if (res.status === 204) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}
