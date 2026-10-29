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
import { validateCourse, validateUnitReferences } from "./validate";

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
    problems.push(...validateUnitReferences(unit).map((p) => `${file}: ${p}`));
    units.push(unit);
  }
  problems.push(...validateCourse(course, units).map((p) => `${courseFile}: ${p}`));

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
      title: unit.title,
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
