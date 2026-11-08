# Aramaic (arc-for-he) – blueprint

Status: plan approved by the owner (2026-11-08). Code foundation done (see below). Next: one pilot unit for review.

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
| A0 | 0. פתח | Reading without niqqud, abbreviations (ת״ש, א״ר, מתני׳, גמ׳), telling Hebrew from Aramaic on the page. |
| A1 | 1. מילות הסוגיה | ~150 key words: מאי, אמר, תניא, איכא/ליכא, הכא/התם, הכי/היכי, אלא, קשיא, תיובתא, שמע מינה… |
| A2 | 2. פעלים וכינויים | אנא/את/איהו/אנן, the ־א ending, past/participle/future (נ־), basic verb patterns. |
| B1 | 3. מבנה הסוגיה | Question and answer, איבעיא, דיוק, מחלוקת, תא שמע. Passages of 3–5 lines. |
| B2 | 4. סוגיה שלמה | Independent reading of longer passages from several tractates. |

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

## Order of work
1. Plan (done). 2. Schema/engine changes (done). 3. One pilot unit for expert review. 4. Core track. 5. Branches.
