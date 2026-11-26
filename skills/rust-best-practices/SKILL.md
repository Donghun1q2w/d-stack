---
name: rust-best-practices
description: Rust best practices with the cargo build, test, clippy, and fmt commands. Use when reading or editing any .rs file or Cargo.toml.
paths: ["**/*.rs", "**/Cargo.toml"]
---

# Rust best practices

Apply the **type-system-discipline** principle skill first.

## Build and test

Work from the workspace root. Run the commands one at a time from the folder named above and stop at the first non-zero exit. They are the gate for the Commit and push playbook. A project's own `CLAUDE.md` wins when it names different commands.

```text
cargo build
cargo test
```

Add a line only when the project is set up for it:

| Extra command | Add it when |
|---|---|
| `cargo fmt --all -- --check` | The `rustfmt` component is installed (`cargo fmt --version` exits 0). |
| `cargo clippy --all-targets -- -D warnings` | The `clippy` component is installed (`cargo clippy --version` exits 0). |
| `--all-features` on `clippy` and `test` | The crate's features can all be on together. |
| `cargo build --release` | The change ships a binary. |

| Project state | Change to the gate |
|---|---|
| A workspace with several crates | Add `--workspace` to `clippy`, `test`, and `build`. |
| Features that cannot be on together | Drop `--all-features` and run the gate once per supported feature set. Name the sets in the report. |
| The MSVC linker is missing | `link.exe not found` means the Visual Studio C++ build tools are not installed. Report it. Do not switch the toolchain to work around it. |
| A crate with `unsafe` | Also run `cargo +nightly miri test` when Miri is installed, and say when it is not. |

## Rules

| Rule | Summary |
|------|---------|
| Enums for variants | Model a closed set as an `enum` and `match` it without a `_` arm, so a new variant is a compile error. |
| Newtypes | Wrap ids and units in a tuple struct with a private field and one constructor that validates. |
| Parse, don't validate | Turn external data into a typed value once, with `TryFrom` or `FromStr`. Inside, trust the type. See the **boundary-discipline** principle skill. |
| `Result` over panic | Return `Result<T, E>` for anything that can fail at run time. `unwrap` and `expect` belong in tests and in cases a comment-free invariant makes impossible. |
| Error types | `thiserror` enums in libraries, `anyhow::Result` with `.context(...)` in binaries. Never `Box<dyn Error>` in a public library API. |
| Borrow by default | Take `&str`, `&[T]`, and `&Path`. Take ownership only when the function keeps the value. A `.clone()` added to quiet the borrow checker is a design question, not a fix. |
| No stringly state | No `bool` pairs or `String` tags for state. Use an enum that carries the data each state needs. |
| Iterators | Prefer iterator chains to index loops. Indexing with `[i]` can panic, `.get(i)` cannot. |
| `unsafe` | Avoid it. When required, keep it in one small module behind a safe API, with the invariant written as a `// SAFETY:` line, which is a comment the **no-comments** skill keeps. |
| Concurrency | Share with `Arc` plus a channel or a `Mutex`. Never hold a `std::sync::Mutex` guard across `.await`. |
| Windows paths | `std::path::PathBuf` and `Path::join`, never string concatenation. `std::fs::canonicalize` returns a `\\?\` path on Windows, so do not show it to users or pass it to other tools. |
| Lints as the bar | Where `clippy` is installed, `-D warnings` is part of the gate. Fix the lint. An `#[allow(...)]` needs a reason a reader can check. |
| Real tests | Unit tests beside the code in `#[cfg(test)]`, integration tests under `tests/` that use only the public API. |
| Dependencies | Commit `Cargo.lock` for binaries. Add a crate only when the standard library cannot do the job in a few lines. |

Examples: `references/patterns.md`.
