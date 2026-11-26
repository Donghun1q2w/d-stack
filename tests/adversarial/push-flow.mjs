#!/usr/bin/env node
// Push-flow tests for skills/d-mode/playbooks/commit-and-push.md.
// What this proves: the git commands the playbook names behave as the playbook says, and a JavaScript model of
// steps 5 to 8 (land) reaches the documented outcome in each failure case. What it does not prove: that an agent
// follows the playbook. The playbook is prose, so the last case only checks that it still states every case ID
// and command the model encodes.
// Usage: node tests/adversarial/push-flow.mjs [--source DIR] [--keep]
// Exit codes: 0 all assertions held, 1 an assertion failed, 2 git is not runnable.
import { chmodSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const here = dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const SOURCE = argv.includes("--source") ? argv[argv.indexOf("--source") + 1] : join(here, "..", "..");
const KEEP = argv.includes("--keep");
const PLAYBOOK = join(SOURCE, "skills", "d-mode", "playbooks", "commit-and-push.md");
const MAX_REJECTED_PUSHES = 3;

function git(cwd, ...args) {
  const r = spawnSync("git", args, { cwd, encoding: "utf8", env: { ...process.env, GIT_TERMINAL_PROMPT: "0", GIT_EDITOR: "true", LC_ALL: "C" } });
  if (r.error) { console.error("push-flow: git is not runnable: " + r.error.message); process.exit(2); }
  return { code: r.status, out: (r.stdout ?? "").trim(), err: (r.stderr ?? "").trim() };
}
function must(cwd, ...args) {
  const r = git(cwd, ...args);
  if (r.code !== 0) throw new Error("git " + args.join(" ") + " failed: " + r.err);
  return r.out;
}
function world() {
  const root = mkdtempSync(join(tmpdir(), "dstack-push-"));
  const remote = join(root, "origin.git");
  must(root, "init", "--bare", "--initial-branch=main", remote);
  const clone = (name) => {
    const dir = join(root, name);
    must(root, "clone", remote, dir);
    must(dir, "config", "user.email", name + "@example.invalid");
    must(dir, "config", "user.name", name);
    must(dir, "config", "commit.gpgsign", "false");
    must(dir, "config", "core.autocrlf", "false");
    return dir;
  };
  const a = clone("a");
  must(a, "checkout", "-B", "main");
  commit(a, "base.txt", "base\n", "chore: base");
  commit(a, "foreign.txt", "original\n", "chore: foreign file");
  must(a, "push", "origin", "HEAD:main");
  const b = clone("b");
  must(b, "checkout", "-B", "main", "origin/main");
  return { root, remote, a, b };
}
function commit(dir, file, text, subject) {
  writeFileSync(join(dir, file), text);
  must(dir, "add", file);
  must(dir, "commit", "-m", subject);
  return must(dir, "rev-parse", "HEAD");
}
const remoteHead = (w) => must(w.remote, "rev-parse", "main");

// Model of commit-and-push.md steps 5 to 8. gate() returns true when the gate is green.
// beforePush() lets a test move the remote between the fetch and the push.
// options.goal: files the stated goal covers; a diff outside it returns "ask" unless options.confirmed.
// options.base: the ref step 7 compares against, "origin/main" unless a test breaks it on purpose.
function land(dir, gate, beforePush = () => {}, options = {}) {
  if (must(dir, "remote") === "") return "no-remote";
  const base = options.base ?? "origin/main";
  let rejected = 0;
  for (;;) {
    if (!gate()) return "gate-red";
    if (options.goal && !options.confirmed) {
      const touched = must(dir, "diff", "--name-only", "origin/main..HEAD").split("\n").filter(Boolean);
      if (touched.some((file) => !options.goal.includes(file))) return "ask";
    }
    must(dir, "fetch", "origin", "main");
    const ancestor = git(dir, "merge-base", "--is-ancestor", base, "HEAD").code;
    if (ancestor !== 0 && ancestor !== 1) return "error";
    if (ancestor === 1) {
      const dirty = must(dir, "status", "--porcelain", "--untracked-files=no") !== "";
      const rebase = git(dir, "rebase", ...(dirty ? ["--autostash"] : []), "origin/main");
      if (rebase.code !== 0) { git(dir, "rebase", "--abort"); return "conflict"; }
      if (!gate()) return "gate-red";
    }
    beforePush();
    if (git(dir, "push", "origin", "HEAD:main").code === 0) {
      must(dir, "fetch", "origin", "main");
      return must(dir, "rev-parse", "HEAD") === must(dir, "rev-parse", "origin/main") ? "pushed" : "mismatch";
    }
    rejected++;
    if (rejected >= MAX_REJECTED_PUSHES) return "gave-up";
  }
}

const results = [];
function test(id, body) {
  const w = world();
  try { body(w); results.push({ id, ok: true }); console.log("ok   " + id); }
  catch (error) { results.push({ id, ok: false }); console.log("FAIL " + id + (KEEP ? " (" + w.root + ")" : "") + "\n     " + error.message); }
  finally { if (!KEEP) rmSync(w.root, { recursive: true, force: true }); }
}
function assert(condition, message) { if (!condition) throw new Error(message); }

test("P01-non-fast-forward-is-rejected-then-rebase-lands-it", (w) => {
  const theirs = commit(w.b, "b.txt", "b\n", "feat: theirs");
  must(w.b, "push", "origin", "HEAD:main");
  commit(w.a, "a.txt", "a\n", "feat: ours");
  const push = git(w.a, "push", "origin", "HEAD:main");
  assert(push.code !== 0, "a plain push of a diverged branch must fail");
  assert(/rejected/.test(push.err) && /(fetch first|non-fast-forward)/.test(push.err), "rejection text changed: " + push.err);
  assert(remoteHead(w) === theirs, "a rejected push must leave the remote untouched");
  assert(land(w.a, () => true) === "pushed", "fetch, rebase, gate, push must land the work");
  assert(git(w.remote, "merge-base", "--is-ancestor", theirs, "main").code === 0, "their commit must still be in main: nothing was overwritten");
});

test("P02-dirty-tree-plain-rebase-refuses-autostash-preserves", (w) => {
  commit(w.b, "b.txt", "b\n", "feat: theirs");
  must(w.b, "push", "origin", "HEAD:main");
  commit(w.a, "a.txt", "a\n", "feat: ours");
  writeFileSync(join(w.a, "foreign.txt"), "someone else's unsaved work\n");
  must(w.a, "fetch", "origin", "main");
  const plain = git(w.a, "rebase", "origin/main");
  assert(plain.code !== 0 && /unstaged changes/.test(plain.err), "a plain rebase must refuse a dirty tree: " + plain.err);
  assert(land(w.a, () => true) === "pushed", "the autostash path must land the work");
  assert(readFileSync(join(w.a, "foreign.txt"), "utf8") === "someone else's unsaved work\n", "the foreign edit must survive byte for byte");
  assert(must(w.a, "diff", "--name-only") === "foreign.txt" && must(w.a, "diff", "--cached", "--name-only") === "", "the foreign edit must still be unstaged");
  assert(must(w.remote, "show", "main:foreign.txt") === "original", "the foreign edit must not reach the remote");
});

test("P03-dirty-tree-without-divergence-pushes-and-leaves-the-file", (w) => {
  commit(w.a, "a.txt", "a\n", "feat: ours");
  writeFileSync(join(w.a, "foreign.txt"), "left alone\n");
  assert(land(w.a, () => true) === "pushed", "a push needs no clean tree");
  assert(readFileSync(join(w.a, "foreign.txt"), "utf8") === "left alone\n", "the foreign edit must be untouched");
});

test("P04-red-gate-never-pushes", (w) => {
  const before = remoteHead(w);
  commit(w.a, "a.txt", "broken\n", "feat: breaks the build");
  const gate = () => spawnSync(process.execPath, ["-e", "process.exit(1)"]).status === 0;
  assert(land(w.a, gate) === "gate-red", "a failing gate must stop before the push");
  assert(remoteHead(w) === before, "the remote must not move when the gate is red");
});

test("P05-gate-reruns-after-rebase-and-blocks-when-the-new-base-breaks-it", (w) => {
  commit(w.b, "b.txt", "b\n", "feat: theirs");
  must(w.b, "push", "origin", "HEAD:main");
  const before = remoteHead(w);
  commit(w.a, "a.txt", "a\n", "feat: ours");
  let runs = 0;
  assert(land(w.a, () => ++runs === 1) === "gate-red", "the gate must run again after the rebase and block on red");
  assert(runs === 2, "the gate must run exactly twice, got " + runs);
  assert(remoteHead(w) === before, "the remote must not move");
});

test("P06-conflict-aborts-and-restores-the-commits", (w) => {
  commit(w.b, "base.txt", "theirs\n", "fix: theirs");
  must(w.b, "push", "origin", "HEAD:main");
  const before = remoteHead(w);
  const ours = commit(w.a, "base.txt", "ours\n", "fix: ours");
  assert(land(w.a, () => true) === "conflict", "a conflicting rebase must stop");
  assert(must(w.a, "rev-parse", "HEAD") === ours, "git rebase --abort must restore the local commit");
  assert(must(w.a, "status", "--porcelain") === "", "the tree must be clean after the abort");
  assert(remoteHead(w) === before, "the remote must not move");
});

test("P07-three-rejected-pushes-then-stop", (w) => {
  commit(w.a, "a.txt", "a\n", "feat: ours");
  let n = 0;
  const race = () => { n++; commit(w.b, "race" + n + ".txt", "x\n", "feat: race " + n); must(w.b, "push", "origin", "HEAD:main"); };
  assert(land(w.a, () => true, race) === "gave-up", "the flow must stop after " + MAX_REJECTED_PUSHES + " rejected pushes");
  assert(n === MAX_REJECTED_PUSHES, "expected " + MAX_REJECTED_PUSHES + " attempts, got " + n);
  assert(git(w.remote, "cat-file", "-e", "main:a.txt").code !== 0, "our commit must not be on the remote");
});

test("P08-no-remote-commits-only", (w) => {
  must(w.a, "remote", "remove", "origin");
  commit(w.a, "a.txt", "a\n", "feat: ours");
  assert(land(w.a, () => true) === "no-remote", "without origin the flow must not push");
});

test("P09-revert-undoes-a-bad-push-without-rewriting-history", (w) => {
  const bad = commit(w.a, "a.txt", "bad\n", "feat: bad");
  assert(land(w.a, () => true) === "pushed", "setup push failed");
  must(w.a, "revert", "--no-edit", bad);
  assert(land(w.a, () => true) === "pushed", "the revert must land through the same flow");
  assert(git(w.remote, "merge-base", "--is-ancestor", bad, "main").code === 0, "the bad commit must stay in history");
  assert(git(w.remote, "cat-file", "-e", "main:a.txt").code !== 0, "the reverted file must be gone at the tip");
});

test("P10-worktree-branch-lands-by-fast-forward", (w) => {
  const wt = join(w.root, "wt");
  must(w.a, "worktree", "add", "-b", "d/item", wt, "main");
  must(wt, "config", "user.email", "wt@example.invalid");
  commit(wt, "item.txt", "item\n", "feat: item");
  commit(w.a, "main-only.txt", "m\n", "chore: main moved");
  assert(git(w.a, "merge", "--ff-only", "d/item").code !== 0, "a diverged branch must not fast-forward");
  must(wt, "rebase", "main");
  must(w.a, "merge", "--ff-only", "d/item");
  assert(land(w.a, () => true) === "pushed", "the fast-forwarded main must push");
  assert(git(w.remote, "cat-file", "-e", "main:item.txt").code === 0, "the item must be on the remote");
});

test("P12-diff-outside-the-goal-asks-before-pushing", (w) => {
  const before = remoteHead(w);
  commit(w.a, "a.txt", "a\n", "feat: the goal");
  commit(w.a, "unrelated.txt", "u\n", "chore: something else");
  assert(land(w.a, () => true, () => {}, { goal: ["a.txt"] }) === "ask", "a diff past the goal must stop for one question");
  assert(remoteHead(w) === before, "the remote must not move before the answer");
  assert(land(w.a, () => true, () => {}, { goal: ["a.txt"], confirmed: true }) === "pushed", "after the user confirms, the push proceeds");
});

test("P13-merge-base-exit-codes-0-1-and-error", (w) => {
  commit(w.a, "a.txt", "a\n", "feat: ours");
  must(w.a, "fetch", "origin", "main");
  assert(git(w.a, "merge-base", "--is-ancestor", "origin/main", "HEAD").code === 0, "an ancestor must exit 0");
  commit(w.b, "b.txt", "b\n", "feat: theirs");
  must(w.b, "push", "origin", "HEAD:main");
  must(w.a, "fetch", "origin", "main");
  assert(git(w.a, "merge-base", "--is-ancestor", "origin/main", "HEAD").code === 1, "a moved base must exit 1");
  const broken = git(w.a, "merge-base", "--is-ancestor", "origin/no-such-branch", "HEAD").code;
  assert(broken !== 0 && broken !== 1, "a missing ref must exit with neither 0 nor 1, got " + broken);
  const before = remoteHead(w);
  assert(land(w.a, () => true, () => {}, { base: "origin/no-such-branch" }) === "error", "any other exit code must stop the flow");
  assert(remoteHead(w) === before, "the remote must not move on an error");
});

test("P14-detached-head-is-kept-on-a-branch-then-lands", (w) => {
  must(w.a, "checkout", "--detach");
  const sha = commit(w.a, "a.txt", "a\n", "feat: on a detached head");
  assert(must(w.a, "branch", "--show-current") === "", "a detached HEAD prints no branch name");
  must(w.a, "switch", "-c", "d/kept");
  must(w.a, "switch", "main");
  must(w.a, "merge", "--ff-only", "d/kept");
  assert(must(w.a, "rev-parse", "HEAD") === sha, "the commit must reach main by fast-forward");
  assert(land(w.a, () => true) === "pushed", "the fast-forwarded main must push");
});

test("P15-patch-id-survives-a-clean-rebase-and-changes-with-the-patch", (w) => {
  const patchId = (dir) => {
    const diff = spawnSync("git", ["show", "HEAD"], { cwd: dir, encoding: "utf8" }).stdout;
    return spawnSync("git", ["patch-id", "--stable"], { cwd: dir, input: diff, encoding: "utf8" }).stdout.split(" ")[0];
  };
  commit(w.a, "a.txt", "a\n", "feat: ours");
  const first = patchId(w.a);
  commit(w.b, "b.txt", "b\n", "feat: theirs");
  must(w.b, "push", "origin", "HEAD:main");
  must(w.a, "fetch", "origin", "main");
  must(w.a, "rebase", "origin/main");
  assert(patchId(w.a) === first, "a rebase that leaves the patch alone must keep its patch-id");
  writeFileSync(join(w.a, "a.txt"), "a changed\n");
  must(w.a, "commit", "-a", "--amend", "--no-edit");
  assert(patchId(w.a) !== first, "a changed patch must change the patch-id");
});

test("P16-line-ending-churn-is-visible-and-empty-under-the-whitespace-diff", (w) => {
  commit(w.a, "text.txt", "one\ntwo\n", "docs: text");
  writeFileSync(join(w.a, "text.txt"), "one\r\ntwo\r\n");
  assert(must(w.a, "diff", "--stat") !== "", "the flipped file must show in the plain diff");
  assert(must(w.a, "diff", "-w", "--ignore-cr-at-eol", "--", "text.txt") === "", "the whitespace-blind diff must be empty");
  must(w.a, "restore", "text.txt");
  assert(must(w.a, "status", "--porcelain") === "", "git restore must undo the churn");
});

test("P17-a-failing-commit-hook-blocks-the-commit", (w) => {
  const hook = join(w.a, ".git", "hooks", "pre-commit");
  writeFileSync(hook, "#!/bin/sh\necho hook says no\nexit 1\n");
  chmodSync(hook, 0o755);
  const before = must(w.a, "rev-parse", "HEAD");
  writeFileSync(join(w.a, "a.txt"), "a\n");
  must(w.a, "add", "a.txt");
  const result = git(w.a, "commit", "-m", "feat: blocked");
  assert(result.code !== 0 && /hook says no/.test(result.err + result.out), "the hook's failure must fail the commit and show its output");
  assert(must(w.a, "rev-parse", "HEAD") === before, "HEAD must not move");
});

const TICK = String.fromCharCode(96);
const REQUIRED = [
  ...Array.from({ length: 16 }, (_, i) => "| F" + String(i + 1).padStart(2, "0") + " |"),
  ...Array.from({ length: 5 }, (_, i) => "- N" + (i + 1) + "."),
  "git push origin HEAD:main", "git fetch origin main", "git rebase origin/main", "git merge-base --is-ancestor origin/main HEAD",
  "Exit 1 means it moved", "Any other exit code is an error", "After 3 rejected pushes", "git rebase --abort",
  "git rebase --autostash origin/main", "git stash list", "verification: none available", "dstack-gate: manual",
  "Verification: manual (", "git diff --stat origin/main..HEAD", "git revert <sha>", "git merge --ff-only <branch>",
  "git switch -c d/<slug>", "git diff -w --ignore-cr-at-eol", "core.longpaths", "--no-verify", "git push --force",
  "--force-with-lease", "git add -A", "never " + TICK + "-A" + TICK, "Never stage a secret",
];
(function docConformance() {
  const id = "P11-playbook-states-every-case-id-and-command-the-model-encodes";
  let text;
  try { text = readFileSync(PLAYBOOK, "utf8"); } catch (error) { results.push({ id, ok: false }); console.log("FAIL " + id + "\n     cannot read " + PLAYBOOK); return; }
  const missing = REQUIRED.filter((phrase) => !text.includes(phrase));
  results.push({ id, ok: missing.length === 0 });
  console.log(missing.length === 0 ? "ok   " + id : "FAIL " + id + "\n     missing: " + missing.join(" | "));
})();

const failed = results.filter((r) => !r.ok).length;
console.log("push-flow: these cases exercise git and a model of the procedure, not an agent following it");
console.log(failed === 0 ? "PASS push-flow: " + results.length + " cases" : "FAIL push-flow: " + failed + " of " + results.length + " cases");
process.exit(failed === 0 ? 0 : 1);
