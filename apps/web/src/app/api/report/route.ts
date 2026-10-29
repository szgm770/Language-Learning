import { z } from "zod";
import { cloudEnabled } from "@/lib/env";
import { adminDb, serverConfigured, verifyRequest } from "@/server/firebase-admin";
import { FirestoreOpStore } from "@/server/firestore-store";

const Report = z.object({
  courseId: z.string().min(1).max(100),
  exerciseId: z.string().min(1).max(100),
  category: z.enum(["answer_rejected", "mistake", "audio", "other"]),
  learnerAnswer: z.string().max(500).default(""),
  comment: z.string().max(1000).default(""),
});

/** "My answer should have been accepted": stored for the content editors. */
export async function POST(request: Request) {
  if (!cloudEnabled || !serverConfigured()) return Response.json({ error: "not configured" }, { status: 503 });
  const uid = await verifyRequest(request);
  if (!uid) return Response.json({ error: "sign in required" }, { status: 401 });
  const parsed = Report.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "bad request" }, { status: 400 });
  await new FirestoreOpStore(adminDb()).addReport(uid, parsed.data);
  return Response.json({ ok: true });
}
