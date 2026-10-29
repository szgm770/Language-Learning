/* One consistent icon set: 24×24, 2px strokes, round caps. */

const paths = {
  home: "M4 11l8-7 8 7v8a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1z",
  path: "M6 4v4a4 4 0 0 0 4 4h4a4 4 0 0 1 4 4v4M6 20h.01M18 4h.01",
  words: "M5 4h10a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3zM5 17a3 3 0 0 1 3-3h10M9 8h5",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 20c1.5-4 4.5-6 8-6s6.5 2 8 6",
  play: "M8 5l11 7-11 7z",
  check: "M5 12.5l4.5 4.5L19 7.5",
  lock: "M7 11V8a5 5 0 0 1 10 0v3M6 11h12v9H6z",
  star: "M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.8l-5.2 2.8 1-5.8L3.5 9.7l5.9-.8z",
  flame: "M12 3c1 4 6 6 6 11a6 6 0 0 1-12 0c0-2.5 1.2-4.2 2.5-5.3.3 1.9 1.2 3 2.5 3.6 0-4-.6-7 1-9.3z",
  volume: "M4 9v6h4l5 4V5L8 9zM16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12",
  slow: "M4 9v6h4l5 4V5L8 9zM16 12h5",
  bulb: "M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.4 1 1.1 1 1.8V16h5v-.3c0-.7.4-1.4 1-1.8A6 6 0 0 0 12 3z",
  chat: "M4 5h16v11H9l-5 4z",
  close: "M6 6l12 12M18 6L6 18",
  back: "M9 5l7 7-7 7",
  gear: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1",
  repeat: "M4 4v6h6M20 20v-6h-6M5.6 15a7 7 0 0 0 12.2 2.4M18.4 9A7 7 0 0 0 6.2 6.6",
  trophy: "M8 4h8v5a4 4 0 0 1-8 0zM8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8 20h8M9 17h6",
  grammar: "M4 19L9 5l5 14M6 14h6M15 9h5M15 13h5M15 17h3",
  ear: "M8 15c-2-2-2-4-2-6a6 6 0 0 1 12 0c0 3-3 4-3 7a3 3 0 0 1-6 0M10 9a2 2 0 0 1 4 0",
  mic: "M12 3a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3zM5 11a7 7 0 0 0 14 0M12 18v3",
} as const;

export type IconName = keyof typeof paths;

export function Icon({ name, className = "size-6", filled = false }: { name: IconName; className?: string; filled?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        d={paths[name]}
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
