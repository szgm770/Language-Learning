"use client";

import { setting } from "@lingo/sync";
import { type ReactNode, useEffect } from "react";
import { init, useLearner } from "@/lib/store";
import { startSync } from "@/lib/sync-client";

export function Providers({ children }: { children: ReactNode }) {
  const { state } = useLearner();
  const theme = setting(state, "theme", "system");

  useEffect(() => {
    void init().then(startSync);
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      void navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }
  }, []);

  useEffect(() => {
    if (theme === "system") document.documentElement.removeAttribute("data-theme");
    else document.documentElement.dataset.theme = String(theme);
  }, [theme]);

  return children;
}
