import { normalize, normalizeKeepMarks } from "./normalize";

/**
 * correct  – matches an accepted answer exactly (after normalization)
 * accent   – matches except for accents / vowel points; counted correct with a notice
 * typo     – one small spelling slip in a long word; counted correct with a notice
 * wrong    – no match
 */
export type TextVerdict = "correct" | "accent" | "typo" | "wrong";

export interface TextCheck {
  verdict: TextVerdict;
  /** The accepted answer that matched best (as written in the content). */
  matched: string;
}

/** Shortest word length where one typo is forgiven. Short words ("he"/"she") must be exact. */
export const TYPO_MIN_WORD_LENGTH = 5;

/**
 * Edit distance where swapping two neighbouring letters counts as one edit
 * (optimal string alignment), so "studnet" is one typo away from "student".
 */
export function editDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const d: number[][] = Array.from({ length: m + 1 }, (_, i) => Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let v = Math.min(d[i - 1]![j]! + 1, d[i]![j - 1]! + 1, d[i - 1]![j - 1]! + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) v = Math.min(v, d[i - 2]![j - 2]! + 1);
      d[i]![j] = v;
    }
  }
  return d[m]![n]!;
}

function wordsWithinTypo(a: string, b: string): boolean {
  const wa = a.split(" ");
  const wb = b.split(" ");
  if (wa.length !== wb.length) return false;
  let typos = 0;
  for (let i = 0; i < wa.length; i++) {
    const x = wa[i]!;
    const y = wb[i]!;
    if (x === y) continue;
    if (Math.min(x.length, y.length) < TYPO_MIN_WORD_LENGTH || editDistance(x, y) > 1) return false;
    typos++;
  }
  // At most one typo per 4 words, and at least one allowed.
  return typos <= Math.max(1, Math.floor(wa.length / 4));
}

export function checkText(input: string, accepted: readonly string[], lang?: string): TextCheck {
  const first = accepted[0] ?? "";
  const withMarks = normalizeKeepMarks(input, lang);
  if (withMarks === "") return { verdict: "wrong", matched: first };

  for (const a of accepted) if (normalizeKeepMarks(a, lang) === withMarks) return { verdict: "correct", matched: a };

  const plain = normalize(input, { lang });
  for (const a of accepted) {
    const target = normalize(a, { lang });
    if (target === plain) {
      // If the accepted answer itself has no marks, the learner simply added/omitted nothing that matters.
      const verdict = normalizeKeepMarks(a, lang) === target ? "correct" : "accent";
      return { verdict, matched: a };
    }
  }
  for (const a of accepted) if (wordsWithinTypo(plain, normalize(a, { lang }))) return { verdict: "typo", matched: a };
  return { verdict: "wrong", matched: first };
}
