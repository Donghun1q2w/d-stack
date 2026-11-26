### Commit and push

Invoked at the end of every other playbook that changes files.

**You own what reaches `main`. Small ordered commits, a gate that passed on the exact commit you push, then a fast-forward push. Nothing else reaches the remote.**

1. **Clean the diff.** Read `git diff` for the files you changed. Remove narrating comments, guards that no caller needs, dead compatibility paths, debug output, and edits unrelated to the goal. Apply the **unslop** skill to changed prose. Run the **no-comments** skill when the diff adds comments you did not review.
2. **Guard what you stage.** Read `git status --porcelain` before any `git add`. Stage by path (`git add <files>`, never `-A`), so a file you did not change stays out. Never stage a secret (`.env`, `*.pfx`, `*.key`, `*.pem`, `credentials*`, a config file that holds a password), a vendor binary the project does not already track, or build output (`bin/`, `obj/`, `.venv/`, `target/`, `dist/`, `node_modules/`). When such a path shows as untracked, propose a `.gitignore` line for it and leave it unstaged.
3. **Commit in small, ordered units.** Each commit builds on its own. Subject: `type(scope): subject`, naming a real symbol when one carries the change. Body: 20 lines at most, with `Why:`, `What changed:`, and `Verification:`, empty ones dropped, per the **technical-writing** skill. The `Verification:` line lists each gate command with its exit code, or `manual (<what was run>)`. Order the commits so the sequence proves itself (the **sequence-verifiable-units** principle skill).
4. **Find the gate.** Use the first source that names one: the project's `CLAUDE.md`, its `verify-<app>` skill, then the bundled language skill for the files you changed (**csharp-best-practices**, **python-best-practices**, **rust-best-practices**, **typescript-best-practices**, **pml-best-practices**). A project with no test command still has a gate: the build, plus the real artifact run once. A project whose proof cannot run from a shell (PML inside E3D, a C# tool that needs a vendor install) declares a manual gate with the line `dstack-gate: manual` in its `CLAUDE.md`, optionally followed by what to run. With no build, no test, and no declared manual gate, the gate is missing.
5. **Run the gate on the commit you will push.** Run its commands one at a time and stop at the first non-zero exit. Green means every command exited 0 at this `HEAD`. A manual gate is green only when the user confirmed in this session that the manual run passed on this change. Ask once, name what to run, and record `Verification: manual (<what was run>)`. An unattended run, or a worker that may not ask, treats an unconfirmed manual gate as red.
6. **Check the reach of the diff.** Run `git diff --stat origin/main..HEAD`. When it changes files outside the goal you restated at the start, show the stat and ask once before pushing.
7. **Sync with the remote.** Run `git fetch origin main`, then `git merge-base --is-ancestor origin/main HEAD`. Exit 0 means `main` has not moved: go to step 8. Exit 1 means it moved: run `git rebase origin/main`, then run step 5 again, because the base changed under the commits. Any other exit code is an error: stop and report it.
8. **Push.** Run `git push origin HEAD:main`. Then run `git fetch origin main` and confirm that `git rev-parse HEAD` equals `git rev-parse origin/main`.

The command list for steps 7 and 8. Run one line at a time in the session's shell and stop at the first non-zero exit, except where the note says an exit code is a branch:

```text
git fetch origin main
git merge-base --is-ancestor origin/main HEAD     (exit 0: skip the next line. exit 1: run it. other: stop)
git rebase origin/main                            (then run the gate again)
git push origin HEAD:main
git fetch origin main
git rev-parse HEAD
git rev-parse origin/main                         (must print the same SHA as the line above)
```

**When a step fails**

| ID | Case | What you see | What you do |
|---|---|---|---|
| F01 | The gate is red on your commits | A build or test command exits non-zero | Do not push. Fix forward in a new commit, or amend a commit that is not on `origin/main`. Run the whole gate again. |
| F02 | The gate is red on the base too | The same command fails on `origin/main` in a scratch worktree (`git worktree add --detach <dir> origin/main`) | Report the base failure in one line. Push only when your commits fail no command that the base passes. Remove the scratch worktree. |
| F03 | The gate is missing | No build, no test, and no `dstack-gate: manual` line | Stop with the commits local. Report `verification: none available` and ask before any push. |
| F04 | The manual gate is not confirmed | `dstack-gate: manual` is declared and the user has not confirmed a run on this change | Ask once, naming what to run. Unattended: stop with the commits local and report `verification: manual run pending`. |
| F05 | The push is rejected as non-fast-forward | `! [rejected]` with `fetch first` or `non-fast-forward` | Someone pushed first. Go back to step 7. After 3 rejected pushes in one run, stop and report. |
| F06 | The rebase stops on a conflict | `CONFLICT`, and `git status` shows a rebase in progress | Resolve it only when both sides are in files you changed and the right result is clear. Otherwise `git rebase --abort`, which restores your commits, and report the two commits that collide. |
| F07 | The tree is dirty with work that is not yours | `git status --porcelain` lists files you did not change | Leave them unstaged. A push needs no clean tree. If step 7 must rebase, use `git rebase --autostash origin/main`. If the stash does not reapply, stop. The work is safe in `git stash list`. Never drop it. |
| F08 | You are on a worktree branch, not `main` | `git branch --show-current` prints another name | In the worktree, `git rebase main`. In the main checkout, `git merge --ff-only <branch>`. Then run steps 5 to 8 there. |
| F09 | `HEAD` is detached | `git branch --show-current` prints nothing | `git switch -c d/<slug>` to keep the commits on a branch, then handle it as F08. |
| F10 | A commit hook rejects the commit | `git commit` exits non-zero and prints the hook's output | Fix what the hook reports, stage the fix by path, and commit again. Never pass `--no-verify`. |
| F11 | A push hook or the server refuses the push | `pre-push hook` output or `protected branch` | Report the exact message. Never pass `--no-verify`. Never change the remote's settings. |
| F12 | Authentication fails | `Authentication failed`, `Permission denied`, or a credential prompt that cannot be answered | Report it. The commits stay local. Never change the credential helper or the remote URL. |
| F13 | A file shows as fully changed with no real edit | `git diff --stat` lists every line, and `git diff -w --ignore-cr-at-eol` for that file is empty | Line endings flipped. Do not commit it. `git restore <file>` when you made no real edit to it. Report the file and the repository's `.gitattributes` or `core.autocrlf` setting. |
| F14 | A path is too long | `Filename too long` during a checkout, rebase, or worktree add on Windows | Report it and name the fix for the user to run: `git config --global core.longpaths true`. Do not change global git settings yourself. |
| F15 | There is no `origin` remote | `git remote` prints nothing | Commit only. Report that nothing was pushed. |
| F16 | A pushed commit turns out wrong | A check or a user finds the break after step 8 | `git revert <sha>`, run the gate, and push the revert. Never reset or rewrite `origin/main`. |

**Never**

- N1. `git push --force` or `--force-with-lease` to `main`.
- N2. A push with a red, missing, or unconfirmed gate, unless the user said so for this push in so many words.
- N3. `git add -A`, `git stash drop`, or `git reset --hard` on work you did not create.
- N4. `git commit --amend` or a rebase that rewrites a commit already on `origin/main`.
- N5. `--no-verify` on a commit or a push.

**Reply:** the commits pushed as `<old sha>..<new sha>`, each gate command with its exit code or the manual run the user confirmed, any failure case you hit by its ID and what you did, and anything left local.
