#!/usr/bin/env node
// One-time migration tool. It ported the pinned upstream commit named in port-map.json into this tree: it copies
// files, applies the line edits and literal replacements in port-map.json, and skips deleted and hand-written paths.
// The edits are keyed to line numbers of that one commit, so this is a record of the port, not a resync path.
// docs/UPSTREAM.md describes how to review a newer upstream by hand.
// Usage: node scripts/migration/port-from-upstream.mjs --upstream DIR --out DIR [--map FILE] [--dry-run]
// Exit codes: 0 done, 1 an edit anchor no longer matches upstream (the upstream line changed), 2 usage error.
import { chmodSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const opt = (name) => (argv.includes(name) ? argv[argv.indexOf(name) + 1] : undefined);
const usage = (message) => { console.error("port-from-upstream: " + message); process.exit(2); };
const UP = opt("--upstream") ? resolve(opt("--upstream")) : usage("--upstream DIR is required");
const OUT = opt("--out") ? resolve(opt("--out")) : usage("--out DIR is required");
const MAP = resolve(opt("--map") ?? join(here, "port-map.json"));
const DRY = argv.includes("--dry-run");
if (!existsSync(UP) || !statSync(UP).isDirectory()) usage("upstream is not a directory: " + UP);
if (!existsSync(MAP)) usage("map not found: " + MAP);
let map;
try { map = JSON.parse(readFileSync(MAP, "utf8")); } catch (error) { usage("map is not valid JSON: " + error.message); }
for (const key of ["version", "delete", "handWritten", "verbatim", "rename", "edits", "replace", "binaryExtensions"]) if (!(key in map)) usage("map is missing key: " + key);
if (map.version !== 1) usage("unsupported map version: " + map.version);

const glob = (g) => new RegExp("^" + g.replace(/[.+^$()|[\]{}\\]/g, "\\$&").replace(/\*\*/g, "\u0000").replace(/\*/g, "[^/]*").replace(/\u0000/g, ".*") + "$");
const deleted = map.delete.map(glob);
const handWritten = map.handWritten.map(glob);
const verbatim = map.verbatim.map(glob);
function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    if (name === ".git" || name === "node_modules" || name === ".DS_Store") return [];
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}
function target(path) {
  for (const [from, to] of map.rename) if (path === from || path.startsWith(from)) return to + path.slice(from.length);
  return path;
}
const editsByPath = new Map();
for (const e of map.edits) editsByPath.set(e.path, [...(editsByPath.get(e.path) ?? []), e]);

const [nodeMajor, nodeMinor] = process.versions.node.split(".").map(Number);
if (nodeMajor < 22 || (nodeMajor === 22 && nodeMinor < 18)) usage("Node 22.18 or later is required, found " + process.versions.node);
const stats = { copied: 0, edited: 0, skippedDeleted: 0, skippedHandWritten: 0, replacements: 0 };
const problems = [];
const seenEditPaths = new Set();
for (const abs of walk(UP)) {
  const path = relative(UP, abs).split(sep).join("/");
  if (deleted.some((re) => re.test(path))) { stats.skippedDeleted++; continue; }
  if (handWritten.some((re) => re.test(path))) { stats.skippedHandWritten++; continue; }
  const out = join(OUT, target(path));
  const bytes = readFileSync(abs);
  const binary = map.binaryExtensions.some((ext) => path.toLowerCase().endsWith(ext)) || bytes.subarray(0, 8000).includes(0);
  let result = bytes;
  if (!binary && !verbatim.some((re) => re.test(path))) {
    const lines = bytes.toString("utf8").split("\n");
    const drop = new Set();
    for (const e of editsByPath.get(path) ?? []) {
      seenEditPaths.add(path);
      const index = e.line - 1;
      if (index >= lines.length) { problems.push(path + ":" + e.line + " is past the end of the file"); continue; }
      if (e.old === "*") { if (e.new === null) drop.add(index); else lines[index] = e.new; }
      else if (!lines[index].includes(e.old)) problems.push(path + ":" + e.line + " no longer contains " + JSON.stringify(e.old.slice(0, 60)));
      else lines[index] = lines[index].replace(e.old, () => e.new);
      stats.edited++;
    }
    let text = lines.filter((_, i) => !drop.has(i)).join("\n");
    for (const rule of map.replace) {
      if (rule.only && !glob(rule.only).test(path)) continue;
      const parts = text.split(rule.from);
      stats.replacements += parts.length - 1;
      text = parts.join(rule.to);
    }
    result = Buffer.from(text, "utf8");
  }
  if (!DRY) {
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, result);
    chmodSync(out, statSync(abs).mode & 0o777);
  }
  stats.copied++;
}
for (const path of editsByPath.keys()) if (!seenEditPaths.has(path)) problems.push(path + " has edits in the map but was not copied (missing upstream, deleted, or hand-written)");
for (const problem of problems) console.log("FAIL " + problem);
console.log("port-from-upstream: " + JSON.stringify(stats) + (DRY ? " (dry run)" : ""));
process.exit(problems.length === 0 ? 0 : 1);
