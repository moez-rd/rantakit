//! Facts about every Tool planned before 1.0 (RANTAKIT.md §4), and which
//! Tools fit a set of files. Names, descriptions, and icons belong to the
//! frontend, keyed by `ToolId::as_str`.

use std::path::Path;

use crate::kinds::{FileKind, detect_kind};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum ToolId {
    KompresFoto,
    KompresPdf,
    UbahFormatFoto,
    UbahUkuranFoto,
    KompresDokumen,
    KompresAudio,
    UbahFormatAudio,
    KompresVideo,
    WordKePdf,
    ExcelKePdf,
    JpgKePdf,
    ScanDokumen,
    GabungPdf,
    PisahPdf,
    AturHalamanPdf,
    PdfKeJpg,
    BeriWatermark,
    HapusInfoLokasi,
}

impl ToolId {
    /// The stable id the frontend keys names, descriptions, and icons by.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::KompresFoto => "kompres-foto",
            Self::KompresPdf => "kompres-pdf",
            Self::UbahFormatFoto => "ubah-format-foto",
            Self::UbahUkuranFoto => "ubah-ukuran-foto",
            Self::KompresDokumen => "kompres-dokumen",
            Self::KompresAudio => "kompres-audio",
            Self::UbahFormatAudio => "ubah-format-audio",
            Self::KompresVideo => "kompres-video",
            Self::WordKePdf => "word-ke-pdf",
            Self::ExcelKePdf => "excel-ke-pdf",
            Self::JpgKePdf => "jpg-ke-pdf",
            Self::ScanDokumen => "scan-dokumen",
            Self::GabungPdf => "gabung-pdf",
            Self::PisahPdf => "pisah-pdf",
            Self::AturHalamanPdf => "atur-halaman-pdf",
            Self::PdfKeJpg => "pdf-ke-jpg",
            Self::BeriWatermark => "beri-watermark",
            Self::HapusInfoLokasi => "hapus-info-lokasi",
        }
    }
}

/// The five jobs-to-be-done; Home groups Tools by them.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum Job {
    /// "Kecilkan & Ubah"
    KecilkanUbah,
    /// "Scan"
    Scan,
    /// "Atur PDF"
    AturPdf,
    /// "Ambil Teks"
    AmbilTeks,
    /// "Bagikan dengan Aman"
    BagikanAman,
}

impl Job {
    /// The stable id the frontend keys Job headings by.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::KecilkanUbah => "kecilkan-ubah",
            Self::Scan => "scan",
            Self::AturPdf => "atur-pdf",
            Self::AmbilTeks => "ambil-teks",
            Self::BagikanAman => "bagikan-aman",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum Platform {
    Windows,
    Linux,
    Android,
}

impl Platform {
    /// The platform this build runs on.
    pub fn current() -> Self {
        if cfg!(target_os = "android") {
            Self::Android
        } else if cfg!(windows) {
            Self::Windows
        } else {
            Self::Linux
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Availability {
    Shipped,
    /// Shown greyed out with "Segera hadir"; cannot be used yet.
    ComingSoon,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Tool {
    pub id: ToolId,
    pub job: Job,
    /// File kinds the Tool takes; empty for Tools that start from the camera.
    pub accepts: &'static [FileKind],
    pub platforms: &'static [Platform],
    pub availability: Availability,
}

use Availability::*;
use FileKind::*;
use Job::*;

const ALL: &[Platform] = &[Platform::Windows, Platform::Linux, Platform::Android];
const PHOTOS: &[FileKind] = &[Jpg, Png];
const OFFICE: &[FileKind] = &[Word, Excel, PowerPoint];

/// Every Tool planned before 1.0, in the order Home shows them within a Job.
/// Tools planned for after 1.0 are not listed, so they never appear.
pub const CATALOGUE: &[Tool] = &[
    tool(ToolId::KompresFoto, KecilkanUbah, PHOTOS, ALL, Shipped),
    tool(ToolId::KompresPdf, KecilkanUbah, &[Pdf], ALL, Shipped),
    tool(
        ToolId::UbahFormatFoto,
        KecilkanUbah,
        &[Jpg, Png, Heic, Webp],
        ALL,
        ComingSoon,
    ),
    tool(
        ToolId::UbahUkuranFoto,
        KecilkanUbah,
        PHOTOS,
        ALL,
        ComingSoon,
    ),
    tool(
        ToolId::KompresDokumen,
        KecilkanUbah,
        OFFICE,
        ALL,
        ComingSoon,
    ),
    tool(
        ToolId::KompresAudio,
        KecilkanUbah,
        &[Audio],
        ALL,
        ComingSoon,
    ),
    tool(
        ToolId::UbahFormatAudio,
        KecilkanUbah,
        &[Audio],
        ALL,
        ComingSoon,
    ),
    tool(
        ToolId::KompresVideo,
        KecilkanUbah,
        &[Video],
        ALL,
        ComingSoon,
    ),
    tool(ToolId::WordKePdf, KecilkanUbah, &[Word], ALL, ComingSoon),
    tool(ToolId::ExcelKePdf, KecilkanUbah, &[Excel], ALL, ComingSoon),
    tool(ToolId::JpgKePdf, Scan, PHOTOS, ALL, ComingSoon),
    tool(
        ToolId::ScanDokumen,
        Scan,
        &[],
        &[Platform::Android],
        ComingSoon,
    ),
    tool(ToolId::GabungPdf, AturPdf, &[Pdf], ALL, ComingSoon),
    tool(ToolId::PisahPdf, AturPdf, &[Pdf], ALL, ComingSoon),
    tool(ToolId::AturHalamanPdf, AturPdf, &[Pdf], ALL, ComingSoon),
    tool(ToolId::PdfKeJpg, AturPdf, &[Pdf], ALL, ComingSoon),
    tool(
        ToolId::BeriWatermark,
        BagikanAman,
        &[Jpg, Png, Pdf],
        ALL,
        ComingSoon,
    ),
    tool(
        ToolId::HapusInfoLokasi,
        BagikanAman,
        PHOTOS,
        ALL,
        ComingSoon,
    ),
];

const fn tool(
    id: ToolId,
    job: Job,
    accepts: &'static [FileKind],
    platforms: &'static [Platform],
    availability: Availability,
) -> Tool {
    Tool {
        id,
        job,
        accepts,
        platforms,
        availability,
    }
}

/// The Tools to list on `platform`, shipped or coming soon.
pub fn tools_for(platform: Platform) -> impl Iterator<Item = &'static Tool> {
    CATALOGUE
        .iter()
        .filter(move |tool| tool.platforms.contains(&platform))
}

/// The shipped Tools on `platform` that accept every one of `kinds`. Empty
/// when `kinds` is empty.
pub fn tools_for_kinds(kinds: &[FileKind], platform: Platform) -> Vec<ToolId> {
    if kinds.is_empty() {
        return Vec::new();
    }
    tools_for(platform)
        .filter(|tool| tool.availability == Shipped)
        .filter(|tool| kinds.iter().all(|kind| tool.accepts.contains(kind)))
        .map(|tool| tool.id)
        .collect()
}

/// The shipped Tools on `platform` that accept every one of `files`, judged by
/// content. A file Rantakit cannot recognize fits no Tool.
pub fn tools_for_files(files: &[impl AsRef<Path>], platform: Platform) -> Vec<ToolId> {
    let kinds: Option<Vec<FileKind>> = files.iter().map(|f| detect_kind(f.as_ref())).collect();
    match kinds {
        Some(kinds) => tools_for_kinds(&kinds, platform),
        None => Vec::new(),
    }
}

#[cfg(test)]
mod tests {
    use std::collections::HashSet;

    use super::*;

    #[test]
    fn ids_are_unique() {
        let ids: HashSet<_> = CATALOGUE.iter().map(|tool| tool.id.as_str()).collect();
        assert_eq!(ids.len(), CATALOGUE.len());
    }

    #[test]
    fn photos_fit_kompres_foto_and_pdfs_fit_kompres_pdf() {
        let on = Platform::Windows;
        assert_eq!(tools_for_kinds(&[Jpg, Png], on), [ToolId::KompresFoto]);
        assert_eq!(tools_for_kinds(&[Pdf, Pdf], on), [ToolId::KompresPdf]);
    }

    #[test]
    fn photos_and_pdfs_together_fit_nothing() {
        assert!(tools_for_kinds(&[Jpg, Pdf], Platform::Linux).is_empty());
    }

    #[test]
    fn coming_soon_tools_never_match() {
        assert!(tools_for_kinds(&[Webp], Platform::Linux).is_empty());
        assert!(tools_for_kinds(&[Word], Platform::Linux).is_empty());
    }

    #[test]
    fn scan_dokumen_is_android_only() {
        let listed = |platform| tools_for(platform).any(|t| t.id == ToolId::ScanDokumen);
        assert!(listed(Platform::Android));
        assert!(!listed(Platform::Windows));
        assert!(!listed(Platform::Linux));
    }
}
