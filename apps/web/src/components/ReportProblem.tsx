"use client";

import { useState } from "react";
import { cloudEnabled } from "@/lib/env";
import { authedFetch, currentUser } from "@/lib/firebase";

/** "My answer should have been accepted" — sent to the editors when signed in. */
export function ReportProblem({ courseId, exerciseId, answer }: { courseId: string; exerciseId: string; answer: string }) {
  const [state, setState] = useState<"idle" | "sent" | "unavailable">("idle");
  if (!cloudEnabled) return null;

  async function send() {
    if (!(await currentUser())) return setState("unavailable");
    const res = await authedFetch("/api/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseId, exerciseId, category: "answer_rejected", learnerAnswer: answer.slice(0, 500) }),
    }).catch(() => null);
    setState(res?.ok ? "sent" : "unavailable");
  }

  if (state === "sent") return <p className="mt-2 text-sm">תודה, הדיווח נשלח לעורכים.</p>;
  if (state === "unavailable") return <p className="mt-2 text-sm">כדי לדווח צריך להתחבר לחשבון.</p>;
  return (
    <button type="button" onClick={send} className="mt-2 min-h-11 text-sm underline underline-offset-4">
      התשובה שלי נכונה – דיווח
    </button>
  );
}
