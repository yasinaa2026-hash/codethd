import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const pages = [
  "index.html",
  "studio.html",
  "languages.html",
  "language.html",
  "projects.html",
  "community.html",
  "auth.html"
];
const errors = [];
const requiredEditorIds = [
  "workspace", "preview-area", "html-editor", "css-editor", "js-editor",
  "runPreviewBtn", "saveProjectBtn", "layoutToggle", "importBtn", "exportBtn",
  "clearBtn", "themeToggle", "authUserBtn"
];

for (const page of pages) {
  if (!fs.existsSync(path.join(root, page))) {
    errors.push(page + ": page file is missing");
    continue;
  }
  const html = fs.readFileSync(path.join(root, page), "utf8");
  const ids = [...html.matchAll(/\bid\s*=\s*["']([^"']+)["']/gi)].map((m) => m[1]);
  const seen = new Set();
  for (const id of ids) {
    if (seen.has(id)) errors.push(page + ": duplicate id #" + id);
    seen.add(id);
  }
  if (page === "studio.html") {
    for (const id of requiredEditorIds) {
      if (!seen.has(id)) errors.push(page + ": required editor control #" + id + " is missing");
    }
  }

  for (const match of html.matchAll(/\b(?:href|src)\s*=\s*["']([^"']+)["']/gi)) {
    const raw = match[1].trim();
    if (!raw || raw.startsWith("#") || /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(raw)) continue;
    const pathname = decodeURIComponent(raw.split(/[?#]/, 1)[0]);
    if (!pathname || pathname.startsWith("/")) continue;
    const target = path.resolve(root, path.dirname(page), pathname);
    if (!target.startsWith(root + path.sep) && target !== root) {
      errors.push(page + ": unsafe relative link " + raw);
    } else if (!fs.existsSync(target)) {
      errors.push(page + ": missing local asset or page " + raw);
    }
  }

  for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)) {
    if (/\bsrc\s*=/.test(match[1])) continue;
    const code = match[2].trim();
    if (!code) continue;
    const temp = path.join(os.tmpdir(), "codethd-inline-" + process.pid + "-" + Math.random().toString(16).slice(2) + ".js");
    fs.writeFileSync(temp, code, "utf8");
    const checked = spawnSync(process.execPath, ["--check", temp], { encoding: "utf8" });
    fs.rmSync(temp, { force: true });
    if (checked.status !== 0) {
      errors.push(page + ": inline JavaScript syntax error\n" + (checked.stderr || checked.stdout));
    }
  }
}

if (errors.length) {
  console.error(errors.join("\n\n"));
  process.exit(1);
}
// Guard against the production signup failure caused by exporting an undefined error formatter.
const cloudAdapterPath = path.join(root, "codethd-supabase.js");
if (fs.existsSync(cloudAdapterPath)) {
  const cloudAdapter = fs.readFileSync(cloudAdapterPath, "utf8");
  if (!/const\\s+errText\\s*=/.test(cloudAdapter)) {
    errors.push("codethd-supabase.js: error formatter declaration is missing");
  }
  if (!/errorText\\s*:\\s*errText/.test(cloudAdapter)) {
    errors.push("codethd-supabase.js: CodeTHDCloud must export errorText from the declared errText function");
  }
}
if (errors.length) {
  console.error(errors.join("\\n\\n"));
  process.exit(1);
}
console.log("CodeTHD page integrity checks passed (" + pages.length + " pages).");
