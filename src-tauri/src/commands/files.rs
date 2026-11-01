use std::path::PathBuf;

use rantakit_tasks::{FileKind, file_info as read_info};
use serde::Serialize;
use tauri::AppHandle;
use tauri::ipc::Response;
use tauri_plugin_opener::OpenerExt;

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FileInfo {
    pub size: Option<u64>,
    pub kind: Option<&'static str>,
    pub pages: Option<usize>,
    pub longest_side: Option<u32>,
}

/// What the Files step shows next to each Original: size, and the page count
/// for PDFs. Reads file headers, so it runs off the main thread.
#[tauri::command]
pub async fn file_info(paths: Vec<PathBuf>) -> Vec<FileInfo> {
    paths
        .iter()
        .map(|path| {
            let info = read_info(path);
            FileInfo {
                size: info.size,
                kind: info.kind.map(FileKind::as_str),
                pages: info.pages,
                longest_side: info.longest_side,
            }
        })
        .collect()
}

/// A small JPG of a photo, as raw bytes, for the file rows and the Result
/// preview. Fails quietly with an empty body; the row then shows an icon.
#[tauri::command]
pub async fn thumbnail(path: PathBuf, size: u32) -> Response {
    let size = size.clamp(32, 1024);
    Response::new(rantakit_tasks::thumbnail(&path, size).unwrap_or_default())
}

/// Opens a Result in the app the system uses for it ("Buka").
#[tauri::command]
pub fn open_path(app: AppHandle, path: PathBuf) {
    if let Err(error) = app.opener().open_path(path.to_string_lossy(), None::<&str>) {
        eprintln!("open failed: {error}");
    }
}
