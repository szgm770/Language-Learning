"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Icon, type IconName } from "./icons";

const TABS: { href: string; label: string; icon: IconName; match: RegExp }[] = [
  { href: "/learn/", label: "היום", icon: "home", match: /\/learn\/$/ },
  { href: "/path/", label: "המסלול", icon: "path", match: /\/(path|course)\// },
  { href: "/words/", label: "מילים", icon: "words", match: /\/words\/$/ },
  { href: "/settings/", label: "אני", icon: "user", match: /\/settings\/$/ },
];

/** Main app frame: content on top, a tab bar at the bottom (thumb reach on phones). */
export function AppShell({ children }: { children: ReactNode }) {
  const path = usePathname() ?? "";
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-xl flex-col">
      <main className="flex flex-1 flex-col px-4 pb-28">{children}</main>
      <nav
        aria-label="ניווט ראשי"
        className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur"
      >
        <ul className="mx-auto grid max-w-xl grid-cols-4">
          {TABS.map((t) => {
            const active = t.match.test(path.endsWith("/") ? path : `${path}/`);
            return (
              <li key={t.href}>
                <Link
                  href={t.href}
                  aria-current={active ? "page" : undefined}
                  className={`flex min-h-16 flex-col items-center justify-center gap-1 text-xs font-medium ${active ? "text-cobalt" : "text-ink-soft"}`}
                >
                  <span className={`grid h-8 w-14 place-items-center rounded-full ${active ? "bg-cobalt-soft" : ""}`}>
                    <Icon name={t.icon} className="size-6" filled={active && (t.icon === "home" || t.icon === "user")} />
                  </span>
                  {t.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
