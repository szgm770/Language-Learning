"""Quote values inside one-line YAML flow mappings, so commas in Hebrew text stay inside the value.
Also quotes plain block-list items whose Hebrew text contains ": " (YAML would read them as a mapping)."""
import re, sys, json
KEYS = r"(speaker|text|translation|he|en|id|type|lexeme|name|color|look|pitch|pos|pronunciation)"
def fix_map(body):
    parts = re.split(r"(?:^|,\s*)" + KEYS + r":\s", body.strip())
    # parts: ['', key, value, key, value...]
    out = []
    for i in range(1, len(parts), 2):
        k, v = parts[i], parts[i + 1].strip()
        if not (v.startswith('"') or v.startswith("'") or re.fullmatch(r"-?[\d.]+", v)):
            v = json.dumps(v, ensure_ascii=False)
        out.append(f"{k}: {v}")
    return "{ " + ", ".join(out) + " }"
for path in sys.argv[1:]:
    lines = open(path).read().split("\n")
    block = None  # indentation of the key that opened a "|" or ">" block scalar
    for n, line in enumerate(lines):
        indent = len(line) - len(line.lstrip())
        if block is not None:
            if line.strip() == "" or indent > block:
                continue
            block = None
        if re.search(r":\s*[|>][-+]?\s*$", line):
            block = indent
        m = re.match(r"^(\s*(?:-\s+)?(?:[\w-]+:\s+)?)\{(.*)\}\s*$", line)
        if m and re.search(KEYS + r":", m.group(2)):
            lines[n] = m.group(1) + fix_map(m.group(2))
            continue
        b = re.match(r"""^(\s*-\s+)([^\s{\["'].*)$""", line)
        if b and ": " in b.group(2) and re.search("[\u0590-\u05ff]", b.group(2).split(": ")[0]):
            lines[n] = b.group(1) + json.dumps(b.group(2), ensure_ascii=False)
    open(path, "w").write("\n".join(lines))
