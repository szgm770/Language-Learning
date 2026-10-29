import { type Op, SCHEMA_VERSION } from "@lingo/sync";
import { describe, expect, it } from "vitest";
import { MemoryOpStore } from "./memory-store";
import { PULL_OVERLAP_MS } from "./opstore";
import { handlePull, handlePush, PAGE, type PullBody } from "./sync-handler";

let n = 0;
const op = (over: Partial<Op> = {}): Op =>
  ({
    id: `00000000-0000-4000-8000-${(++n).toString(16).padStart(12, "0")}`,
    at: 1_000,
    deviceId: "phone",
    v: SCHEMA_VERSION,
    kind: "review",
    cardKey: "en:hello",
    rating: 3,
    durationMs: 100,
    ...over,
  }) as Op;

async function pullAll(store: MemoryOpStore, uid: string, cursor: string | null) {
  const out: Op[] = [];
  for (;;) {
    const r = (await handlePull(store, uid, cursor, store.now())).body as PullBody;
    out.push(...r.ops);
    cursor = r.cursor;
    if (!r.hasMore) return { ops: out, cursor };
  }
}

describe("sync API", () => {
  it("stores pushed ops once and returns them on pull", async () => {
    const store = new MemoryOpStore();
    const a = op();
    const r1 = await handlePush(store, "u1", { deviceId: "phone", ops: [a] });
    const r2 = await handlePush(store, "u1", { deviceId: "laptop", ops: [a] });
    expect(r1.status).toBe(200);
    expect(r2.body).toMatchObject({ accepted: [a.id] });
    expect((await pullAll(store, "u1", null)).ops).toEqual([a]);
  });

  it("keeps learners apart", async () => {
    const store = new MemoryOpStore();
    await handlePush(store, "alice", { deviceId: "d", ops: [op()] });
    expect((await pullAll(store, "bob", null)).ops).toEqual([]);
  });

  it("rejects invalid ops but keeps the valid ones", async () => {
    const store = new MemoryOpStore();
    const good = op();
    const res = await handlePush(store, "u", { deviceId: "d", ops: [good, { id: "x", kind: "hack" }] });
    expect(res.body).toMatchObject({ accepted: [good.id], rejected: [{ id: "x" }] });
  });

  it("pages through large logs without losing or repeating ops", async () => {
    const store = new MemoryOpStore();
    const ops = Array.from({ length: PAGE * 2 + 7 }, () => op());
    for (let i = 0; i < ops.length; i += 100) await handlePush(store, "u", { deviceId: "d", ops: ops.slice(i, i + 100) });
    const pulled = await pullAll(store, "u", null);
    expect(pulled.ops.map((o) => o.id)).toEqual(ops.map((o) => o.id));
  });

  it("a later pull sees new ops, re-reading a short overlap window", async () => {
    const store = new MemoryOpStore();
    let clock = 1_000_000;
    store.now = () => clock;
    await handlePush(store, "u", { deviceId: "d", ops: [op()] });
    const first = await pullAll(store, "u", null);
    clock += PULL_OVERLAP_MS * 2;
    const late = op();
    await handlePush(store, "u", { deviceId: "d", ops: [late] });
    const second = await pullAll(store, "u", first.cursor);
    expect(second.ops.map((o) => o.id)).toContain(late.id);
  });

  it("an idle device re-reads nothing once the overlap window has passed", async () => {
    const store = new MemoryOpStore();
    let clock = 1_000_000;
    store.now = () => clock;
    await handlePush(store, "u", { deviceId: "d", ops: [op(), op()] });
    let cursor = (await pullAll(store, "u", null)).cursor;
    clock += PULL_OVERLAP_MS + 1;
    const r = (await handlePull(store, "u", cursor, clock)).body as PullBody;
    cursor = r.cursor;
    expect(r.ops).toHaveLength(2); // still inside the window right after writing
    clock += PULL_OVERLAP_MS + 1;
    expect(((await handlePull(store, "u", cursor, clock)).body as PullBody).ops).toHaveLength(0);
  });

  it("a write that lands just before the last pull's position is still picked up", async () => {
    const store = new MemoryOpStore();
    let clock = 1_000_000;
    store.now = () => clock;
    await handlePush(store, "u", { deviceId: "d", ops: [op()] });
    const first = await pullAll(store, "u", null);
    // Another device's write that finished with an earlier timestamp than the pull saw.
    clock -= 10_000;
    const slow = op();
    await handlePush(store, "u", { deviceId: "tablet", ops: [slow] });
    const second = await pullAll(store, "u", first.cursor);
    expect(second.ops.map((o) => o.id)).toContain(slow.id);
  });

  it("refuses a malformed cursor", async () => {
    expect((await handlePull(new MemoryOpStore(), "u", "not-a-cursor")).status).toBe(400);
  });

  it("blocks a batch that leaves too many courses and records it", async () => {
    const store = new MemoryOpStore();
    const ops = Array.from({ length: 21 }, (_, i) => op({ kind: "unenroll", courseId: `c${i}` } as Partial<Op>));
    const res = await handlePush(store, "u", { deviceId: "d", ops });
    expect(res.status).toBe(409);
    expect(store.blocked).toHaveLength(1);
    expect((await pullAll(store, "u", null)).ops).toEqual([]);
  });
});
