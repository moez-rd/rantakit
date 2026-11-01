use std::path::PathBuf;

/// Each file's size in bytes, or None when it can't be read. The Files step
/// shows it next to every Original.
#[tauri::command]
pub fn file_sizes(paths: Vec<PathBuf>) -> Vec<Option<u64>> {
    paths
        .iter()
        .map(|path| std::fs::metadata(path).ok().map(|meta| meta.len()))
        .collect()
}
