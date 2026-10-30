# English A2–B2 for Hebrew speakers – curriculum blueprint

Continues `en-a1.md`: same principles, characters, quality checklist and YAML rules. Read that first.

## What changes from A1

- **Six lessons per unit:** new, new, grammar, listening, **reading**, review.
  The reading lesson opens with a `reading` step (an email, a notice, a blog post, an article;
  80–120 words at A2, 120–180 at B1, 180–250 at B2), then comprehension questions, then vocabulary in context.
- **Grammar notes grow** (100–180 words) and always contrast with Hebrew, e.g. Hebrew has one past tense,
  English has past simple, past continuous and present perfect.
- **Longer conversations** (6–10 lines) and more production: translate into English, dictation of full
  sentences, dialogue gaps with near-miss distractors (wrong tense, wrong preposition).
- **Lexeme ids** are unique across the whole course. Before writing a unit, list existing ids
  (`grep -h "{ id:" content/courses/en-for-he/units/*.yaml`) and reuse a taught word instead of redefining it.
- Each level ends with a **level test** (lesson kind `test`, id `a2-test`, `b1-test`, `b2-test`) in its last
  unit: 20 items spread over the level's units. It unlocks that level's certificate (70%).

## The story

Noa's company sends her to the London office for a year (A2). She rents a flat, makes friends, gets sick,
plans trips and is interviewed for a team-lead role. At B1 she leads a project between Tel Aviv and London:
meetings, opinions, complaints, news, the people around her. At B2 she negotiates, presents, debates
technology and the environment, and finally decides whether to stay in London.

## A2 – "A year in London"

| # | Id | Unit | Scene | Can-do | Grammar | Key vocabulary |
|---|----|------|-------|--------|---------|----------------|
| 11 | u11-home | A new flat | home | describe a flat, rent, talk about furniture | past simple regular (-ed); questions with did | flat, rent, bedroom, kitchen, bathroom, living room, sofa, bed, table, chair, window, floor, upstairs, downstairs, furniture, landlord, move, quiet, noisy, bright |
| 12 | u12-weekend | Last weekend | free-time | tell what I did last weekend | past simple irregular (went, had, saw, ate, met, bought, made, took) | went, had, saw, ate, met, bought, made, took, beach, market, concert, ago, then, after that, fun, boring |
| 13 | u13-food | Food and cooking | food | shop for food, follow a recipe, order at a restaurant | countable / uncountable; some / any; how much / how many | bread, milk, eggs, cheese, rice, vegetables, fruit, meat, fish, chicken, sugar, salt, recipe, a bit of, a lot of, menu, order, starter, main course, dessert |
| 14 | u14-health | At the doctor's | health | describe symptoms, understand advice | should / shouldn't; have got | headache, sore throat, cough, fever, cold, sick, tired, medicine, appointment, pharmacy, rest, hurt, back, stomach, head, better, worse, prescription |
| 15 | u15-plans | Plans and dreams | day | talk about plans and intentions | going to; future time expressions | next week, next month, tomorrow, soon, plan, holiday, visit, learn, start, finish, save money, dream, decide, hope |
| 16 | u16-weather | Weather and seasons | nature | talk about the weather, compare | comparatives (-er, more, than, as … as) | weather, sunny, rainy, cloudy, windy, cold, hot, warm, snow, rain, summer, winter, spring, autumn, temperature, umbrella, outside |
| 17 | u17-transport | Getting around | town | buy tickets, compare ways to travel | superlatives (the -est, the most); how long does it take | bus, train, underground, taxi, bike, stop, platform, return ticket, single ticket, change, miss, on time, delay, journey, fastest, cheapest |
| 18 | u18-phone | Right now | tech | talk on the phone, say what is happening now | present continuous vs present simple | call, text, message, battery, charger, laptop, password, app, online, download, right now, at the moment, wait, hang on |
| 19 | u19-party | Celebrations | party | invite, accept, offer help | will for offers and promises; would you like | birthday, party, invitation, present, invite, celebrate, cake, candles, guests, dance, wedding, congratulations, bring, promise |
| 20 | u20-interview | The interview | work | talk about experience and skills | present perfect (ever / never / already / yet) | interview, experience, skills, team, project, manager, salary, apply, ever, never, already, yet, been, done, worked, led, achieve |

## B1 – "Leading the project"

| # | Id | Unit | Scene | Grammar | Topic |
|---|----|------|-------|---------|-------|
| 21 | u21-team | The new team | work | present perfect with for / since; how long | introductions at work, roles, experience |
| 22 | u22-stories | What happened? | globe | past continuous vs past simple (when / while) | telling a story, an accident, a funny moment |
| 23 | u23-lifestyle | Healthy habits | health | used to; first conditional | habits, sleep, sport, stress |
| 24 | u24-complaints | It doesn't work | money | have to / must / don't have to; complaints | online orders, refunds, customer service |
| 25 | u25-trip | Planning a trip | travel | future forms: will, going to, present continuous | booking, itineraries, changes |
| 26 | u26-neighbours | Neighbours | home | polite requests: could you, would you mind; phrasal verbs | building rules, noise, favours |
| 27 | u27-news | In the news | news | passive voice (present and past) | headlines, events, technology news |
| 28 | u28-people | People in my life | family | relative clauses (who / which / that / where) | describing people, personality |
| 29 | u29-learning | Learning for life | study | second conditional | courses, skills, studying abroad |
| 30 | u30-problems | Problem solving | tech | reported speech (said / told / asked) | an IT crisis, giving instructions |

## B2 – "The big decision"

| # | Id | Unit | Scene | Grammar | Topic |
|---|----|------|-------|---------|-------|
| 31 | u31-career | Career moves | work | present perfect continuous | promotions, ambitions, feedback |
| 32 | u32-city | City or country? | nature | so / such; too / enough; contrast linkers | quality of life, housing |
| 33 | u33-tech | Tech and society | tech | causative (have / get something done); advanced passive | AI, privacy, social media |
| 34 | u34-negotiation | Negotiation | money | third conditional; diplomatic language | contracts, compromise |
| 35 | u35-planet | Our planet | nature | future continuous and future perfect | climate, recycling, energy |
| 36 | u36-culture | Culture and customs | party | modals of deduction (must / might / can't have) | traditions, misunderstandings |
| 37 | u37-science | Health and science | health | reporting verbs (suggest, advise, deny, admit) | research, medicine in the news |
| 38 | u38-presentation | The presentation | news | linking words; formal register | structuring a talk, Q&A |
| 39 | u39-regrets | Wishes and regrets | family | I wish / if only | choices, family, homesickness |
| 40 | u40-decision | The decision | travel | mixed review of narrative tenses | Noa decides; the story ends |
