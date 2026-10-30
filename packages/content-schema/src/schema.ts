import { z } from "zod";

/** Stable identifiers: lowercase letters, digits, dashes. Never change once published. */
export const Id = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "ids must be kebab-case: lowercase letters, digits and dashes");

export const LangCode = z.enum(["he", "en", "es", "ru", "fr", "de", "it", "pt", "ar", "yi", "zh", "ja", "ko"]);
export type LangCode = z.infer<typeof LangCode>;

export const Cefr = z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]);
export type Cefr = z.infer<typeof Cefr>;

/** Text shown in the learner's interface language. */
/** Strict, so a YAML slip like `{ he: היי, אני נועה }` (an unquoted comma) is caught instead of cut short. */
export const UiText = z.strictObject({ he: z.string().min(1), en: z.string().min(1) });
export type UiText = z.infer<typeof UiText>;

export const PartOfSpeech = z.enum([
  "noun",
  "verb",
  "adjective",
  "adverb",
  "pronoun",
  "preposition",
  "conjunction",
  "interjection",
  "number",
  "phrase",
  "determiner",
]);

export const Lexeme = z.object({
  id: Id,
  text: z.string().min(1),
  translation: z.string().min(1),
  pos: PartOfSpeech,
  /** Pronunciation hint in the learner's script, e.g. Hebrew letters for English words. */
  pronunciation: z.string().optional(),
  example: z.strictObject({ text: z.string(), translation: z.string() }).optional(),
});
export type Lexeme = z.infer<typeof Lexeme>;

export const GrammarPoint = z.object({
  id: Id,
  title: UiText,
  /** Short explanation (60–120 words), Markdown, in the learner's language. */
  explanation: z.string().min(20),
  examples: z.array(z.object({ text: z.string(), translation: z.string() })).min(1),
});
export type GrammarPoint = z.infer<typeof GrammarPoint>;

const ExerciseBase = z.object({
  id: Id,
  /** Lexemes practised by this exercise. They are added to the learner's review queue. */
  lexemes: z.array(Id).default([]),
});

/** Accepted answers. The first one is shown as the "correct answer" on mistakes. */
const Answers = z
  .array(z.string().min(1))
  .min(1)
  .refine((a) => new Set(a.map((x) => x.trim())).size === a.length, "answers must not repeat");

export const MultipleChoice = ExerciseBase.extend({
  type: z.literal("multiple_choice"),
  prompt: z.string().min(1),
  options: z.array(z.string().min(1)).min(2).max(6),
  correct: z.number().int().min(0),
});

export const MatchPairs = ExerciseBase.extend({
  type: z.literal("match_pairs"),
  pairs: z.array(z.tuple([z.string().min(1), z.string().min(1)])).min(3).max(6),
});

export const WordBank = ExerciseBase.extend({
  type: z.literal("word_bank"),
  /** Sentence to translate, in the source language. */
  prompt: z.string().min(1),
  /** Acceptable target-language sentences. */
  answers: Answers,
  /** Extra wrong tiles mixed in with the words of the first answer. */
  distractors: z.array(z.string().min(1)).default([]),
});

export const FillBlank = ExerciseBase.extend({
  type: z.literal("fill_blank"),
  /** Sentence with exactly one "___" gap. */
  sentence: z.string().refine((s) => s.split("___").length === 2, "sentence must contain exactly one ___"),
  translation: z.string().optional(),
  answers: Answers,
  /** Optional choices; without them the learner types. */
  options: z.array(z.string().min(1)).optional(),
});

export const Translate = ExerciseBase.extend({
  type: z.literal("translate"),
  direction: z.enum(["to_target", "to_source"]),
  prompt: z.string().min(1),
  answers: Answers,
});

export const Dictation = ExerciseBase.extend({
  type: z.literal("dictation"),
  /** Spoken by text-to-speech; the learner types what they hear. */
  text: z.string().min(1),
  answers: Answers.optional(),
});

export const ListeningChoice = ExerciseBase.extend({
  type: z.literal("listening_choice"),
  audioText: z.string().min(1),
  question: z.string().min(1),
  options: z.array(z.string().min(1)).min(2).max(6),
  correct: z.number().int().min(0),
});

export const SpeakRepeat = ExerciseBase.extend({
  type: z.literal("speak_repeat"),
  text: z.string().min(1),
  translation: z.string().min(1),
});

/** Meet a new word: shown with audio and an example, nothing to answer. */
export const Learn = ExerciseBase.extend({
  type: z.literal("learn"),
  lexeme: Id,
});

const DialogueLine = z.strictObject({
  /** A character id from the course's `characters`. */
  speaker: Id,
  text: z.string().min(1),
  translation: z.string().min(1),
});

/** A short conversation to read and listen to. Nothing to answer. */
export const Dialogue = ExerciseBase.extend({
  type: z.literal("dialogue"),
  /** One line in Hebrew setting the scene, e.g. "נועה פוגשת את סאם בשיחת וידאו". */
  scene: z.string().min(1),
  lines: z.array(DialogueLine).min(2).max(12),
});

/** Complete a conversation: one line is missing; pick the reply that fits. */
export const DialogueGap = ExerciseBase.extend({
  type: z.literal("dialogue_gap"),
  lines: z.array(DialogueLine.extend({ text: z.string().min(1) })).min(2).max(8),
  /** Index of the missing line in `lines`; its `text` is the correct answer. */
  gap: z.number().int().min(0),
  /** Wrong replies shown with the right one. */
  distractors: z.array(z.string().min(1)).min(1).max(3),
});

/** A short note: culture, pronunciation or a usage tip. Nothing to answer. */
export const Tip = ExerciseBase.extend({
  type: z.literal("tip"),
  title: z.string().min(1),
  text: z.string().min(10),
});

/** A short text to read (an email, a notice, a blog post), with a Hebrew translation on demand. */
export const Reading = ExerciseBase.extend({
  type: z.literal("reading"),
  /** What the text is, in Hebrew: "מייל מבן", "מודעה בבניין". */
  kind: z.string().min(1),
  title: z.string().min(1),
  /** Paragraphs separated by a blank line. */
  text: z.string().min(40),
  /** Hebrew translation with the same paragraphs. */
  translation: z.string().min(20),
});

/** Steps the learner reads or listens to, without an answer to check. */
export const UNGRADED_TYPES = ["learn", "dialogue", "tip", "reading"] as const;

export const Exercise = z
  .discriminatedUnion("type", [
    Learn,
    Dialogue,
    DialogueGap,
    Tip,
    Reading,
    MultipleChoice,
    MatchPairs,
    WordBank,
    FillBlank,
    Translate,
    Dictation,
    ListeningChoice,
    SpeakRepeat,
  ])
  .superRefine((ex, ctx) => {
    if ((ex.type === "multiple_choice" || ex.type === "listening_choice") && ex.correct >= ex.options.length) {
      ctx.addIssue({ code: "custom", message: `correct index ${ex.correct} is out of range`, path: ["correct"] });
    }
    if (ex.type === "dialogue_gap" && ex.gap >= ex.lines.length) {
      ctx.addIssue({ code: "custom", message: `gap ${ex.gap} is out of range`, path: ["gap"] });
    }
    if (ex.type === "fill_blank" && ex.options && !ex.answers.some((a) => ex.options!.includes(a))) {
      ctx.addIssue({ code: "custom", message: "one of the answers must appear in options", path: ["options"] });
    }
  });
export type Exercise = z.infer<typeof Exercise>;
export type ExerciseType = Exercise["type"];
export type DialogueLine = z.infer<typeof DialogueLine>;

export const isGraded = (ex: Exercise) => !(UNGRADED_TYPES as readonly string[]).includes(ex.type);

export const Lesson = z.object({
  id: Id,
  title: UiText,
  kind: z.enum(["new", "grammar", "listening", "reading", "review", "test"]),
  /** Grammar point shown before the exercises. */
  grammar: Id.optional(),
  exercises: z.array(Exercise).min(3),
});
export type Lesson = z.infer<typeof Lesson>;

/** Illustrations available for unit cards (drawn in the web app). */
export const Scene = z.enum(["hello", "globe", "family", "cafe", "day", "work", "town", "shopping", "free-time", "travel", "home", "food", "health", "nature", "tech", "party", "money", "news", "study"]);
export type Scene = z.infer<typeof Scene>;

export const Unit = z.object({
  id: Id,
  cefr: Cefr,
  title: UiText,
  scene: Scene,
  /** One line in Hebrew: what happens in this unit's story. */
  story: z.string().min(1),
  /** What the learner can do after the unit. */
  canDo: z.array(z.string().min(1)).min(1),
  vocabulary: z.array(Lexeme).default([]),
  grammar: z.array(GrammarPoint).default([]),
  lessons: z.array(Lesson).min(1),
});
export type Unit = z.infer<typeof Unit>;

export const Character = z.object({
  id: Id,
  /** Name as written in the target language. */
  name: z.string().min(1),
  /** Name in Hebrew letters. */
  he: z.string().min(1),
  /** Avatar colour. */
  color: z.enum(["blue", "amber", "green", "rose", "violet", "teal"]),
  /** Avatar hair style. */
  look: z.enum(["short", "long", "curly", "bald"]).default("short"),
  /** Speech voice pitch hint for text-to-speech (0.5–2). */
  pitch: z.number().min(0.5).max(2).default(1),
});
export type Character = z.infer<typeof Character>;

export const Course = z.object({
  id: Id,
  source: LangCode,
  target: LangCode,
  title: UiText,
  description: UiText,
  /** Unit ids in learning order; each maps to units/<id>.yaml. */
  units: z.array(Id).min(1),
  /** Web Speech API voice language, e.g. "en-US". */
  speechLang: z.string().min(2),
  characters: z.array(Character).default([]),
});
export type Course = z.infer<typeof Course>;

/** What the app downloads first: course info plus a version per unit pack. */
export const CourseManifest = Course.extend({
  units: z.array(
    z.object({
      id: Id,
      cefr: Cefr,
      title: UiText,
      scene: Scene,
      story: z.string(),
      lessonCount: z.number().int(),
      /** Content hash; changes whenever the unit changes. */
      version: z.string(),
    }),
  ),
});
export type CourseManifest = z.infer<typeof CourseManifest>;
