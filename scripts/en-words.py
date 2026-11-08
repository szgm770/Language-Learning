#!/usr/bin/env python3
"""English vocabulary planning: coverage of the course and the next words to teach.

Usage:
  scripts/en-words.py coverage            # coverage of held-out text by the words the course teaches
  scripts/en-words.py next [--level A1] [--n 300] [--out words.tsv]

Needs: pip install wordfreq lemminflect
Held-out text: Universal Dependencies treebanks (already lemmatised, never used for choosing words):
  git clone --depth 1 https://github.com/UniversalDependencies/UD_English-EWT  (web text, CC BY-SA 4.0)
  git clone --depth 1 https://github.com/UniversalDependencies/UD_English-GUM  (15 genres, CC BY-NC-SA 4.0)
into $EN_CORPUS (default /home/claude/encorp). Words are chosen from wordfreq frequencies only.

"Known" = a lemma that appears in the text of some lexeme of the course, or a closed-class word (articles,
pronouns, prepositions, auxiliaries, conjunctions, numbers), which the course teaches through grammar and dialogues.
"""
import argparse
import glob
import json
import os
import re
from collections import Counter

from lemminflect import getAllLemmas
from wordfreq import top_n_list, word_frequency

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CORPUS = os.environ.get("EN_CORPUS", "/home/claude/encorp")
COURSE = "en-for-he"
CLOSED = {"DET", "PRON", "ADP", "CCONJ", "SCONJ", "AUX", "PART", "NUM", "SYM", "PUNCT", "X", "PROPN", "INTJ"}
SKIP = {"PUNCT", "NUM", "SYM", "PROPN", "X"}
# Levels by rank among content lemmas (cumulative): what a learner should know at the end of each level.
LEVELS = [("A1", 500), ("A2", 1150), ("B1", 2100), ("B2", 3150), ("C1", 4000)]


def lemmas(word: str) -> set[str]:
    w = word.lower()
    out = {w}
    for _pos, ls in getAllLemmas(w).items():
        out.update(x.lower() for x in ls)
    return out


def course_units():
    for f in sorted(glob.glob(f"{REPO}/apps/web/public/content/{COURSE}/units/*.json")):
        yield json.load(open(f))


def taught() -> dict[str, str]:
    """lemma -> level where the course first teaches it."""
    order = {"A0": 0, "A1": 1, "A2": 2, "B1": 3, "B2": 4, "C1": 5}
    out: dict[str, str] = {}
    for u in course_units():
        for v in u.get("vocabulary") or []:
            for t in re.findall(r"[a-zA-Z]+", v["text"]):
                for l in lemmas(t):
                    if l not in out or order[u["cefr"]] < order[out[l]]:
                        out[l] = u["cefr"]
    return out


def corpus_tokens():
    for f in glob.glob(f"{CORPUS}/UD_English-*/*.conllu"):
        for line in open(f, encoding="utf-8"):
            if not line or line[0] in "#\n":
                continue
            c = line.split("\t")
            if "-" in c[0] or "." in c[0]:
                continue
            yield c[1].lower(), c[2].lower(), c[3]


def closed_class() -> set[str]:
    cnt: Counter = Counter()
    tot: Counter = Counter()
    for _form, lemma, upos in corpus_tokens():
        tot[lemma] += 1
        if upos in CLOSED:
            cnt[lemma] += 1
    return {l for l in tot if cnt[l] / tot[l] > 0.5}


def coverage(known: set[str], closed: set[str]) -> float:
    n = k = 0
    for form, lemma, upos in corpus_tokens():
        if upos in SKIP or not re.fullmatch(r"[a-z]+(-[a-z]+)*", form):
            continue
        n += 1
        if lemma in closed or lemma in known or form in known:
            k += 1
    return 100 * k / n


def ranked_lemmas(closed: set[str]) -> list[tuple[str, float]]:
    freq: Counter = Counter()
    for w in top_n_list("en", 40000):
        if not re.fullmatch(r"[a-z]+", w) or len(w) < 2 and w not in ("a", "i"):
            continue
        ls = getAllLemmas(w)
        lemma = (ls.get("VERB") or ls.get("NOUN") or ls.get("ADJ") or ls.get("ADV") or (w,))[0].lower()
        if lemma in closed:
            continue
        freq[lemma] += word_frequency(w, "en")
    return freq.most_common()


def level_of(rank: int) -> str:
    for name, top in LEVELS:
        if rank < top:
            return name
    return "C2"


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("cmd", choices=["coverage", "next"])
    ap.add_argument("--level")
    ap.add_argument("--n", type=int, default=300)
    ap.add_argument("--out")
    a = ap.parse_args()
    t = taught()
    closed = closed_class()
    if a.cmd == "coverage":
        print(f"taught lemmas: {len(t)}")
        print(f"coverage of held-out text: {coverage(set(t), closed):.1f}% (closed-class words alone: {coverage(set(), closed):.1f}%)")
        return
    rows = []
    for rank, (lemma, f) in enumerate(ranked_lemmas(closed)):
        lv = level_of(rank)
        if lemma in t or (a.level and lv != a.level) or lv == "C2":
            continue
        rows.append((lemma, lv, rank + 1, f"{f * 1e6:.0f}"))
    rows = rows[: a.n]
    out = "\n".join("\t".join(map(str, r)) for r in rows)
    if a.out:
        open(a.out, "w").write("lemma\tlevel\trank\tper_million\n" + out + "\n")
        print(f"{len(rows)} words -> {a.out}")
    else:
        print(out)
    cov_after = coverage(set(t) | {r[0] for r in rows}, closed)
    print(f"# coverage now {coverage(set(t), closed):.1f}%, with these words {cov_after:.1f}%")


if __name__ == "__main__":
    main()
