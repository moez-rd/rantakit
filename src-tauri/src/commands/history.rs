use std::path::PathBuf;

use rantakit_tasks::{EntryFile, History};
use serde::Serialize;
use tauri::State;

use crate::error::Result;

/// Mirrors `Entry`, with whether each Result is still where it was saved.
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct HistoryItem {
    pub id: String,
    pub tool: String,
    pub created_at: u64,
    pub files: Vec<HistoryFile>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct HistoryFile {
    pub original_path: PathBuf,
    pub result_path: PathBuf,
    pub original_bytes: u64,
    pub result_bytes: u64,
    /// False when the Result was moved or deleted since.
    pub exists: bool,
}

impl From<EntryFile> for HistoryFile {
    fn from(file: EntryFile) -> Self {
        Self {
            exists: file.result_path.exists(),
            original_path: file.original_path,
            result_path: file.result_path,
            original_bytes: file.original_bytes,
            result_bytes: file.result_bytes,
        }
    }
}

/// History entries, one per Task, newest first.
#[tauri::command]
pub fn list_history(history: State<'_, History>) -> Result<Vec<HistoryItem>> {
    Ok(history
        .list()?
        .into_iter()
        .map(|entry| HistoryItem {
            id: entry.id,
            tool: entry.tool,
            created_at: entry.created_at,
            files: entry.files.into_iter().map(HistoryFile::from).collect(),
        })
        .collect())
}

/// Forget every entry. Result files are left alone.
#[tauri::command]
pub fn clear_history(history: State<'_, History>) -> Result<()> {
    Ok(history.clear()?)
}

/// The last Tools used, newest first, for "Terakhir dipakai" (Recent tools).
#[tauri::command]
pub fn recent_tools(history: State<'_, History>) -> Result<Vec<String>> {
    Ok(history.recent_tools()?)
}
