---
name: pml-best-practices
description: AVEVA PML best practices for E3D and PDMS macros, functions, forms, and objects, with how to load and run them. Use when reading or editing any .pmlfnc, .pmlfrm, .pmlobj, .pmlmac, or .mac file.
paths: ["**/*.pmlfnc", "**/*.pmlfrm", "**/*.pmlobj", "**/*.pmlmac", "**/*.mac"]
---

# PML best practices

Apply the **boundary-discipline** principle skill first. PML has no compiler and no test runner, so the only proof is a run inside E3D.

Every rule below names its source. `launcher`, `standalone`, and `crypto` are the user's own E3D skills (`e3d-launcher`, `e3d-standalone`, `pml-crypto`), which were checked against a real installation. `unverified` means general PML practice that nobody has checked here: confirm it in E3D before you rely on it, and tell the user when a change depends on one.

## Load and run

PML has no build, so a PML project has no gate that runs from a shell. Declare the gate in the project's `CLAUDE.md`:

```text
dstack-gate: manual - load the changed file in E3D and run <entry point>
```

The Commit and push playbook then asks the user to confirm that run before it pushes, and records `Verification: manual (<what was run>)`. Without E3D on this machine you cannot run the proof yourself. Say so, hand the user the exact lines to run, and wait for their confirmation.

| Step | How | Source |
|---|---|---|
| Run a macro file | `$M /<full path to the macro>` | standalone |
| Print a value while proving a change | `$P $!value` | standalone |
| Query into a variable | `VAR !result <query>`, as in `VAR !result FLNN` | standalone |
| Run PML from a C# host | `Command.CreateCommand("$M /<macro>")`, then `Run()`. Read `Result` on success and `Error.MessageText()` on failure | standalone |
| Start a console session that runs a macro | `mon.exe PROD E3D init "<launch.init>" TTY <project> <user>/<password> /<mdb> <macro path>` | launcher |
| Make project PML findable | Put the project's PML folder first on `PMLLIB`, before the install folder | standalone |
| Rebuild the `PMLLIB` index after adding or renaming a file | `pml rehash all` | unverified |
| Reload one form or object after editing it | `pml reload form !!<FormName>`, `pml reload object <OBJECTNAME>` | unverified |

Keep install paths, project codes, and credentials in a configuration file or environment variables that stay out of the repository, never in a committed file (launcher).

## Rules

| Rule | Summary | Source |
|------|---------|--------|
| File types | PML source lives in `.pmlfnc` (function), `.pmlfrm` (form), `.pmlobj` (object), and `.pmlmac` (macro) files. Extension case does not matter. | crypto |
| Published files are not source | A file whose first line is `--<004>-- Published PML 1.0`, or the `--<004-N>--` and `--<002>--` variants, is encrypted output. Edit the plain source and publish again. Never commit a hand-edited published file. | crypto |
| Authorized code only | Decrypt or edit published PML only when it is the user's own code or code they are licensed to change. | crypto |
| File encoding | Write generated macro files as UTF-8, and read PML back as UTF-8. Korean comments break when a tool re-reads them in the ANSI code page. After any round trip, check one Korean string and treat U+FFFD or `?` in its place as a failure. | standalone, crypto |
| No silent continue | `onerror continue` belongs only in a generated batch macro whose host reads every result back. In hand-written PML it hides the first failure. | standalone |
| Check the host's result | A C# host checks the return of `Run()` and logs `Error.MessageText()`. A macro that printed nothing is not a pass. | standalone |
| x86 hosts | A C# host that loads AVEVA assemblies targets x86 and resolves them from the install folder. See the **csharp-best-practices** skill. | standalone |
| No secrets in macros | A macro or launcher argument that carries a user name and password is built at run time from configuration. It is never written into a tracked file. | launcher |
| Prove it in the session | After every edit, load the file, run the entry point once, and paste the command-window output into the report. | standalone |
| One definition per file | A function, form, or object lives in a file named after it in lower case, because `PMLLIB` finds a definition by file name. | unverified |
| Local before global | `!name` is local and `!!name` is global to the session. Use a global only for a form or a shared object. | unverified |
| Typed members and arguments | Declare member and argument types (`is STRING`, `is REAL`). | unverified |
| Handle the error you expect | Follow a command that can fail with a `handle` block for that one error. A catch-all handler hides every failure. | unverified |
| Forms hold no rules | A form's methods read gadgets and call an object or function. | unverified |

Syntax differs between PDMS 12 and E3D 2 and 3. For an `unverified` row, read the AVEVA PML reference for the installed version, or run a two-line probe in the command window, before writing code that depends on it.

Examples: `references/patterns.md`.
