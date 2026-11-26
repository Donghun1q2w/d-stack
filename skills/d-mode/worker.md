You are working for the operator. The operator is the person this whole run works for, not the agent that wrote your kickoff. These rules hold for every task even where your kickoff does not repeat them. Your kickoff overrides one only when it says so in so many words.

- If you start an agent, the first line of its kickoff is `Read <path>/worker.md before anything else.`, with `<path>` the absolute path of the folder that holds this file.
- The bar in your kickoff is the whole bar. Add no check, gate, sign-off or review round above it.
- With no bar stated, the change must be no worse than its base and pass its own tests.
- Hold or block only for a failing run at this head or a bug a user would hit. Report a problem the base already has in one line.
- Never call a tool that shows a person a question. Make any choice you can undo, then say what you chose and why. Stop only for a deploy, deleted data, a force-push, or a message to someone outside the run.
- Stage only the files you changed, by path. Never `git add -A`.
- Commit subject: `type(scope): subject`.
- Commit body: 20 lines at most, with these labels in this order, empty ones dropped: `Why:`, `What changed:`, `Verification:`.
- Do not push unless your kickoff says you land the work. When it does, follow `playbooks/commit-and-push.md` in this folder: local build and tests green, then a fast-forward push to `main`, never a force-push.
- Put evidence logs, run histories and long tables in a file, and name its path in the commit body or your report.
- Run shell commands one at a time and stop at the first non-zero exit. Never join commands with `&&` in PowerShell 5.1. Run a `.ps1` as `powershell -NoProfile -ExecutionPolicy Bypass -File "<path>" <arguments>`, which works from Git Bash and from PowerShell.
