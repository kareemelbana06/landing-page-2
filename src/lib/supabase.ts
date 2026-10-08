import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let supabase: SupabaseClient | undefined;

export function getSupabaseClient() {
  if (!supabase) {
    const url = import.meta.env.VITE_SUPABASE_URL;
    const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    if (!url || !publishableKey) {
      throw new Error("Supabase environment variables are not configured");
    }

    supabase = createClient(url, publishableKey);
  }

  return supabase;
}
