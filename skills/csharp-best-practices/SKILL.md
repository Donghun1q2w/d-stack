---
name: csharp-best-practices
description: C# and .NET best practices with the dotnet build and test commands. Use when reading or editing any .cs, .csproj, .sln, or .xaml file.
paths: ["**/*.cs", "**/*.csproj", "**/*.sln", "**/*.xaml"]
---

# C# best practices

Apply the **type-system-discipline** principle skill first.

## Build and test

Work from the folder that holds the `.sln`. Run the commands one at a time from the folder named above and stop at the first non-zero exit. They are the gate for the Commit and push playbook. A project's own `CLAUDE.md` wins when it names different commands.

```text
dotnet build -c Release
dotnet test -c Release --no-build
```

Add a line only when the project is set up for it:

| Extra command | Add it when |
|---|---|
| `-warnaserror` on the build line | A project file sets `TreatWarningsAsErrors`, or the project's `CLAUDE.md` asks for it. |
| `dotnet format --verify-no-changes` | The repository has an `.editorconfig`. |
| `dotnet test` | The solution has a test project. Leave the line out when it has none. |

| Project kind | Change to the gate |
|---|---|
| SDK-style project | The commands above. |
| Legacy .NET Framework `.csproj` (WinForms or WPF with `packages.config`) | `dotnet build` can fail on it. Use `msbuild <solution>.sln /p:Configuration=Release` with the project's `Platform` from a Visual Studio developer shell, and `vstest.console.exe` for the tests. |
| A project that references vendor DLLs outside the repo (AVEVA and similar) | The build needs the vendor install on the machine. Where it cannot run, the project declares `dstack-gate: manual` in its `CLAUDE.md`, and the gate is the user's confirmed run on a machine that has the install. Never mark an unrun build green. |
| No test project | The gate is the build plus one run of the real exe. Say so. |

## Rules

| Rule | Summary |
|------|---------|
| Research order | For an API you do not know cold, read Microsoft Learn first, then StackOverflow answers that target the project's .NET version, then real usage on GitHub. Cite the source in the reply. |
| Target framework first | Read `<TargetFramework>` and `<PlatformTarget>` before writing code. Language features and APIs differ between .NET Framework 4.x and .NET 8, and an x86 vendor DLL forces x86. |
| Nullable reference types | Keep `<Nullable>enable</Nullable>` on in SDK-style projects. Fix a warning by changing the type, not with `!`. |
| Closed variants | Model a closed set as an abstract `record` with a private constructor and nested sealed cases. Match it with a `switch` expression whose discard arm throws, because the compiler cannot prove the set is closed, and cover every case in one test. Records need C# 9, so on older targets use a sealed class hierarchy. |
| Strong ids | Wrap an id or unit in a `readonly record struct` so two ids cannot be swapped. Parse it once at the boundary. |
| Immutable by default | `record`, `init` setters, and `IReadOnlyList<T>` for data that crosses a method boundary. |
| Parse at the boundary | Turn config, files, CLI args, and network payloads into a typed model once. Inside, trust the type. See the **boundary-discipline** principle skill. |
| Exceptions | Throw for a broken invariant. Return `bool TryX(out T)` or a result type for an expected failure. Catch only what you can handle, and never `catch (Exception) { }`. |
| `IDisposable` | `using` declarations for every disposable. A class that owns one implements `IDisposable`. |
| Async | `async` all the way. No `.Result`, `.Wait()`, or `async void` outside an event handler. Pass `CancellationToken` through. |
| UI thread | WinForms and WPF controls are touched only on the UI thread. Long work runs in `Task.Run` and returns through `await`, `IProgress<T>`, or the dispatcher. |
| Logic out of code-behind | A form or window wires events and binds data. Rules live in plain classes a test can construct without a window. |
| Vendor assemblies | Load DLLs that live in a vendor install folder through one `AssemblyResolve` handler registered before the first vendor type is touched, and keep the install path in configuration, never in code. |
| Real tests | Test the public behavior with xUnit, NUnit, or MSTest, whichever the solution already uses. Don't mock what you can construct. |
| Structured logging | `ILogger` message templates with named fields. No `Console.WriteLine` in shipped library code. |

Examples: `references/patterns.md`.
