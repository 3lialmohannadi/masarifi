import { useCallback, useState } from "react";
import { useAuth } from "@/store/AuthContext";

const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;

/** Decode a JWT payload without verifying signature (client-side only). */
function decodeIdToken(token: string): { sub: string; email: string; name?: string } {
  const payload = token.split(".")[1];
  const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
  return JSON.parse(json);
}

/**
 * Google Auth hook. Lazy-loads expo-auth-session on sign-in to avoid
 * crashing on web where expo-crypto native module is unavailable.
 */
export function useGoogleAuth() {
  const { loginWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);

  const signIn = useCallback(async () => {
    if (!GOOGLE_CLIENT_ID) {
      throw new Error("GOOGLE_CLIENT_ID_MISSING");
    }

    setLoading(true);
    try {
      // Dynamic imports — only loaded when user actually taps Google Sign-In
      const Google = await import("expo-auth-session/providers/google");
      const { makeRedirectUri, AuthRequest, ResponseType } = await import("expo-auth-session");
      const WebBrowser = await import("expo-web-browser");
      WebBrowser.maybeCompleteAuthSession();

      const redirectUri = makeRedirectUri({ scheme: "masarifi" });
      const request = new AuthRequest({
        clientId: GOOGLE_CLIENT_ID,
        redirectUri,
        scopes: ["openid", "profile", "email"],
        responseType: ResponseType.IdToken,
      });

      const result = await request.promptAsync(Google.discovery);

      if (result.type === "success" && result.params.id_token) {
        const { sub, email, name } = decodeIdToken(result.params.id_token);
        await loginWithGoogle(sub, email, name);
      }
    } finally {
      setLoading(false);
    }
  }, [loginWithGoogle]);

  const isConfigured = !!GOOGLE_CLIENT_ID;

  return { signIn, loading, isConfigured, request: null };
}
