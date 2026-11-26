### Authoring or modifying a skill

**You own the skill's voice.**

1. Write the `SKILL.md` by hand: YAML frontmatter with `name` equal to the folder name and a one-line `description` that says when to use it, then the body. A project skill lives in `.claude/skills/<name>/`, a personal one in `~/.claude/skills/<name>/`, and a dstack skill in this plugin's `skills/<name>/` per `docs/EXTENDING.md` at the plugin root.
2. Validate the skill: frontmatter has `name` and `description`, referenced files exist, cross-skill links resolve. For a dstack skill, `node scripts/check-dstack.mjs` at the plugin root checks all three.
3. Test cases if structural. Skip if subjective.
4. Run **Commit and push**.

When in doubt, delete. Keep only prose that changes a decision. Tell it to do the thing and skip the reason. Explain only when the rule is confusing without one. Match tone to scope. Point at structural sources (types, READMEs, config) per the **encode-lessons-in-structure** principle skill. Delegate to other skills by path. Don't restate. A workflow you keep hitting but isn't captured → propose a new skill.

**Reply:** summary of the skill, key design decisions, validation notes.
