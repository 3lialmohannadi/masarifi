import { useAuth } from "@/store/AuthContext";

const DEFAULT_USER_ID = "00000000-0000-0000-0000-000000000000";

/**
 * Returns the current authenticated user's ID.
 * Falls back to DEFAULT_USER_ID when not signed in,
 * so existing API calls continue to work unchanged.
 */
export function useAuthUser() {
  const { user } = useAuth();
  return {
    userId: user?.id ?? DEFAULT_USER_ID,
    isAuthenticated: !!user,
    user,
  };
}
