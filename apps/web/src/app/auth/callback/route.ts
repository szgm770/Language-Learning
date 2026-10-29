import { NextResponse } from "next/server";
import { serverSupabase } from "@/lib/supabase/server";

/** Finishes a magic-link or Google sign-in, then returns to the app. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/";
  // Only same-site paths, so the link cannot send people to another website.
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/";
  if (code) {
    const sb = await serverSupabase();
    const { error } = await sb.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(safeNext, url.origin));
  }
  return NextResponse.redirect(new URL("/login?error=1", url.origin));
}
