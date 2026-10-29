/**
 * Text normalization for answer comparison.
 * Two strings that normalize the same are treated as the same answer.
 */

const HEBREW_POINTS = /[֑-ׇ]/g; // cantillation marks and niqqud
const ARABIC_HARAKAT = /[ً-ٰٟ]/g;
const COMBINING_MARKS = /\p{M}/gu;
const PUNCTUATION = /[\p{P}\p{S}]/gu;

const EN_CONTRACTIONS: Record<string, string> = {
  "i'm": "i am",
  "you're": "you are",
  "he's": "he is",
  "she's": "she is",
  "it's": "it is",
  "we're": "we are",
  "they're": "they are",
  "that's": "that is",
  "what's": "what is",
  "where's": "where is",
  "who's": "who is",
  "there's": "there is",
  "isn't": "is not",
  "aren't": "are not",
  "wasn't": "was not",
  "weren't": "were not",
  "don't": "do not",
  "doesn't": "does not",
  "didn't": "did not",
  "can't": "cannot",
  "won't": "will not",
  "i've": "i have",
  "you've": "you have",
  "we've": "we have",
  "they've": "they have",
  "i'll": "i will",
  "you'll": "you will",
  "i'd": "i would",
  "let's": "let us",
};

export interface NormalizeOptions {
  /** Language of the text, used for contractions and case rules. */
  lang?: string;
  /** Remove accents and vowel points too. Default true. */
  stripMarks?: boolean;
}

/** Unifies quote characters so contractions match whatever keyboard was used. */
function unifyApostrophes(s: string): string {
  return s.replace(/[‘’ʼ׳`´]/g, "'");
}

export function normalize(text: string, opts: NormalizeOptions = {}): string {
  const { lang, stripMarks = true } = opts;
  let s = unifyApostrophes(text.normalize("NFC")).toLocaleLowerCase(lang);

  if (lang === "en" || lang === undefined) {
    s = s.replace(/\b[a-z]+'[a-z]+\b/g, (w) => EN_CONTRACTIONS[w] ?? w);
  }
  if (stripMarks) {
    s = s.replace(HEBREW_POINTS, "").replace(ARABIC_HARAKAT, "");
    s = s.normalize("NFD").replace(COMBINING_MARKS, "").normalize("NFC");
  }
  // Apostrophes left inside words (e.g. "o'clock") are kept; everything else that is punctuation goes.
  s = s.replace(/'/g, "\u0000").replace(PUNCTUATION, " ").replace(/\u0000/g, "'");
  return s.replace(/\s+/g, " ").trim();
}

/** Normalizes but keeps accents, to tell "correct" from "correct apart from accents". */
export function normalizeKeepMarks(text: string, lang?: string): string {
  return normalize(text, { lang, stripMarks: false });
}
