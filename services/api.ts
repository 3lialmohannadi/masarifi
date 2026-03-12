import { fetch } from "expo/fetch";
import { Platform } from "react-native";
import { QueryClient, QueryFunction } from "@tanstack/react-query";

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

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

function isRetryableError(error: unknown): boolean {
  if (error instanceof TypeError) return true;
  if (error instanceof Error) {
    const msg = error.message;
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
    const headers: Record<string, string> = {};
    if (data) headers["Content-Type"] = "application/json";
    if (extraHeaders) Object.assign(headers, extraHeaders);

    return fetch(url.toString(), {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
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

    const res = await fetch(url.toString(), {});

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
