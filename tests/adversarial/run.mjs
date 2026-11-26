#!/usr/bin/env node
// Adversarial tests for scripts/check-dstack.mjs. Copies the repository to a temporary folder,
// plants one defect per case, and asserts that the checker reports exactly the expected rule.
// Usage: node tests/adversarial/run.mjs [--source DIR] [--keep] [--case ID]
// Exit codes: 0 every case behaved as expected, 1 at least one case did not, 2 setup error.
import { cpSync, existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync, appendFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const here = dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const flag = (name) => (argv.includes(name) ? argv[argv.indexOf(name) + 1] : undefined);
const SOURCE = flag("--source") ?? join(here, "..", "..");
const ONLY = flag("--case");
const KEEP = argv.includes("--keep");
const CHECKER = join(SOURCE, "scripts", "check-dstack.mjs");
const CONFIG = join(SOURCE, "scripts", "check-dstack.config.json");
if (!existsSync(CHECKER) || !existsSync(CONFIG)) {
  console.error("run.mjs: checker or config not found under " + SOURCE);
  process.exit(2);
}

const SKIP = new Set([".git", "node_modules", ".omc"]);
function freshCopy() {
  const dir = mkdtempSync(join(tmpdir(), "dstack-adv-"));
  cpSync(SOURCE, dir, { recursive: true, filter: (src) => !SKIP.has(src.split(/[\\/]/).pop()) });
  return dir;
}
function check(root, extra = []) {
  const r = spawnSync(process.execPath, [join(root, "scripts", "check-dstack.mjs"), "--root", root, "--json", ...extra], { encoding: "utf8", maxBuffer: 1 << 28 });
  let report;
  try { report = JSON.parse(r.stdout); } catch { report = undefined; }
  return { status: r.status, report, stderr: r.stderr };
}
const A = (root, path, text) => appendFileSync(join(root, path), text);
const W = (root, path, text) => { mkdirSync(dirname(join(root, path)), { recursive: true }); writeFileSync(join(root, path), text); };
const R = (root, path) => readFileSync(join(root, path), "utf8");
const firstSkill = (root) => readdirSync(join(root, "skills")).filter((n) => n.startsWith("principle-")).sort()[0];
const B = String.fromCharCode(96);
const FENCE = B + B + B;

// Each case: id, what it plants, and expect = [{ rule, path?, count? }]. count defaults to "at least 1".
// expectClean: the checker must report zero findings.
const cases = [
  { id: "T00-pristine", plant: () => {}, expectClean: true },
  { id: "T01-pr-upper-md", plant: (r) => A(r, "skills/how/SKILL.md", "\nOpen a PR for this change.\n"), expect: [{ rule: "PR", path: "skills/how/SKILL.md", count: 1 }] },
  { id: "T02-pr-lower-md", plant: (r) => A(r, "skills/how/SKILL.md", "\nthen open the pr.\n"), expect: [{ rule: "PR", path: "skills/how/SKILL.md", count: 1 }] },
  { id: "T03-gh-pr-in-ps1-fence", plant: (r) => A(r, "skills/how/SKILL.md", "\n" + FENCE + "powershell\ngh pr create --fill\n" + FENCE + "\n"), expect: [{ rule: "PR", path: "skills/how/SKILL.md" }] },
  { id: "T04-pull-request-in-code", plant: (r) => W(r, "skills/statechart/scripts/planted.ts", "// see the pull request for details\nexport const x = 1;\n"), expect: [{ rule: "PR", path: "skills/statechart/scripts/planted.ts", count: 1 }] },
  { id: "T05-editor-name-md", plant: (r) => A(r, "skills/why/SKILL.md", "\nThis works best in " + "Cur" + "sor.\n"), expect: [{ rule: "CURSOR", path: "skills/why/SKILL.md", count: 1 }] },
  { id: "T06-editor-rule-path", plant: (r) => A(r, "skills/why/SKILL.md", "\nWrite ~/." + "cur" + "sor/rules/x.mdc now.\n"), expect: [{ rule: "CURSOR", path: "skills/why/SKILL.md", count: 2 }] },
  { id: "T07-upstream-mode-name", plant: (r) => A(r, "skills/why/SKILL.md", "\nSee the " + "pot" + "eto-mode skill.\n"), expect: [{ rule: "IDENTITY", path: "skills/why/SKILL.md", count: 1 }] },
  { id: "T08-upstream-plugin-name-json", plant: (r) => W(r, "skills/statechart/scripts/planted.json", "{ \"name\": \"" + "ps" + "tack-tools\" }\n"), expect: [{ rule: "IDENTITY", path: "skills/statechart/scripts/planted.json", count: 1 }] },
  { id: "T09-macos-tool", plant: (r) => A(r, "skills/why/SKILL.md", "\nRun xc" + "run sim" + "ctl list.\n"), expect: [{ rule: "MACOS", path: "skills/why/SKILL.md", count: 2 }] },
  { id: "T10-bash-fence", plant: (r) => A(r, "skills/why/SKILL.md", "\n" + FENCE + "bash\nls\n" + FENCE + "\n"), expect: [{ rule: "SHELL", path: "skills/why/SKILL.md", count: 1 }] },
  { id: "T11-harness-term", plant: (r) => A(r, "skills/why/SKILL.md", "\nSpawn general" + "Purpose with claude-" + "opus-5-5-xhigh-fast.\n"), expect: [{ rule: "HARNESS", path: "skills/why/SKILL.md", count: 2 }] },
  { id: "T12-name-mismatch", plant: (r) => { const p = "skills/how/SKILL.md"; W(r, p, R(r, p).replace(/^name: how$/m, "name: howl")); }, expect: [{ rule: "NAME_MISMATCH", path: "skills/how/SKILL.md", count: 1 }] },
  { id: "T13-no-description", plant: (r) => { const p = "skills/how/SKILL.md"; W(r, p, R(r, p).replace(/^description:.*$/m, "description:")); }, expect: [{ rule: "NO_DESCRIPTION", path: "skills/how/SKILL.md", count: 1 }] },
  { id: "T14-skill-folder-without-skill-md", plant: (r) => W(r, "skills/empty-skill/notes.md", "nothing\n"), expect: [{ rule: "SKILL_MISSING", path: "skills/empty-skill/SKILL.md", count: 1 }] },
  { id: "T15-broken-link", plant: (r) => A(r, "skills/why/SKILL.md", "\nSee [the missing file](../no-such-skill/SKILL.md).\n"), expect: [{ rule: "LINK_BROKEN", path: "skills/why/SKILL.md", count: 1 }] },
  { id: "T16-route-to-deleted-playbook", plant: (r) => rmSync(join(r, "skills/d-mode/playbooks/autopilot.md")), expect: [{ rule: "ROUTE_TO_MISSING_PLAYBOOK", path: "skills/d-mode/SKILL.md" }, { rule: "COUNT_PLAYBOOKS", count: 1 }] },
  { id: "T17-unrouted-playbook", plant: (r) => W(r, "skills/d-mode/playbooks/extra-thing.md", "### Extra thing\n"), expect: [{ rule: "PLAYBOOK_NOT_ROUTED", path: "skills/d-mode/playbooks/extra-thing.md", count: 1 }, { rule: "COUNT_PLAYBOOKS", count: 1 }] },
  { id: "T18-reference-to-removed-playbook", plant: (r) => A(r, "skills/why/SKILL.md", "\nThen follow " + B + "playbooks/babysit.md" + B + ".\n"), expect: [{ rule: "ROUTE_TO_MISSING_PLAYBOOK", path: "skills/why/SKILL.md", count: 1 }] },
  { id: "T19-route-to-missing-skill", plant: (r) => A(r, "skills/why/SKILL.md", "\nRun the **nonexistent-thing** skill.\n"), expect: [{ rule: "ROUTE_TO_MISSING_SKILL", path: "skills/why/SKILL.md", count: 1 }] },
  { id: "T20-bait-lowercase-in-code", plant: (r) => W(r, "skills/statechart/scripts/bait.ts", "// move the text cursor, then read pr\nexport const pr = 1;\nexport let cursorColumn = pr + 1;\nexport const prs = [pr];\n"), expectClean: true },
  { id: "T21-bait-allowlisted-line", plant: (r) => {
      A(r, "skills/why/SKILL.md", "\nMove the text " + "cur" + "sor to the end.\nMove the text " + "cur" + "sor again.\n");
      const line = R(r, "skills/why/SKILL.md").split("\n").findIndex((l) => l.includes("to the end.")) + 1;
      const p = "scripts/check-dstack.config.json"; const c = JSON.parse(R(r, p));
      c.allowlist.push({ path: "skills/why/SKILL.md", rules: ["CURSOR"], line, reason: "adversarial test: one allowlisted line" });
      W(r, p, JSON.stringify(c, null, 2));
    }, expect: [{ rule: "CURSOR", path: "skills/why/SKILL.md", count: 1 }], total: 1 },
  { id: "T22-malformed-plugin-json", plant: (r) => W(r, ".claude-plugin/plugin.json", "{ \"name\": \"dstack\", "), expect: [{ rule: "MANIFEST_INVALID_JSON", path: ".claude-plugin/plugin.json", count: 1 }], validate: true, alsoWhenValidateRuns: "VALIDATE_FAILED" },
  { id: "T23-wrong-plugin-name", plant: (r) => { const p = ".claude-plugin/plugin.json"; const c = JSON.parse(R(r, p)); c.name = "other"; W(r, p, JSON.stringify(c)); }, expect: [{ rule: "PLUGIN_NAME", count: 1 }, { rule: "MARKETPLACE_ENTRY", count: 0 }] },
  { id: "T24-wrong-marketplace-source", plant: (r) => { const p = ".claude-plugin/marketplace.json"; const c = JSON.parse(R(r, p)); c.plugins[0].source = "./plugin"; W(r, p, JSON.stringify(c)); }, expect: [{ rule: "MARKETPLACE_SOURCE", count: 1 }] },
  { id: "T25-ps1-chain-operator", plant: (r) => A(r, "skills/show-me-your-work/scripts/log.ps1", "git fetch && git status\r\n"), expect: [{ rule: "PS1_DENYLIST", path: "skills/show-me-your-work/scripts/log.ps1", count: 1 }] },
  { id: "T26-ps1-non-ascii", plant: (r) => A(r, "skills/show-me-your-work/scripts/log.ps1", "# 한글 주석\r\n"), expect: [{ rule: "PS1_NON_ASCII", path: "skills/show-me-your-work/scripts/log.ps1", count: 1 }] },
  { id: "T27-ps1-lf-only", plant: (r) => A(r, "skills/show-me-your-work/scripts/log.ps1", "exit 0\n"), expect: [{ rule: "PS1_LF_ONLY", path: "skills/show-me-your-work/scripts/log.ps1", count: 1 }] },
  { id: "T28-ps1-out-file", plant: (r) => A(r, "skills/show-me-your-work/scripts/log.ps1", "$row | Out-File -FilePath $path -Append\r\n"), expect: [{ rule: "PS1_DENYLIST", path: "skills/show-me-your-work/scripts/log.ps1", count: 1 }] },
  { id: "T29-ps1-missing-strict-mode", plant: (r) => { const p = "skills/show-me-your-work/scripts/log.ps1"; W(r, p, R(r, p).replace("Set-StrictMode -Version Latest", "")); }, expect: [{ rule: "PS1_REQUIRED_LINE", path: "skills/show-me-your-work/scripts/log.ps1", count: 1 }] },
  { id: "T30-md-powershell-fence-chain", plant: (r) => A(r, "skills/why/SKILL.md", "\n" + FENCE + "powershell\ndotnet build && dotnet test\n" + FENCE + "\n"), expect: [{ rule: "PS1_FENCE_DENYLIST", path: "skills/why/SKILL.md", count: 1 }] },
  { id: "T31-bom", plant: (r) => { const p = "skills/why/SKILL.md"; writeFileSync(join(r, p), Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), readFileSync(join(r, p))])); }, expect: [{ rule: "BOM", path: "skills/why/SKILL.md", count: 1 }, { rule: "NO_FRONTMATTER", path: "skills/why/SKILL.md", count: 1 }] },
  { id: "T32-not-utf8", plant: (r) => writeFileSync(join(r, "skills/why/cp949.md"), Buffer.from([0x23, 0x20, 0xc7, 0xd1, 0xb1, 0xdb, 0x0a])), expect: [{ rule: "NOT_UTF8", path: "skills/why/cp949.md", count: 1 }] },
  { id: "T33-crlf-in-md", plant: (r) => A(r, "skills/why/SKILL.md", "\r\nline with carriage return\r\n"), expect: [{ rule: "CRLF", path: "skills/why/SKILL.md", count: 1 }] },
  { id: "T34-deleted-skill", plant: (r) => rmSync(join(r, "skills", firstSkill(r)), { recursive: true }), expect: [{ rule: "COUNT_SKILLS", count: 1 }, { rule: "COUNT_PRINCIPLESKILLS", count: 1 }] },
  { id: "T38-hangul-in-skill", plant: (r) => A(r, "skills/why/SKILL.md", "\n\uD55C\uAD6D\uC5B4 \uBB38\uC7A5\n"), expect: [{ rule: "HANGUL_IN_SKILL", path: "skills/why/SKILL.md", count: 1 }] },
  { id: "T39-guide-page-not-korean", plant: (r) => W(r, "docs/guide/03-understand.md", "# Understand the code\n\nEnglish only.\n"), expect: [{ rule: "KOREAN_MISSING", path: "docs/guide/03-understand.md", count: 1 }] },
  { id: "T40-guide-page-deleted", plant: (r) => rmSync(join(r, "docs/guide/08-principles.md")), expect: [{ rule: "COUNT_GUIDEPAGES", count: 1 }] },
  { id: "T41-language-skill-blocks-auto-load", plant: (r) => { const p = "skills/csharp-best-practices/SKILL.md"; W(r, p, R(r, p).replace(/^paths: (.*)$/m, "paths: $1\ndisable-model-invocation: true")); }, expect: [{ rule: "LANG_SKILL_FRONTMATTER", path: "skills/csharp-best-practices/SKILL.md", count: 1 }] },
  { id: "T42-language-skill-without-rules-section", plant: (r) => { const p = "skills/rust-best-practices/SKILL.md"; W(r, p, R(r, p).replace(/^## Rules$/m, "## Guidance")); }, expect: [{ rule: "LANG_SKILL_SECTION", path: "skills/rust-best-practices/SKILL.md", count: 1 }] },
  { id: "T43-language-skill-without-examples", plant: (r) => rmSync(join(r, "skills/python-best-practices/references/patterns.md")), expect: [{ rule: "LANG_SKILL_PATTERNS", count: 1 }] },
  { id: "T44-language-skill-not-routed", plant: (r) => { const p = "skills/d-mode/SKILL.md"; W(r, p, R(r, p).split("**pml-best-practices**").join("the PML rules")); }, expect: [{ rule: "LANG_SKILL_NOT_ROUTED", path: "skills/d-mode/SKILL.md", count: 1 }] },
  { id: "T45-plugin-version-pinned", plant: (r) => { const p = ".claude-plugin/plugin.json"; const c = JSON.parse(R(r, p)); c.version = "0.1.0"; W(r, p, JSON.stringify(c)); }, expect: [{ rule: "PLUGIN_VERSION_PINNED", path: ".claude-plugin/plugin.json", count: 1 }] },
  { id: "T46-korean-residue-in-guide", plant: (r) => A(r, "docs/guide/03-understand.md", "\n풀 리퀘스트를 연다. 커서에서 실행한다.\n"), expect: [{ rule: "PR", path: "docs/guide/03-understand.md", count: 1 }, { rule: "CURSOR", path: "docs/guide/03-understand.md", count: 1 }] },
  { id: "T47-unix-idioms", plant: (r) => A(r, "skills/why/SKILL.md", "\nRun " + B + "cat -n notes.txt > /dev" + "/null" + B + " and " + B + "export FOO=1" + B + ", then read " + B + "~" + "/notes" + B + ".\n"), expect: [{ rule: "SHELL", path: "skills/why/SKILL.md", count: 4 }] },
  { id: "T48-bait-legitimate-look-alikes", plant: (r) => A(r, "skills/why/SKILL.md", "\nRead " + B + "~/.claude/rules/x.md" + B + ". PowerShell prints " + B + "$($row.Name)" + B + ". It instruments the live process, then you grep the topic and open a file.\n"), expectClean: true },
  { id: "T49-ps1-unbalanced-brace", plant: (r) => A(r, "skills/show-me-your-work/scripts/log.ps1", "if ($true) {\r\n"), expect: [{ rule: "PS1_UNBALANCED", path: "skills/show-me-your-work/scripts/log.ps1", count: 1 }] },
  { id: "T50-failure-case-id-removed", plant: (r) => { const p = "skills/d-mode/playbooks/commit-and-push.md"; W(r, p, R(r, p).replace("| F05 |", "| FXX |")); }, expect: [{ rule: "REQUIRED_TEXT_MISSING", path: "skills/d-mode/playbooks/commit-and-push.md", count: 1 }] },
  { id: "T51-always-pause-rule-removed", plant: (r) => { const p = "skills/d-mode/SKILL.md"; W(r, p, R(r, p).replace("a push whose verification failed or never ran, ", "")); }, expect: [{ rule: "REQUIRED_TEXT_MISSING", path: "skills/d-mode/SKILL.md", count: 1 }] },
  { id: "T52-bootstrap-file-removed", plant: (r) => rmSync(join(r, "skills/d-mode/scripts/bootstrap.ts")), expect: [{ rule: "REQUIRED_FILE_MISSING", path: "skills/d-mode/scripts/bootstrap.ts", count: 1 }] },
  { id: "T53-deleted-tool-referenced-again", plant: (r) => { const p = "skills/d-mode/scripts/package.json"; const c = JSON.parse(R(r, p)); c.scripts = { test: "bun test watch-" + "pr" }; W(r, p, JSON.stringify(c, null, 2) + "\n"); }, expect: [{ rule: "FORBIDDEN_TEXT", path: "skills/d-mode/scripts/package.json", count: 1 }] },
  { id: "T54-setup-fallback-row-removed", plant: (r) => { const p = "skills/setup-dstack/SKILL.md"; W(r, p, R(r, p).replace("| Missing line |", "| Absent line |")); }, expect: [{ rule: "REQUIRED_TEXT_MISSING", path: "skills/setup-dstack/SKILL.md", count: 1 }] },
  { id: "T35-malformed-config", plant: (r) => W(r, "scripts/check-dstack.config.json", "{ not json"), expectExit: 2 },
  { id: "T36-allowlist-without-reason", plant: (r) => { const p = "scripts/check-dstack.config.json"; const c = JSON.parse(R(r, p)); c.allowlist.push({ path: "README.md", rules: ["*"] }); W(r, p, JSON.stringify(c)); }, expectExit: 2 },
  { id: "T37-unknown-argument", plant: () => {}, args: ["--bogus"], expectExit: 2 },
];

let failed = 0;
for (const c of cases) {
  if (ONLY && c.id !== ONLY) continue;
  const root = freshCopy();
  const problems = [];
  try {
    c.plant(root);
    const result = check(root, [...(c.validate ? [] : ["--no-validate"]), ...(c.args ?? [])]);
    if (c.expectExit !== undefined) {
      if (result.status !== c.expectExit) problems.push("exit " + result.status + ", expected " + c.expectExit);
    } else if (!result.report) {
      problems.push("checker printed no JSON report (exit " + result.status + "): " + result.stderr.slice(0, 200));
    } else if (c.expectClean) {
      if (result.status !== 0 || result.report.findings.length !== 0) problems.push("expected 0 findings, got " + result.report.findings.length + ": " + JSON.stringify(result.report.findings.slice(0, 3)));
    } else {
      if (result.status !== 1) problems.push("exit " + result.status + ", expected 1");
      for (const e of c.expect) {
        const hits = result.report.findings.filter((f) => f.rule === e.rule && (e.path === undefined || f.path === e.path));
        if (e.count === undefined ? hits.length === 0 : hits.length !== e.count) problems.push(e.rule + (e.path ? " at " + e.path : "") + ": " + hits.length + " findings, expected " + (e.count ?? "at least 1"));
      }
      if (c.total !== undefined && result.report.findings.length !== c.total) problems.push("total findings " + result.report.findings.length + ", expected " + c.total);
      const validateRan = result.report.notes.every((n) => !n.startsWith("SKIP"));
      if (c.alsoWhenValidateRuns && validateRan && !result.report.findings.some((f) => f.rule === c.alsoWhenValidateRuns)) problems.push("claude plugin validate ran but " + c.alsoWhenValidateRuns + " was not reported");
    }
  } catch (error) {
    problems.push("threw: " + error.message);
  } finally {
    if (!KEEP) rmSync(root, { recursive: true, force: true });
  }
  if (problems.length === 0) console.log("ok   " + c.id);
  else { failed++; console.log("FAIL " + c.id + (KEEP ? " (" + root + ")" : "") + "\n     " + problems.join("\n     ")); }
}
console.log(failed === 0 ? "PASS adversarial: every case behaved as expected" : "FAIL adversarial: " + failed + " case(s)");
process.exit(failed === 0 ? 0 : 1);
