use std::fs;
use std::path::Path;

use crate::kinds::{FileKind, detect_kind};

/// What the Files step shows about a file before a Task runs. Every field is
/// `None` when it cannot be read; the row then shows less, never an error.
#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct FileInfo {
    pub size: Option<u64>,
    pub kind: Option<FileKind>,
    /// PDFs only.
    pub pages: Option<usize>,
    /// Photos only: the longest side in pixels, to tell "Sudah kecil" apart.
    pub longest_side: Option<u32>,
}

pub fn file_info(path: &Path) -> FileInfo {
    let kind = detect_kind(path);
    let mut info = FileInfo {
        size: fs::metadata(path).ok().map(|m| m.len()),
        kind,
        ..Default::default()
    };
    match kind {
        Some(FileKind::Pdf) => info.pages = rantakit_pdf::page_count(path).ok(),
        Some(FileKind::Jpg | FileKind::Png) => {
            info.longest_side = rantakit_image::photo_info(path)
                .ok()
                .map(|photo| photo.width.max(photo.height));
        }
        _ => {}
    }
    info
}
