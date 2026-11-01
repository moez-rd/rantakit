use std::fs::File;
use std::io::Read;
use std::path::Path;

/// What a file is, judged by its content.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum FileKind {
    Jpg,
    Png,
    Heic,
    Webp,
    Pdf,
    Word,
    Excel,
    PowerPoint,
    Audio,
    Video,
}

impl FileKind {
    /// The stable id the frontend uses for this kind.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Jpg => "jpg",
            Self::Png => "png",
            Self::Heic => "heic",
            Self::Webp => "webp",
            Self::Pdf => "pdf",
            Self::Word => "word",
            Self::Excel => "excel",
            Self::PowerPoint => "powerpoint",
            Self::Audio => "audio",
            Self::Video => "video",
        }
    }
}

/// PDF readers accept the `%PDF-` header anywhere in the first 1024 bytes.
const HEADER_BYTES: usize = 1024;

/// The kind of the file at `path` from its first bytes, not its extension.
/// `None` when it cannot be read or is not a kind Rantakit knows. Office,
/// audio, and video files are recognized once their Tools ship.
pub fn detect_kind(path: &Path) -> Option<FileKind> {
    let mut header = Vec::with_capacity(HEADER_BYTES);
    File::open(path)
        .ok()?
        .take(HEADER_BYTES as u64)
        .read_to_end(&mut header)
        .ok()?;
    kind_of(&header)
}

fn kind_of(header: &[u8]) -> Option<FileKind> {
    let at = |offset: usize, bytes: &[u8]| header.get(offset..offset + bytes.len()) == Some(bytes);

    if at(0, &[0xFF, 0xD8, 0xFF]) {
        Some(FileKind::Jpg)
    } else if at(0, b"\x89PNG\r\n\x1a\n") {
        Some(FileKind::Png)
    } else if at(0, b"RIFF") && at(8, b"WEBP") {
        Some(FileKind::Webp)
    } else if at(4, b"ftyp") && HEIC_BRANDS.iter().any(|brand| at(8, brand)) {
        Some(FileKind::Heic)
    } else if header.windows(5).any(|window| window == b"%PDF-") {
        Some(FileKind::Pdf)
    } else {
        None
    }
}

const HEIC_BRANDS: &[&[u8]] = &[
    b"heic", b"heix", b"hevc", b"hevx", b"heim", b"heis", b"mif1",
];

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn recognizes_kinds_by_their_first_bytes() {
        assert_eq!(kind_of(&[0xFF, 0xD8, 0xFF, 0xE0]), Some(FileKind::Jpg));
        assert_eq!(kind_of(b"\x89PNG\r\n\x1a\n...."), Some(FileKind::Png));
        assert_eq!(kind_of(b"RIFF\0\0\0\0WEBPVP8 "), Some(FileKind::Webp));
        assert_eq!(kind_of(b"\0\0\0\x18ftypheic"), Some(FileKind::Heic));
        assert_eq!(kind_of(b"%PDF-1.7\n"), Some(FileKind::Pdf));
        assert_eq!(kind_of(b"\r\n%PDF-1.4"), Some(FileKind::Pdf));
    }

    #[test]
    fn unknown_or_empty_is_none() {
        assert_eq!(kind_of(b""), None);
        assert_eq!(kind_of(b"just some text"), None);
        assert_eq!(
            kind_of(b"\0\0\0\x18ftypisom"),
            None,
            "MP4 video is not recognized yet"
        );
    }
}
