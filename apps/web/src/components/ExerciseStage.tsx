"use client";

import type { Exercise } from "@lingo/content-schema";
import { type Evaluation, type Response, RuleEvaluator } from "@lingo/engine";
import { useCallback, useEffect, useRef, useState } from "react";
import { ExerciseView, type ExerciseContext } from "./exercises";

const evaluator = new RuleEvaluator();

const VERDICT_TEXT: Record<Evaluation["verdict"], string> = {
  correct: "נכון!",
  accent: "נכון. שימו לב לסימנים מעל האותיות:",
  typo: "כמעט מושלם. שימו לב לאיות:",
  wrong: "התשובה הנכונה:",
};

/**
 * One exercise: the learner answers, presses "Check", sees feedback, presses "Continue".
 * Enter works for both buttons.
 */
export function ExerciseStage({
  ex,
  ctx,
  courseId,
  onResult,
  onContinue,
}: {
  ex: Exercise;
  ctx: ExerciseContext;
  courseId: string;
  onResult: (evaluation: Evaluation, durationMs: number) => void;
  onContinue: () => void;
}) {
  const [response, setResponse] = useState<Response | null>(null);
  const [result, setResult] = useState<Evaluation | null>(null);
  const shownAt = useRef(Date.now());
  const continueRef = useRef<HTMLButtonElement>(null);

  const check = useCallback(
    (r: Response | null = response) => {
      if (!r || result) return;
      const evaluation = evaluator.evaluate(ex, r, ctx);
      setResult(evaluation);
      onResult(evaluation, Date.now() - shownAt.current);
    },
    [ex, ctx, response, result, onResult],
  );

  const onChange = useCallback(
    (r: Response | null) => {
      setResponse(r);
      // Matching pairs checks itself once every pair is matched.
      if (r?.type === "match_pairs") check(r);
    },
    [check],
  );

  useEffect(() => {
    if (result) continueRef.current?.focus();
  }, [result]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Enter" || e.shiftKey) return;
      if (result) {
        e.preventDefault();
        onContinue();
      } else if (response) {
        e.preventDefault();
        check();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [result, response, check, onContinue]);

  const tone = !result ? "" : result.correct ? "bg-mint-soft text-mint" : "bg-rose-soft text-rose";
  const showExpected = result && result.verdict !== "correct";

  return (
    <>
      <div className="flex-1 py-6" data-exercise={ex.id} data-type={ex.type}>
        <ExerciseView ex={ex} ctx={ctx} locked={!!result} onChange={onChange} />
      </div>
      <div className={`sticky bottom-0 -mx-4 px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] ${result ? `sheet-up ${tone}` : "bg-paper"}`}>
        {result && (
          <div className="mb-4" role="status" aria-live="polite">
            <p className="text-xl font-semibold">{VERDICT_TEXT[result.verdict]}</p>
            {showExpected && (
              <p lang={ctx.target} dir="auto" className="word mt-1 text-2xl">
                {result.expected}
              </p>
            )}
          </div>
        )}
        {result ? (
          <button
            ref={continueRef}
            type="button"
            onClick={onContinue}
            className={`btn w-full text-white ${result.correct ? "bg-mint" : "bg-rose"}`}
          >
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
