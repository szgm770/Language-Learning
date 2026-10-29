import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseAnonKey, supabaseUrl } from "../env";

/**
 * Server Supabase client acting as the signed-in user (from their session cookie).
 * It uses the public anon key, so every query is limited by row-level security.
 */
export async function serverSupabase() {
  const store = await cookies();
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          for (const { name, value, options } of list) store.set(name, value, options);
        } catch {
          // Called from a place where cookies are read-only; the browser client refreshes the session.
        }
      },
    },
  });
}
