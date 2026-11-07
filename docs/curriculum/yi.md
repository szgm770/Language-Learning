# Yiddish for Hebrew speakers – blueprint (draft)

Course id `yi-for-he`. Dialect: Litvish (Northeastern), taken as the base for Chabad Yiddish (owner's decision; not independently verified, see `yi-notes.md`). Torah-observant content, Chabad setting. Same content rules as the other courses (CLAUDE.md).

## What the existing code already gives us
- `yi` is a valid language code; the UI treats it as right-to-left.
- Answer checking strips niqqud, so a missing or extra pasekh/komets mark on an alef is forgiven.

## What has to be built before content
1. **Yiddish letter digraphs in `normalize`.** Hebrew keyboards type וו / וי / יי, while text may contain the single letters װ ױ ײ (U+05F0–05F2). Map them to the two-letter forms (and strip the marks on ײַ) so both spellings match. Add a test.
2. **No machine voice.** Browsers have no Yiddish voice; with `lang: yi` the code would fall back to some other voice and read Hebrew letters wrongly. Decide: hide all play/record buttons for this course until we have **recorded audio by a Chabad Yiddish speaker**, then add an `audio` path to the schema. Until then listening/speak tasks are not used.
3. Spelling rule for the course: YIVO-like, Hebrew-origin words as in Hebrew (see notes). One spelling in all files, enforced by a content test (list of forbidden variants).
4. Course `dialect` note shown to the learner (Litvish base).

## Method differences from Spanish and English
| Topic | Yiddish |
|-------|---------|
| Script | Hebrew letters: A0 is short. Teach pasekh vs komets alef, the digraphs, and that vowels are letters, not niqqud. |
| Source of words | Germanic core + Hebrew/Aramaic + Slavic. Hebrew-origin words are an easy bridge for Hebrew speakers: flag them. |
| Gender | three genders (der/di/dos): every noun taught with its article. |
| Cases | nominative / accusative / dative: starts at A2, light. |
| Verbs | verb second position, separable prefixes, *hobn/zayn* in the perfect. |
| Pronunciation | Litvish vowel set to be written down by the reviewer (not by us). |

## Story (proposal, to be confirmed)
Different from English and Spanish. A grandson from Kfar Chabad spends a year with his Yiddish-speaking grandparents; neighbours, a shopkeeper, a melamed, a Rebbetzin's class. Shabbat, farbrengen, Chassidic stories give natural scenes. Mixed outings are groups or family only.

## Levels
A0 (letters, sounds, cognates from Hebrew) → A1 → A2 → B1 → B2 first; C1 later. Chassidic vocabulary (Tanya, sichos) gets its own word packs, as in the other courses.

## Review
A Chabad Yiddish-speaking reviewer signs off every unit. The AI draft is not reviewed content.
