import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://ywfoqrrssuzyluppunov.supabase.co";
const SUPABASE_KEY = "sb_publishable_esATBUBHKZlatDp4zmnYGA_S1uF8i53";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export async function signUp(email, password) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data;
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export function getSession() {
  return supabase.auth.getSession();
}

export function onAuthChange(callback) {
  supabase.auth.onAuthStateChange(callback);
}