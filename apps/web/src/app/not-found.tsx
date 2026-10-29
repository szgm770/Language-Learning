import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-2xl font-semibold">הדף לא נמצא</h1>
      <Link href="/learn/" className="btn-primary">
        למסך הבית
      </Link>
    </main>
  );
}
