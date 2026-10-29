import Link from "next/link";

/** The mark: a speech bubble with a second line answering it. Same drawing as the app icon. */
export function Logo({ className = "size-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 512 512" className={className} aria-hidden="true">
      <rect width="512" height="512" rx="112" fill="var(--color-cobalt)" />
      <path
        d="M136 176h136a40 40 0 0 1 40 40v40a40 40 0 0 1-40 40h-56l-56 44v-44h-24a40 40 0 0 1-40-40v-40a40 40 0 0 1 40-40z"
        fill="var(--color-paper)"
      />
      <path d="M376 236h-24v108h-40l-36 32v-32" fill="none" stroke="#f2b53a" strokeWidth="28" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

export function Brand({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="inline-flex min-h-11 items-center gap-2" aria-label="לינגו, לעמוד הראשי">
      <Logo />
      <span className="text-xl font-bold tracking-tight">לינגו</span>
    </Link>
  );
}
