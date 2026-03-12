import React, {
  createContext,
  useCallback,
  useContext,
  useState,
  useEffect,
  useMemo,
  ReactNode,
} from "react";
import type { UserProfile } from "@/types";
import {
  getAuthToken,
  setAuthToken,
  clearAuthToken,
  setUserProfile as storeProfile,
  getUserProfile,
  authApiRequest,
  queryClient,
} from "@/services/api";

interface AuthContextValue {
  user: UserProfile | null;
  isLoggedIn: boolean;
  isAuthLoading: boolean;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  signupWithEmail: (email: string, password: string, fullName: string) => Promise<void>;
  loginWithGoogle: (googleId: string, email: string, fullName?: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<string>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (data: { full_name?: string; phone?: string | null; gender?: string | null }) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // Load stored auth state on mount
  useEffect(() => {
    (async () => {
      try {
        const token = await getAuthToken();
        if (token) {
          const storedProfile = await getUserProfile();
          if (storedProfile) {
            setUser(storedProfile);
          }
        }
      } catch {
        // Token invalid or expired
      } finally {
        setIsAuthLoading(false);
      }
    })();
  }, []);

  const loginWithEmail = useCallback(async (email: string, password: string) => {
    const res = await authApiRequest("POST", "/api/auth/email/login", { email, password });
    if (!res.ok) {
      const data = await res.json().catch(() => ({ message: "Login failed" }));
      throw new Error(data.message || "Login failed");
    }
    const data = await res.json();
    await setAuthToken(data.token);
    await storeProfile(data.user);
    setUser(data.user);
  }, []);

  const signupWithEmail = useCallback(async (email: string, password: string, fullName: string) => {
    const res = await authApiRequest("POST", "/api/auth/email/register", {
      email,
      password,
      full_name: fullName,
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({ message: "Registration failed" }));
      throw new Error(data.message || "Registration failed");
    }
    const data = await res.json();
    await setAuthToken(data.token);
    await storeProfile(data.user);
    setUser(data.user);
  }, []);

  const loginWithGoogle = useCallback(async (googleId: string, email: string, fullName?: string) => {
    const res = await authApiRequest("POST", "/api/auth/google", {
      google_id: googleId,
      email,
      full_name: fullName,
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({ message: "Google sign-in failed" }));
      throw new Error(data.message || "Google sign-in failed");
    }
    const data = await res.json();
    await setAuthToken(data.token);
    await storeProfile(data.user);
    setUser(data.user);
  }, []);

  const forgotPassword = useCallback(async (email: string): Promise<string> => {
    const res = await authApiRequest("POST", "/api/auth/forgot-password", { email });
    if (!res.ok) {
      const data = await res.json().catch(() => ({ message: "Request failed" }));
      throw new Error(data.message || "Request failed");
    }
    const data = await res.json();
    return data.message;
  }, []);

  const logout = useCallback(async () => {
    await clearAuthToken();
    queryClient.clear();
    setUser(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    const { apiRequest } = await import("@/services/api");
    const res = await apiRequest("GET", "/api/profile");
    const profile = await res.json();
    await storeProfile(profile);
    setUser(profile);
  }, []);

  const updateProfile = useCallback(async (data: { full_name?: string; phone?: string | null; gender?: string | null }) => {
    const { apiRequest } = await import("@/services/api");
    const res = await apiRequest("PATCH", "/api/profile", data);
    const profile = await res.json();
    await storeProfile(profile);
    setUser(profile);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isLoggedIn: !!user,
      isAuthLoading,
      loginWithEmail,
      signupWithEmail,
      loginWithGoogle,
      forgotPassword,
      logout,
      refreshProfile,
      updateProfile,
    }),
    [user, isAuthLoading, loginWithEmail, signupWithEmail, loginWithGoogle, forgotPassword, logout, refreshProfile, updateProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
