import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Lists every course and lesson at build time, so each page can be exported as a static file.
 * Reads the JSON packs written by `pnpm content:build`.
 */
const dir = join(process.cwd(), "public/content");
const read = <T,>(path: string): T => JSON.parse(readFileSync(join(dir, path), "utf8")) as T;

export function courseParams(): { courseId: string }[] {
  return read<{ id: string }[]>("index.json").map((c) => ({ courseId: c.id }));
}

export function lessonParams(): { courseId: string; lessonId: string }[] {
  return courseParams().flatMap(({ courseId }) =>
    read<{ units: { id: string }[] }>(`${courseId}/manifest.json`).units.flatMap((u) =>
      read<{ lessons: { id: string }[] }>(`${courseId}/units/${u.id}.json`).lessons.map((l) => ({ courseId, lessonId: l.id })),
    ),
  );
}

/** Units with at least two dialogues get a listening chapter (courses with a machine voice only). */
export function listenParams(): { courseId: string; unitId: string }[] {
  return courseParams().flatMap(({ courseId }) => {
    const m = read<{ speechLang: string; units: { id: string }[] }>(`${courseId}/manifest.json`);
    if (m.speechLang === "none") return [];
    return m.units
      .filter((u) => read<{ lessons: { exercises: { type: string }[] }[] }>(`${courseId}/units/${u.id}.json`).lessons.flatMap((l) => l.exercises).filter((e) => e.type === "dialogue").length >= 2)
      .map((u) => ({ courseId, unitId: u.id }));
  });
}
