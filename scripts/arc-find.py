#!/usr/bin/env python3
"""Find short real Bavli lines that use a word, to pick quotations for the Aramaic course.

Usage: scripts/arc-find.py WORD [--max-words 12] [--n 12] [--tractate "Bava Metzia"]
Prints: tractate, daf in Hebrew, the line (Wikisource text) and its vocalised form when found.
Data as in arc-quote.py ($ARC_DATA).
"""
import argparse
import glob
import json
import os
import re

DATA = os.environ.get("ARC_DATA", "/home/claude/sefaria/bavli")
POINTS = re.compile(r"[֑-ֽֿ-ׇ]")
TAG = re.compile(r"<[^>]+>|\([^)]*\)")
HEB = "אבגדהוזחטיכלמנסעפצקרשת"


def heb_num(n: int) -> str:
    out = ""
    for v, l in ((400, "ת"), (300, "ש"), (200, "ר"), (100, "ק")):
        while n >= v:
            out, n = out + l, n - v
    if n in (15, 16):
        return out + ("טו" if n == 15 else "טז")
    tens = "יכלמנסעפצ"
    if n >= 10:
        out, n = out + tens[n // 10 - 1], n % 10
    if n:
        out += "אבגדהוזחט"[n - 1]
    return out


def he_daf(i: int) -> str:
    """Sefaria index (0 = 1a) -> 'ב ע״א'."""
    return f"{heb_num(i // 2 + 1)} ע״{'א' if i % 2 == 0 else 'ב'}"


def bare(w: str) -> str:
    return re.sub(r"[^א-ת]", "", POINTS.sub("", w))


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("word")
    ap.add_argument("--max-words", type=int, default=12)
    ap.add_argument("--n", type=int, default=12)
    ap.add_argument("--tractate")
    a = ap.parse_args()
    target = bare(a.word)
    hits = []
    for f in sorted(glob.glob(f"{DATA}/ws/*.json")):
        name = os.path.basename(f)[:-5]
        if a.tractate and name != a.tractate:
            continue
        d = json.load(open(f))
        for i, daf in enumerate(d["text"]):
            for seg in daf if isinstance(daf, list) else []:
                ws = TAG.sub(" ", seg).replace("־", " ").split()
                if len(ws) <= a.max_words and target in [bare(w) for w in ws]:
                    hits.append((len(ws), name, d.get("heTitle", name), i, " ".join(ws)))
    hits.sort()
    for _, name, he, i, text in hits[: a.n]:
        print(f"{name} {i // 2 + 1}{'ab'[i % 2]} | {he} {he_daf(i)} | {text}")


if __name__ == "__main__":
    main()
