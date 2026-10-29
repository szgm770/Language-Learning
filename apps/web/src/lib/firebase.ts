"use client";

import { type FirebaseApp, getApps, initializeApp } from "firebase/app";
import { type Auth, connectAuthEmulator, getAuth, type User } from "firebase/auth";
import { cloudEnabled, firebaseConfig } from "./env";

let auth: Auth | undefined;

/** Firebase Auth in the browser, or undefined when cloud features are not configured. */
export function firebaseAuth(): Auth | undefined {
  if (!cloudEnabled || typeof window === "undefined") return undefined;
  if (!auth) {
    const app: FirebaseApp = getApps()[0] ?? initializeApp(firebaseConfig);
    auth = getAuth(app);
    auth.languageCode = "he";
    const emulator = process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR;
    if (emulator) connectAuthEmulator(auth, emulator, { disableWarnings: true });
  }
  return auth;
}

/** Resolves once Firebase has restored the saved session (or found none). */
export async function currentUser(): Promise<User | null> {
  const a = firebaseAuth();
  if (!a) return null;
  await a.authStateReady();
  return a.currentUser;
}

/** fetch() with the learner's ID token, for our own API routes. */
export async function authedFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const user = await currentUser();
  if (!user) throw new Error("not signed in");
  const token = await user.getIdToken();
  return fetch(input, { ...init, headers: { ...init.headers, Authorization: `Bearer ${token}` }, cache: "no-store" });
}
