import * as AUTH from "./auth.js";

export async function getItems() {
  try {
    // 1️⃣ Get current session
    const { data: sessionData, error: sessionError } = await AUTH.getSession();
    if (sessionError) console.error("Session error:", sessionError);

    console.log("DEBUG SESSION OBJECT:", sessionData);
    const session = sessionData?.session;

    if (!session) {
      console.warn("No active session found!");
      return [];
    }

    console.log("DEBUG USER ID:", session.user.id);
    console.log("DEBUG ACCESS TOKEN:", session.access_token);

    // 2️⃣ Fetch rows from testhouse
    const { data, error } = await AUTH.supabase
      .from("testhouse")
      .select("*");

    if (error) {
      console.error("Fetch error:", error);
      return [];
    }

    console.log("Fetched items (should respect RLS):", data);
    return data;

  } catch (err) {
    console.error("Unexpected error in getItems():", err);
    return [];
  }
}