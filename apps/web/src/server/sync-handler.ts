import { applyAll, brakeCheck, clampClock, emptyState, Op, PushRequest, type PushResponse } from "@lingo/sync";
import { decodeCursor, encodeCursor, type OpStore, PULL_OVERLAP_MS } from "./opstore";

export const PAGE = 500;

export interface HandlerResult {
  status: number;
  body: unknown;
}

export interface PullBody {
  ops: Op[];
  /** Opaque; send it back as `cursor` next time. */
  cursor: string | null;
  hasMore: boolean;
}

/**
 * Pull: ops after the cursor.
 * Paging cursors continue right after the last op sent. When a pull is complete, the next one
 * starts at (now − overlap): anything committed later is newer than that, and anything older
 * was already visible and sent. Ops sent twice are harmless because merging is idempotent,
 * and an idle device re-reads nothing once the overlap window has passed.
 */
export async function handlePull(
  store: OpStore,
  uid: string,
  cursorParam: string | null,
  now = Date.now(),
): Promise<HandlerResult> {
  const decoded = decodeCursor(cursorParam);
  if (cursorParam && !decoded) return { status: 400, body: { error: "bad cursor" } };
  const paging = decoded?.startedAt != null;
  // Resume cursors start AT a time (inclusive): "after (t − 1 ms, last possible id)".
  const from = decoded ? (paging ? decoded.cursor : { t: decoded.cursor.t - 1, id: "\uffff" }) : null;
  const startedAt = paging ? decoded!.startedAt! : now;

  // One extra row tells whether there is another page.
  const { ops, positions } = await store.pull(uid, from, PAGE + 1);
  const hasMore = ops.length > PAGE;
  const page = ops.slice(0, PAGE);
  const body: PullBody = {
    ops: page,
    cursor: hasMore
      ? encodeCursor({ cursor: positions[page.length - 1]!, startedAt })
      : encodeCursor({ cursor: { t: startedAt - PULL_OVERLAP_MS, id: "" }, startedAt: null }),
    hasMore,
  };
  return { status: 200, body };
}

/** Push: validate, brake-check, append. Never updates or deletes stored ops. */
export async function handlePush(store: OpStore, uid: string, raw: unknown, now = Date.now()): Promise<HandlerResult> {
  const parsed = PushRequest.safeParse(raw);
  if (!parsed.success) return { status: 400, body: { error: "bad request" } };

  const res: PushResponse = { accepted: [], rejected: [] };
  const ops: Op[] = [];
  for (const item of parsed.data.ops) {
    const op = Op.safeParse(item);
    if (!op.success) {
      const id = typeof item === "object" && item && "id" in item ? String((item as { id: unknown }).id) : null;
      res.rejected.push({ id, reason: op.error.issues[0]?.message ?? "invalid op" });
      continue;
    }
    ops.push(clampClock(op.data, now));
  }

  if (ops.some((o) => o.kind === "unenroll")) {
    const reason = brakeCheck(ops, applyAll(emptyState(), await store.enrollmentOps(uid)));
    if (reason) {
      await store.recordBlocked(uid, { deviceId: parsed.data.deviceId, reason, opCount: ops.length, sample: ops.slice(0, 5) });
      return { status: 409, body: { ...res, blocked: reason } satisfies PushResponse };
    }
  }

  if (ops.length > 0) await store.append(uid, ops);
  res.accepted = ops.map((o) => o.id);
  return { status: 200, body: res };
}
