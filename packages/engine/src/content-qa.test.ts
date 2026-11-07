/**
 * Content QA: every exercise in every course must accept its own listed answers,
 * and word-bank tiles must be able to build the first answer.
 * Catches AI-written content where the "correct" answer would be marked wrong.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { Course, type Exercise, Unit } from "@lingo/content-schema";
import { parse } from "yaml";
import { describe, expect, it } from "vitest";
import { RuleEvaluator, type Response, wordBankTiles } from "./evaluate";

const root = resolve(__dirname, "../../../content/courses");
const ev = new RuleEvaluator();

function correctResponses(ex: Exercise): Response[] {
  switch (ex.type) {
    case "learn":
    case "dialogue":
    case "tip":
    case "reading":
      return [{ type: "seen" }];
    case "dialogue_gap":
      return [{ type: "dialogue_gap", choice: ex.lines[ex.gap]!.text }];
    case "multiple_choice":
    case "listening_choice":
      return [{ type: ex.type, choice: ex.correct }];
    case "match_pairs":
      return [{ type: "match_pairs", mistakes: 0 }];
    case "word_bank":
      return [{ type: "word_bank", tiles: ex.answers[0]!.replace(/[.!?,]/g, "").split(/\s+/) }];
    case "fill_blank":
    case "translate":
      return ex.answers.map((text) => ({ type: ex.type, text }));
    case "dictation":
      return (ex.answers ?? [ex.text]).map((text) => ({ type: "dictation", text }));
    case "speak_repeat":
      return [{ type: "speak_repeat", selfRating: "good" }];
    case "write":
      return [{ type: "write", text: ex.model }];
  }
}

for (const courseId of readdirSync(root)) {
  const course = Course.parse(parse(readFileSync(join(root, courseId, "course.yaml"), "utf8")));
  describe(`content: ${courseId}`, () => {
    for (const unitId of course.units) {
      const unit = Unit.parse(parse(readFileSync(join(root, courseId, "units", `${unitId}.yaml`), "utf8")));
      it(`${unitId}: every listed answer is accepted`, () => {
        for (const lesson of unit.lessons) {
          for (const ex of lesson.exercises) {
            for (const res of correctResponses(ex)) {
              const r = ev.evaluate(ex, res, { target: course.target, source: course.source });
              expect(r.correct, `${ex.id} rejects ${JSON.stringify(res)}`).toBe(true);
            }
            if (ex.type === "match_pairs") {
              // A repeated word on either side makes the pair ambiguous to tap (and to solve).
              const left = ex.pairs.map((pair) => pair[0]);
              const right = ex.pairs.map((pair) => pair[1]);
              expect(new Set(left).size, `${ex.id} repeats a word on the left`).toBe(left.length);
              expect(new Set(right).size, `${ex.id} repeats a word on the right`).toBe(right.length);
              // Both sides of a pair showing the same text cannot be told apart on screen.
              for (const pair of ex.pairs) expect(pair[0], `${ex.id} pairs "${pair[0]}" with itself`).not.toBe(pair[1]);
            }
            if (ex.type === "word_bank") {
              const tiles = wordBankTiles(ex, 1);
              for (const w of ex.answers[0]!.replace(/[.!?,]/g, "").split(/\s+/)) {
                expect(tiles, `${ex.id} is missing tile "${w}"`).toContain(w);
              }
            }
          }
        }
      });
    }
  });
}
