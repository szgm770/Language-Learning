import { cloudEnabled } from "@/lib/env";
import { adminDb, serverConfigured, verifyRequest } from "@/server/firebase-admin";
import { FirestoreOpStore } from "@/server/firestore-store";
import { handlePull, handlePush } from "@/server/sync-handler";

const json = (status: number, body: unknown) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

async function context(request: Request) {
  if (!cloudEnabled || !serverConfigured()) return { error: json(503, { error: "cloud sync is not configured" }) };
  const uid = await verifyRequest(request);
  if (!uid) return { error: json(401, { error: "sign in required" }) };
  return { uid, store: new FirestoreOpStore(adminDb()) };
}

/** Pull: the learner's ops after `cursor`. */
export async function GET(request: Request) {
  const c = await context(request);
  if ("error" in c) return c.error;
  const r = await handlePull(c.store, c.uid, new URL(request.url).searchParams.get("cursor"));
  return json(r.status, r.body);
}

/** Push: append ops. Never updates or deletes anything already stored. */
export async function POST(request: Request) {
  const c = await context(request);
  if ("error" in c) return c.error;
  const r = await handlePush(c.store, c.uid, await request.json().catch(() => null));
  return json(r.status, r.body);
}
