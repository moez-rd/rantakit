use std::fs::File;
use std::io::{BufReader, Read, Seek};
use std::path::Path;

use crate::kinds::{FileKind, read_kind};

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
    File::open(path).map(file_info_of).unwrap_or_default()
}

/// `file_info` of an open file, such as one Android handed over without a
/// path. A file that cannot go back to its start, like a pipe, gives its
/// kind only.
pub fn file_info_of(mut file: File) -> FileInfo {
    let mut info = FileInfo {
        size: file.metadata().ok().map(|m| m.len()),
        kind: read_kind(&mut file),
        ..Default::default()
    };
    if file.rewind().is_err() {
        return info;
    }
    match info.kind {
        Some(FileKind::Pdf) => {
            let mut bytes = Vec::new();
            info.pages = file
                .read_to_end(&mut bytes)
                .ok()
                .and_then(|_| rantakit_pdf::page_count_of(&bytes).ok());
        }
        Some(FileKind::Jpg | FileKind::Png) => {
            info.longest_side = rantakit_image::photo_info_of(BufReader::new(file))
                .ok()
                .map(|photo| photo.width.max(photo.height));
        }
        _ => {}
    }
    info
}
