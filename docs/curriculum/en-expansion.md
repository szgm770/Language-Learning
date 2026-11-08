# English expansion plan (A0 → C1, 2026-11)

## Where we are (measured 2026-11-08)
- 1,226 taught items (learn cards): A0 61, A1 242, A2 212, B1 280, B2 260, C1 173. Many are phrases ("go home", "on time").
- Words a learner meets at least twice anywhere in the course: about 2,350.
- Running-text coverage (wordfreq, English, top 30k forms, simple inflection matching):
  taught items 66.5%, words met twice 78.2%.
- Of the 1,000 most frequent English forms, 236 are never met twice; of the top 3,000, about 1,150.

## Target
C1 reading needs about 95% coverage of ordinary text, which takes roughly 4,500–5,000 word families.
Goal: about **4,000 taught lexemes** (≈ 2,800 new) and 95% coverage on held-out text.

| Level | Taught now | Target | New |
|-------|-----------:|-------:|----:|
| A1 | 242 | 500 | ~260 |
| A2 | 212 | 650 | ~440 |
| B1 | 280 | 950 | ~670 |
| B2 | 260 | 1,050 | ~790 |
| C1 | 173 | 800 | ~630 |

## How words are chosen
1. Frequency: wordfreq (subtitles, news, books, web) lemmatised with `lemminflect`; irregular forms (went, children)
   are taught on the lemma's learn card.
2. Remove words already taught, names, and words unsuitable for the audience.
3. Level by frequency rank (A1 ≈ top 800, A2 ≈ 1,500, B1 ≈ 2,500, B2 ≈ 3,500, C1 ≈ 5,000), then moved to the unit
   whose topic needs the word.
4. Coverage is measured on texts not used for choosing (public-domain modern prose plus texts the owner supplies)
   after each level, before publishing.

## How words enter the story (no word packs)
- Each existing unit gets one or two lessons ״היומן של נועה״ appended **after its review lesson**
  (published lesson ids never change): a dialogue or short diary entry in the unit's scene, 8–10 words, the usual
  learn → match → meaning → gap → word bank pattern. 55 units × ~1.5 lessons × 9 ≈ 750 words.
- New story units for the rest (≈ 2,000 words, about 40 units of 3 new lessons + review), placed inside the
  existing levels, each a new chapter of the same story:
  - A1–A2: Noa's family in Jerusalem, the neighbourhood, school and shul, a family simcha.
  - B1: London life (v1–v2 continue): the bakery, the community, Grandpa Shimon's notebook.
  - B2: the Levy family history, Miriam's farm, a trip to Manchester; work under pressure.
  - C1: the Jaffa office (v5–v6, u41–u46): the board, the press, a legal problem, the siyum and the full circle.
- Every new unit keeps the content rules in CLAUDE.md and passes `pnpm check` and the content grep.

## Order of work
1. Tooling: frequency list, lemmatiser, a coverage script in `scripts/` (like the Aramaic ones), and a generator
   that appends a lesson to a unit without changing ids.
2. A1 → C1, one level per PR: appended lessons first, then new units; measure coverage, publish.
3. Level tests (a1…c1-test) get questions on the new words.
4. Spanish next, same method (~1,300 entries).

## Learning extras (separate PRs)
1. **Pictures for concrete words**: open-licence SVG icons (OpenMoji, CC BY-SA; Twemoji, CC BY) bundled with the site,
   an optional `image` field on a lexeme, a picture-choice exercise. Abstract words keep text only.
2. **Story chapters to read and listen**: each unit's dialogues joined into one chapter, read aloud by the characters'
   voices (existing `pitch`), with tap-a-word translation. Works offline.
3. **״מילים שכבר מכירים״ boost**: English words already used in Hebrew (טלפון, מחשב, פרויקט) as a quick early win.
4. **Sound pairs for Hebrew speakers**: th/s, w/v, ship/sheep, short listening pairs (A0–A1).
5. **Daily 5-minute review** from FSRS due cards with a short story sentence for each word, not bare translation.

## Business English
Not a separate course. An open section ״אנגלית לעבודה״ (like the Aramaic sections, available from B1) with
8–10 units: emails, meetings, calls, interviews, presentations, negotiation, small talk, reports. It reuses Noa's
office story. Other sections (travel, health, English for studies) only by demand.
