use rantakit_tasks::{Entry, History};
use serde::Serialize;
use tauri::State;

use crate::error::Result;

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct HistoryItem {
    #[serde(flatten)]
    pub entry: Entry,
    /// False when the compressed copy was moved or deleted since.
    pub output_exists: bool,
}

/// History entries, newest first.
#[tauri::command]
pub fn list_history(history: State<'_, History>) -> Result<Vec<HistoryItem>> {
    Ok(history
        .list()?
        .into_iter()
        .map(|entry| HistoryItem {
            output_exists: entry.output_path.exists(),
            entry,
        })
        .collect())
}

/// Forget one entry. The compressed file itself is left alone.
#[tauri::command]
pub fn remove_history(history: State<'_, History>, id: String) -> Result<()> {
    Ok(history.remove(&id)?)
}

/// Forget every entry. Compressed files are left alone.
#[tauri::command]
pub fn clear_history(history: State<'_, History>) -> Result<()> {
    Ok(history.clear()?)
}

/// The last Tools used, newest first, for "Terakhir dipakai" (Recent tools).
#[tauri::command]
pub fn recent_tools(history: State<'_, History>) -> Result<Vec<String>> {
    Ok(history.recent_tools()?)
}
