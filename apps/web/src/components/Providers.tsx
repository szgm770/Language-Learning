"use client";

import { setting } from "@lingo/sync";
import { type ReactNode, useEffect } from "react";
import { withBase } from "@/lib/base-path";
import { setSoundEnabled } from "@/lib/sfx";
import { init, useLearner } from "@/lib/store";

export function Providers({ children }: { children: ReactNode }) {
  const { state } = useLearner();
  const theme = setting(state, "theme", "system");
  const sound = setting<boolean | null>(state, "soundOn", true);
  useEffect(() => setSoundEnabled(sound !== false), [sound]);

  useEffect(() => {
    void init();
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      void navigator.serviceWorker.register(withBase("/sw.js"), { scope: withBase("/") }).catch(() => undefined);
    }
  }, []);

  useEffect(() => {
    if (theme === "system") document.documentElement.removeAttribute("data-theme");
    else document.documentElement.dataset.theme = String(theme);
  }, [theme]);

  return children;
}
