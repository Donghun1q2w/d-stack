---
name: setup-dstack
description: Configure which models dstack uses per role and at what reasoning budget. Detects your available models and writes a rule file that overrides the skill defaults. Use for /dstack:setup-dstack, /setup-dstack, "configure dstack models", "dstack budget", or changing dstack's model choices.
---

# Setup dstack

Write `~/.claude/rules/dstack-models.md` (`%USERPROFILE%\.claude\rules\dstack-models.md` on Windows), a rule file that Claude Code loads into every new session and that sets dstack's model per role.

## The file

| Property | Rule |
|---|---|
| Location | User scope: `~/.claude/rules/dstack-models.md`. Project scope, optional and written by hand: `.claude/rules/dstack-models.md`, which overrides the user file line by line. |
| Format | No frontmatter. `#` lines are comments. Every other line is `<role>: <value>`, or for a panel role `<role>: <value>, <value>, ...`, or the settings line `shell: <value>`. |
| `shell` | `bash` or `powershell`. The shell the session runs commands in. d-mode writes commands for it. Claude Code on Windows runs its Bash tool through Git Bash, so `bash` is the usual value there. |
| Missing `shell` line | The agent uses the shell tool the session offers and says which. |
| Malformed `shell` value | Treated as missing, and the skill that read it says so once. |
| Value | `<model> <effort>`, `inherit`, or `codex`. `<model>` is `opus`, `sonnet`, `haiku`, or `fable`. `<effort>` is `low`, `medium`, `high`, or `xhigh`. |
| `inherit` | The role runs on the session model. The caller omits `model` and `effort`. |
| `codex` | A seat on another vendor through `subagent_type: "codex:codex-rescue"`. Valid only in the three panel roles. It falls back to `opus high` when the codex plugin is not installed. |
| Missing file | Every role uses its default from step 6. |
| Missing line | That role uses its default. |
| Unknown role | Ignored. This skill drops it on the next run and tells the user. |
| Malformed value | The role uses its default, and the skill that read it says so once. |
| No `# defaults: 1` line | The file is honored as written, and d-mode tells the user once per session to rerun this skill. |

## Steps

### 1. Detect available models

The detected models are the `model` values that the `Agent` tool schema lists in this session, each with the `effort` values it lists. The `codex` seat is detected when the session's agent list has `codex:codex-rescue`. If you cannot detect any, ask the user which of `opus`, `sonnet`, `haiku`, and `fable` they can use. Never write a model you have not confirmed. `inherit` is always valid.

### 2. Detect the shell

The shell is `bash` when the session offers a `Bash` tool, which on Windows is Git Bash. It is `powershell` when the session offers only a PowerShell tool. Confirm it with one command: `echo $0` prints a path that ends in `bash` under Git Bash, and PowerShell prints an empty line. Record the result for step 6.

### 3. Load current state

The default role-to-model mapping is the shape shown in step 6. If the file already exists, read it and treat its `# budget` line and its role values as the current choices. Otherwise start from those defaults. Drop a line whose role is not in step 6, and drop a value that the File table calls malformed. Tell the user which lines you dropped.

### 4. Budget, map, and confirm

**(a) Ask for a budget.** Use `AskUserQuestion`. In `-p` mode it is absent, so ask in plain text. Offer these three options with these exact labels, and name the current budget when the file records one. With no file, say that `large` matches the skill defaults.

- `large — xhigh reasoning`
- `medium — high reasoning`
- `small — medium reasoning`

**(b) Apply it.** Build the working table from the defaults, and on a re-run keep any role the user changed by model, list, or alias (`inherit`, `codex`). Each role has a target effort, which is its default's effort moved by the budget. `large` keeps it, `medium` lowers it one step, and `small` lowers it two steps, on the ladder `xhigh` > `high` > `medium` > `low`. No role runs above `xhigh`, and a target at the bottom of the ladder stays there. Set the effort of every `<model> <effort>` value in the role, panel entries included, to the role's target. If the model does not list that effort, use its highest listed effort at or below the target, else mark the role as needing a choice. `inherit` and `codex` do not change. So `medium` turns `opus xhigh` into `opus high` and `opus high` into `opus medium`, and `small` turns them into `opus medium` and `opus low`.

**(c) Show the roles and confirm.** Show every role with its value, marking any model not in the detected set as needing a choice, and marking `codex` as "falls back to opus high" when the seat was not detected. Also list each line step 3 dropped. Ask whether to accept as-is or change specific roles, offering the detected models at `xhigh` or below plus `inherit`, and `codex` for panel roles. For panel roles (`arena runners`, `interrogate reviewers`) the value is a list, and one subagent runs per entry, so the list length sets the count. `arena cross-judge pool` is also a list, but Arena runs one judge. It takes the first entry from another vendor than the session model, so `codex` comes first when detected. `swarm workers` is the default model for every worker unless a race or comparison assigns another model per arm.

### 5. Validate

Every `<model> <effort>` written must be in the detected set and at `xhigh` or below. `inherit` always passes. `codex` passes only in a panel role. If a chosen value fails, stop and ask again. Write nothing until every role passes.

### 6. Write the file

Write the user-scope file with no frontmatter, the `# defaults: 1` line, a `# budget` line with the chosen label and the effort that label names, the `shell:` line from step 2, and one line per role, using the same labels d-mode uses. Create the `rules` folder when it is missing. Overwrite the whole file so re-runs stay idempotent. Never put the role lines in `CLAUDE.md` or `AGENTS.md`. Shape:

```
# dstack model configuration. One line per role. Delete a line to fall back to the skill default.
# Value: <model> <effort> | inherit | codex. model: opus, sonnet, haiku, fable. effort: low, medium, high, xhigh.
# inherit: the role runs on the session model. codex: a codex:codex-rescue seat, panel roles only.
# shell: bash | powershell. The shell this machine's sessions run commands in.
# defaults: 1
# budget: large (xhigh)
shell: bash
feature, refactoring: opus xhigh
bug-fix: opus xhigh
perf-issue: opus xhigh
hillclimb: opus xhigh
judgment and prose: opus xhigh
arena runners: fable high, opus high, codex
arena cross-judge pool: codex, opus high
swarm workers: opus high
interrogate reviewers: fable high, opus high, codex
```

### 7. Confirm

Read the file back and show it. Tell the user it applies to new sessions. Re-running this skill updates it.

### 8. Offer a verification skill (optional)

Check whether the project has a way to drive the real app for proof (a `verify-*` skill under `.claude/skills/`, or an existing harness). If not, offer once: "want a project-local verification skill, so agents can drive the app the way a user does and prove changes work? I can generate one with /dstack:create-verification-skill." On yes, `Read` `../create-verification-skill/SKILL.md` and follow it. On no, move on without pushing.

### 9. Offer a formal verification skill (optional)

Check whether the project already has a formal verification skill (a project skill that runs a model checker, a proof, or another verifier against the code). If not, offer once: "want a formal verification skill, so agents can prove a key property of your code holds in every case in scope, not only the cases tests reach? I can generate one with /dstack:create-formal-verification-skill." On yes, `Read` `../create-formal-verification-skill/SKILL.md` and follow it. On no, move on without pushing.
