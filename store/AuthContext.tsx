import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/src/lib/supabase";
import { setAuthToken } from "@/services/api";
import { getProfile } from "@/src/lib/profileService";

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  isAuthLoading: boolean;
  displayName: string | null;
  setDisplayName: (name: string | null) => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [displayName, setDisplayName] = useState<string | null>(null);

  const resolveDisplayName = useCallback(async (u: User | null) => {
    if (!u) {
      setDisplayName(null);
      return;
    }
    try {
      const profile = await getProfile(u.id);
      if (profile?.full_name) {
        setDisplayName(profile.full_name.split(" ")[0]);
        return;
      }
    } catch {}
    const meta = u.user_metadata?.full_name as string | undefined;
    setDisplayName(meta?.split(" ")[0] || u.email?.split("@")[0] || null);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setAuthToken(session?.access_token ?? null);
      resolveDisplayName(session?.user ?? null);
      setIsAuthLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setAuthToken(session?.access_token ?? null);
      resolveDisplayName(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [resolveDisplayName]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setAuthToken(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, isAuthLoading, displayName, setDisplayName, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
