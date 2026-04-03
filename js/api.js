import { createClient } from "https://esm.sh/@supabase/supabase-js@2";


const SUPABASE_URL = "https://ywfoqrrssuzyluppunov.supabase.co";
const SUPABASE_KEY = "sb_publishable_esATBUBHKZlatDp4zmnYGA_S1uF8i53";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// fetch all items
export async function getItems() {
    const { data, error } = await supabase.from("testHouse").select("*");
    if (error) console.error(error);
    return data;
}