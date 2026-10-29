import type { Op } from "@lingo/sync";
import type { ContentReport, Cursor, OpStore } from "./opstore";

const after = (a: Cursor, b: Cursor) => a.t > b.t || (a.t === b.t && a.id > b.id);

/** In-memory OpStore with the same ordering rules as Firestore. For tests. */
export class MemoryOpStore implements OpStore {
  logs = new Map<string, { op: Op; receivedAt: number }[]>();
  blocked: { uid: string; reason: string }[] = [];
  reports: (ContentReport & { uid: string })[] = [];
  now = () => Date.now();

  private log(uid: string) {
    let l = this.logs.get(uid);
    if (!l) this.logs.set(uid, (l = []));
    return l;
  }

  async pull(uid: string, cursor: Cursor | null, limit: number) {
    const rows = this.log(uid)
      .map((r) => ({ op: r.op, c: { t: r.receivedAt, id: r.op.id } }))
      .filter((r) => !cursor || after(r.c, cursor))
      .sort((a, b) => a.c.t - b.c.t || a.c.id.localeCompare(b.c.id))
      .slice(0, limit);
    return { ops: rows.map((r) => r.op), positions: rows.map((r) => r.c) };
  }

  async append(uid: string, ops: Op[]) {
    const log = this.log(uid);
    const have = new Set(log.map((r) => r.op.id));
    const t = this.now();
    let n = 0;
    for (const op of ops) {
      if (have.has(op.id)) continue;
      have.add(op.id);
      log.push({ op, receivedAt: t });
      n++;
    }
    return n;
  }

  async enrollmentOps(uid: string) {
    return this.log(uid)
      .map((r) => r.op)
      .filter((o) => o.kind === "enroll" || o.kind === "unenroll");
  }

  async recordBlocked(uid: string, info: { reason: string }) {
    this.blocked.push({ uid, reason: info.reason });
  }

  async addReport(uid: string, report: ContentReport) {
    this.reports.push({ ...report, uid });
  }
}
