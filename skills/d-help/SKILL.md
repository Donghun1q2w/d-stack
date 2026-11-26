---
name: d-help
description: Guides users through dstack setup, /dstack:d-mode, and picking the skill, playbook, or principle for a task. Type /dstack:d-help with a question.
disable-model-invocation: true
---

# D help

Answer the user's question about dstack, hand them a prompt they can send, and link the file the answer came from. For a help question, don't start the work. The user asked how, and a dstack run spends real tokens, so let them send the prompt.

A message that asks for work, such as "use dstack to fix this bug", is not a help question. Read [`d-mode`](../d-mode/SKILL.md), do the work under it, and mention once that typing `/dstack:d-mode` at the start of a task loads it.

This file maps questions to the skills and guide pages that hold the answers. Those files own the details. Read the file you route to before you quote it, and trust it when it disagrees with this map. The links here point into the installed plugin, which the user may not be able to open, so give the user the file's public copy: `https://github.com/Donghun1q2w/d-stack/blob/main/` followed by its path. The guide pages and the README are written in Korean. Answer in the user's language.

## Find out what they need

Infer the need from the message and the conversation. A named situation, such as "which skill reviews a branch?", goes straight to its section. If the need is still unclear, ask one multiple-choice question with `AskUserQuestion` and these options, then answer only the section they pick:

- Get set up
- Start a task with `/dstack:d-mode`
- Pick a skill for a situation
- Fix a run that went wrong
- Make dstack my own

Check the state that changes the answer, and mention it only when it does:

- No `~/.claude/rules/dstack-models.md` means `/dstack:setup-dstack` hasn't run for this user, so every role uses its default model.
- No `verify-*` skill or other app harness in the project means agents have no scripted way to drive the app. Mention `/dstack:create-verification-skill` when the question is about proving a change works.
- No formal verification skill in the project means no property is checked past what tests reach. Mention `/dstack:create-formal-verification-skill` when the question is about a race, an invariant, or another case tests rarely hit. When one exists and the code it covers changed after the commit it records as last in sync, mention `/dstack:maintain-formal-verification-skill` if the question touches that code.

When the model file is missing and it matters, ask whether the user wants to pick a model for each role and a reasoning budget now. It matters when the user is new, the question is about setup or cost, or the answer depends on which models run. Ask at most once per chat. If the need is also unclear, ask both questions together. Offer two choices:

- Now: give them `/dstack:setup-dstack` to type, and answer their question too.
- Later: answer their question, and add one line saying every role keeps its default model until they run `/dstack:setup-dstack`.

## Get set up

1. Install with `/plugin marketplace add Donghun1q2w/d-stack`, then `/plugin install dstack@d-stack`.
2. Run [`/dstack:setup-dstack`](../setup-dstack/SKILL.md). It asks for a reasoning budget, maps a model to each role, and writes `~/.claude/rules/dstack-models.md`. The file applies to new sessions. Then it offers once each to generate a verification skill and a formal verification skill for the project, unless the project already has one.
3. Start a real task with `/dstack:d-mode`, a goal, and a check that can pass or fail.

Installing changes little until the user invokes a skill. `/dstack:setup-dstack` loads from the user's words, and the four language skills load when a session opens a file their `paths` match. Every other skill waits for its slash command. The [README](../../README.md) and [guide page 1](../../docs/guide/01-setup.md) have the details. Offer to word their first prompt with them, per [`references/prompting.md`](references/prompting.md).

If cost is the worry, say where the tokens go and how to spend fewer. dstack spends extra tokens on subagents and review panels. Rerun `/dstack:setup-dstack` and pick a smaller budget or cheaper models. A role set to `inherit` runs on the session's model. A shorter panel list runs fewer subagents, one for each entry. Save `/dstack:d-mode` for work that needs rigor.

dstack is built for Claude Code on Windows. Its two helper scripts are Windows PowerShell 5.1, and its gates are plain command lists that run in Git Bash or PowerShell. The panel's third seat uses the codex plugin's `codex:codex-rescue` agent when it is installed and falls back to an Opus seat when it is not.

## Start a task with `/dstack:d-mode`

`/dstack:d-mode` matches the task to a playbook, copies the playbook's steps into the todo list, and runs the other skills as the steps need them. A good prompt states the goal and how to tell it's done. It doesn't list skills, because a hand-written sequence tends to drop or reorder steps the playbook would keep. Read [`references/prompting.md`](references/prompting.md) before you help word one. [Guide page 2](../../docs/guide/02-d-mode.md) has examples.

The skill stays in the conversation after the user types `/dstack:d-mode` once. After a `/clear`, a compaction that drops it, or in a new session, they type it again. Mid-chat, "new task" makes the mode match a fresh playbook. `/dstack:d-mode` already uses `dstack:d-agent` for the subagents its playbook steps spawn. To get the same style from a subagent of your own, spawn it with `subagent_type: "dstack:d-agent"`.

## Pick a skill

The default answer is `/dstack:d-mode`, which runs most of the others when its steps need them. Name a skill directly when the user wants more or less of something than the playbook gives. Read the skill before you recommend it, and give one example prompt. Every command below takes the `/dstack:` prefix, such as `/dstack:how`.

| The user wants to | Skill |
|---|---|
| Do any non-trivial task with rigor | [`d-mode`](../d-mode/SKILL.md) |
| Check that the agent understood their goal and the problem before it starts | [`in-your-own-words`](../in-your-own-words/SKILL.md) |
| Get a prompt rewritten deeper, not bigger, before sending it | [`sharpen`](../sharpen/SKILL.md) |
| Learn the expert words for what they're building and get their description rewritten with them | [`reframe`](../reframe/SKILL.md) |
| Know how code works now, or where new code should live | [`how`](../how/SKILL.md) |
| Know why code is shaped this way, or where a number came from | [`why`](../why/SKILL.md) |
| Understand a change or subsystem, explained plainly | [`teach`](../teach/SKILL.md) |
| Catch up on their own recent work on a topic | [`recall`](../recall/SKILL.md) |
| Catch up on what changed in this chat since their last message | [`ketchup`](../ketchup/SKILL.md) |
| Catch up like `ketchup`, in a short subtitled video of slides | [`ketchup-video`](../ketchup-video/SKILL.md) |
| Know what a small diff could break outside itself | [`blast-radius`](../blast-radius/SKILL.md) |
| Settle types and module shape before code that crosses a function boundary | [`architect`](../architect/SKILL.md) |
| Get several attempts at one brief, merged into the best one | [`arena`](../arena/SKILL.md) |
| Run parallel checks over slices, or race workers, each in its own worktree | [`swarm`](../swarm/SKILL.md) |
| Have different models review a diff and try to break it | [`interrogate`](../interrogate/SKILL.md) |
| Fix a bug test-first when a cheap local test exists | [`tdd`](../tdd/SKILL.md) |
| Apply TypeScript rules to `.ts` or `.tsx` work | [`typescript-best-practices`](../typescript-best-practices/SKILL.md) |
| Apply C# and .NET rules, with `dotnet build` and `dotnet test` | [`csharp-best-practices`](../csharp-best-practices/SKILL.md) |
| Apply Python rules, with `pytest` | [`python-best-practices`](../python-best-practices/SKILL.md) |
| Apply Rust rules, with `cargo test` and `cargo clippy` | [`rust-best-practices`](../rust-best-practices/SKILL.md) |
| Apply AVEVA PML rules for E3D macros, forms, and objects | [`pml-best-practices`](../pml-best-practices/SKILL.md) |
| Strip comments before review, using a reviewer that didn't write them | [`no-comments`](../no-comments/SKILL.md) |
| Clean AI tells out of prose | [`unslop`](../unslop/SKILL.md) |
| Write docs, an RFC, a README, or a commit message to a standard | [`technical-writing`](../technical-writing/SKILL.md) |
| Hear the last reply again in plain words | [`bro`](../bro/SKILL.md) |
| Give agents a scripted way to drive the app and prove behavior | [`create-verification-skill`](../create-verification-skill/SKILL.md) |
| Bring a verification skill and its feature map back in line with the app | [`maintain-verification-skill`](../maintain-verification-skill/SKILL.md) |
| Formally verify a race, invariant, or other property that tests rarely reach | [`create-formal-verification-skill`](../create-formal-verification-skill/SKILL.md) |
| Bring a formal verification back in line after the code it covers changed | [`maintain-formal-verification-skill`](../maintain-formal-verification-skill/SKILL.md) |
| Show a planner or designer what the user sees as a chart checked by a TLA+ model | [`statechart`](../statechart/SKILL.md) |
| Vet a performance number before reporting or acting on it | [`benchmark-checklist`](../benchmark-checklist/SKILL.md) |
| Run a large or cross-cutting change, or one to review after stepping away | [`figure-it-out`](../figure-it-out/SKILL.md) |
| Keep a decision log during a run, and review it afterward | [`show-me-your-work`](../show-me-your-work/SKILL.md) |
| Pick a model for each role and a reasoning budget | [`setup-dstack`](../setup-dstack/SKILL.md) |
| Turn their own working habits into a personal mode skill | [`automate-me`](../automate-me/SKILL.md) |
| Turn what a finished task taught into skill edits | [`reflect`](../reflect/SKILL.md) |
| Stop agents from repeating the same mistakes in this repo | [`correct`](../correct/SKILL.md) |
| Find their way around dstack | `d-help` |

If a skill directory next to this one is missing from the table, read its frontmatter and route by its description. The `principle-*` directories are covered under principles below.

Close calls:

- `how` explains what the code does. `why` explains the reasons. `teach` runs one or both and explains the result plainly.
- `arena` gives every worker the same brief and merges the best parts. `swarm` splits work into slices or a race and returns one report.
- `interrogate` reviews the diff. `blast-radius` looks for breakage outside the diff and proves the one fact that makes the change safe.
- `recall` rebuilds context across recent chats. `ketchup` covers only this chat since the user's last message. Resuming one specific chat or branch is the Session pickup playbook.
- `figure-it-out` designs one rigorous run. The Autonomous run playbook drives one task to a finish condition.

Not in dstack:

- `/loop` is a Claude Code built-in.
- The `codex:codex-rescue` agent ships in the codex plugin. dstack works without it.
- dstack has no planning skill. Claude Code's plan mode works alongside it.

## Playbooks and principles

Playbooks are step lists inside `/dstack:d-mode`, not skills, so they have no slash command. Inside `/dstack:d-mode`, describing the task picks one, and these phrases name one directly:

- "commit and push" or "land this" runs Commit and push. It runs the project's gate, then pushes to `main` only when it passes.
- "take over this branch" runs Session pickup.
- "pause safely" runs Pause safely.
- "full autopilot on this queue" runs Autopilot. "autopilot, don't push" stops each item at verified.
- "run the eval playbook" runs Eval.

The Playbooks section of [`d-mode`](../d-mode/SKILL.md) lists every playbook. [Guide page 6](../../docs/guide/06-verify-and-ship.md) covers verifying a change and pushing it.

For work that spans phases, asking `/dstack:d-mode` for a plan runs the [Multi-phase plan playbook](../d-mode/playbooks/multi-phase-plan.md), which writes the plan and doesn't implement it. For a design question, the Prototype playbook or `architect` settles it in code first.

Principles are one-rule skills that `/dstack:d-mode` reads and cites in its replies. The user rarely invokes one. They steer with the names instead, as in "apply prove it works. show me the real output." Typing `/dstack:principle-<name>` still loads one on demand. [Guide page 8](../../docs/guide/08-principles.md) lists them.

## Fix a run that went wrong

| Symptom | Fix |
|---|---|
| The mode stopped applying | The context was cleared or compacted. Type `/dstack:d-mode` again at the start of the task. |
| A question got treated as the next step of the last task | Say "new task", or say the turn doesn't need the mode. |
| A new model choice had no effect | The file from `/dstack:setup-dstack` applies to new sessions. Start one. |
| Runs cost more than expected | See the cost paragraph under Get set up. |
| A skill didn't load on its own | Only `/dstack:setup-dstack` and the four language skills load on their own. The others load when the user types them or when `/dstack:d-mode` reads them, and it doesn't read every skill. |
| Parallel agents overwrote each other | Give each agent its own worktree. `/dstack:d-mode` passes `isolation: "worktree"` when two agents could write the same checkout. |
| An overnight run moved but finished nothing | `/loop` needs a check that can pass or fail, not a duration. See [guide page 7](../../docs/guide/07-overnight.md). |
| The reply claims success from a green build | Ask for the real command, flow, stored value, or profile. That's the prove-it-works principle. |
| A push was rejected | Someone pushed first. The Commit and push playbook fetches, rebases, reruns the gate, and pushes again. It never force-pushes. |
| A PowerShell command failed on `&&` | Windows PowerShell 5.1 has no `&&`. Rerun `/dstack:setup-dstack` so the `shell:` line matches the session, and ask the agent to run the commands one at a time. |
| Every push stops to ask about verification | The project has no build or test command. Add `dstack-gate: manual` to its `CLAUDE.md` with what to run, and confirm the manual run when asked. |

For a run that drifts, [`references/prompting.md`](references/prompting.md) has one-line steers. [Guide page 10](../../docs/guide/10-recipes-and-pitfalls.md) has more pitfalls and the recipes worth copying.

## Make dstack my own

- [`automate-me`](../automate-me/SKILL.md) drafts a personal mode skill from the user's own history, to use alongside `/dstack:d-mode`.
- [`reflect`](../reflect/SKILL.md) after a session turns its lessons into skill edits the user approves.
- `/dstack:d-mode write a skill for <workflow>` runs the authoring playbook. The eval playbook tests a skill change blind.
- Fix a misbehaving skill in its own commit, not inside the feature work where it went wrong.
- [`docs/EXTENDING.md`](../../docs/EXTENDING.md) has the naming contract and the steps for adding a language skill or a playbook.

[Guide page 9](../../docs/guide/09-make-it-yours.md) covers each of these.

## Reply

Lead with the answer. Give at most one example prompt in a code block, adapted from [`references/recipes.md`](references/recipes.md) when one fits, then the link to that file. Keep it short unless the user asked for the whole map.
