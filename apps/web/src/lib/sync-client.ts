"use client";

import type { Op, PullResponse, PushResponse } from "@lingo/sync";
import { useSyncExternalStore } from "react";
import { db, getMeta, setMeta } from "./db";
import { cloudEnabled } from "./env";
import { clearLocalData, discardUnsynced, getDeviceId, ingest, init, onRecord } from "./store";
import { supabase } from "./supabase/client";

export type SyncStatus =
  | { kind: "off" } // no cloud configured
  | { kind: "guest" } // not signed in: everything stays on this device
  | { kind: "idle"; lastSyncAt: number | null; pending: number }
  | { kind: "syncing" }
  | { kind: "offline"; pending: number }
  | { kind: "needs-merge"; localCount: number } // this device has guest progress and the account has progress too
  | { kind: "error"; message: string; pending: number };

const BATCH = 100;
const INTERVAL_MS = 30_000;

let status: SyncStatus = cloudEnabled ? { kind: "guest" } : { kind: "off" };
const listeners = new Set<() => void>();
let running: Promise<void> | undefined;
let again = false;
let started = false;
let debounce: ReturnType<typeof setTimeout> | undefined;

function set(s: SyncStatus) {
  status = s;
  for (const l of listeners) l();
}

async function pendingCount() {
  return db().ops.where("synced").equals(0).count();
}

async function pull(userId: string): Promise<number> {
  const key = `cursor:${userId}`;
  let cursor = (await getMeta<number>(key)) ?? 0;
  let total = 0;
  for (;;) {
    const res = await fetch(`/api/sync?cursor=${cursor}`, { cache: "no-store" });
    if (!res.ok) throw new Error(`pull failed (${res.status})`);
    const page = (await res.json()) as PullResponse;
    total += page.ops.length;
    await ingest(page.ops);
    cursor = page.cursor;
    await setMeta(key, cursor);
    if (!page.hasMore) return total;
  }
}

async function push(): Promise<void> {
  for (;;) {
    const rows = await db().ops.where("synced").equals(0).limit(BATCH).toArray();
    if (rows.length === 0) return;
    const res = await fetch("/api/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deviceId: getDeviceId(), ops: rows.map((r) => r.op) satisfies Op[] }),
    });
    const body = (await res.json().catch(() => ({}))) as Partial<PushResponse> & { error?: string };
    if (body.blocked) throw new Error(`השרת עצר את הסנכרון כדי להגן על הנתונים: ${body.blocked}`);
    if (!res.ok) throw new Error(body.error ?? `push failed (${res.status})`);
    await db().transaction("rw", db().ops, async () => {
      for (const id of body.accepted ?? []) await db().ops.update(id, { synced: 1 });
      for (const r of body.rejected ?? []) if (r.id) await db().ops.update(r.id, { synced: -1 });
    });
  }
}

async function cycle(): Promise<void> {
  await init();
  const sb = supabase();
  if (!sb) return set({ kind: "off" });
  const { data } = await sb.auth.getSession();
  const userId = data.session?.user.id;
  if (!userId) return set({ kind: "guest" });
  if (typeof navigator !== "undefined" && !navigator.onLine) return set({ kind: "offline", pending: await pendingCount() });

  const lastUser = await getMeta<string>("lastUser");
  if (lastUser && lastUser !== userId) {
    // Someone else signed in on this device: start from their cloud progress, not the previous person's.
    await clearLocalData();
  }

  set({ kind: "syncing" });
  try {
    // Pull before push: a new or reset device first gets everything from the cloud.
    const pulled = await pull(userId);
    const decision = await getMeta<"merge" | "cloud-only">(`merge:${userId}`);
    const pending = await pendingCount();
    if (!lastUser && pending > 0 && decision === undefined) {
      if (pulled > 0) return set({ kind: "needs-merge", localCount: pending });
      await setMeta(`merge:${userId}`, "merge"); // a new account simply takes the guest progress
    }
    await setMeta("lastUser", userId);
    await push();
    await setMeta("lastSyncAt", Date.now());
    set({ kind: "idle", lastSyncAt: Date.now(), pending: await pendingCount() });
  } catch (err) {
    set({ kind: "error", message: (err as Error).message, pending: await pendingCount() });
  }
}

/** Runs one sync now (or right after the one in progress). Safe to call often. */
export function syncNow(): Promise<void> {
  if (running) {
    again = true;
    return running;
  }
  running = (async () => {
    do {
      again = false;
      await cycle();
    } while (again);
  })().finally(() => {
    running = undefined;
  });
  return running;
}

/** The learner's answer to "merge this device's progress into your account?". */
export async function resolveMerge(choice: "merge" | "cloud-only"): Promise<void> {
  const sb = supabase();
  const { data } = (await sb?.auth.getSession()) ?? { data: { session: null } };
  const userId = data.session?.user.id;
  if (!userId) return;
  if (choice === "cloud-only") await discardUnsynced();
  await setMeta(`merge:${userId}`, choice);
  await setMeta("lastUser", userId);
  await syncNow();
}

/** Signs out after a last sync. With `clearDevice`, also removes the local copy (never the cloud). */
export async function signOut(clearDevice: boolean): Promise<void> {
  await syncNow();
  await supabase()?.auth.signOut();
  if (clearDevice) await clearLocalData();
  set(cloudEnabled ? { kind: "guest" } : { kind: "off" });
}

/** Starts background sync: on load, every 30 s, when back online, when the tab returns, after each action. */
export function startSync(): void {
  if (started || typeof window === "undefined") return;
  started = true;
  void syncNow();
  setInterval(() => void syncNow(), INTERVAL_MS);
  window.addEventListener("online", () => void syncNow());
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") void syncNow();
  });
  onRecord(() => {
    clearTimeout(debounce);
    debounce = setTimeout(() => void syncNow(), 2_000);
  });
  supabase()?.auth.onAuthStateChange((event) => {
    if (event === "SIGNED_IN" || event === "SIGNED_OUT") void syncNow();
  });
}

export function useSyncStatus(): SyncStatus {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => status,
    () => status,
  );
}
