export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/** Cloud features (sign-in, sync) are on only when a Supabase project is configured. */
export const cloudEnabled = supabaseUrl !== "" && supabaseAnonKey !== "";
