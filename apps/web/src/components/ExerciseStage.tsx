"use client";

import { type Exercise, isGraded } from "@lingo/content-schema";
import { type Evaluation, type Response, RuleEvaluator } from "@lingo/engine";
import { useCallback, useEffect, useRef, useState } from "react";
import { sfx } from "@/lib/sfx";
import { ExerciseView, type ExerciseContext } from "./exercises";
import { Icon } from "./icons";
import { Word } from "./ui";

const evaluator = new RuleEvaluator();

const PRAISE = ["מצוין!", "נכון!", "יפה מאוד!", "בדיוק!", "כל הכבוד!"];
const VERDICT_TEXT: Record<Exclude<Evaluation["verdict"], "correct">, string> = {
  accent: "נכון, רק שימו לב לסימנים:",
  typo: "כמעט מושלם. שימו לב לאיות:",
  wrong: "התשובה הנכונה:",
};

/**
 * One step of a lesson.
 * Graded steps: answer → "Check" → feedback → "Continue". Reading steps: just "Continue".
 * Enter works for every button.
 */
export function ExerciseStage({
  ex,
  ctx,
  onResult,
  onContinue,
}: {
  ex: Exercise;
  ctx: ExerciseContext;
  courseId?: string;
  onResult: (evaluation: Evaluation, durationMs: number) => void;
  onContinue: () => void;
}) {
  const graded = isGraded(ex);
  const [response, setResponse] = useState<Response | null>(null);
  const [result, setResult] = useState<Evaluation | null>(null);
  const shownAt = useRef(Date.now());
  const continueRef = useRef<HTMLButtonElement>(null);
  const [praise] = useState(() => PRAISE[Math.floor(Math.random() * PRAISE.length)]!);

  const check = useCallback(
    (r: Response | null = response) => {
      if (!r || result) return;
      const evaluation = evaluator.evaluate(ex, r, ctx);
      setResult(evaluation);
      if (evaluation.correct) sfx.correct();
      else sfx.wrong();
      onResult(evaluation, Date.now() - shownAt.current);
    },
    [ex, ctx, response, result, onResult],
  );

  const next = useCallback(() => {
    if (!graded) {
      onResult({ correct: true, verdict: "correct", expected: "" }, Date.now() - shownAt.current);
    }
    onContinue();
  }, [graded, onResult, onContinue]);

  const onChange = useCallback(
    (r: Response | null) => {
      setResponse(r);
      if (r?.type === "match_pairs") check(r); // matching checks itself once every pair is matched
    },
    [check],
  );

  useEffect(() => {
    if (result) continueRef.current?.focus();
  }, [result]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Enter" || e.shiftKey) return;
      if (!graded || result) {
        e.preventDefault();
        next();
      } else if (response) {
        e.preventDefault();
        check();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [graded, result, response, check, next]);

  const good = result?.correct ?? false;

  return (
    <>
      <div className={`flex-1 py-6 rise-in ${result && !good ? "shake" : ""}`} data-exercise={ex.id} data-type={ex.type}>
        <ExerciseView ex={ex} ctx={ctx} locked={!!result} onChange={onChange} />
      </div>

      <div
        className={`sticky bottom-0 -mx-4 px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] ${
          result ? `sheet-up ${good ? "bg-mint-soft" : "bg-rose-soft"}` : "bg-paper"
        }`}
      >
        {result && (
          <div className="mb-4 flex items-start gap-3" role="status" aria-live="polite" data-verdict={result.verdict}>
            <span className={`pop grid size-11 shrink-0 place-items-center rounded-full ${good ? "bg-mint" : "bg-rose"} text-white`}>
              <Icon name={good ? "check" : "close"} className="size-6" />
            </span>
            <div className="flex flex-col">
              <p className={`text-xl font-bold ${good ? "text-mint-strong" : "text-rose-strong"}`}>
                {result.verdict === "correct" ? praise : VERDICT_TEXT[result.verdict]}
              </p>
              {result.verdict !== "correct" && (
                <Word text={result.expected} lang={ctx.target} className={`mt-1 text-xl ${good ? "text-mint-strong" : "text-rose-strong"}`} />
              )}
            </div>
          </div>
        )}
        {!graded ? (
          <button type="button" className="btn-primary w-full" onClick={next} autoFocus>
            {ex.type === "learn" ? "הבנתי" : "המשך"}
          </button>
        ) : result ? (
          <button ref={continueRef} type="button" onClick={onContinue} className={`w-full ${good ? "btn-success" : "btn-danger"}`}>
            המשך
          </button>
        ) : (
          <button type="button" className="btn-primary w-full" disabled={!response} onClick={() => check()}>
            בדיקה
          </button>
        )}
      </div>
    </>
  );
}
