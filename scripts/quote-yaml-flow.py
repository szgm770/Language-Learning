"""Quote values inside one-line YAML flow mappings, so commas in Hebrew text stay inside the value."""
import re, sys, json
KEYS = r"(speaker|text|translation|he|en|id|type|lexeme|name|color|look|pitch)"
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
    for n, line in enumerate(lines):
        m = re.match(r"^(\s*(?:-\s+)?(?:[\w-]+:\s+)?)\{(.*)\}\s*$", line)
        if m and re.search(KEYS + r":", m.group(2)):
            lines[n] = m.group(1) + fix_map(m.group(2))
    open(path, "w").write("\n".join(lines))
