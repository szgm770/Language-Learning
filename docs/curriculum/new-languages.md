# New languages – work plan (draft, 2026-11-09)

Russian, Mandarin Chinese, Arabic, Korean and French for Hebrew speakers.
Same rules as every course (CLAUDE.md): content in YAML only, Torah-observant, learn before practise,
written with AI and **not finished until a native speaker and a Torah-observant reader have reviewed it**.
Each language gets its own blueprint (`docs/curriculum/<lang>.md`, like `es.md`) before any unit is written.

## 1. What the code already has, and what is missing

All five codes (`ru fr ar zh ko`) are already in `LangCode` (schema) and in `lib/languages.ts`; `ar` is already
right-to-left (`dirOf`), and `normalize` already strips Arabic harakat. Everything else is per-language work:

| Need | fr | ru | ko | ar | zh |
|------|----|----|----|----|----|
| Browser voice (`speechLang`) | fr-FR, good | ru-RU, good | ko-KR, good | ar-SA/ar-EG only (Standard Arabic; no Levantine voice) | zh-CN, good |
| On-screen special keys (`TextAnswer`, today only `es`) | é è ê à â ç ô û ù î ï ë œ « » | full Cyrillic layout for A0–A1 (most learners have no Russian keyboard) | none: system keyboard + tip in A0 (Hangul needs syllable composition) | system keyboard + tip; optional Arabic key row in A0 | none: system pinyin IME (see below) |
| `normalize` rules | fold accents to the "accent" verdict as in Spanish; œ = oe | ё = е (books print е); ударение marks stripped | NFC Hangul; spacing mistakes (띄어쓰기) give "typo", not "wrong" | أ إ آ ٱ → ا, ى ↔ ي at word end, ة ↔ ه at word end, tatweel removed, Arabic-Indic digits → 0-9, Arabic comma/question mark | no spaces: compare without spaces; full-width punctuation removed; accept pinyin answers (below) |
| Word splitting (`wordBankTiles`, typo check) | spaces, fine | fine | fine (word = eojeol) | fine | **must change**: sentences have no spaces. Add an optional `tiles` list to `word_bank` (or split answers on `|` at build time); typo check per character for `zh` |
| `TYPO_MIN_WORD_LENGTH` (5) | fine | fine | too long for Korean words (2–3 syllables): per-language value | fine | not used (character-based) |
| Pronunciation hint (`pronunciation`) | Hebrew letters, only in A0–A1 | Hebrew letters + stress mark | Hebrew letters in A0–A1, then none | Hebrew letters (the Israeli school convention) + harakat on learn cards | **pinyin with tone marks** on every learn card; Hebrew letters only in A0 |
| Font check (phones) | – | – | Noto Sans KR fallback | line height and size for Arabic | Noto Sans SC fallback; size ≥ 20px for characters |
| Content lint (new test) | – | no Latin letters in target text | no Hanja in A0–B1 | harakat only on learn cards/examples, one spelling convention | Simplified characters only (no Traditional variants) |

Shared refactor before the first new course: move the per-language rules that are now scattered
(`RTL` in `ui.tsx`, the Spanish keys in `TextAnswer.tsx`, `if (lang === …)` branches in `normalize.ts`, the typo
length) into one table per language, e.g. `packages/engine/src/langs/<code>.ts` with
`{ dir, keys, normalize, tokenize, typoMinLength }`. Each new language then adds one file plus tests
(`normalize-<code>.test.ts`), and an e2e run that solves sample lessons on phone and desktop.

### Chinese answers: characters and pinyin
Typing Chinese needs a pinyin IME, which most Hebrew speakers have never used. Proposal:
- The learner may answer in characters **or** in pinyin. At build time `build-content` adds the pinyin of each
  accepted answer (library `pinyin-pro`, checked by the reviewer for polyphonic characters like 了 行 长).
- Pinyin without tone marks or with tone numbers (`ni3 hao3`) is accepted with the "accent" verdict, as missing
  Spanish accents are; correct tones give "correct".
- Early levels rely on `multiple_choice`, `word_bank`, `match_pairs` and listening; free typing grows from A2.

## 2. Teaching differences per language (summary; full tables go in each blueprint)

**French (`fr-for-he`, standard French of France, `fr-FR`)** – closest to the existing Spanish engine.
Spelling ↔ sound is the hard part (silent letters, nasal vowels, liaison, e muet): A0 needs a full sounds unit
and dictation practice all the way through. Gender with article on every noun (as in Spanish), *tu/vous* from
lesson one, passé composé vs imparfait (A2–B1), subjonctif (B1+). Hebrew speakers know ר גרונית: a positive tip.
Learning load is low (FSI category I): about 45 units A0–C1, like Spanish.

**Russian (`ru-for-he`, `ru-RU`)** – Cyrillic in A0 (two to three units; many letters look like Latin but sound
different: В Н Р С). Stress is free and changes vowels (о → а): learn cards show the stress mark, exercises do
not. Six cases are the main load: introduce one case at a time from late A1 to B1, always in fixed phrases first.
Verb aspect (perfective / imperfective) has no Hebrew equivalent: its own unit at A2 and B1. Hebrew drops "to be"
in the present, like Russian: positive transfer. Motion verbs (идти/ходить/ехать) at A2–B1. FSI category III:
about 55 units.

**Korean (`ko-for-he`, Seoul standard, `ko-KR`)** – Hangul is the easiest script of the five: A0 is three units
and the learner reads after a week. Verb at the end, particles (은/는, 이/가, 을/를) instead of word order;
speech levels (해요체 polite, 합니다체 formal, 반말 casual) have no Hebrew parallel: start with 해요체 only,
add 합니다체 at A2 and 반말 at B1. Two number systems (native and Sino-Korean) at A1. FSI category IV:
about 60 units; A1 and A2 each take more units than in Spanish.

**Arabic (`ar-for-he`)** – the biggest decision (section 4). Hebrew speakers get a lot for free: roots and
patterns (binyanim ≈ awzān), many shared roots, gender, dual, construct state (סמיכות ≈ iḍāfa). The script is
taught in A0 with letter forms by position; harakat appear on learn cards and early lessons, then fade out.
Sounds Hebrew lost (ع ح ط ص ض ظ ق ث ذ) get a sounds unit with minimal pairs. FSI category IV: about 60 units.

**Mandarin Chinese (`zh-for-he`, Putonghua, Simplified characters, `zh-CN`)** – four tones plus neutral tone
from the first lesson (tone pairs drills with `listening_choice`); pinyin is taught in A0 as a tool, characters
arrive gradually (target ~150 characters at A1, ~600 at A2, in line with HSK 1–3). Grammar is light (no
conjugation, no gender) but measure words (个 本 张 …), aspect particles (了 过 着) and word order of time/place
are new. Characters are learned by components (radicals) with a `tip` per new radical. FSI category IV:
about 60 units; listening matters more than in any other course.

## 3. Story per language

Each course has its own storyline, different from English (Noa in London), Spanish (Yael in Mexico City),
Yiddish (Menachem in Kfar Chabad) and Aramaic (Eitan and the Shas notes). All mixed scenes are groups, family
or colleagues; the local Jewish community gives Shabbat and yom tov scenes; nothing happens on Shabbat.

| Course | Proposal | Characters | Natural Jewish scenes |
|--------|----------|------------|-----------------------|
| French | **Avital**, an Israeli architecture student, spends a year in **Strasbourg** helping restore an old synagogue. Old Jewish Alsace, trips to Paris on Sunday, a study group. | Monsieur Bloch (gabbai, retired engineer), Madame Dreyfus (landlady), Julien and Camille (fellow students, always as a group), Professeur Moreau, Rav Attal, Avital's parents on video calls | Friday-night meal with the Bloch family, a kosher bakery in the old town, history of the community, a Sephardi family from North Africa |
| Russian | **Itai** (16, Ashdod) finds a bundle of letters his grandfather **Boris** wrote as a refusenik in 1970s Leningrad, about secret Torah study. To read them he learns Russian with grandmother **Raya**. Present-day scenes in Israel (where Russian is spoken in every shop and clinic), past-tense scenes from the letters. | Babushka Raya, Dedushka Boris (in the letters), neighbour Sveta and her family, pharmacist Dr. Kaplan, Rav Gurevich (teaches the secret shiur in the letters), Itai's cousin Misha | Underground shiur and matzah baking in the letters, Pesach seder with grandparents, aliyah story; the plot gives the past tense and aspect naturally |
| Korean | **Hadar**, an Israeli student, does a semester at a university in **Seoul** and lives with a host family. Keeping kosher in Korea is a running theme (vegetarian dishes, kimchi made at home, kosher supplies from the Chabad house). | Mr. Park and Mrs. Kim (host parents), their daughter Ji-woo (same age, a friend), grandmother Halmeoni, Professor Lee, Rabbi and Rebbetzin of the Chabad house | Friday-night meal at the Chabad house with Korean guests, Chanukah candle lighting in the city, explaining Shabbat to the host family; speech levels come out of the family scenes |
| Arabic | **Elisheva**, a nurse, starts working in a **Jerusalem hospital ward** with Arabic-speaking colleagues and patients. Everyday, professional, respectful; no politics. | Dr. Samir Haddad (head of the ward), nurse Rana, the pharmacist Abu Yusuf, an elderly patient and his family, Elisheva's grandmother **Savta Rachel** who grew up in Baghdad and still knows Arabic proverbs | Savta Rachel's Judeo-Arabic proverbs and recipes, Shabbat shifts (handled by colleagues), a later section on Judeo-Arabic texts (the Rambam's letters, the Kuzari in the original) like the Aramaic branches |
| Mandarin | **Yonatan**, a drip-irrigation engineer, is sent to **Shanghai** for a project. He discovers the story of the Jewish refugees in Hongkou during the war and the Ohel Moshe synagogue. | Chen Wei (colleague), Teacher Wang (Chinese teacher), Mrs. Liu (landlady), Xiao Li (driver), the Chabad rabbi in Shanghai, an elderly neighbour who remembers the refugees, Yonatan's daughter on video calls | Friday-night meal at the Chabad house, the refugees' history (reading texts at B1–B2), a Sunday trip to Kaifeng about its old Jewish community |

## 4. Decisions the owner needs to make

1. **Order of courses.** Proposal: French → Russian → Korean → Arabic → Mandarin, from the least code work to the
   most (French reuses the Spanish engine almost unchanged; Mandarin needs tokenization and pinyin answers).
   Another order is fine if one language matters more to learners.
2. **Which Arabic.** Options:
   (a) spoken Levantine/Palestinian Arabic (what Israelis hear every day) in Arabic script with Hebrew
   transliteration; no good browser voice, so `speechLang: none` until recordings exist (like Yiddish);
   (b) Modern Standard Arabic (newspapers, Bagrut, Judeo-Arabic texts), with the ar-SA voice;
   (c) spoken Arabic as the main path and Standard Arabic as a section (like the Aramaic branches).
   Proposal: (c), starting with the spoken path.
3. **"Spoken Chinese".** Proposal: Mandarin (Putonghua), Simplified characters, pinyin as support. Cantonese
   would need traditional characters, Jyutping and a zh-HK voice; it can be a later course.
4. **French variety.** Proposal: France (fr-FR); a tip mentions Québec. Belgium and Switzerland only in tips.
5. **Scope of the first release per language.** Proposal: A0 → A2 first (about 20–25 units), published with a
   "draft, not yet reviewed" note, then B1+ after the review of A0–A2.
6. **Reviewers.** One native speaker per language (for Arabic: a speaker of the chosen variety) plus a
   Torah-observant reader. Without them a course stays marked as unreviewed.

## 5. Observance notes specific to these cultures

On top of the CLAUDE.md list:
- **French:** no wine-tasting, apéritif or café-with-alcohol scenes; no Christmas markets (Strasbourg is famous for
  them: leave them out); church buildings only as architecture in passing, never visits for worship.
- **Russian:** no vodka scenes or toasts; Novy God with the yolka (tree) and Ded Moroz is left out; the Victory Day
  and Soviet history may appear in the letters, carefully.
- **Korean:** no soju, no ancestor rites (jesa, charye) or temple visits; Chuseok only as a family meal date; no
  K-pop romance themes.
- **Arabic:** no politics, no religious debate; common phrases like *in shā' Allāh* and *al-ḥamdu lillāh* are fine
  (Jews used them for centuries); no Ramadan iftar meals (kashrut); hospital scenes stay modest.
- **Mandarin:** no temple, incense or ancestor-offering scenes; Spring Festival only as a family meal and travel
  date; no baijiu toasts at business dinners (the dinner happens, toasts with tea).

## 6. Work phases

| Phase | What | Done when |
|-------|------|-----------|
| 0 | Owner decisions (section 4) | answers recorded in this file |
| 1 | Per-language table in the engine (`langs/*.ts`), French and Russian rules, Cyrillic and French key rows, tests | `pnpm check` green, e2e on a test course |
| 2 | French: blueprint `fr.md`, A0 → A2, level tests, then B1 → C1 | e2e solves a sample of every unit; review requested |
| 3 | Russian: blueprint `ru.md`, A0 → A2 (Cyrillic A0, cases plan), then B1+ | same |
| 4 | Korean: per-language typo length, Hangul A0, speech-level plan, A0 → A2, then B1+ | same |
| 5 | Arabic: normalize rules (hamza, ى, ة), script A0, chosen variety, A0 → A2; Standard Arabic section later | same |
| 6 | Mandarin: `tiles` in `word_bank`, character-based typo check, pinyin answers at build time, tone drills, A0 → A2, then B1+ | same |

Each language follows the Spanish lesson pattern (about 6 lessons per unit: new, new, grammar, listening, reading,
review), word packs (`p1…`) built from a frequency list of that language (as in `en-expansion.md`), level tests
at each level, and from B1 a `write` task at the end of every review lesson.
