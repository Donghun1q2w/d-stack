---
name: python-best-practices
description: Python best practices with the pytest, ruff, and mypy commands and the Windows exe build. Use when reading or editing any .py file or pyproject.toml.
paths: ["**/*.py", "**/pyproject.toml"]
---

# Python best practices

Apply the **type-system-discipline** principle skill first.

## Build and test

Work from the project root, with the project's own interpreter. Run the commands one at a time from the folder named above and stop at the first non-zero exit. They are the gate for the Commit and push playbook. A project's own `CLAUDE.md` wins when it names different commands.

```text
python -m pytest
```

Use the interpreter the project already has: `.venv/Scripts/python.exe` when a `.venv` folder exists, otherwise the `python` on `PATH`. Do not create a virtual environment or install packages to satisfy the gate. When a test needs a package that is not installed, stop and report it.

Add a line only when the project is set up for it:

| Extra command | Add it when |
|---|---|
| `python -m ruff check .` | `pyproject.toml` has a `[tool.ruff]` table, or a `ruff.toml` exists. |
| `python -m mypy .` | `pyproject.toml` has a `[tool.mypy]` table, or a `mypy.ini` exists. |

| Project state | Change to the gate |
|---|---|
| No tests at all | The gate is one run of the real entry point with a real input. Say so. |
| Tests use `unittest` | `python -m unittest discover tests`. |
| The project ships a Windows exe | After the tests pass, `pyinstaller --onefile --console <entry>.py`, then run `dist\<entry>.exe --help` once. On Windows the `--add-data` separator is `;`. A missing module at run time takes `--hidden-import=<module>`. |
| The user asks you to set the project up | `python -m venv .venv`, then `.venv/Scripts/python.exe -m pip install -r requirements.txt` or `-e .` for a `pyproject.toml` project. Call the interpreter by path. Activation scripts differ between shells. |

## Rules

| Rule | Summary |
|------|---------|
| Type hints on every signature | Annotate parameters and returns. `mypy` or `pyright` checks them. A function without hints is unchecked. |
| Closed variants | Model variants as frozen dataclasses in a `Union`, matched with `match` and `assert_never` in the default arm. |
| Strong ids | `NewType` for ids and units, made by one parsing function at the boundary. |
| Immutable data | `@dataclass(frozen=True, slots=True)` for values. `tuple` and `Mapping` in signatures. |
| Parse at the boundary | Turn CLI args, JSON, CSV, and environment values into typed objects once. Inside, trust the type. See the **boundary-discipline** principle skill. |
| No `Any` | External data is `object` until parsed. `Any` switches the checker off for everything it touches. |
| Exceptions | Raise a specific exception. Catch a specific exception. Never a bare `except:`, and never `except Exception: pass`. |
| Resources | `with` for every file, lock, connection, and temporary folder. |
| Paths | `pathlib.Path`, never string joins. No hard-coded separators and no absolute user paths. |
| Text encoding | Pass `encoding="utf-8"` to every `open`, `read_text`, and `write_text`. The Windows default is the ANSI code page, which corrupts Korean text. |
| Bundled data | Code that ships as a PyInstaller exe finds its data through `sys._MEIPASS` when it is set, and the source folder otherwise. |
| Subprocesses | `subprocess.run([...], check=True)` with an argument list. Never `shell=True` with text built from input. |
| Real tests | `pytest` with `tmp_path` and real files. Parametrize the cases. Mock only what you cannot run locally. |
| Logging | The `logging` module with a named logger. No `print` in library code. |

Examples: `references/patterns.md`.
