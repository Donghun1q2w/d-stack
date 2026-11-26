### Worktree cleanup

1. Snapshot and audit. Record free space with `Get-PSDrive -Name C` (use the drive that holds the repository), then run the audit (the **build-the-lever** principle skill):

   ```powershell
   powershell -NoProfile -ExecutionPolicy Bypass -File "<this skill's folder>\scripts\worktree-audit.ps1" [-Base origin/<branch>] [-RepoPath <repo>]
   ```

   The same line works from Git Bash and from PowerShell. Without `-Base` it checks `MERGED` against `origin/HEAD`, then `origin/main`, then `origin/master`. It reads paths from `git worktree list`, never hand-typed, since a hand-typed path misses a worktree that lives under `.claude\worktrees` (the **encode-lessons-in-structure** principle skill). It classifies each worktree by size, age, merge state, uncommitted work, push state, and the newest session transcript that names it, then suggests a bucket: `hold-wip`, `verify-recent-chat`, `safe`, or `review`. The transcript scan is slow, so run it in the background, or pass `-SkipTranscripts` for a first look.
2. The bucket is advice, not permission. The sessions still in use are the real artifact (the **prove-it-works** principle skill). Ask the user which sessions are still open and cross-check every candidate. The audit has marked `safe` a worktree whose session was still open, so the user's list wins.
3. Verify usage before deleting. For every `verify-recent-chat` row, or anything you doubt, fan subagents out to read the transcripts and report whether the session is ongoing and which worktrees it touches (the **guard-the-context-window** principle skill, transcripts are bulk). A running session spawns arena and repro trees into sibling worktrees through background subagents, and those are in use even when the user never saw their names. Pick each subagent's reasoning level for the job, per the Subagents section.
4. Pause on irreversible loss. `wip:N` is N tracked uncommitted edits. Show the diff and get a decision first, since removing a clean worktree is recoverable from its branch but uncommitted work is gone. `scratch:N` is untracked throwaway, safe to drop, but name the files. `REMOTE` of `no-remote` or `ahead<N>` with `MERGED` of `no` means commits that exist only on this machine. Removing the worktree keeps the branch, so keep the branch too unless the user says to delete it. Per Autonomy, clean and merged and not-in-use proceeds. `wip` and in-use pause.
5. Prune the confirmed set. Per path, `git worktree remove --force <path>`. If the folder survives on ignored build output, `Remove-Item -LiteralPath <path> -Recurse -Force`, then `git worktree prune`. Branch refs survive, so no commits are lost. Confirm with `Get-PSDrive` and `git worktree list`.
6. Other reclaimers, only when the user asks for more space. Build output (`bin`, `obj`, `target`, `dist`, `node_modules`) inside kept worktrees, `dotnet nuget locals all --clear`, `cargo cache` folders under `%USERPROFILE%\.cargo`, `pip cache purge`, and `%TEMP%`. Clear only caches the user has not said to keep.

A worktree deep under a long path can fail on Windows with `Filename too long`. Report it and name `git config --global core.longpaths true` for the user to run.

This is the one playbook that deletes user state with no code review to catch a slip, so the gates above are the review.

**Reply:** free space before and after with the amount reclaimed, the worktrees pruned, and a one-line reason for each held back (in use by which session, uncommitted work, or unpushed commits).
