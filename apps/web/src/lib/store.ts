"use client";

import { apply, emptyState, type LearnerState, type Op } from "@lingo/sync";
import { useSyncExternalStore } from "react";
import { db, getMeta, type OpRow, setMeta } from "./db";
import { uuidv7 } from "./ids";

/**
 * In-memory learner state, built by folding every op stored on this device.
 * Writes go to IndexedDB first (op + outbox flag in one transaction), then update memory.
 */
let state: LearnerState = emptyState();
let version = 0;
let ready: Promise<void> | undefined;
let deviceId = "";
const listeners = new Set<() => void>();
const afterRecord = new Set<() => void>();

function emit() {
  version++;
  for (const l of listeners) l();
}

export function init(): Promise<void> {
  ready ??= (async () => {
    deviceId = (await getMeta<string>("deviceId")) ?? "";
    if (!deviceId) {
      deviceId = uuidv7();
      await setMeta("deviceId", deviceId);
    }
    const rows = await db().ops.toArray();
    const next = emptyState();
    for (const r of rows) apply(next, r.op);
    state = next;
    // Ask the browser not to evict our data when storage runs low.
    void navigator.storage?.persist?.().catch(() => undefined);
    emit();
  })();
  return ready;
}

export const getDeviceId = () => deviceId;
export const getState = () => state;

/** Records the learner's own actions. They are queued for sync automatically. */
export async function record(ops: Op[]): Promise<void> {
  await init();
  const rows: OpRow[] = ops.map((op) => ({ id: op.id, op, synced: 0 }));
  await db().transaction("rw", db().ops, async () => {
    await db().ops.bulkAdd(rows);
  });
  for (const op of ops) apply(state, op);
  emit();
  for (const cb of afterRecord) cb();
}

/** Adds ops that came from the cloud. Ops this device already has are only marked as stored. */
export async function ingest(remote: Op[]): Promise<number> {
  await init();
  let added = 0;
  await db().transaction("rw", db().ops, async () => {
    const existing = await db().ops.bulkGet(remote.map((o) => o.id));
    const fresh: OpRow[] = [];
    const confirm: string[] = [];
    remote.forEach((op, i) => {
      const row = existing[i];
      if (!row) fresh.push({ id: op.id, op, synced: 1 });
      else if (row.synced !== 1) confirm.push(op.id);
    });
    if (fresh.length) await db().ops.bulkAdd(fresh);
    for (const id of confirm) await db().ops.update(id, { synced: 1 });
    added = fresh.length;
  });
  let changed = false;
  for (const op of remote) changed = apply(state, op) || changed;
  if (changed) emit();
  return added;
}

/**
 * Deletes this device's copy only. Nothing is sent to the cloud, so cloud progress is untouched.
 * The device id is kept so the cloud can still tell devices apart.
 */
export async function clearLocalData(): Promise<void> {
  const id = deviceId;
  await db().transaction("rw", db().ops, db().meta, db().packs, async () => {
    await db().ops.clear();
    await db().meta.clear();
    await db().packs.clear();
    if (id) await db().meta.put({ key: "deviceId", value: id });
  });
  state = emptyState();
  emit();
}

/** Drops local ops that were never sent (used when the learner keeps only their cloud progress). */
export async function discardUnsynced(): Promise<void> {
  await db().ops.where("synced").equals(0).delete();
  ready = undefined;
  await init();
}

export function onRecord(cb: () => void): () => void {
  afterRecord.add(cb);
  return () => afterRecord.delete(cb);
}

function subscribe(l: () => void) {
  listeners.add(l);
  void init();
  return () => listeners.delete(l);
}

/** React hook: re-renders whenever the learner state changes. */
export function useLearner(): { state: LearnerState; version: number; loaded: boolean } {
  const v = useSyncExternalStore(
    subscribe,
    () => version,
    () => -1,
  );
  return { state, version: v, loaded: v > 0 };
}

export function newOpBase(now = Date.now()) {
  return { id: uuidv7(now), at: now, deviceId, v: 1 as const };
}
