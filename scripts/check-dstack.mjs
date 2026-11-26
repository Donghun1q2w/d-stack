#!/usr/bin/env node
// dstack repository check. Zero dependencies. Needs Node 22.18 or later, on Windows or macOS. Development tool: the plugin does not load it.
// Usage: node scripts/check-dstack.mjs [--root DIR] [--config FILE] [--only a,b] [--json] [--counts] [--no-validate] [--require-validate]
// Exit codes: 0 no findings, 1 findings, 2 usage or configuration error.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, extname, join, posix, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const CHECKS = ["residue", "frontmatter", "links", "routes", "manifest", "ps1", "counts", "encoding", "language", "languageSkills", "required"];
const [nodeMajor, nodeMinor] = process.versions.node.split(".").map(Number);
if (nodeMajor < 22 || (nodeMajor === 22 && nodeMinor < 18)) {
  console.error("check-dstack: Node 22.18 or later is required, found " + process.versions.node + ". Install the current LTS from nodejs.org, then run this again.");
  process.exit(2);
}
const SKILL_NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const LINK = /\]\(([^)\s]+)\)/g;

function fail(message) {
  console.error("check-dstack: " + message);
  process.exit(2);
}

function parseArgs(argv) {
  const args = { root: undefined, config: undefined, only: CHECKS, json: false, counts: false, validate: "auto" };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const value = () => (i + 1 < argv.length ? argv[++i] : fail(a + " needs a value"));
    if (a === "--root") args.root = value();
    else if (a === "--config") args.config = value();
    else if (a === "--only") args.only = value().split(",").map((s) => s.trim()).filter(Boolean);
    else if (a === "--json") args.json = true;
    else if (a === "--counts") args.counts = true;
    else if (a === "--no-validate") args.validate = "never";
    else if (a === "--require-validate") args.validate = "require";
    else fail("unknown argument: " + a);
  }
  for (const name of args.only) if (!CHECKS.includes(name)) fail("unknown check: " + name + " (known: " + CHECKS.join(", ") + ")");
  return args;
}

const here = dirname(fileURLToPath(import.meta.url));
const args = parseArgs(process.argv.slice(2));
const ROOT = resolve(args.root ?? join(here, ".."));
const CONFIG_PATH = resolve(args.config ?? process.env.DSTACK_CHECK_CONFIG ?? join(here, "check-dstack.config.json"));
if (!existsSync(ROOT) || !statSync(ROOT).isDirectory()) fail("root is not a directory: " + ROOT);
if (!existsSync(CONFIG_PATH)) fail("config not found: " + CONFIG_PATH);
let config;
try {
  config = JSON.parse(readFileSync(CONFIG_PATH, "utf8"));
} catch (error) {
  fail("config is not valid JSON: " + error.message);
}
for (const key of ["version", "expected", "scan", "allowlist", "residue", "routes", "ps1", "language", "languageSkills", "required"]) {
  if (!(key in config)) fail("config is missing key: " + key);
}
if (config.version !== 1) fail("unsupported config version: " + config.version);

const findings = [];
const notes = [];
const add = (check, rule, path, line, message) => findings.push({ check, rule, path, line, message });

function globToRegExp(glob) {
  const escaped = glob.replace(/[.+^$()|[\]{}\\]/g, "\\$&").replace(/\*\*/g, "\u0000").replace(/\*/g, "[^/]*").replace(/\u0000/g, ".*");
  return new RegExp("^" + escaped + "$");
}
const allow = config.allowlist.map((entry) => {
  if (!entry.path || !Array.isArray(entry.rules) || !entry.reason) fail("allowlist entry needs path, rules, reason: " + JSON.stringify(entry));
  return { ...entry, re: globToRegExp(entry.path) };
});
function allowed(path, rule, line) {
  return allow.some((e) => e.re.test(path) && (e.rules.includes("*") || e.rules.includes(rule)) && (e.line === undefined || e.line === line));
}

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    if (config.scan.excludeDirs.includes(name) || name === ".DS_Store") return [];
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}
const rel = (path) => relative(ROOT, path).split(sep).join("/");
const all = walk(ROOT).map((abs) => ({ abs, path: rel(abs), ext: extname(abs).toLowerCase() }));
const isBinary = (f) => config.scan.binaryExtensions.includes(f.ext) || readFileSync(f.abs).subarray(0, 8000).includes(0);
const textFiles = all.filter((f) => !isBinary(f));
const read = (f) => readFileSync(f.abs, "utf8");
const exists = (path) => existsSync(join(ROOT, path));
const run = (name) => args.only.includes(name);

if (run("residue")) {
  const rules = config.residue.map((rule) => {
    try {
      return { ...rule, res: rule.patterns.map((p) => new RegExp(p, "g" + rule.flags)) };
    } catch (error) {
      fail("bad residue pattern in rule " + rule.id + ": " + error.message);
    }
  });
  for (const f of textFiles) {
    const prose = config.scan.proseExtensions.includes(f.ext);
    const lines = read(f).split(/\r?\n/);
    lines.forEach((text, index) => {
      const seen = new Set();
      for (const rule of rules) {
        if (rule.scope === "prose" && !prose) continue;
        if (rule.scope === "code" && prose) continue;
        if (allowed(f.path, rule.id, index + 1)) continue;
        for (const re of rule.res) {
          re.lastIndex = 0;
          for (const m of text.matchAll(re)) {
            const key = rule.id + ":" + m.index;
            if (seen.has(key)) continue;
            seen.add(key);
            add("residue", rule.id, f.path, index + 1, JSON.stringify(m[0]) + " in: " + text.trim().slice(0, 120));
          }
        }
      }
    });
  }
}

function frontmatter(text) {
  const block = text.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1];
  if (block === undefined) return undefined;
  const field = (key) => block.match(new RegExp("^" + key + ":(.*)$", "m"))?.[1].trim().replace(/^(["'])([\s\S]*)\1$/, "$2");
  return { name: field("name"), description: field("description"), block };
}
const skillsDir = join(ROOT, "skills");
const skillNames = existsSync(skillsDir) ? readdirSync(skillsDir).filter((n) => statSync(join(skillsDir, n)).isDirectory()) : [];
const agentsDir = join(ROOT, "agents");
const agentFiles = existsSync(agentsDir) ? readdirSync(agentsDir).filter((n) => n.endsWith(".md")) : [];

if (run("frontmatter")) {
  for (const skill of skillNames) {
    const path = "skills/" + skill + "/SKILL.md";
    if (!exists(path)) { add("frontmatter", "SKILL_MISSING", path, 0, "skill folder has no SKILL.md"); continue; }
    const fm = frontmatter(readFileSync(join(ROOT, path), "utf8"));
    if (!fm) { add("frontmatter", "NO_FRONTMATTER", path, 1, "no YAML frontmatter block"); continue; }
    if (fm.name !== skill) add("frontmatter", "NAME_MISMATCH", path, 1, "name " + JSON.stringify(fm.name ?? "") + " is not the folder name " + skill);
    if (!SKILL_NAME.test(skill) || skill.length > 64) add("frontmatter", "BAD_NAME", path, 1, "folder name must be lowercase words joined by hyphens, at most 64 characters");
    if (!fm.description) add("frontmatter", "NO_DESCRIPTION", path, 1, "description is missing or empty");
  }
  for (const file of agentFiles) {
    const path = "agents/" + file;
    const fm = frontmatter(readFileSync(join(ROOT, path), "utf8"));
    if (!fm) { add("frontmatter", "NO_FRONTMATTER", path, 1, "no YAML frontmatter block"); continue; }
    if (fm.name !== file.slice(0, -3)) add("frontmatter", "NAME_MISMATCH", path, 1, "name " + JSON.stringify(fm.name ?? "") + " is not the file name " + file.slice(0, -3));
    if (!fm.description) add("frontmatter", "NO_DESCRIPTION", path, 1, "description is missing or empty");
  }
}

const mdFiles = textFiles.filter((f) => f.ext === ".md" && !allowed(f.path, "LINKS", 0));
if (run("links")) {
  for (const f of mdFiles) {
    read(f).split(/\r?\n/).forEach((text, index) => {
      for (const [, href] of text.matchAll(LINK)) {
        const target = href.replace(/[#?].*/, "");
        if (!target || /^[a-z][a-z0-9+.-]*:/i.test(target) || target.includes("<")) continue;
        const resolved = posix.normalize(posix.join(posix.dirname(f.path), target)).replace(/\/$/, "");
        if (resolved.startsWith("..")) add("links", "LINK_ESCAPES", f.path, index + 1, href + " leaves the repository");
        else if (!exists(resolved)) add("links", "LINK_BROKEN", f.path, index + 1, href + " does not exist (resolved to " + resolved + ")");
      }
    });
  }
}

const kebab = (title) => title.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
if (run("routes")) {
  const dMode = "skills/" + config.expected.dModeSkill;
  const playbookDir = join(ROOT, dMode, "playbooks");
  const onDisk = existsSync(playbookDir) ? readdirSync(playbookDir).filter((n) => n.endsWith(".md")).map((n) => n.slice(0, -3)) : [];
  if (!exists(dMode + "/SKILL.md")) add("routes", "ROUTER_MISSING", dMode + "/SKILL.md", 0, "router skill not found");
  else {
    const text = readFileSync(join(ROOT, dMode, "SKILL.md"), "utf8");
    const section = text.split(/^## Playbooks\s*$/m)[1]?.split(/^## /m)[0] ?? "";
    const listLine = section.split(/\r?\n/).filter((l) => l.trim()).pop() ?? "";
    const listed = listLine.replace(/\.\s*$/, "").split(",").map(kebab).filter(Boolean);
    for (const name of listed) if (!onDisk.includes(name)) add("routes", "ROUTE_TO_MISSING_PLAYBOOK", dMode + "/SKILL.md", 0, "Playbooks list names " + name + " but playbooks/" + name + ".md does not exist");
    for (const name of onDisk) if (!listed.includes(name)) add("routes", "PLAYBOOK_NOT_ROUTED", dMode + "/playbooks/" + name + ".md", 0, "playbook file is not in the Playbooks list");
  }
  const external = new Set(config.routes.externalCommands);
  const ignore = new RegExp(config.routes.ignoreCommandPattern);
  const known = new Set(skillNames);
  for (const f of mdFiles) {
    read(f).split(/\r?\n/).forEach((text, index) => {
      for (const m of text.matchAll(/playbooks\/([a-z0-9-]+)\.md/g)) {
        if (!onDisk.includes(m[1])) add("routes", "ROUTE_TO_MISSING_PLAYBOOK", f.path, index + 1, "references playbooks/" + m[1] + ".md, which does not exist");
      }
      for (const m of text.matchAll(/the \*\*([a-z0-9-]+)\*\* (principle )?skill/g)) {
        const name = m[2] && !m[1].startsWith("principle-") ? "principle-" + m[1] : m[1];
        if (!known.has(name)) add("routes", "ROUTE_TO_MISSING_SKILL", f.path, index + 1, "names the " + m[1] + " skill, but skills/" + name + " does not exist");
      }
      for (const m of text.matchAll(/\*\*(principle-[a-z0-9-]+)\*\*/g)) {
        if (!known.has(m[1])) add("routes", "ROUTE_TO_MISSING_SKILL", f.path, index + 1, "names " + m[1] + ", but skills/" + m[1] + " does not exist");
      }
      for (const m of text.matchAll(/(?<![\w/.~:-])\/(?:dstack:)?([a-z][a-z0-9-]*)(?![\w/.<-])/g)) {
        const name = m[1];
        if (known.has(name) || external.has(name) || ignore.test(name)) continue;
        const before = text.slice(0, m.index);
        const inCode = (before.match(/`/g) ?? []).length % 2 === 1;
        if (inCode && m[0].includes("dstack:")) add("routes", "ROUTE_TO_MISSING_SKILL", f.path, index + 1, "command " + m[0] + " names no skill in skills/");
      }
    });
  }
}

if (run("manifest")) {
  const readJson = (path) => {
    if (!exists(path)) { add("manifest", "MANIFEST_MISSING", path, 0, "file not found"); return undefined; }
    try { return JSON.parse(readFileSync(join(ROOT, path), "utf8")); }
    catch (error) { add("manifest", "MANIFEST_INVALID_JSON", path, 0, error.message); return undefined; }
  };
  const plugin = readJson(".claude-plugin/plugin.json");
  const market = readJson(".claude-plugin/marketplace.json");
  if (plugin) {
    if (plugin.name !== config.expected.pluginName) add("manifest", "PLUGIN_NAME", ".claude-plugin/plugin.json", 0, "name is " + JSON.stringify(plugin.name) + ", expected " + config.expected.pluginName);
    if ("version" in plugin) add("manifest", "PLUGIN_VERSION_PINNED", ".claude-plugin/plugin.json", 0, "remove version: the commit is the version, and a pinned version hides later commits from plugin updates");
    for (const key of ["description", "license"]) if (!plugin[key]) add("manifest", "PLUGIN_FIELD", ".claude-plugin/plugin.json", 0, "missing " + key);
  }
  if (market) {
    if (market.name !== config.expected.marketplaceName) add("manifest", "MARKETPLACE_NAME", ".claude-plugin/marketplace.json", 0, "name is " + JSON.stringify(market.name) + ", expected " + config.expected.marketplaceName);
    const entry = Array.isArray(market.plugins) ? market.plugins.find((p) => p.name === config.expected.pluginName) : undefined;
    if (!entry) add("manifest", "MARKETPLACE_ENTRY", ".claude-plugin/marketplace.json", 0, "no plugins[] entry named " + config.expected.pluginName);
    else if (entry.source !== "./") add("manifest", "MARKETPLACE_SOURCE", ".claude-plugin/marketplace.json", 0, "source must be \"./\"");
    if (entry && "version" in entry) add("manifest", "PLUGIN_VERSION_PINNED", ".claude-plugin/marketplace.json", 0, "remove version from the plugins[] entry");
    if (!market.description && !market.metadata?.description) add("manifest", "MARKETPLACE_DESCRIPTION", ".claude-plugin/marketplace.json", 0, "missing description");
  }
  if (args.validate !== "never") {
    const bin = process.env.DSTACK_CHECK_CLAUDE_BIN ?? "claude";
    const r = spawnSync(bin, ["plugin", "validate", ROOT], { encoding: "utf8", shell: process.platform === "win32" });
    if (r.error || r.status === null) {
      if (args.validate === "require") add("manifest", "VALIDATE_UNAVAILABLE", ".claude-plugin/plugin.json", 0, "could not run " + bin + " plugin validate");
      else notes.push("SKIP claude plugin validate: " + bin + " is not runnable here");
    } else if (r.status !== 0) {
      add("manifest", "VALIDATE_FAILED", ".claude-plugin/plugin.json", 0, "claude plugin validate exited " + r.status + ": " + (r.stdout + r.stderr).split(/\r?\n/).filter((l) => /✘|error/i.test(l)).slice(0, 5).join(" | "));
    } else notes.push("OK claude plugin validate exited 0");
  }
}

// Walks a PowerShell source once and reports the first unclosed string, comment, here-string, or bracket.
function ps1Balance(text) {
  const stack = [];
  const pairs = { ")": "(", "}": "{", "]": "[" };
  let line = 1;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];
    if (ch === "\n") { line++; continue; }
    if (ch === "<" && next === "#") {
      const end = text.indexOf("#>", i + 2);
      if (end === -1) return { line, message: "block comment is never closed" };
      line += text.slice(i, end).split("\n").length - 1;
      i = end + 1;
    } else if (ch === "#") {
      while (i + 1 < text.length && text[i + 1] !== "\n") i++;
    } else if (ch === "@" && (next === "'" || next === '"')) {
      const end = text.indexOf("\n" + next + "@", i + 2);
      if (end === -1) return { line, message: "here-string is never closed" };
      line += text.slice(i, end + 1).split("\n").length - 1;
      i = end + 2;
    } else if (ch === "'" || ch === '"') {
      const start = line;
      let j = i + 1;
      for (; j < text.length; j++) {
        if (text[j] === "\n") line++;
        if (ch === '"' && text[j] === String.fromCharCode(96)) { j++; continue; }
        if (text[j] === ch) { if (text[j + 1] === ch) { j++; continue; } break; }
      }
      if (j >= text.length) return { line: start, message: "string is never closed" };
      i = j;
    } else if (ch === "(" || ch === "{" || ch === "[") {
      stack.push({ ch, line });
    } else if (ch in pairs) {
      const open = stack.pop();
      if (!open || open.ch !== pairs[ch]) return { line, message: "unexpected " + ch };
    }
  }
  const open = stack.pop();
  return open ? { line: open.line, message: open.ch + " is never closed" } : undefined;
}

if (run("ps1")) {
  const compile = (list) => list.map((d) => ({ ...d, re: new RegExp(d.pattern) }));
  const deny = compile(config.ps1.denylist);
  const fenceDeny = compile(config.ps1.fenceDenylist);
  const stripped = (line) => line.replace(/'[^']*'/g, "''").replace(/"[^"]*"/g, '""').replace(/#.*$/, "");
  for (const f of all.filter((f) => f.ext === ".ps1")) {
    const bytes = readFileSync(f.abs);
    if (config.ps1.requireAscii) {
      const index = bytes.findIndex((b) => b > 0x7e || (b < 0x20 && b !== 0x0a && b !== 0x0d && b !== 0x09));
      if (index !== -1) add("ps1", "PS1_NON_ASCII", f.path, bytes.subarray(0, index).toString("latin1").split("\n").length, "byte 0x" + bytes[index].toString(16) + " is outside printable ASCII");
    }
    const text = bytes.toString("latin1");
    if (config.ps1.requireCrlf && /(^|[^\r])\n/.test(text)) add("ps1", "PS1_LF_ONLY", f.path, 0, "line endings must be CRLF");
    const unbalanced = ps1Balance(text);
    if (unbalanced) add("ps1", "PS1_UNBALANCED", f.path, unbalanced.line, unbalanced.message);
    const lines = text.split(/\r?\n/);
    for (const required of config.ps1.requiredLines) {
      if (!lines.some((l) => new RegExp(required).test(l))) add("ps1", "PS1_REQUIRED_LINE", f.path, 0, "missing line matching " + required);
    }
    lines.forEach((line, index) => {
      if (/^\s*#/.test(line)) return;
      const code = stripped(line);
      for (const d of deny) if (d.re.test(code)) add("ps1", "PS1_DENYLIST", f.path, index + 1, d.why + " in: " + line.trim().slice(0, 100));
    });
  }
  for (const f of mdFiles) {
    let inFence = false;
    read(f).split(/\r?\n/).forEach((line, index) => {
      if (/^\s*```/.test(line)) { inFence = !inFence && /^\s*```(powershell|ps1|pwsh)\b/i.test(line); return; }
      if (!inFence) return;
      for (const d of fenceDeny) if (d.re.test(line)) add("ps1", "PS1_FENCE_DENYLIST", f.path, index + 1, d.why + " in: " + line.trim().slice(0, 100));
    });
  }
}

const counts = {
  skills: skillNames.filter((n) => exists("skills/" + n + "/SKILL.md")).length,
  principleSkills: skillNames.filter((n) => n.startsWith("principle-")).length,
  agents: agentFiles.length,
  playbooks: existsSync(join(ROOT, "skills", config.expected.dModeSkill, "playbooks")) ? readdirSync(join(ROOT, "skills", config.expected.dModeSkill, "playbooks")).filter((n) => n.endsWith(".md")).length : 0,
  guidePages: all.filter((f) => /^docs\/guide\/[^/]+\.md$/.test(f.path)).length,
  files: all.length,
};
if (run("counts")) {
  for (const key of ["skills", "principleSkills", "agents", "playbooks", "guidePages"]) {
    if (counts[key] !== config.expected[key]) add("counts", "COUNT_" + key.toUpperCase(), ".", 0, key + " is " + counts[key] + ", expected " + config.expected[key]);
  }
}

if (run("encoding")) {
  const decoder = new TextDecoder("utf-8", { fatal: true });
  for (const f of textFiles) {
    const bytes = readFileSync(f.abs);
    if (bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) add("encoding", "BOM", f.path, 1, "file starts with a UTF-8 byte order mark");
    try { decoder.decode(bytes); } catch { add("encoding", "NOT_UTF8", f.path, 0, "file is not valid UTF-8"); }
    if (f.ext !== ".ps1" && f.ext !== ".bat" && f.ext !== ".cmd" && !allowed(f.path, "CRLF", 0) && bytes.includes(0x0d)) add("encoding", "CRLF", f.path, 0, "carriage return found; only .ps1 files use CRLF");
  }
}

if (run("language")) {
  const korean = config.language.koreanRequired.map(globToRegExp);
  const english = config.language.englishOnly.map(globToRegExp);
  const hangul = /[\uAC00-\uD7A3]/g;
  for (const f of textFiles) {
    const text = read(f);
    const count = (text.match(hangul) ?? []).length;
    if (korean.some((re) => re.test(f.path)) && count < config.language.minHangul) add("language", "KOREAN_MISSING", f.path, 0, "has " + count + " Hangul characters, needs at least " + config.language.minHangul);
    if (english.some((re) => re.test(f.path)) && count > 0 && !allowed(f.path, "HANGUL_IN_SKILL", 0)) add("language", "HANGUL_IN_SKILL", f.path, text.split(/\r?\n/).findIndex((l) => /[\uAC00-\uD7A3]/.test(l)) + 1, "skill and agent files are written in English");
  }
}

if (run("languageSkills")) {
  const spec = config.languageSkills;
  const router = exists("skills/" + config.expected.dModeSkill + "/SKILL.md") ? readFileSync(join(ROOT, "skills", config.expected.dModeSkill, "SKILL.md"), "utf8") : "";
  for (const name of spec.names) {
    const path = "skills/" + name + "/SKILL.md";
    if (!exists(path)) { add("languageSkills", "LANG_SKILL_MISSING", path, 0, "language skill not found"); continue; }
    const text = readFileSync(join(ROOT, path), "utf8");
    const fm = frontmatter(text)?.block ?? "";
    if (!/^paths: \[.+\]\s*$/m.test(fm)) add("languageSkills", "LANG_SKILL_FRONTMATTER", path, 1, "frontmatter needs a paths list so the skill loads when a matching file is opened");
    if (/^disable-model-invocation:\s*true\s*$/m.test(fm)) add("languageSkills", "LANG_SKILL_FRONTMATTER", path, 1, "disable-model-invocation: true would stop paths from loading the skill");
    const headings = text.split(/\r?\n/).filter((l) => l.startsWith("## "));
    if (!spec.gateHeadings.some((h) => headings.includes(h))) add("languageSkills", "LANG_SKILL_SECTION", path, 0, "needs one of: " + spec.gateHeadings.join(", "));
    for (const h of spec.requiredHeadings) if (!headings.includes(h)) add("languageSkills", "LANG_SKILL_SECTION", path, 0, "needs the heading " + h);
    if (!exists("skills/" + name + "/" + spec.patternsFile)) add("languageSkills", "LANG_SKILL_PATTERNS", "skills/" + name + "/" + spec.patternsFile, 0, "examples file not found");
    if (!router.includes("**" + name + "**")) add("languageSkills", "LANG_SKILL_NOT_ROUTED", "skills/" + config.expected.dModeSkill + "/SKILL.md", 0, "the router does not name **" + name + "**");
  }
}

if (run("required")) {
  for (const entry of config.required) {
    if (!entry.path || !Array.isArray(entry.contains) || !entry.reason) fail("required entry needs path, contains, reason: " + JSON.stringify(entry).slice(0, 120));
    if (!exists(entry.path)) { add("required", "REQUIRED_FILE_MISSING", entry.path, 0, entry.reason); continue; }
    const text = readFileSync(join(ROOT, entry.path), "utf8");
    for (const needle of entry.contains) if (!text.includes(needle)) add("required", "REQUIRED_TEXT_MISSING", entry.path, 0, JSON.stringify(needle) + " is missing (" + entry.reason + ")");
    for (const needle of entry.absent ?? []) if (text.includes(needle)) add("required", "FORBIDDEN_TEXT", entry.path, text.split(/\r?\n/).findIndex((l) => l.includes(needle)) + 1, JSON.stringify(needle) + " must not appear (" + entry.reason + ")");
  }
}

const byRule = {};
for (const f of findings) {
  byRule[f.rule] ??= { hits: 0, files: new Set() };
  byRule[f.rule].hits++;
  byRule[f.rule].files.add(f.path);
}
const summary = Object.fromEntries(Object.entries(byRule).map(([rule, v]) => [rule, { hits: v.hits, files: v.files.size }]));
if (args.json) {
  console.log(JSON.stringify({ root: ROOT, counts, summary, notes, findings }, null, 2));
} else {
  if (!args.counts) for (const f of findings) console.log("FAIL [" + f.check + "/" + f.rule + "] " + f.path + (f.line ? ":" + f.line : "") + " " + f.message);
  for (const note of notes) console.log(note);
  console.log("counts: " + JSON.stringify(counts));
  for (const [rule, v] of Object.entries(summary)) console.log("summary: " + rule + " " + v.hits + " hits in " + v.files + " files");
  console.log(findings.length === 0 ? "PASS check-dstack: 0 findings" : "FAIL check-dstack: " + findings.length + " findings");
}
process.exit(findings.length === 0 ? 0 : 1);
