import type { Character, Scene } from "@lingo/content-schema";
import type { ReactNode } from "react";

/* Flat illustrations drawn in code: one per unit theme, plus character avatars. */

type Hue = "blue" | "amber" | "green" | "rose" | "violet" | "teal";

export const SCENE_HUE: Record<Scene, Hue> = {
  hello: "blue",
  globe: "teal",
  family: "rose",
  cafe: "amber",
  day: "violet",
  work: "blue",
  town: "green",
  shopping: "rose",
  "free-time": "green",
  travel: "teal",
  home: "amber",
  food: "green",
  health: "rose",
  nature: "teal",
  tech: "violet",
  party: "violet",
  money: "green",
  news: "blue",
  study: "blue",
};

const c = (hue: Hue) => `var(--color-u-${hue})`;
const soft = (hue: Hue) => `var(--color-u-${hue}-soft)`;
const INK = "var(--color-ink)";
const WHITE = "#ffffff";

const SCENES: Record<Scene, (h: Hue) => ReactNode> = {
  hello: (h) => (
    <>
      <rect x="18" y="26" width="60" height="38" rx="14" fill={c(h)} />
      <path d="M32 64l-6 14 18-14z" fill={c(h)} />
      <text x="48" y="51" textAnchor="middle" fontSize="18" fontWeight="700" fill={WHITE} fontFamily="Rubik, sans-serif">
        Hi!
      </text>
      <rect x="50" y="58" width="52" height="34" rx="13" fill={WHITE} stroke={c(h)} strokeWidth="3" />
      <path d="M88 92l6 12-16-12z" fill={WHITE} stroke={c(h)} strokeWidth="3" strokeLinejoin="round" />
      <path d="M78 91h12" stroke={WHITE} strokeWidth="4" />
      <circle cx="64" cy="75" r="4" fill={c("amber")} />
      <circle cx="76" cy="75" r="4" fill={c("amber")} />
      <circle cx="88" cy="75" r="4" fill={c("amber")} />
    </>
  ),
  globe: (h) => (
    <>
      <circle cx="60" cy="62" r="34" fill={c(h)} />
      <path d="M40 46c8 2 10 8 18 8s6 10 14 10M46 84c4-6 12-4 14-12M78 40c-2 6 4 10 10 10" stroke={WHITE} strokeWidth="5" fill="none" strokeLinecap="round" />
      <ellipse cx="60" cy="62" rx="34" ry="12" fill="none" stroke={WHITE} strokeOpacity="0.5" strokeWidth="2" />
      <path d="M20 30c20-16 56-18 80 0" stroke={INK} strokeOpacity="0.35" strokeWidth="2.5" fill="none" strokeDasharray="5 6" />
      <path d="M96 24l10 4-8 6z" fill={c("amber")} />
    </>
  ),
  family: (h) => (
    <>
      <circle cx="38" cy="46" r="13" fill="var(--color-skin)" />
      <path d="M18 92c0-16 9-26 20-26s20 10 20 26z" fill={c(h)} />
      <circle cx="82" cy="44" r="13" fill="var(--color-skin)" />
      <path d="M69 40c0-10 6-15 13-15s13 5 13 15c-4-4-9-6-13-6s-9 2-13 6z" fill="var(--color-hair)" />
      <path d="M62 92c0-16 9-27 20-27s20 11 20 27z" fill={c("blue")} />
      <circle cx="60" cy="66" r="10" fill="var(--color-skin)" />
      <path d="M46 98c0-12 6-19 14-19s14 7 14 19z" fill={c("amber")} />
      <path d="M26 41c0-8 5-13 12-13s12 5 12 13" fill="none" stroke="var(--color-hair)" strokeWidth="6" strokeLinecap="round" />
    </>
  ),
  cafe: (h) => (
    <>
      <ellipse cx="58" cy="94" rx="40" ry="8" fill={c(h)} fillOpacity="0.35" />
      <path d="M30 52h56v20c0 14-12 24-28 24S30 86 30 72z" fill={c(h)} />
      <path d="M86 58h6a10 10 0 0 1 0 20h-8" fill="none" stroke={c(h)} strokeWidth="6" />
      <path d="M44 22c-6 8 6 12 0 20M58 18c-6 8 6 12 0 20M72 22c-6 8 6 12 0 20" stroke={INK} strokeOpacity="0.35" strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M40 66h36" stroke={WHITE} strokeOpacity="0.6" strokeWidth="4" strokeLinecap="round" />
    </>
  ),
  day: (h) => (
    <>
      <circle cx="40" cy="44" r="18" fill={c("amber")} />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
        <path
          key={a}
          d={`M${40 + Math.cos((a * Math.PI) / 180) * 24} ${44 + Math.sin((a * Math.PI) / 180) * 24}L${40 + Math.cos((a * Math.PI) / 180) * 31} ${44 + Math.sin((a * Math.PI) / 180) * 31}`}
          stroke={c("amber")}
          strokeWidth="4"
          strokeLinecap="round"
        />
      ))}
      <circle cx="74" cy="72" r="30" fill={c(h)} />
      <circle cx="74" cy="72" r="23" fill={WHITE} />
      <path d="M74 56v16l11 7" stroke={INK} strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  work: (h) => (
    <>
      <rect x="24" y="30" width="72" height="48" rx="6" fill={INK} />
      <rect x="30" y="36" width="60" height="36" rx="3" fill={c(h)} />
      <path d="M38 46h26M38 54h40M38 62h18" stroke={WHITE} strokeWidth="4" strokeLinecap="round" />
      <path d="M14 82h92l-6 10H20z" fill={INK} fillOpacity="0.85" />
      <rect x="84" y="20" width="18" height="18" rx="5" fill={c("amber")} />
    </>
  ),
  town: (h) => (
    <>
      <rect x="16" y="50" width="26" height="50" rx="3" fill={c("blue")} />
      <rect x="44" y="32" width="30" height="68" rx="3" fill={c(h)} />
      <rect x="76" y="58" width="26" height="42" rx="3" fill={c("amber")} />
      {[40, 52, 64, 76].map((y) => (
        <path key={y} d={`M52 ${y}h6M62 ${y}h6`} stroke={WHITE} strokeWidth="5" />
      ))}
      <path d="M60 4c-9 0-15 7-15 15 0 11 15 24 15 24s15-13 15-24c0-8-6-15-15-15z" fill={c("rose")} />
      <circle cx="60" cy="19" r="5" fill={WHITE} />
      <path d="M8 100h104" stroke={INK} strokeOpacity="0.3" strokeWidth="3" strokeLinecap="round" />
    </>
  ),
  shopping: (h) => (
    <>
      <path d="M26 44h60l-6 54H32z" fill={c(h)} />
      <path d="M42 50V36a14 14 0 0 1 28 0v14" fill="none" stroke={INK} strokeWidth="5" strokeLinecap="round" />
      <path d="M78 58l22-4 4 22-16 18-14-16z" fill={c("amber")} />
      <circle cx="94" cy="62" r="4" fill={WHITE} />
      <path d="M40 70h28" stroke={WHITE} strokeOpacity="0.6" strokeWidth="4" strokeLinecap="round" />
    </>
  ),
  "free-time": (h) => (
    <>
      <circle cx="78" cy="74" r="24" fill={WHITE} stroke={INK} strokeWidth="3" />
      <path d="M78 58l9 7-3 11h-12l-3-11z" fill={INK} />
      <path d="M78 50v8M95 69l-8-4M90 92l-6-16M66 92l6-16M61 69l8-4" stroke={INK} strokeWidth="2.5" />
      <path d="M30 24v42" stroke={c(h)} strokeWidth="7" strokeLinecap="round" />
      <path d="M30 24l26-8v30" stroke={c(h)} strokeWidth="7" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <ellipse cx="24" cy="68" rx="10" ry="8" fill={c(h)} />
      <ellipse cx="50" cy="48" rx="10" ry="8" fill={c(h)} />
    </>
  ),
  travel: (h) => (
    <>
      <rect x="18" y="56" width="42" height="44" rx="7" fill={c("amber")} />
      <path d="M30 56v-8a9 9 0 0 1 18 0v8" fill="none" stroke={INK} strokeWidth="4" />
      <path d="M18 72h42" stroke={WHITE} strokeOpacity="0.6" strokeWidth="4" />
      <path
        d="M60 40l40-18c6-3 11 3 7 8L78 54l4 24-7 4-10-20-14 10 1 8-5 3-6-12-12-6 3-5 8 1 10-14-20-10 4-7z"
        fill={c(h)}
      />
    </>
  ),
  home: (h) => (
    <>
      <path d="M18 58L60 24l42 34" fill="none" stroke={INK} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M28 52l32-26 32 26v44H28z" fill={c(h)} />
      <rect x="52" y="68" width="16" height="28" rx="3" fill={WHITE} />
      <rect x="34" y="60" width="13" height="13" rx="2" fill={c("amber")} />
      <rect x="73" y="60" width="13" height="13" rx="2" fill={c("amber")} />
      <rect x="78" y="22" width="10" height="18" rx="2" fill={INK} fillOpacity="0.8" />
      <path d="M8 98h104" stroke={INK} strokeOpacity="0.3" strokeWidth="3" strokeLinecap="round" />
    </>
  ),
  food: (h) => (
    <>
      <ellipse cx="60" cy="72" rx="44" ry="22" fill={WHITE} stroke={INK} strokeOpacity="0.2" strokeWidth="2" />
      <ellipse cx="60" cy="70" rx="30" ry="13" fill={c(h)} />
      <circle cx="48" cy="66" r="6" fill={c("rose")} />
      <circle cx="66" cy="64" r="5" fill={c("amber")} />
      <circle cx="72" cy="73" r="5" fill={c("rose")} />
      <path d="M50 76c6 2 12 2 16 0" stroke={WHITE} strokeWidth="3" strokeLinecap="round" fill="none" />
      <path d="M12 28v22M8 28v10a4 4 0 0 0 8 0V28" stroke={INK} strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M106 28c-6 0-8 8-8 14s4 8 8 8v18" stroke={INK} strokeWidth="3" fill="none" strokeLinecap="round" />
    </>
  ),
  health: (h) => (
    <>
      <path d="M60 98S20 74 20 46a20 20 0 0 1 40-6 20 20 0 0 1 40 6c0 28-40 52-40 52z" fill={c(h)} />
      <rect x="52" y="44" width="16" height="40" rx="3" fill={WHITE} />
      <rect x="40" y="56" width="40" height="16" rx="3" fill={WHITE} />
    </>
  ),
  nature: (h) => (
    <>
      <circle cx="84" cy="34" r="14" fill={c("amber")} />
      <path d="M30 56a14 14 0 0 1 26-6 11 11 0 0 1 18 10H26a8 8 0 0 1 4-4z" fill={WHITE} stroke={INK} strokeOpacity="0.15" strokeWidth="2" />
      <path d="M8 98l30-34 18 20 14-14 42 28z" fill={c(h)} />
      <path d="M38 64l8 9-8-2-8 3z" fill={WHITE} />
      <path d="M40 80v-6M52 92v-6M84 90v-6" stroke={INK} strokeOpacity="0.25" strokeWidth="3" strokeLinecap="round" />
    </>
  ),
  tech: (h) => (
    <>
      <rect x="38" y="16" width="44" height="86" rx="10" fill={INK} />
      <rect x="43" y="25" width="34" height="62" rx="4" fill={c(h)} />
      <circle cx="60" cy="94" r="3" fill={WHITE} />
      <rect x="48" y="32" width="14" height="10" rx="5" fill={WHITE} />
      <rect x="56" y="48" width="16" height="10" rx="5" fill={c("amber")} />
      <rect x="48" y="64" width="18" height="10" rx="5" fill={WHITE} />
      <path d="M92 40a14 14 0 0 1 0 20M100 34a24 24 0 0 1 0 32" stroke={c(h)} strokeWidth="4" fill="none" strokeLinecap="round" />
    </>
  ),
  party: (h) => (
    <>
      <path d="M28 98l18-62 34 34z" fill={c(h)} />
      <path d="M38 70l18 10M34 84l12 6" stroke={WHITE} strokeWidth="4" strokeLinecap="round" />
      <circle cx="84" cy="34" r="14" fill={c("rose")} />
      <path d="M84 48c-2 8 4 12 0 20" stroke={INK} strokeOpacity="0.4" strokeWidth="2" fill="none" />
      <circle cx="100" cy="56" r="10" fill={c("amber")} />
      <path d="M100 66c-2 6 3 9 0 14" stroke={INK} strokeOpacity="0.4" strokeWidth="2" fill="none" />
      {[[24, 26], [62, 20], [96, 88], [70, 98]].map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width="6" height="6" rx="1" fill={c("violet")} transform={`rotate(25 ${x} ${y})`} />
      ))}
    </>
  ),
  money: (h) => (
    <>
      <rect x="16" y="40" width="72" height="44" rx="8" fill={c(h)} />
      <circle cx="52" cy="62" r="11" fill={WHITE} fillOpacity="0.85" />
      <path d="M24 50h8M72 74h8" stroke={WHITE} strokeWidth="4" strokeLinecap="round" />
      <circle cx="88" cy="80" r="18" fill={c("amber")} />
      <circle cx="88" cy="80" r="12" fill="none" stroke={WHITE} strokeOpacity="0.7" strokeWidth="3" />
      <circle cx="96" cy="44" r="12" fill={c("amber")} />
    </>
  ),
  news: (h) => (
    <>
      <rect x="20" y="22" width="72" height="80" rx="6" fill={WHITE} stroke={INK} strokeOpacity="0.2" strokeWidth="2" />
      <rect x="28" y="30" width="56" height="12" rx="3" fill={c(h)} />
      <rect x="28" y="50" width="24" height="22" rx="3" fill={c("amber")} />
      <path d="M58 52h26M58 60h26M58 68h18M28 80h56M28 88h40" stroke={INK} strokeOpacity="0.35" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M92 40h8a4 4 0 0 1 4 4v50a8 8 0 0 1-8 8h-4" fill="none" stroke={INK} strokeOpacity="0.3" strokeWidth="3" />
    </>
  ),
  study: (h) => (
    <>
      <path d="M60 30l46 18-46 18-46-18z" fill={INK} />
      <path d="M32 58v20c0 8 14 14 28 14s28-6 28-14V58l-28 11z" fill={c(h)} />
      <path d="M100 50v26" stroke={c("amber")} strokeWidth="4" strokeLinecap="round" />
      <circle cx="100" cy="80" r="5" fill={c("amber")} />
    </>
  ),
};

/** Unit illustration on a soft tile in the unit's colour. */
export function SceneArt({ scene, className = "size-20" }: { scene: Scene; className?: string }) {
  const hue = SCENE_HUE[scene];
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden="true">
      <rect width="120" height="120" rx="28" fill={soft(hue)} />
      {SCENES[scene](hue)}
    </svg>
  );
}

/** A simple illustrated face for a course character. */
export function Avatar({ character, className = "size-11" }: { character: Pick<Character, "color" | "look" | "name">; className?: string }) {
  const hue = character.color as Hue;
  const hair = "var(--color-hair)";
  return (
    <svg viewBox="0 0 48 48" className={`${className} shrink-0`} role="img" aria-label={character.name}>
      <circle cx="24" cy="24" r="24" fill={c(hue)} />
      {character.look === "long" && <path d="M10 26c0-12 6-18 14-18s14 6 14 18v14H10z" fill={hair} />}
      <path d="M8 48c2-9 8-13 16-13s14 4 16 13z" fill={WHITE} fillOpacity="0.9" />
      <circle cx="24" cy="23" r="10" fill="var(--color-skin)" />
      {character.look === "short" && <path d="M14 21c0-7 4-11 10-11s10 4 10 11c-3-3-6-4-10-4s-7 1-10 4z" fill={hair} />}
      {character.look === "long" && <path d="M14 22c0-7 4-11 10-11s10 4 10 11c-4-2-6-5-7-7-3 4-8 6-13 7z" fill={hair} />}
      {character.look === "curly" &&
        [15, 19, 24, 29, 33].map((x, i) => <circle key={x} cx={x} cy={i % 2 ? 13 : 15} r="4.5" fill={hair} />)}
      <circle cx="20.5" cy="23.5" r="1.3" fill={INK} />
      <circle cx="27.5" cy="23.5" r="1.3" fill={INK} />
      <path d="M20.5 27.5c2 2 5 2 7 0" stroke={INK} strokeWidth="1.4" fill="none" strokeLinecap="round" />
    </svg>
  );
}
