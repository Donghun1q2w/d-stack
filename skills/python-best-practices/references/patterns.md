# Python patterns

Code examples for the rules in `SKILL.md`. See the **type-system-discipline** and **boundary-discipline** principle skills.

## Closed variants

```python
from dataclasses import dataclass
from typing import assert_never


@dataclass(frozen=True, slots=True)
class Loading:
    pass


@dataclass(frozen=True, slots=True)
class Ready:
    rows: tuple[str, ...]


@dataclass(frozen=True, slots=True)
class Failed:
    error: str


LoadState = Loading | Ready | Failed


def describe(state: LoadState) -> str:
    match state:
        case Loading():
            return "loading"
        case Ready(rows=rows):
            return f"{len(rows)} rows"
        case Failed(error=error):
            return error
        case _:
            assert_never(state)
```

`match` and `slots=True` need Python 3.10, and `assert_never` needs 3.11. On 3.10 import `assert_never` from `typing_extensions`.

## Strong ids

```python
from typing import NewType

ElementId = NewType("ElementId", str)


def parse_element_id(raw: str) -> ElementId:
    if not raw.startswith("/"):
        raise ValueError(f"not an element name: {raw!r}")
    return ElementId(raw)
```

## Text encoding and paths

```python
from pathlib import Path


def read_macro(folder: Path, name: str) -> str:
    return (folder / name).read_text(encoding="utf-8")
```

## Bundled data

```python
import sys
from pathlib import Path


def resource_path(relative: str) -> Path:
    base = Path(getattr(sys, "_MEIPASS", Path(__file__).resolve().parent))
    return base / relative
```

## Real tests

```python
import pytest


@pytest.mark.parametrize(("raw", "ok"), [("/PIPE-1", True), ("PIPE-1", False), ("", False)])
def test_parse_element_id(raw: str, ok: bool) -> None:
    if ok:
        assert parse_element_id(raw) == raw
    else:
        with pytest.raises(ValueError):
            parse_element_id(raw)
```
