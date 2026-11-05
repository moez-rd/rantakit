use std::path::{Path, PathBuf};

use rantakit_tasks::{EntryFile, History};
use serde::Serialize;
use tauri::{AppHandle, State};

#[cfg(target_os = "android")]
use crate::android;
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

impl HistoryFile {
    fn new(app: &AppHandle, file: EntryFile) -> Self {
        Self {
            exists: exists(app, &file.result_path),
            original_path: file.original_path,
            result_path: file.result_path,
            original_bytes: file.original_bytes,
            result_bytes: file.result_bytes,
        }
    }
}

fn exists(app: &AppHandle, path: &Path) -> bool {
    #[cfg(target_os = "android")]
    return android::result_exists(app, path);
    #[cfg(not(target_os = "android"))]
    {
        let _ = app;
        path.exists()
    }
}

/// History entries, one per Task, newest first. Looks for every Result, so
/// it runs off the main thread.
#[tauri::command]
pub async fn list_history(app: AppHandle, history: State<'_, History>) -> Result<Vec<HistoryItem>> {
    Ok(history
        .list()?
        .into_iter()
        .map(|entry| HistoryItem {
            id: entry.id,
            tool: entry.tool,
            created_at: entry.created_at,
            files: entry
                .files
                .into_iter()
                .map(|file| HistoryFile::new(&app, file))
                .collect(),
        })
        .collect())
}

/// Forget every entry. Result files are left alone.
#[tauri::command]
pub fn clear_history(history: State<'_, History>) -> Result<()> {
    Ok(history.clear()?)
}
