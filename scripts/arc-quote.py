#!/usr/bin/env python3
"""Check an Aramaic quotation against the Bavli text and print its vocalised form.

Usage: scripts/arc-quote.py "Bava Metzia" 2b "התם ודאי איכא שבועת שוא"

Needs the Sefaria JSON files (not kept in the repo, they are large):
  $ARC_DATA/ws/<Tractate>.json   Wikisource Talmud Bavli (CC BY-SA) – the unvocalised text shown in lessons
  $ARC_DATA/voc/<Tractate>.json  William Davidson Edition, Vocalized Aramaic (CC BY-NC) – the "with niqqud" view
They come from the Sefaria-Export archive (github.com/Sefaria/Sefaria-Export-Archive, json/Talmud/Bavli/...).
Exit code 1 when the quotation is not found word for word, so no invented or misquoted text gets in.
"""
import json
import os
import re
import sys

DATA = os.environ.get("ARC_DATA", "/home/claude/sefaria/bavli")
POINTS = re.compile(r"[֑-ֽֿ-ׇ]")
TAG = re.compile(r"<[^>]+>|\([^)]*\)")


def daf_index(daf: str) -> int:
    """'2a' -> index 2 in Sefaria's list (index 0 is 1a, index 1 is 1b)."""
    m = re.fullmatch(r"(\d+)([ab])", daf)
    if not m:
        sys.exit(f"bad daf {daf!r}, use e.g. 2a")
    return (int(m.group(1)) - 1) * 2 + (m.group(2) == "b")


def bare(word: str) -> str:
    return re.sub(r"[^א-ת]", "", POINTS.sub("", word))


def words(text: str) -> list[str]:
    """Display words with tags and verse references removed."""
    return TAG.sub(" ", text).replace("־", " ").split()


# Abbreviations in the Vilna text that the vocalised edition writes out in full.
EXPAND = {"מתני'": "מתניתין", "אפי'": "אפילו", 'אע"ג': "אף על גב", 'כ"ש': "כל שכן", 'א"ר': "אמר רבי", "ר'": "רבי",
          'ת"ש': "תא שמע", 'א"ל': "אמר ליה", 'ש"מ': "שמע מינה", 'מ"ט': "מאי טעמא", 'ת"ר': "תנו רבנן", 'בע"כ': "בעל כורחיה"}


def expand(quote: list[str]) -> list[str]:
    return [x for w in quote for x in EXPAND.get(w, w).split()]


def find(segments: list[str], quote: list[str]) -> str | None:
    toks = [w for s in segments for w in words(s) if bare(w)]
    keys = [bare(w) for w in toks]
    q = [bare(w) for w in quote]
    for i in range(len(keys) - len(q) + 1):
        if keys[i : i + len(q)] == q:
            return " ".join(toks[i : i + len(q)])
    return None


def main() -> None:
    tractate, daf, quote = sys.argv[1], sys.argv[2], sys.argv[3]
    i = daf_index(daf)
    plain = json.load(open(f"{DATA}/ws/{tractate}.json"))["text"][i]
    found = find(plain, quote.split())
    if not found:
        print(f"NOT FOUND in {tractate} {daf}: {quote}")
        sys.exit(1)
    print("text:     ", found)
    voc = json.load(open(f"{DATA}/voc/{tractate}.json"))["text"][i]
    v = find(voc, quote.split()) or find(voc, expand(quote.split()))
    print("vocalized:", v if v else "(no word-for-word match in the vocalised edition; check by hand)")


if __name__ == "__main__":
    main()
