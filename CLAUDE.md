# Notes for AI coding agents

Language-learning web app for Hebrew speakers (English and Spanish first). Full plan:
https://claude.ai/artifact/GFqUqL1TGLJecV2RuqKfsj

## Layout
- `content/courses/<course>/` – course content as YAML (written with AI, reviewed by people). Never put lesson content in code.
  English runs A0 → C1 (55 units). v1–v6 were word packs and are now story units (Noa in London, Grandpa Shimon and the Levy bakery, the Tel Aviv office in Jaffa; extra character `saba`); their lesson and exercise ids are unchanged. A0 (letters, sounds, first words) follows `docs/curriculum/en-a0.md`; A1 follows `docs/curriculum/en-a1.md` (units, lesson pattern, characters Noa/Ben/Rachel/Eli/Miriam/Mr. Cohen); A2–B2 follow `docs/curriculum/en-a2-b2.md`; C1 (u41–u46, level test `c1-test`) follows `docs/curriculum/en-c1.md`.
  Spanish (`es-for-he`, Latin-American, Yael in Mexico City) runs A0 → C1 in 49 units: u00a–u00c (A0), u01–u10 (A1), u11–u20 (A2), u21–u30 (B1), u31–u40 (B2), u41–u46 (C1), p1–p6 word packs, and level tests a1/a2/b1/b2/c1-test. Blueprint and method differences from English: `docs/curriculum/es.md`. From B1 on every review lesson ends with a `write` task (free writing, checked by regex; accents are folded in `checkWriting`, so write patterns without accents). The Spanish storyline is deliberately different from the English one.
  Aramaic (`arc-for-he`) follows `docs/curriculum/arc.md`: `quotesOnly` (every sentence is a real quotation with a `source`, never invented Aramaic), `stages` instead of CEFR names, `speechLang: none`. Its branches (Onkelos, Daniel/Ezra, Yerushalmi, Zohar; `docs/curriculum/arc-branches.md`) are units with a `section`: each section is open from the start and locks only inside itself; sections come after the main path.
  The A0 level of every course is optional: it never locks A1, and once a later lesson is done it is no longer suggested as the next lesson (`isOptional` in `lib/progress.ts`).
  Lesson steps: `learn` (introduce a word), `dialogue`, `dialogue_gap`, `tip` (ungraded) plus the graded exercise types.
  The build fails if a word is practised before a learn card introduces it.
  Quote YAML values that contain commas (`scripts/quote-yaml-flow.py <file>` fixes one-line `{ … }` maps).
- `packages/content-schema` – Zod schema for content + `build-content` (YAML → `apps/web/public/content/*.json`).
- `packages/engine` – answer checking, the `Evaluator` interface (a future AI evaluator plugs in here), FSRS wrapper (ts-fsrs **v5** API: `fsrs()`, `createEmptyCard()`, `.next()`; v6 changed the API and needs Node 24).
- `packages/sync` – learner state built from ops (merge rules, streak). No cloud sync today, but the rules **must stay idempotent and order-independent** so it can be added later; the property tests in `sync.test.ts` enforce it.
- `apps/web` – Next.js 16 app exported as a **static site** (`output: "export"`) for GitHub Pages under `PAGES_BASE_PATH`. No server, no API routes, no database: all learner data is in IndexedDB. Use `withBase()` for any URL not made by next/link. Dynamic routes need `generateStaticParams` (see `lib/static-params.ts`). Read `node_modules/next/dist/docs/` before using Next APIs: `params`, `cookies()` and `headers()` are async; middleware is now `proxy.ts`.

## Content must suit Torah-observant Jewish learners
All content (any course) is for shomer Torah u'mitzvot users. When writing or reviewing YAML:
- Nothing happens on Shabbat or yom tov (no travel, shopping, work, sport, cooking, concerts, parties). Put weekend activities on Friday morning or Sunday. A Friday-night dinner with family is fine and welcome.
- Food is kosher: no pork, shellfish, or meat with dairy in the same meal. Restaurants are kosher.
- No alcohol-centred scenes (pub, bar, "cheers"); wine only for Kiddush. No Christmas, Easter, Halloween, Valentine's Day.
- Modest, non-romantic content: no dating, boyfriend/girlfriend, kissing, mixed dancing, mixed pair outings (use groups, family, colleagues). Husband/wife and engagement are fine.
- Run `pnpm check` and grep for `Saturday|pub|wine|date|dance` after writing a unit.

## Rules that protect learner data
1. Every change is recorded as an op in IndexedDB; state is rebuilt from ops.
2. Card state is recomputed from the review log, never stored as truth.
3. Any new op kind needs: a Zod schema in `ops.ts`, a merge rule in `state.ts`, and a case in the property-test generator.
4. iOS Safari evicts site data after 7 days without a visit unless installed to the home screen (`InstallHint`).
5. Moving to another device needs no server: Settings → "מעבר למכשיר אחר" shows a QR of a short position code (`lingo1.<course>.<next lesson id>[.<passed tests>]`, see `lib/transfer.ts`), scans it with the camera (BarcodeDetector or jsQR), accepts it typed, lets the learner pick a place by hand, and imports the JSON export. Applying a code only marks lessons done (same as placement); it never undoes progress. Level tests never block the next lesson.
6. A Firebase-based sync existed on the `firebase` branch (PR #2, closed) if cloud backup is ever wanted.

## Deploy
- GitHub Pages: `.github/workflows` publishes `main` under `PAGES_BASE_PATH`.
- Vercel (project `language-learning-770`, root directory `apps/web`): `apps/web/vercel.json` runs the root build (`pnpm build`, which generates `public/content` first), framework `other`, output `out/`. Do not set `PAGES_BASE_PATH` there. Production branch: `main`.

## Commands
- `pnpm check` – types, tests, content validation
- `pnpm --filter web e2e` – Playwright on phone and desktop, incl. offline, against `out/` (after `pnpm build`; set the same `PAGES_BASE_PATH` for both)
- UI is Hebrew and right-to-left: use logical CSS (`ms-`, `ps-`, `start-`), wrap target-language text in `<Word>`.
