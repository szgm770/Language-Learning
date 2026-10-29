"use client";

import type { CourseManifest, Lexeme, Unit } from "@lingo/content-schema";
import { useEffect, useState } from "react";
import { withBase } from "./base-path";
import { db } from "./db";

export interface CourseSummary {
  id: string;
  source: string;
  target: string;
  title: { he: string; en: string };
}

export type UnitPack = Unit & { version: string };

/**
 * Network first, then the copy saved on the device, so lessons keep working offline.
 * Every successful download is saved for next time.
 */
async function cached<T>(key: string, url: string): Promise<T> {
  try {
    const res = await fetch(withBase(url), { cache: "no-cache" });
    if (!res.ok) throw new Error(String(res.status));
    const data = (await res.json()) as T & { version?: string };
    await db().packs.put({ key, version: data.version ?? "", data, savedAt: Date.now() });
    return data;
  } catch (err) {
    const row = await db().packs.get(key);
    if (row) return row.data as T;
    throw err;
  }
}

export const loadCourses = () => cached<CourseSummary[]>("index", "/content/index.json");
export const loadManifest = (courseId: string) =>
  cached<CourseManifest>(`${courseId}/manifest`, `/content/${courseId}/manifest.json`);
export const loadUnit = (courseId: string, unitId: string) =>
  cached<UnitPack>(`${courseId}/${unitId}`, `/content/${courseId}/units/${unitId}.json`);

export async function loadCourse(courseId: string): Promise<{ manifest: CourseManifest; units: UnitPack[] }> {
  const manifest = await loadManifest(courseId);
  const units = await Promise.all(manifest.units.map((u) => loadUnit(courseId, u.id)));
  return { manifest, units };
}

/** Lessons of a course in learning order, with their unit. */
export function flatLessons(units: UnitPack[]) {
  return units.flatMap((unit) => unit.lessons.map((lesson) => ({ unit, lesson })));
}

export function lexemeIndex(units: UnitPack[]): Map<string, Lexeme> {
  return new Map(units.flatMap((u) => u.vocabulary.map((l) => [l.id, l] as const)));
}

/** Small loader hook: { data, error } for an async function of the given deps. */
export function useLoad<T>(fn: () => Promise<T>, deps: unknown[]): { data?: T; error?: Error } {
  const [state, setState] = useState<{ data?: T; error?: Error }>({});
  useEffect(() => {
    let alive = true;
    fn().then(
      (data) => alive && setState({ data }),
      (error: Error) => alive && setState({ error }),
    );
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return state;
}

/** Everything an exercise needs to know about its course. */
export function exerciseContext(data: { manifest: CourseManifest; units: UnitPack[] }) {
  return {
    target: data.manifest.target,
    source: data.manifest.source,
    speechLang: data.manifest.speechLang,
    characters: data.manifest.characters,
    lexemes: lexemeIndex(data.units),
  };
}
