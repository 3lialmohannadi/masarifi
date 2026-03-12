import { useEffect, useCallback, useState } from "react";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import { useAuth } from "@/store/AuthContext";

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;

/** Decode a JWT payload without verifying signature (client-side only). */
function decodeIdToken(token: string): { sub: string; email: string; name?: string } {
  const payload = token.split(".")[1];
  const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
  return JSON.parse(json);
}

export function useGoogleAuth() {
  const { loginWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: GOOGLE_CLIENT_ID,
    webClientId: GOOGLE_CLIENT_ID,
  });

  useEffect(() => {
    if (response?.type !== "success") return;

    const idToken = response.params.id_token;
    if (!idToken) return;

    (async () => {
      setLoading(true);
      try {
        const { sub, email, name } = decodeIdToken(idToken);
        await loginWithGoogle(sub, email, name);
      } finally {
        setLoading(false);
      }
    })();
  }, [response, loginWithGoogle]);

  const signIn = useCallback(() => {
    if (!GOOGLE_CLIENT_ID) {
      throw new Error("GOOGLE_CLIENT_ID_MISSING");
    }
    return promptAsync();
  }, [promptAsync]);

  const isConfigured = !!GOOGLE_CLIENT_ID;

  return { signIn, loading, isConfigured, request };
}
