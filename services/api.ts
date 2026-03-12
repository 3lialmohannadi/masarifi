import { fetch } from "expo/fetch";
import { Platform } from "react-native";
import { QueryClient, QueryFunction } from "@tanstack/react-query";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { UserProfile } from "@/types";

const AUTH_TOKEN_KEY = "@masarifi/auth_token";
const USER_PROFILE_KEY = "@masarifi/user_profile";

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
  await AsyncStorage.removeItem(USER_PROFILE_KEY);
}

/** Store the user profile */
export async function setUserProfile(profile: UserProfile): Promise<void> {
  await AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));
}

/** Retrieve the stored user profile */
export async function getUserProfile(): Promise<UserProfile | null> {
  const raw = await AsyncStorage.getItem(USER_PROFILE_KEY);
  if (!raw) return null;
  return JSON.parse(raw);
}

/**
 * Check if user has a stored auth token (is logged in).
 */
export async function isAuthenticated(): Promise<boolean> {
  const token = await getAuthToken();
  return !!token;
}

/** Clear cached auth state so the next ensureAuthenticated() re-checks */
export function resetAuth(): void {
  // No-op: auth is now managed by AuthContext
}

/** Backwards-compatible: resolves immediately if token exists */
export async function ensureAuthenticated(): Promise<void> {
  const token = await getAuthToken();
  if (!token) {
    throw new Error("Not authenticated");
  }
}

/** Auth API calls that don't require a token */
export async function authApiRequest(
  method: string,
  route: string,
  data?: unknown,
): Promise<Response> {
  const baseUrl = getApiUrl();
  const url = new URL(route, baseUrl);

  return fetch(url.toString(), {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
  });
}

export function getApiUrl(): string {
  // On web, use the current page origin so API calls go to the same server
  if (Platform.OS === "web" && typeof window !== "undefined" && window.location) {
    return window.location.origin + "/";
  }

  // On mobile (iOS/Android), use the configured domain
  let host = process.env.EXPO_PUBLIC_DOMAIN;

  if (!host) {
    throw new Error("EXPO_PUBLIC_DOMAIN is not set");
  }

  const protocol = host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https";
  let url = new URL(`${protocol}://${host}`);

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
  extraHeaders?: Record<string, string>,
): Promise<Response> {
  const baseUrl = getApiUrl();
  const url = new URL(route, baseUrl);

  async function doFetch(): Promise<Response> {
    const token = await getAuthToken();
    const headers: Record<string, string> = {};
    if (data) headers["Content-Type"] = "application/json";
    if (token) headers["Authorization"] = `Bearer ${token}`;
    if (extraHeaders) Object.assign(headers, extraHeaders);

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
    const baseUrl = getApiUrl();
    const url = new URL(queryKey.join("/") as string, baseUrl);

    const token = await getAuthToken();
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(url.toString(), { credentials: "include", headers });

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
