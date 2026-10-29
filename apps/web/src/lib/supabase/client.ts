"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cloudEnabled, supabaseAnonKey, supabaseUrl } from "../env";

let client: SupabaseClient | undefined;

/** Browser Supabase client, or undefined when cloud features are not configured. */
export function supabase(): SupabaseClient | undefined {
  if (!cloudEnabled) return undefined;
  client ??= createBrowserClient(supabaseUrl, supabaseAnonKey);
  return client;
}
