# Aramaic (arc-for-he) – planning draft

Status: planning only. No course content exists yet.

## Goal
Reading and understanding Aramaic in the sources of Judaism. Not modern spoken Aramaic.
Audience: everyone (no Gemara background assumed). Pronunciation: Chabad tradition.

## Principles
- Content is real quotations with a source reference (tractate/page, verse, Zohar portion). Never invented Aramaic.
- Every unit is reviewed by a person who knows the sources before it is published.
- Hebrew letters only. Gemara text is shown unvocalised; vocalised/partly vocalised views are optional.
- Stages, not CEFR (CEFR describes spoken languages).

## Dialects and tracks
1. Core: Babylonian Aramaic (Bavli). Letters/reading, key words (מאי, אמר, תניא, קשיא, איכא, הכא, ...), verbs, pronouns, structure of a sugya.
2. Branches after the core, each its own course:
   - Yerushalmi (Galilean/Western forms).
   - Targum: Onkelos, then Jonathan.
   - Biblical Aramaic (Daniel, Ezra).
   - Zohar (own vocabulary and forms).
   - Later: midrashic Aramaic and others, by demand.

## Technical work needed
- New language code and a course type without speech: decide what replaces listening/speak tasks (e.g. Hebrew-reading with Chabad pronunciation, or none).
- Unvocalised text display and a source field on each exercise.
- Engine: answer checking for Hebrew-letter targets (ignore nikud).
- Faster course loading (one summary file per course) before adding more languages.

## Open decisions
- Text sources and licences (Sefaria texts have per-text licences; check each).
- Stage names.
- Reviewer(s) beyond the owner.

## Order of work
1. This plan. 2. Schema/engine changes. 3. One pilot unit for expert review. 4. Core track. 5. Branches.
