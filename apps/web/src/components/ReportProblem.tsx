"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";

/** "My answer should have been accepted" — sent to the editors when signed in. */
export function ReportProblem({ courseId, exerciseId, answer }: { courseId: string; exerciseId: string; answer: string }) {
  const [state, setState] = useState<"idle" | "sent" | "unavailable">("idle");
  const sb = supabase();
  if (!sb) return null;

  async function send() {
    const { data } = await sb!.auth.getSession();
    if (!data.session) return setState("unavailable");
    const { error } = await sb!.from("content_reports").insert({
      course_id: courseId,
      exercise_id: exerciseId,
      category: "answer_rejected",
      learner_answer: answer.slice(0, 500),
    });
    setState(error ? "unavailable" : "sent");
  }

  if (state === "sent") return <p className="mt-2 text-sm">תודה, הדיווח נשלח לעורכים.</p>;
  if (state === "unavailable") return <p className="mt-2 text-sm">כדי לדווח צריך להתחבר לחשבון.</p>;
  return (
    <button type="button" onClick={send} className="mt-2 min-h-11 text-sm underline underline-offset-4">
      התשובה שלי נכונה – דיווח
    </button>
  );
}
