import type { Op } from "@lingo/sync";
import { FieldPath, type Firestore } from "firebase-admin/firestore";
import type { ContentReport, Cursor, OpStore } from "./opstore";

/**
 * Firestore layout:
 *   users/{uid}/ops/{opId}      { op, kind, receivedMs }   ← append-only learner log
 *   users/{uid}/blocked/{auto}  batches refused by the safety brake
 *   reports/{auto}              "my answer should have been accepted"
 * Browsers cannot read or write any of this directly (see firestore.rules); only this server can.
 */
export class FirestoreOpStore implements OpStore {
  constructor(
    private db: Firestore,
    private now = () => Date.now(),
  ) {}

  private ops(uid: string) {
    return this.db.collection("users").doc(uid).collection("ops");
  }

  async pull(uid: string, cursor: Cursor | null, limit: number) {
    let q = this.ops(uid).orderBy("receivedMs").orderBy(FieldPath.documentId());
    if (cursor) q = q.startAfter(cursor.t, cursor.id);
    const snap = await q.limit(limit).get();
    return {
      ops: snap.docs.map((d) => d.get("op") as Op),
      positions: snap.docs.map((d) => ({ t: d.get("receivedMs") as number, id: d.id })),
    };
  }

  async append(uid: string, ops: Op[]) {
    const receivedMs = this.now();
    const col = this.ops(uid);
    const results = await Promise.all(
      ops.map((op) =>
        col
          .doc(op.id)
          // create() fails if the op is already stored, so nothing is ever overwritten.
          .create({ op, kind: op.kind, receivedMs })
          .then(() => 1)
          .catch((err: { code?: number }) => {
            if (err.code === 6) return 0; // ALREADY_EXISTS: the same op sent again
            throw err;
          }),
      ),
    );
    return results.reduce<number>((a, b) => a + b, 0);
  }

  async enrollmentOps(uid: string) {
    const snap = await this.ops(uid).where("kind", "in", ["enroll", "unenroll"]).get();
    return snap.docs.map((d) => d.get("op") as Op);
  }

  async recordBlocked(uid: string, info: { deviceId: string; reason: string; opCount: number; sample: Op[] }) {
    await this.db.collection("users").doc(uid).collection("blocked").add({ ...info, at: this.now() });
  }

  async addReport(uid: string, report: ContentReport) {
    await this.db.collection("reports").add({ ...report, uid, at: this.now(), resolved: false });
  }
}
