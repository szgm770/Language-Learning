"use client";

import { FirebaseError } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BackLink, Screen } from "@/components/ui";
import { cloudEnabled } from "@/lib/env";
import { firebaseAuth } from "@/lib/firebase";

const ERRORS: Record<string, string> = {
  "auth/invalid-credential": "המייל או הסיסמה לא נכונים.",
  "auth/invalid-email": "כתובת המייל לא תקינה.",
  "auth/email-already-in-use": "כבר יש חשבון עם המייל הזה. אפשר להתחבר אליו.",
  "auth/weak-password": "הסיסמה קצרה מדי. צריך לפחות 8 תווים.",
  "auth/too-many-requests": "יותר מדי ניסיונות. נסו שוב בעוד כמה דקות.",
  "auth/popup-closed-by-user": "החלון נסגר לפני שההתחברות הסתיימה.",
  "auth/network-request-failed": "אין חיבור לאינטרנט.",
};
const message = (err: unknown) =>
  (err instanceof FirebaseError && ERRORS[err.code]) || "משהו השתבש. נסו שוב.";

export default function Login() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);

  // Decided from build-time settings, so the server and the browser render the same thing.
  if (!cloudEnabled) {
    return (
      <Screen className="gap-6 pt-2">
        <BackLink href="/settings" />
        <h1 className="text-3xl font-semibold">התחברות</h1>
        <p className="text-ink-soft">ההתחברות עדיין לא פעילה באתר הזה. ההתקדמות שלכם שמורה במכשיר.</p>
      </Screen>
    );
  }

  const auth = () => firebaseAuth()!;

  async function run(fn: () => Promise<void>) {
    setBusy(true);
    setNote(null);
    try {
      await fn();
    } catch (err) {
      setNote({ ok: false, text: message(err) });
    } finally {
      setBusy(false);
    }
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    void run(async () => {
      if (mode === "signup") {
        if (password.length < 8) throw new FirebaseError("auth/weak-password", "");
        const cred = await createUserWithEmailAndPassword(auth(), email, password);
        await sendEmailVerification(cred.user).catch(() => undefined);
      } else {
        await signInWithEmailAndPassword(auth(), email, password);
      }
      router.push("/settings");
    });
  };

  return (
    <Screen className="gap-6 pt-2">
      <BackLink href="/settings" />
      <h1 className="text-3xl font-semibold">{mode === "signin" ? "התחברות" : "יצירת חשבון"}</h1>
      <p className="text-ink-soft">ההתקדמות שכבר צברתם במכשיר הזה תצטרף לחשבון.</p>

      <button
        type="button"
        className="btn-quiet"
        disabled={busy}
        onClick={() =>
          run(async () => {
            await signInWithPopup(auth(), new GoogleAuthProvider());
            router.push("/settings");
          })
        }
      >
        המשך עם Google
      </button>

      <form onSubmit={submit} className="flex flex-col gap-3">
        <label htmlFor="email" className="font-medium">
          מייל
        </label>
        <input id="email" type="email" dir="ltr" required autoComplete="email" className="field" value={email} onChange={(e) => setEmail(e.target.value)} />
        <label htmlFor="password" className="font-medium">
          סיסמה
        </label>
        <input
          id="password"
          type="password"
          dir="ltr"
          required
          minLength={mode === "signup" ? 8 : undefined}
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          className="field"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit" className="btn-primary" disabled={busy}>
          {mode === "signin" ? "התחברות" : "יצירת חשבון"}
        </button>
        <p role="status" className={`text-sm ${note?.ok ? "" : "text-rose"}`}>
          {note?.text}
        </p>
      </form>

      <div className="flex flex-wrap justify-between gap-2 text-cobalt">
        <button type="button" className="min-h-11" onClick={() => setMode(mode === "signin" ? "signup" : "signin")}>
          {mode === "signin" ? "אין לכם חשבון? יצירת חשבון" : "כבר יש לכם חשבון? התחברות"}
        </button>
        {mode === "signin" && (
          <button
            type="button"
            className="min-h-11"
            onClick={() =>
              run(async () => {
                if (!email) throw new FirebaseError("auth/invalid-email", "");
                await sendPasswordResetEmail(auth(), email);
                setNote({ ok: true, text: "אם יש חשבון עם המייל הזה, שלחנו אליו קישור לאיפוס סיסמה." });
              })
            }
          >
            שכחתי סיסמה
          </button>
        )}
      </div>
    </Screen>
  );
}
