import { z } from "zod";

/**
 * Every change a learner makes is recorded as an operation (op).
 * Devices never send their "state" to the cloud — only ops. The cloud keeps every op,
 * and both sides build state by folding ops with merge rules that are idempotent and
 * order-independent. So an empty, new or reset device cannot erase cloud data.
 */
export const SCHEMA_VERSION = 1 as const;

const Base = z.object({
  /** UUID created on the device; the same op sent twice is stored once. */
  id: z.uuid(),
  /** Device clock when the op happened, epoch ms. */
  at: z.number().int().nonnegative(),
  deviceId: z.string().min(1).max(64),
  v: z.literal(SCHEMA_VERSION),
});

const CardKey = z.string().min(1).max(200);
const Day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const ReviewOp = Base.extend({
  kind: z.literal("review"),
  cardKey: CardKey,
  rating: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
  durationMs: z.number().int().nonnegative().max(3_600_000),
});

export const CardAddOp = Base.extend({
  kind: z.literal("card_add"),
  cardKey: CardKey,
  courseId: z.string().min(1),
});

export const LessonResultOp = Base.extend({
  kind: z.literal("lesson_result"),
  courseId: z.string().min(1),
  lessonId: z.string().min(1),
  /** Share of exercises right on the first try, 0..1. */
  score: z.number().min(0).max(1),
  completed: z.boolean(),
});

export const ActivityOp = Base.extend({
  kind: z.literal("activity"),
  /** Local calendar day of the learner. */
  day: Day,
  xp: z.number().int().nonnegative().max(10_000),
  seconds: z.number().int().nonnegative().max(86_400),
});

export const SettingOp = Base.extend({
  kind: z.literal("setting"),
  field: z.enum([
    "uiLang",
    "dailyGoalMinutes",
    "newPerDay",
    "retention",
    "reminderTime",
    "theme",
    "goal",
    "soundOn",
    "currentCourse",
  ]),
  value: z.union([z.string().max(100), z.number(), z.boolean(), z.null()]),
});

export const EnrollOp = Base.extend({
  kind: z.literal("enroll"),
  courseId: z.string().min(1),
  /** Index of the furthest lesson reached in the course order. */
  position: z.number().int().nonnegative(),
});

export const UnenrollOp = Base.extend({
  kind: z.literal("unenroll"),
  courseId: z.string().min(1),
});

export const Op = z.discriminatedUnion("kind", [
  ReviewOp,
  CardAddOp,
  LessonResultOp,
  ActivityOp,
  SettingOp,
  EnrollOp,
  UnenrollOp,
]);
export type Op = z.infer<typeof Op>;
export type OpKind = Op["kind"];
export type SettingField = z.infer<typeof SettingOp>["field"];

/** Ops that take something away. Only these count toward the safety brake. */
export const DESTRUCTIVE_KINDS: ReadonlySet<OpKind> = new Set(["unenroll"]);

export const PushRequest = z.object({
  deviceId: z.string().min(1).max(64),
  ops: z.array(z.unknown()).max(500),
});
export type PushRequest = { deviceId: string; ops: Op[] };

export interface PushResponse {
  accepted: string[];
  rejected: { id: string | null; reason: string }[];
  /** Set when the whole batch was refused by the safety brake. */
  blocked?: string;
}

export interface PullResponse {
  ops: Op[];
  /** Server sequence number of the last op returned; send it back next time. */
  cursor: number;
  hasMore: boolean;
}
