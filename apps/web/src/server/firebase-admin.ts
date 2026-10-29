import { type App, cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

/**
 * Server-side Firebase. In production it uses the service account from FIREBASE_SERVICE_ACCOUNT
 * (a secret set in Vercel, never sent to browsers). With the emulators running it needs no key.
 */
export const serverConfigured = () =>
  !!process.env.FIREBASE_SERVICE_ACCOUNT || !!process.env.FIRESTORE_EMULATOR_HOST;

function app(): App {
  const existing = getApps()[0];
  if (existing) return existing;
  const sa = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (sa) return initializeApp({ credential: cert(JSON.parse(sa) as Parameters<typeof cert>[0]) });
  return initializeApp({ projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "demo-lingo" });
}

export const adminDb = () => getFirestore(app());

/** The signed-in learner's id from "Authorization: Bearer <Firebase ID token>", or null. */
export async function verifyRequest(request: Request): Promise<string | null> {
  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) return null;
  try {
    const decoded = await getAuth(app()).verifyIdToken(token, true);
    return decoded.uid;
  } catch {
    return null;
  }
}
