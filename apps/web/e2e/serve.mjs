// Serves the static export (out/) the way GitHub Pages does: under an optional base path,
// "dir/" → "dir/index.html", and 404.html for anything missing. Used by the end-to-end tests.
import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";

const root = new URL("../out/", import.meta.url).pathname;
const base = process.env.PAGES_BASE_PATH ?? "";
const port = Number(process.env.E2E_PORT ?? 3100);
const types = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".webmanifest": "application/manifest+json", ".txt": "text/plain" };

createServer((req, res) => {
  const url = new URL(req.url, "http://x");
  if (!url.pathname.startsWith(`${base}/`)) {
    res.writeHead(404).end();
    return;
  }
  let rel = normalize(decodeURIComponent(url.pathname.slice(base.length))).replace(/^(\.\.[/\\])+/, "");
  let file = join(root, rel);
  if (existsSync(file) && statSync(file).isDirectory()) {
    if (!url.pathname.endsWith("/")) {
      res.writeHead(301, { Location: `${url.pathname}/` }).end();
      return;
    }
    file = join(file, "index.html");
  }
  const found = existsSync(file);
  if (!found) file = join(root, "404.html");
  res.writeHead(found ? 200 : 404, { "Content-Type": types[extname(file)] ?? "application/octet-stream" });
  createReadStream(file).pipe(res);
}).listen(port, () => console.log(`serving ${root} at http://localhost:${port}${base}/`));
