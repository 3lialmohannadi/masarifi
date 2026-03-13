import { supabase } from "./supabase";

export interface Profile {
  id: string;
  user_id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  gender: string | null;
  created_at: string;
  updated_at: string;
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error) return null;
  return data as Profile;
}

export async function createProfile(
  userId: string,
  email: string
): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .upsert(
      { user_id: userId, email },
      { onConflict: "user_id" }
    )
    .select()
    .single();

  if (error) return null;
  return data as Profile;
}

export async function updateProfile(
  userId: string,
  updates: Partial<Pick<Profile, "full_name" | "phone" | "gender" | "email">>
): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("user_id", userId)
    .select()
    .single();

  if (error) return null;
  return data as Profile;
}
