/**
 * Validates every course under content/courses and writes JSON packs for the web app:
 *   apps/web/public/content/<course>/manifest.json
 *   apps/web/public/content/<course>/units/<unit>.json
 * Exits with code 1 and a list of problems if anything is invalid.
 */
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";
import { z } from "zod";
import { Course, type CourseManifest, Unit } from "./schema";
import { validateCourse, validateTeachingOrder, validateUnitReferences } from "./validate";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const contentDir = join(root, "content/courses");
const outDir = join(root, "apps/web/public/content");

const problems: string[] = [];

function load<T>(schema: z.ZodType<T>, file: string): T | undefined {
  let raw: unknown;
  try {
    raw = parse(readFileSync(file, "utf8"));
  } catch (err) {
    problems.push(`${file}: YAML error: ${(err as Error).message}`);
    return undefined;
  }
  const result = schema.safeParse(raw);
  if (!result.success) {
    for (const issue of result.error.issues) {
      problems.push(`${file}: ${issue.path.join(".") || "(root)"}: ${issue.message}`);
    }
    return undefined;
  }
  return result.data;
}

/**
 * Authors write the right answer first; the learner must not see that. The order is shuffled here,
 * the same way on every build (seeded by the exercise id), so a lesson looks the same every time.
 */
function shuffleAnswers(unit: Unit): Unit {
  const relative = /\b(both|none of|all of|neither)\b|שתי התשובות|כל התשובות|אף אחת/i;
  for (const lesson of unit.lessons) {
    for (const ex of lesson.exercises) {
      if ((ex.type !== "multiple_choice" && ex.type !== "listening_choice") || ex.options.some((o) => relative.test(o))) continue;
      const right = ex.options[ex.correct]!;
      const keyed = ex.options.map((o, i) => ({ o, k: hash(`${ex.id}:${i}`) })).sort((a, b) => a.k.localeCompare(b.k));
      ex.options = keyed.map((x) => x.o);
      ex.correct = ex.options.indexOf(right);
    }
  }
  return unit;
}

const hash = (s: string) => createHash("sha256").update(s).digest("hex").slice(0, 16);

rmSync(outDir, { recursive: true, force: true });
const index: { id: string; source: string; target: string; title: unknown }[] = [];

for (const courseId of readdirSync(contentDir)) {
  const courseFile = join(contentDir, courseId, "course.yaml");
  if (!existsSync(courseFile)) continue;
  const course = load(Course, courseFile);
  if (!course) continue;
  if (course.id !== courseId) problems.push(`${courseFile}: id "${course.id}" must match folder "${courseId}"`);

  const units: Unit[] = [];
  for (const unitId of course.units) {
    const file = join(contentDir, courseId, "units", `${unitId}.yaml`);
    if (!existsSync(file)) {
      problems.push(`${courseFile}: unit file units/${unitId}.yaml is missing`);
      continue;
    }
    const unit = load(Unit, file);
    if (!unit) continue;
    if (unit.id !== unitId) problems.push(`${file}: id "${unit.id}" must match file name "${unitId}"`);
    problems.push(...validateUnitReferences(unit, { courseWide: true }).map((p) => `${file}: ${p}`));
    units.push(shuffleAnswers(unit));
  }
  problems.push(...validateCourse(course, units).map((p) => `${courseFile}: ${p}`));
  // Courses written with learn cards must introduce every word before practising it.
  const usesLearnCards = units.some((u) => u.lessons.some((l) => l.exercises.some((e) => e.type === "learn")));
  if (usesLearnCards) problems.push(...validateTeachingOrder(units).map((p) => `${courseId}: ${p}`));

  const courseOut = join(outDir, courseId);
  mkdirSync(join(courseOut, "units"), { recursive: true });
  const manifest: CourseManifest = { ...course, units: [] };
  for (const unit of units) {
    const json = JSON.stringify(unit);
    const version = hash(json);
    writeFileSync(join(courseOut, "units", `${unit.id}.json`), JSON.stringify({ ...unit, version }));
    manifest.units.push({
      id: unit.id,
      cefr: unit.cefr,
      ...(unit.section ? { section: unit.section } : {}),
      title: unit.title,
      scene: unit.scene,
      story: unit.story,
      lessonCount: unit.lessons.length,
      version,
    });
  }
  writeFileSync(join(courseOut, "manifest.json"), JSON.stringify(manifest, null, 2));
  index.push({ id: course.id, source: course.source, target: course.target, title: course.title });
}

if (problems.length > 0) {
  console.error(`Content has ${problems.length} problem(s):\n` + problems.map((p) => `  - ${p}`).join("\n"));
  process.exit(1);
}
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, "index.json"), JSON.stringify(index, null, 2));
console.log(`Content OK: ${index.length} course(s) written to ${outDir}`);
