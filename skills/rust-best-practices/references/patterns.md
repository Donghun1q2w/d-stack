# Rust patterns

Code examples for the rules in `SKILL.md`. See the **type-system-discipline** and **boundary-discipline** principle skills.

## Enums for variants

```rust
enum LoadState {
    Loading,
    Ready { rows: Vec<String> },
    Failed { error: String },
}

fn describe(state: &LoadState) -> String {
    match state {
        LoadState::Loading => "loading".to_owned(),
        LoadState::Ready { rows } => format!("{} rows", rows.len()),
        LoadState::Failed { error } => error.clone(),
    }
}
```

## Newtypes that parse

```rust
use std::str::FromStr;

#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub struct ElementId(String);

#[derive(Debug, thiserror::Error)]
#[error("not an element name: {0:?}")]
pub struct ElementIdError(String);

impl FromStr for ElementId {
    type Err = ElementIdError;

    fn from_str(raw: &str) -> Result<Self, Self::Err> {
        if raw.starts_with('/') {
            Ok(Self(raw.to_owned()))
        } else {
            Err(ElementIdError(raw.to_owned()))
        }
    }
}
```

## Errors with context in a binary

```rust
use anyhow::{Context, Result};
use std::path::Path;

fn read_settings(path: &Path) -> Result<Settings> {
    let text = std::fs::read_to_string(path)
        .with_context(|| format!("reading {}", path.display()))?;
    toml::from_str(&text).with_context(|| format!("parsing {}", path.display()))
}
```

## Tests beside the code

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn rejects_a_name_without_a_slash() {
        assert!("PIPE-1".parse::<ElementId>().is_err());
    }
}
```
