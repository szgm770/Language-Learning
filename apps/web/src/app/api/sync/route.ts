import {
  applyAll,
  brakeCheck,
  clampClock,
  emptyState,
  Op,
  type Op as OpT,
  PushRequest,
  type PullResponse,
  type PushResponse,
} from "@lingo/sync";
import { cloudEnabled } from "@/lib/env";
import { serverSupabase } from "@/lib/supabase/server";

const PAGE = 500;

async function user() {
  if (!cloudEnabled) return { error: Response.json({ error: "cloud sync is not configured" }, { status: 503 }) };
  const sb = await serverSupabase();
  const { data, error } = await sb.auth.getUser();
  if (error || !data.user) return { error: Response.json({ error: "sign in required" }, { status: 401 }) };
  return { sb, userId: data.user.id };
}

/** Pull: every op stored after `cursor`, oldest first. */
export async function GET(request: Request) {
  const u = await user();
  if ("error" in u) return u.error;
  const cursor = Number(new URL(request.url).searchParams.get("cursor") ?? "0");
  if (!Number.isSafeInteger(cursor) || cursor < 0) return Response.json({ error: "bad cursor" }, { status: 400 });

  const { data, error } = await u.sb
    .from("sync_ops")
    .select("seq, body")
    .gt("seq", cursor)
    .order("seq", { ascending: true })
    .limit(PAGE + 1);
  if (error) return Response.json({ error: "could not read progress" }, { status: 500 });

  const rows = data.slice(0, PAGE);
  const body: PullResponse = {
    ops: rows.map((r) => r.body as OpT),
    cursor: rows.at(-1)?.seq ?? cursor,
    hasMore: data.length > PAGE,
  };
  return Response.json(body, { headers: { "Cache-Control": "no-store" } });
}

/** Push: append ops. Never updates or deletes anything already stored. */
export async function POST(request: Request) {
  const u = await user();
  if ("error" in u) return u.error;

  const parsed = PushRequest.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "bad request" }, { status: 400 });

  const now = Date.now();
  const res: PushResponse = { accepted: [], rejected: [] };
  const ops: OpT[] = [];
  for (const raw of parsed.data.ops) {
    const op = Op.safeParse(raw);
    if (!op.success) {
      const id = typeof raw === "object" && raw && "id" in raw ? String((raw as { id: unknown }).id) : null;
      res.rejected.push({ id, reason: op.error.issues[0]?.message ?? "invalid op" });
      continue;
    }
    ops.push(clampClock(op.data, now));
  }

  // Safety brake: look at the learner's enrollments before applying anything destructive.
  if (ops.some((o) => o.kind === "unenroll")) {
    const { data } = await u.sb.from("sync_ops").select("body").in("kind", ["enroll", "unenroll"]);
    const reason = brakeCheck(ops, applyAll(emptyState(), (data ?? []).map((r) => r.body as OpT)));
    if (reason) {
      await u.sb.from("sync_blocked").insert({
        device_id: parsed.data.deviceId,
        reason,
        op_count: ops.length,
        sample: ops.slice(0, 5),
      });
      return Response.json({ ...res, blocked: reason } satisfies PushResponse, { status: 409 });
    }
  }

  if (ops.length > 0) {
    const { error } = await u.sb.from("sync_ops").upsert(
      ops.map((op) => ({
        user_id: u.userId,
        id: op.id,
        device_id: op.deviceId,
        kind: op.kind,
        at: op.at,
        schema_version: op.v,
        body: op,
      })),
      { onConflict: "user_id,id", ignoreDuplicates: true },
    );
    if (error) return Response.json({ error: "could not save progress" }, { status: 500 });
  }
  res.accepted = ops.map((o) => o.id);
  return Response.json(res);
}
