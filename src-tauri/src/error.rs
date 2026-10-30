use serde::{Serialize, Serializer};

/// Errors returned by commands. The frontend receives the message as a string.
#[derive(Debug, thiserror::Error)]
pub enum Error {
    #[error(transparent)]
    Io(#[from] std::io::Error),

    #[error(transparent)]
    Core(#[from] rantakit_core::Error),

    #[error(transparent)]
    Tauri(#[from] tauri::Error),

    #[error(transparent)]
    Json(#[from] serde_json::Error),

    #[error("history was saved by a newer version of Rantakit (format {0})")]
    NewerHistory(u32),
}

impl Serialize for Error {
    fn serialize<S: Serializer>(&self, serializer: S) -> std::result::Result<S::Ok, S::Error> {
        serializer.serialize_str(&self.to_string())
    }
}

pub type Result<T> = std::result::Result<T, Error>;
