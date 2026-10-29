# Notes for AI coding agents

Language-learning web app for Hebrew speakers (English and Spanish first). Full plan:
https://claude.ai/artifact/GFqUqL1TGLJecV2RuqKfsj

## Layout
- `content/courses/<course>/` – course content as YAML (written with AI, reviewed by people). Never put lesson content in code.
- `packages/content-schema` – Zod schema for content + `build-content` (YAML → `apps/web/public/content/*.json`).
- `packages/engine` – answer checking, the `Evaluator` interface (a future AI evaluator plugs in here), FSRS wrapper (ts-fsrs **v5** API: `fsrs()`, `createEmptyCard()`, `.next()`; v6 changed the API and needs Node 24).
- `packages/sync` – ops, merge rules, safety brake. **Must stay idempotent and order-independent**; the property tests in `sync.test.ts` enforce it.
- `apps/web` – Next.js 16 app (App Router, Turbopack). Read `node_modules/next/dist/docs/` before using Next APIs: `params`, `cookies()` and `headers()` are async; middleware is now `proxy.ts`.
- `supabase/migrations` – SQL schema with RLS. `supabase/tests` – RLS tests run on plain Postgres.

## Rules that protect learner data
1. Devices send **ops**, never state. The server only appends to `sync_ops` (no UPDATE/DELETE policies).
2. Pull before push. Clearing local data never sends anything.
3. Card state is recomputed from the merged review log, never stored as truth.
4. Any new op kind needs: a Zod schema in `ops.ts`, a merge rule in `state.ts`, the `kind` check in SQL, and a case in the property-test generator.

## Commands
- `pnpm check` – types, tests, content validation
- `DATABASE_URL=postgres://… scripts/test-db.sh` – schema + RLS tests
- `pnpm --filter web e2e` – Playwright on phone and desktop (after `pnpm build`)
- UI is Hebrew and right-to-left: use logical CSS (`ms-`, `ps-`, `start-`), wrap target-language text in `<Word>`.
