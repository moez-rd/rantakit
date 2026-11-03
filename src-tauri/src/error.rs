use rantakit_tasks::{HistoryError, StoreError};
use serde::ser::SerializeStruct;
use serde::{Serialize, Serializer};

/// Errors returned by commands. The frontend receives a code, never English
/// text; the text is only logged. A Task's per-file error kinds travel on its
/// channel instead (see `commands::task`).
#[derive(Debug, thiserror::Error)]
pub enum Error {
    #[error(transparent)]
    History(#[from] HistoryError),

    #[error(transparent)]
    Store(#[from] StoreError),

    #[cfg(desktop)]
    #[error(transparent)]
    Update(#[from] tauri_plugin_updater::Error),
}

impl Error {
    fn code(&self) -> &'static str {
        match self {
            Self::History(HistoryError::Newer(_)) => "history-from-newer-version",
            #[cfg(desktop)]
            Self::Update(_) => "update-failed",
            Self::History(_) | Self::Store(_) => "unexpected",
        }
    }
}

impl Serialize for Error {
    fn serialize<S: Serializer>(&self, serializer: S) -> std::result::Result<S::Ok, S::Error> {
        eprintln!("command failed: {self}");
        let mut error = serializer.serialize_struct("Error", 1)?;
        error.serialize_field("code", self.code())?;
        error.end()
    }
}

pub type Result<T> = std::result::Result<T, Error>;
