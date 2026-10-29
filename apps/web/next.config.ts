import type { NextConfig } from "next";

const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "";

/**
 * Security headers for every response.
 * Next.js injects inline scripts, so script-src still allows 'unsafe-inline'; moving to
 * nonce-based CSP is planned once the app needs dynamic rendering anyway.
 */
const csp = [
  "default-src 'self'",
  // apis.google.com: the Google sign-in popup helper.
  "script-src 'self' 'unsafe-inline' https://apis.google.com" + (process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""),
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "media-src 'self' blob:",
  // Firebase Auth endpoints.
  "connect-src 'self' https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://www.googleapis.com" +
    (process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR ? ` ${process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR}` : ""),
  // The sign-in helper frame Firebase opens on the project's auth domain.
  `frame-src https://accounts.google.com${authDomain ? ` https://${authDomain}` : ""}`,
  "worker-src 'self'",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const nextConfig: NextConfig = {
  transpilePackages: ["@lingo/content-schema", "@lingo/engine", "@lingo/sync"],
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "microphone=(self), camera=(), geolocation=()" },
        ],
      },
      {
        source: "/sw.js",
        headers: [{ key: "Cache-Control", value: "no-cache" }],
      },
    ];
  },
};

export default nextConfig;
