/** Public Firebase web-app settings (Project settings → Your apps). They are not secrets. */
export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "",
};

/** Cloud features (sign-in, sync) are on only when a Firebase project is configured. */
export const cloudEnabled = firebaseConfig.apiKey !== "" && firebaseConfig.projectId !== "";
