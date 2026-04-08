import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/*
 * --- SUPABASE CLIENT INITIALIZATION ---
 * Creates a Supabase client instance using the project URL and public key.
 * Exposes it both as a module export and on `window` for global access.
 */
const SUPABASE_URL = "https://ywfoqrrssuzyluppunov.supabase.co";
const SUPABASE_KEY = "sb_publishable_esATBUBHKZlatDp4zmnYGA_S1uF8i53";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
window.supabase = supabase;


/*
 * --- AUTHENTICATION FUNCTIONS ---
 * These functions wrap Supabase auth methods and provide a simple API
 * for signing up, signing in, signing out, retrieving the session,
 * and subscribing to auth state changes.
 */

/**
 * Registers a new user with email and password.
 * @param {string} email - User's email address.
 * @param {string} password - User's chosen password.
 * @returns {Promise<object>} - Supabase auth data object.
 * @throws Will throw an error if sign up fails.
 */
export async function signUp(email, password) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error; // propagate error to caller
  return data;
}

/**
 * Signs in an existing user using email and password.
 * @param {string} email - User's email address.
 * @param {string} password - User's password.
 * @returns {Promise<object>} - Supabase auth data object.
 * @throws Will throw an error if login fails.
 */
export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

/**
 * Logs out the currently authenticated user.
 * @returns {Promise<void>}
 * @throws Will throw an error if logout fails.
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/**
 * Retrieves the current authentication session.
 * @returns {Promise<object>} - Contains session data and user info if logged in.
 */
export async function getSession() {
  console.log("getting session: ", await supabase.auth.getSession());
  return supabase.auth.getSession();
}

/**
 * Registers a callback function to run whenever the authentication state changes.
 * @param {function} callback - Function receiving (event, session) on auth changes.
 */
export function onAuthChange(callback) {
  supabase.auth.onAuthStateChange(callback);
}
