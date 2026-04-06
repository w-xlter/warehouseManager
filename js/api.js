import { supabase } from "./auth.js";

export {supabase};

// fetch all items
export async function getItems() {
  const { data: sessionData } = await supabase.auth.getSession();
  console.log("Supabase auth session resolved:", sessionData?.session?.user?.id);

  const { data, error } = await supabase
    .from("testhouse")
    .select("*");

  console.log("data func:", data, error);
  if (error) {
    console.error(error);
    return [];
  }
  return data;
}