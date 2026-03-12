import { fetch } from "expo/fetch";
import { QueryClient, QueryFunction } from "@tanstack/react-query";
import AsyncStorage from "@react-native-async-storage/async-storage";

const AUTH_TOKEN_KEY = "@masarifi/auth_token";

/** Store the auth token after login/register */
export async function setAuthToken(token: string): Promise<void> {
  await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
}

/** Retrieve the stored auth token */
export async function getAuthToken(): Promise<string | null> {
  return AsyncStorage.getItem(AUTH_TOKEN_KEY);
}

/** Clear the auth token on logout */
export async function clearAuthToken(): Promise<void> {
  await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
}

/**
 * Ensure the app is authenticated.
 * If no token is stored, auto-login as the default user.
 * If login fails (user doesn't exist yet), auto-register first.
 */
let authPromise: Promise<void> | null = null;
export function ensureAuthenticated(): Promise<void> {
  if (!authPromise) {
    authPromise = doEnsureAuth();
  }
  return authPromise;
}

/** Clear cached auth state so the next ensureAuthenticated() re-authenticates */
export function resetAuth(): void {
  authPromise = null;
}

async function doEnsureAuth(): Promise<void> {
  const existing = await getAuthToken();
  if (existing) return;

  await performLogin();
}

async function performLogin(): Promise<void> {
  const baseUrl = getApiUrl();
  const credentials = { username: "default", password: "default" };

  // Try login first
  let res = await fetch(new URL("/api/auth/login", baseUrl).toString(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });

  // If login fails, try register
  if (!res.ok) {
    res = await fetch(new URL("/api/auth/register", baseUrl).toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });
  }

  if (res.ok) {
    const data = await res.json();
    if (data.token) {
      await setAuthToken(data.token);
    }
  }
}

export function getApiUrl(): string {
  let host = process.env.EXPO_PUBLIC_DOMAIN;

  if (!host) {
    throw new Error("EXPO_PUBLIC_DOMAIN is not set");
  }

  let url = new URL(`https://${host}`);

  return url.href;
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

/**
 * Retry configuration for API requests.
 * Uses exponential backoff: 1s, 2s, 4s
 */
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

function isRetryableError(error: unknown): boolean {
  if (error instanceof TypeError) return true; // Network error
  if (error instanceof Error) {
    const msg = error.message;
    // Retry on network/server errors, not on client errors (4xx)
    if (msg.startsWith("4")) return false;
    if (msg.startsWith("5") || msg.includes("network") || msg.includes("fetch")) return true;
  }
  return false;
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function apiRequest(
  method: string,
  route: string,
  data?: unknown | undefined,
): Promise<Response> {
  await ensureAuthenticated();
  const baseUrl = getApiUrl();
  const url = new URL(route, baseUrl);

  async function doFetch(): Promise<Response> {
    const token = await getAuthToken();
    const headers: Record<string, string> = {};
    if (data) headers["Content-Type"] = "application/json";
    if (token) headers["Authorization"] = `Bearer ${token}`;

    return fetch(url.toString(), {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });
  }

  let lastError: unknown;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await doFetch();

      // If 401, the stored token is stale — re-authenticate and retry once
      if (res.status === 401) {
        await clearAuthToken();
        resetAuth();
        await ensureAuthenticated();
        const retryRes = await doFetch();
        await throwIfResNotOk(retryRes);
        return retryRes;
      }

      await throwIfResNotOk(res);
      return res;
    } catch (error) {
      lastError = error;
      if (attempt < MAX_RETRIES && isRetryableError(error)) {
        await sleep(BASE_DELAY_MS * Math.pow(2, attempt));
        continue;
      }
      throw error;
    }
  }

  throw lastError;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    await ensureAuthenticated();
    const baseUrl = getApiUrl();
    const url = new URL(queryKey.join("/") as string, baseUrl);

    async function doFetch(): Promise<Response> {
      const token = await getAuthToken();
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      return fetch(url.toString(), { credentials: "include", headers });
    }

    let res = await doFetch();

    // If 401 and token might be stale, re-authenticate and retry
    if (res.status === 401) {
      await clearAuthToken();
      resetAuth();
      await ensureAuthenticated();
      res = await doFetch();
    }

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
