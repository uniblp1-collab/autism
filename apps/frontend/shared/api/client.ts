import { useAuthStore } from "../../store/authStore";

// Относительный путь того же origin: браузер шлёт запрос на /api/..., Next.js проксирует его
// на backend (см. next.config.js rewrites). Абсолютный адрес backend больше не нужен фронтенду.
const API_URL = "/api";

export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly code?: string,
  ) {
    super(message);
  }
}

async function parseError(response: Response): Promise<ApiError> {
  const body = await response.json().catch(() => ({ message: response.statusText }));
  const message = Array.isArray(body.message) ? body.message.join(", ") : (body.message ?? "Ошибка запроса");
  return new ApiError(response.status, message, body.code);
}

async function refreshSession(): Promise<boolean> {
  const { refreshToken, user, setSession, clear } = useAuthStore.getState();
  if (!refreshToken) return false;

  const response = await fetch(`${API_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) {
    clear();
    return false;
  }

  const data = await response.json();
  setSession({ user: data.user ?? user, accessToken: data.accessToken, refreshToken: data.refreshToken });
  return true;
}

export async function apiFetch<T>(path: string, options: RequestInit = {}, retry = true): Promise<T> {
  const { accessToken } = useAuthStore.getState();
  // FormData (загрузка файлов) — браузер сам проставляет Content-Type с boundary,
  // явный "application/json" здесь сломал бы multipart-запрос.
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...options.headers,
    },
  });

  if (response.status === 401 && retry) {
    const refreshed = await refreshSession();
    if (refreshed) {
      return apiFetch<T>(path, options, false);
    }
  }

  if (!response.ok) {
    throw await parseError(response);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}
