# English A1 for Hebrew speakers – curriculum blueprint

The source of truth for writing `content/courses/en-for-he`. Every unit file must follow it.
Written for AI authors and human reviewers alike.

## Principles

- **Real situations, not word lists.** Every unit is a situation an Israeli adult meets abroad or at work.
  It opens with a short dialogue; every new word appears first inside that dialogue.
- **Explain in Hebrew, compare with Hebrew.** Grammar notes are short (60–120 words), concrete, and point
  out exactly where English differs from Hebrew (no present-tense "to be" in Hebrew, no a/an, word order of
  adjectives, 3rd-person -s, do-questions).
- **Recall before recognition, then production.** Within a lesson: meet the word (learn card) → recognise it
  (choices, matching, listening) → produce it (word bank, typing, dictation) → use it in a conversation
  (dialogue gap) → say it aloud.
- **6–9 new words per lesson, ~40 per unit, ~400 for the level.** Every new word is a lexeme in the unit file.
- **Recurring characters** make the course a story:
  - **Noa** (נועה) – Israeli, works in a Tel Aviv tech company, travels for work.
  - **Ben** – from London, Noa's new colleague in the company's UK office.
  - Side characters per scene: **Rachel** (Ben's sister), **Mr. Cohen** (hotel receptionist), **Eli** (barista), **Miriam** (Ben's friend from Madrid).
- **Spelling: American English** (color, center) with British variants accepted as answers where they differ.

## Lesson pattern (5 lessons per unit)

| # | Kind | What happens |
|---|------|--------------|
| 1 | `new` | Opening dialogue → learn cards for its words → recognition → first production |
| 2 | `new` | Second set of words around the same situation → practice → short dialogue gap |
| 3 | `grammar` | Grammar note (Hebrew) → controlled practice (fill blank, word bank) → free typing |
| 4 | `listening` | A longer dialogue → comprehension → complete-the-conversation → speak aloud |
| 5 | `review` | Unit checkpoint: mixed, no new words, at least one item per can-do |

A lesson has 10–14 steps. Ungraded steps (learn, dialogue, tip) do not count toward the score.

## Units

| # | Unit | Situation | Can-do (after the unit I can…) | Grammar | Key vocabulary |
|---|------|-----------|-------------------------------|---------|----------------|
| 1 | Hello! | Noa meets Ben on a video call on his first day | greet, introduce myself, ask a name, say goodbye | I am / you are; contractions | hello, hi, good morning/afternoon/evening, goodbye, bye, see you, I, you, my, your, name, nice to meet you, thank you, please, yes, no, sorry, fine, how are you |
| 2 | Where are you from? | Small talk at the start of a meeting | say where I'm from and what languages I speak; count 0–10 | he/she/it is; is-questions and short answers; not | Israel, England, the USA, Spain, France, Hebrew, English, Spanish, from, where, city, language, speak, numbers 0–10, phone number |
| 3 | Family and friends | Noa shows Ben photos | introduce family and friends, say ages; count to 100 | this is; his/her/our/their; possessive 's | mother, father, sister, brother, son, daughter, husband, wife, friend, children, parents, old, young, 11–100, how old |
| 4 | At the café | Noa and Ben order at Eli's café in London | order food and drinks, ask the price, pay | a/an; plurals; can I have…? | coffee, tea, water, juice, sandwich, cake, salad, cup, bottle, small, large, how much, pounds, check, card, cash |
| 5 | My day | Ben asks about Noa's routine | describe my daily routine, tell the time, days | present simple I/you/we/they; questions with do | get up, have breakfast, go to work, start, finish, go home, sleep, early, late, every day, o'clock, half past, days of the week |
| 6 | Work | Noa explains her job | say what I and others do, where we work | present simple he/she (-s); does-questions | job, work, office, company, teacher, doctor, engineer, student, nurse, manager, meeting, email, computer, busy |
| 7 | Around town | Noa looks for places in London | ask for and give simple directions, describe a place | there is / there are; prepositions of place | street, station, bank, pharmacy, supermarket, museum, hotel, left, right, straight on, next to, opposite, near, far |
| 8 | Shopping | Noa buys gifts with Rachel | buy clothes, talk about colors, sizes and prices | this/that/these/those; adjective before noun | shirt, dress, jeans, shoes, jacket, bag, red, blue, black, white, green, size, too big, too small, try on, cheap, expensive |
| 9 | Free time | Ben invites Noa for the weekend | talk about hobbies, abilities, invite and reply | can / can't; like + -ing; always/never | weekend, music, sport, football, swim, cook, read, travel, play, watch, movie, together, maybe, sure, sorry I can't |
| 10 | Travel | Noa checks in at Mr. Cohen's hotel and flies home | check in, ask for help, talk about yesterday's trip | was / were; I'd like | airport, flight, ticket, passport, gate, hotel, room, key, reservation, night, breakfast, help, problem, yesterday, last week |

After unit 10: **A1 level test** (lesson kind `test`) → certificate.

## Exercise mix per lesson (guideline)

- learn: one per new word (usually 4–8)
- dialogue: 1 in lessons 1 and 4
- multiple_choice / listening_choice / match_pairs: 3–4
- word_bank / fill_blank: 2–3
- translate (both directions) / dictation: 2
- dialogue_gap: 1–2
- speak_repeat: 1
- tip: optional, for culture ("In England people say 'Cheers' to mean thanks")

## Quality checklist for every unit

1. `pnpm content:build` passes and the content QA test accepts every listed answer.
2. Every new word appears in a learn card before any exercise asks for it.
3. All accepted answers are listed: contractions, "Hi/Hello", "thanks/thank you", male/female Hebrew forms.
4. Hebrew is natural spoken Hebrew, gender-inclusive where it matters ("אתם" in instructions).
5. No word is tested that was not taught in this or an earlier unit.
