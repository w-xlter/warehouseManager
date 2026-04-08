import * as AUTH from "./auth.js";

export async function getItems() {
  try {
    // Get current session
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

    // Fetch rows from testhouse
    const { data, error } = await AUTH.supabase
      .from("testhouse")
      .select("*");

    if (error) {
      console.error("Fetch error:", error);
      return [];
    }

    console.log("Fetched items:", data);
    return data;

  } catch (err) {
    console.error("Unexpected error in getItems():", err);
    return [];
  }
}

export async function updateRowById(table, id, updates) {
    console.log("trying to update table ", table, "with id ", id, ", update: ", updates);
  return await supabase
    .from(table)
    .update(updates)
    .eq("id", id);
}


export async function insertRow(table, values) {
    console.log(table, values)
  return await supabase
    .from(table)
    .insert(values)
    .select()
    .single();
}