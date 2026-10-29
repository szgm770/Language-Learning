import type { Op } from "@lingo/sync";
import Dexie, { type Table } from "dexie";

/** 0 = waiting to be sent, 1 = stored in the cloud, -1 = refused by the server (kept, never resent). */
export type SyncFlag = 0 | 1 | -1;

export interface OpRow {
  id: string;
  op: Op;
  synced: SyncFlag;
}

export interface MetaRow {
  key: string;
  value: unknown;
}

export interface PackRow {
  /** "<course>/manifest" or "<course>/<unit>" */
  key: string;
  version: string;
  data: unknown;
  savedAt: number;
}

/**
 * The device's own copy of everything. The app reads and writes here first and never waits for
 * the network; ops are sent to the cloud in the background.
 */
export class LingoDB extends Dexie {
  ops!: Table<OpRow, string>;
  meta!: Table<MetaRow, string>;
  packs!: Table<PackRow, string>;

  constructor(name = "lingo") {
    super(name);
    this.version(1).stores({
      ops: "id, synced",
      meta: "key",
      packs: "key",
    });
  }
}

let instance: LingoDB | undefined;
export function db(): LingoDB {
  instance ??= new LingoDB();
  return instance;
}

export async function getMeta<T>(key: string): Promise<T | undefined> {
  return (await db().meta.get(key))?.value as T | undefined;
}

export async function setMeta(key: string, value: unknown): Promise<void> {
  await db().meta.put({ key, value });
}
