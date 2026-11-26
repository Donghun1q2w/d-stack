# Prompts worth copying

Swap in the real paths, skills, and done checks. Informal wording works.

## Understand

- `/dstack:d-mode read <thread>. restate the underlying issue in your own words, in plain english.`
- `/in-your-own-words <long or messy ask>`
- `/sharpen <the prompt you're about to send>`
- `/dstack:d-mode investigate why <symptom>. give me what we know, what data you used, and your best hypotheses. don't change any code yet.`
- `use /how to understand <subsystem>. then use /why to find out why it broke recently.`
- `/recall my work on <topic> from last week, then read <issue>.`
- `/teach me why you implemented it this way and not <other way>. what did you trade off?`
- `/dstack:d-mode take over this branch. read the decision log, find what's done, and continue. don't redo finished work.`

## Build

- Bug: `/dstack:d-mode <symptom>. repro first, then fix and verify.`
- Bug in an app: `/dstack:d-mode repro this with /verify-<app>. if it repros on main, fix it and show me a video as proof.`
- Bug with a cheap test: `/dstack:d-mode repro <bug> first. if there's a cheap test path, /tdd it. then fix and rerun.`
- Feature: `/dstack:d-mode add <behavior>. <current output> stays byte-identical. verify both.`
- Refactor: `/dstack:d-mode move <code> into one module, zero behavior change. record the current output first and prove it's unchanged after.`
- Perf: `/dstack:d-mode <operation> takes <time> on <fixture>. trace it, fix the measured cause, show me before and after.`

## Design and plan

- `/dstack:d-mode prototype a few options for <feature>. take screenshots or videos for me to compare.`
- `/dstack:d-mode we need <feature>. /architect it first, and answer open questions with prototypes. let me review before proceeding.`
- `/dstack:d-mode write a tutorial for how i would use <new package> first. then /teach me why it beats the current one.`
- `ask /arena for a second opinion on this thread and our approach.`
- `/dstack:d-mode turn this design into a plan. small verifiable commits, each with its own verification steps.`
- `/dstack:d-mode plan the migration of <library> to <target>. small verifiable commits. the result must match the original exactly, bugs included.`

## Review and ship

- `/interrogate the whole branch, but skeptically. don't change anything yet. no nitpicks unless it's a real bug or regression.` Read the Dropped list too.
- `/create-formal-verification-skill prove <property> holds in <module>, even when <steps> interleave or retry.` After merges or refactors in that code: `/maintain-formal-verification-skill`.
- `/swarm check every package under <dir> against its check script. one worker per package. one report.`
- `/dstack:d-mode commit and push. small ordered commits, evidence in the commit body.`
- `/dstack:d-mode land this once the build and tests pass.` For status only: `/dstack:ketchup`.

## Away and back

- `/dstack:d-mode im going to bed. <goal> in a fresh worktree off <base>. done means <checks>. keep a decision log. don't ask me before committing. /loop until done. if you're truly stuck after a few hours, stop and write up why.`
- `/show-me-your-work catch me up on what you did last night.` Read its Attention section first.
- `/ketchup` catches you up on this chat since your last message and lists every call that waits on you.
- `/dstack:d-mode full autopilot on this queue. each item is independent.`
- `/dstack:d-mode autopilot these changes, but don't push. i'll land them.`
- `/reflect capture what we learned so the next run doesn't repeat it.` Approve only edits that change a future decision.
- `/bro` restates the last reply in plain words.
