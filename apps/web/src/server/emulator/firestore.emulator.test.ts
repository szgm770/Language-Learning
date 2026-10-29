/**
 * Runs only with the Firebase emulators (FIRESTORE_EMULATOR_HOST set), e.g. in CI:
 *   firebase emulators:exec --only firestore,auth "pnpm test:emulator"
 * Checks the real Firestore store and the security rules.
 */
import { readFileSync } from "node:fs";
import { assertFails, initializeTestEnvironment, type RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { type Op, SCHEMA_VERSION } from "@lingo/sync";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { adminDb } from "../firebase-admin";
import { FirestoreOpStore } from "../firestore-store";
import { handlePull, handlePush, PAGE, type PullBody } from "../sync-handler";

const host = process.env.FIRESTORE_EMULATOR_HOST;
const suite = host ? describe : describe.skip;

let n = 0;
const op = (): Op => ({
  id: `00000000-0000-4000-8000-${(++n).toString(16).padStart(12, "0")}`,
  at: 1_000,
  deviceId: "phone",
  v: SCHEMA_VERSION,
  kind: "review",
  cardKey: "en:hello",
  rating: 3,
  durationMs: 100,
});

suite("Firestore (emulator)", () => {
  let env: RulesTestEnvironment;
  beforeAll(async () => {
    const [hostname, port] = host!.split(":");
    env = await initializeTestEnvironment({
      projectId: "demo-lingo",
      firestore: { host: hostname!, port: Number(port), rules: readFileSync(new URL("../../../../../firebase/firestore.rules", import.meta.url), "utf8") },
    });
    await env.clearFirestore();
  });
  afterAll(async () => env?.cleanup());

  it("stores ops once and pages through them in order", async () => {
    const store = new FirestoreOpStore(adminDb());
    const ops = Array.from({ length: PAGE + 30 }, op);
    for (let i = 0; i < ops.length; i += 100) await handlePush(store, "alice", { deviceId: "d", ops: ops.slice(i, i + 100) });
    expect(await store.append("alice", ops.slice(0, 5))).toBe(0); // duplicates are ignored

    const seen: string[] = [];
    let cursor: string | null = null;
    for (;;) {
      const r = (await handlePull(store, "alice", cursor)).body as PullBody;
      seen.push(...r.ops.map((o) => o.id));
      cursor = r.cursor;
      if (!r.hasMore) break;
    }
    expect(seen).toEqual(ops.map((o) => o.id));
    expect(((await handlePull(store, "bob", null)).body as PullBody).ops).toEqual([]);
  });

  it("browsers cannot read or write the database directly", async () => {
    const alice = env.authenticatedContext("alice").firestore();
    await assertFails(getDoc(doc(alice, "users/alice/ops/x")));
    await assertFails(setDoc(doc(alice, "users/alice/ops/x"), { op: {} }));
    await assertFails(setDoc(doc(alice, "reports/x"), { a: 1 }));
    const anon = env.unauthenticatedContext().firestore();
    await assertFails(getDoc(doc(anon, "users/alice/ops/x")));
  });
});
