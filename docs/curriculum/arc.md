# Aramaic (arc-for-he) – blueprint

Status: core track (stages 1–5, 26 units) written 2026-11-08; pilot unit reviewed by the owner. Branches not started.

## Goal
Reading and understanding Aramaic in the sources of Judaism. Not modern spoken Aramaic.
Audience: everyone (no Gemara background assumed). Pronunciation: Chabad tradition.

## Principles
- Content is real quotations with a source reference (tractate/page, verse, Zohar portion). Never invented Aramaic.
  If no fitting quotation exists, the form is taught without a sentence.
- Every unit is reviewed by a person who knows the sources before it is published (owner first; more reviewers later).
- Hebrew letters only. Gemara text is shown unvocalised; the vocalised form is shown on request.
- Stages, not CEFR (CEFR describes spoken languages).
- No audio and no listening/speaking tasks (`speechLang: none`).

## Stages (core track: Babylonian Aramaic)
Units keep a `cefr` field as the internal level; the course's `stages` gives each level its name.

| Level | Stage | Content |
|-------|-------|---------|
| A0 | 1. היכרות עם הדף | Reading without niqqud, abbreviations (ת״ש, א״ר, מתני׳, גמ׳), telling Hebrew from Aramaic on the page. |
| A1 | 2. מילות הסוגיה | ~150 key words: מאי, אמר, תניא, איכא/ליכא, הכא/התם, הכי/היכי, אלא, קשיא, תיובתא, שמע מינה… |
| A2 | 3. פעלים וכינויים | אנא/את/איהו/אנן, the ־א ending, past/participle/future (נ־), basic verb patterns. |
| B1 | 4. מבנה הסוגיה | Question and answer, איבעיא, דיוק, מחלוקת, תא שמע. Passages of 3–5 lines. |
| B2 | 5. סוגיה שלמה | Independent reading of longer passages from several tractates. |

About 25–30 units; the final number follows the coverage measurement.

## What replaces listening and speaking
Reading tasks, built from existing exercise types: split an unvocalised line into words, expand an abbreviation,
choose the right vocalised reading, analyse a form (root, person, tense). No reading aloud (it cannot be checked
without audio).

## Story: "המחברת של סבא" (the grandfather's notebook)
Eitan, 26, works in high-tech and never learned Gemara. He inherits his grandfather's Shas. The margins hold
handwritten notes, and a drawer holds a sealed letter: "כל מה שרציתי לומר לך כתוב בדף. תמצא אותו."
Each note points to a real sugya; only understanding the Aramaic on the page reveals the next clue. Step by step
the grandfather's story comes out: the yeshiva in Europe, the escape, coming to Eretz Yisrael, and one family
secret revealed only at the end.

Characters (names to be confirmed by the owner):
- **Eitan (איתן)** – the learner: curious and sceptical.
- **R' Yisrael (ר׳ ישראל)** – the grandfather's old chavruta, 85, witty; refuses to give answers before Eitan reads for himself.
- **Chana (חנה)** – Eitan's sister, a historian: background on Sura and Pumbedita and on the grandfather's yeshiva.

Dialogues are in Hebrew; Aramaic appears only as quotations from the page. The grandfather "loved aggadot", which
brings in real Aramaic narratives (e.g. Rabbah bar bar Chana's journeys, Bava Batra 73a–74b; stories from Gittin and Ta'anit).

## Choosing words
- Frequency from the full Bavli. Choose from some tractates, measure coverage on others not used for choosing
  (e.g. choose from Nezikin and Moed, measure on Berakhot and Kiddushin).
- Much of the page is Hebrew the learner already knows: report coverage both with and without the Hebrew parts.
- Text source: Sefaria-Export on GitHub. Check the licence of each edition before use (the Vilna text itself is
  public domain; the digitisation's licence still matters).

## Done in code (PR "Aramaic foundation")
- `arc` is a language code; the UI treats it as right-to-left and calls it ארמית.
- Course fields: `quotesOnly` (build fails if a sentence exercise or word example has no `source`) and `stages`
  (build fails if a unit's level has no stage name). `speechLang: none` courses may not have dictation/listening/speak tasks.
- Exercise and word-example fields `source` and `vocalized`; the app shows the source and a "הצגה עם ניקוד" toggle.
- Answer checking for `arc`: niqqud ignored, abbreviation marks (״ " ׳ ') dropped, maqaf splits words.
- A summary file per course (`CourseManifest`) already existed, so no change was needed for faster loading.

## Branches (after the core, each its own course)
Yerushalmi (Galilean/Western forms); Targum (Onkelos, then Jonathan); Biblical Aramaic (Daniel, Ezra); Zohar;
later midrashic Aramaic and others by demand.

## Core units (course order)
| Stage | Units |
|-------|-------|
| 1 היכרות עם הדף | u00a דף גמרא · u00b מי אמר |
| 2 מילות הסוגיה | u01 מאי (BM 2a–3a) · u02 נצחוני בני (BM 59b) · u03 רבי ינאי והאילן (BB 60) · u04 שאלות (Berakhot 2a) · u05 האי/הא/הני · u06 איתא/ליתא |
| 3 פעלים וכינויים | u07 אנא (Berakhot 30b) · u08 חוני (Taanit 23a) · u09 אבא חלקיה · u10 עתיד (Taanit 23b) · u11 זמנים ומספרים (Berakhot 3b) · u12 רבי עקיבא ורחל (Ketubot 62b–63a) |
| 4 מבנה הסוגיה | u13 קושיא · u14 ראיות · u15 איבעיא · u16 מחלוקת · u17 אוקימתא · u18 בשלמא · u19 קרא ועובדא |
| 5 סוגיה שלמה | u20 רבה בר בר חנה (BB 73b) · u21 קמצא ובר קמצא (Gittin 55b–56a) · u22 הלל ויבנה (Shabbat 31a, Gittin 56b) · u23 מאי מצאתיה (BM 2a) · u24 הדרן עלך (BM 21a) |

Story: Eitan, his grandfather's Shas and notes; R' Yisrael turns out to be the second boy hidden with the grandfather in a Lithuanian hayloft in 1943; the farmer's grandson Jonas comes to the siyum with the boys' coat.

## Coverage (measured 2026-11-08)
Words chosen from the whole Bavli except Berakhot and Kiddushin; measured on those two (127k words). Mishnaic Hebrew (words appearing at least twice in the Mishnah) counts as known; abbreviations count as known (taught as a skill).
- Hebrew only: 72.6%
- + the 285 course words (320 written forms): 81.3%
- + names of sages: 82.9%
Inflected forms not taught one by one (קאמרי, אמרינן, ליתנייה…) are counted as unknown, so real reading coverage is higher. To raise it further: more high-frequency forms (list: `scripts` + `/home/claude/sefaria/miss.json` method) and the branch courses.

## Tools
- `scripts/arc-quote.py "<Tractate>" <daf> "<text>"` checks a quotation word for word and prints its vocalised form.
- `scripts/arc-find.py <word>` lists short real lines that use a word.

## Order of work
1. Plan (done). 2. Schema/engine changes (done). 3. Pilot unit (done, reviewed). 4. Core track (done). 5. Branches.
