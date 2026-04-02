import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  "https://ywfoqrrssuzyluppunov.supabase.co",
  "sb_publishable_esATBUBHKZlatDp4zmnYGA_S1uF8i53"
);

export async function getItems() {
  const { data, error } = await supabase
    .from("testHouse")
    .select("*");

  if (error) console.error(error);
  return data;
}