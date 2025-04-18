import { createClient } from "@supabase/supabase-js";
import { auth } from "./config";

const supabaseUrl = process.env.REACT_APP_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_PUBLIC_SUPABASE_KEY;

const correctedSupabaseUrl = supabaseUrl.replace("/storage/v1/s3", "");

let supabase = createClient(correctedSupabaseUrl, supabaseKey);

export async function updateSupabaseClient() {
  const user = auth.currentUser;
  if (user) {
    supabase = createClient(correctedSupabaseUrl, supabaseKey, {
      global: {
        headers: {
          Authorization: `Bearer ${user.uid}`,
        },
      },
    });
  }
  return supabase;
}

export default supabase;
