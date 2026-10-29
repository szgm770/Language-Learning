import "@fontsource-variable/rubik";
import "./globals.css";
import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Providers } from "@/components/Providers";
import { withBase } from "@/lib/base-path";

export const metadata: Metadata = {
  title: "לינגו – לימוד שפות בעברית",
  description: "לימוד אנגלית וספרדית לדוברי עברית: שיעורים קצרים, חזרה חכמה, בלי הרשמה, עובד גם בלי אינטרנט.",
  icons: { icon: withBase("/icon.svg"), apple: withBase("/icon.svg") },
  applicationName: "לינגו",
  appleWebApp: { capable: true, title: "לינגו", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f7fb" },
    { media: "(prefers-color-scheme: dark)", color: "#12152a" },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="he" dir="rtl" suppressHydrationWarning>
      <head>
        {/* Static hosting cannot send security headers, so the content policy is set here.
            The site talks to no other server: everything loads from its own origin. */}
        <meta
          httpEquiv="Content-Security-Policy"
          content="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; media-src 'self' blob:; connect-src 'self'; worker-src 'self'; manifest-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'"
        />
        <meta name="referrer" content="strict-origin-when-cross-origin" />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
