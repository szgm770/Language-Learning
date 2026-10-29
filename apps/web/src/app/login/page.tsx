"use client";

import { useState } from "react";
import { BackLink, Screen } from "@/components/ui";
import { cloudEnabled } from "@/lib/env";
import { supabase } from "@/lib/supabase/client";

export default function Login() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const callback = typeof window === "undefined" ? "" : `${location.origin}/auth/callback?next=/settings`;

  if (!cloudEnabled) {
    return (
      <Screen className="gap-6 pt-2">
        <BackLink href="/settings" />
        <h1 className="text-3xl font-semibold">התחברות</h1>
        <p className="text-ink-soft">ההתחברות עדיין לא פעילה באתר הזה. ההתקדמות שלכם שמורה במכשיר.</p>
      </Screen>
    );
  }

  async function sendLink(e: React.FormEvent) {
    e.preventDefault();
    setState("sending");
    const { error } = await supabase()!.auth.signInWithOtp({ email, options: { emailRedirectTo: callback } });
    setState(error ? "error" : "sent");
  }

  return (
    <Screen className="gap-6 pt-2">
      <BackLink href="/settings" />
      <h1 className="text-3xl font-semibold">התחברות או הרשמה</h1>
      <p className="text-ink-soft">ההתקדמות שכבר צברתם במכשיר הזה תצטרף לחשבון.</p>

      <button
        type="button"
        className="btn-quiet"
        onClick={() => supabase()!.auth.signInWithOAuth({ provider: "google", options: { redirectTo: callback } })}
      >
        המשך עם Google
      </button>

      <form onSubmit={sendLink} className="flex flex-col gap-3">
        <label htmlFor="email" className="font-medium">
          או קישור כניסה למייל
        </label>
        <input
          id="email"
          type="email"
          dir="ltr"
          required
          autoComplete="email"
          className="field"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button type="submit" className="btn-primary" disabled={state === "sending"}>
          שליחת קישור כניסה
        </button>
        <p role="status" className="text-sm">
          {state === "sent" && "שלחנו קישור לכתובת הזו. פתחו אותו מהמכשיר הזה כדי להיכנס."}
          {state === "error" && "לא הצלחנו לשלוח את הקישור. בדקו את הכתובת ונסו שוב בעוד דקה."}
        </p>
      </form>
    </Screen>
  );
}
