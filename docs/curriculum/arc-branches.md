# Aramaic branch courses

Each branch is a section of the Aramaic course (`arc-for-he`): its units carry `section: onkelos | mikra | yerushalmi | zohar`,
the course lists the sections, and every section is open from the start (it does not wait for the Talmud path). Same characters (Eitan, R' Yisrael, Chana), same rules: real quotations only,
reviewed before publishing, words chosen by frequency and coverage measured on text not used for choosing.

## Sources (Sefaria export archive, github.com/Sefaria/Sefaria-Export-Archive)
| Course | Text | Licence | Hebrew translation used |
|--------|------|---------|-------------------------|
| `onkelos` | Onkelos, Torat Emet | Public domain | the Hebrew verse ("Tanach with Nikkud", public domain) |
| `mikra` | Daniel 2:4–7:28, Ezra 4:8–6:18, 7:12–26 ("Tanach with Nikkud") | Public domain | Rabbi Dan Be'eri, Biblical Aramaic into Hebrew (CC BY-SA) |
| `yerushalmi` | Jerusalem Talmud, ed. H. W. Guggenheimer | CC BY | our own |
| `zohar` | Zohar, Sulam edition 1945 (text only) | not stated; the Zohar itself is public domain | our own |

## Status
- **Onkelos** (2026-11-08): 11 units, about 140 words. Story: "שניים מקרא ואחד תרגום" every Friday with R' Yisrael.
  Coverage on Deuteronomy (not used for choosing): 64.9% counting whole words; about 80% counting Aramaic endings
  (־א, ־יא, ־והי, ־הון…) on stems the learner knows from Hebrew. Onkelos is read next to the Hebrew verse, so this is enough
  to follow; the gap is mostly rare Temple and sacrifice words.
- **Biblical Aramaic** (`arc-mikra`, 2026-11-08): 6 units (Daniel 2, 3, 6, 7; Ezra 5), about 75 words. Story: Chana's article on the
  Babylonian exile; the grandfather wrote Daniel 6:11 on the hayloft wall. Coverage on Ezra (not used for choosing): 67.5% whole
  words, 85.5% counting endings on known stems.
- **Yerushalmi** (`arc-yerushalmi`, 2026-11-08): 4 units on what differs from the Bavli (תמן, אמרין, תנינן, קיימין, תיפתר,
  נישמעינה, עאל, חמית, דמך) and a story (Shimon ben Shetach and the pearl, BM 2:5). A Bavli learner already knows 88% of
  Yerushalmi Berakhot; with this course 89.7% (the rest is mostly halachic Hebrew nouns and rare forms).
- **Zohar** (`arc-zohar`, 2026-11-08): 5 units (formulas, above and below, light and soul, ״ווי לההוא בר נש״, בריך שמיה), each
  with a lesson of frequent forms. Story: Lag BaOmer in Meron. Coverage on the last 8 portions (not used for choosing): 79.3%
  (a Bavli learner starts at 71.1%). The Sulam text's licence is not stated on Sefaria; the Zohar itself is public domain.

## Next for the branches
More frequent forms where coverage is under 85% (Onkelos, Zohar); Targum Jonathan and midrashic Aramaic by demand.

## How a branch is built
1. Frequency of forms in the corpus that the learner does not know yet (Hebrew + the Bavli course); hold out part of the corpus.
2. Units of 2 lessons + a review with a real reading. Verse corpora use the shortest real verse containing the word as its example,
   with the Hebrew verse as the translation.
3. Measure coverage on the held-out part, then publish.
