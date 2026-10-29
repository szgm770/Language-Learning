# Notes for AI coding agents

Language-learning web app for Hebrew speakers (English and Spanish first). Full plan:
https://claude.ai/artifact/GFqUqL1TGLJecV2RuqKfsj

## Layout
- `content/courses/<course>/` – course content as YAML (written with AI, reviewed by people). Never put lesson content in code.
  English A1 follows `docs/curriculum/en-a1.md` (units, lesson pattern, characters Noa/Ben/Rachel/Eli/Miriam/Mr. Cohen).
  Lesson steps: `learn` (introduce a word), `dialogue`, `dialogue_gap`, `tip` (ungraded) plus the graded exercise types.
  The build fails if a word is practised before a learn card introduces it.
  Quote YAML values that contain commas (`scripts/quote-yaml-flow.py <file>` fixes one-line `{ … }` maps).
- `packages/content-schema` – Zod schema for content + `build-content` (YAML → `apps/web/public/content/*.json`).
- `packages/engine` – answer checking, the `Evaluator` interface (a future AI evaluator plugs in here), FSRS wrapper (ts-fsrs **v5** API: `fsrs()`, `createEmptyCard()`, `.next()`; v6 changed the API and needs Node 24).
- `packages/sync` – learner state built from ops (merge rules, streak). No cloud sync today, but the rules **must stay idempotent and order-independent** so it can be added later; the property tests in `sync.test.ts` enforce it.
- `apps/web` – Next.js 16 app exported as a **static site** (`output: "export"`) for GitHub Pages under `PAGES_BASE_PATH`. No server, no API routes, no database: all learner data is in IndexedDB. Use `withBase()` for any URL not made by next/link. Dynamic routes need `generateStaticParams` (see `lib/static-params.ts`). Read `node_modules/next/dist/docs/` before using Next APIs: `params`, `cookies()` and `headers()` are async; middleware is now `proxy.ts`.

## Rules that protect learner data
1. Every change is recorded as an op in IndexedDB; state is rebuilt from ops.
2. Card state is recomputed from the review log, never stored as truth.
3. Any new op kind needs: a Zod schema in `ops.ts`, a merge rule in `state.ts`, and a case in the property-test generator.
4. iOS Safari evicts site data after 7 days without a visit unless installed to the home screen (`InstallHint`).
5. A Firebase-based sync existed on the `firebase` branch (PR #2, closed) if cloud backup is ever wanted.

## Commands
- `pnpm check` – types, tests, content validation
- `pnpm --filter web e2e` – Playwright on phone and desktop, incl. offline, against `out/` (after `pnpm build`; set the same `PAGES_BASE_PATH` for both)
- UI is Hebrew and right-to-left: use logical CSS (`ms-`, `ps-`, `start-`), wrap target-language text in `<Word>`.
