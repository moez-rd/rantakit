//! How Kompres Foto and Kompres PDF turn what the user chose into engine
//! options. Every number the user never sees lives here, in one place.

use rantakit_image::{ImageOptions, OutputFormat, Target};
use rantakit_pdf::PdfOptions;

/// What the user asked for in a compress Tool's Options.
#[derive(Debug, Clone, Copy, Default, PartialEq, Eq)]
pub struct Compression {
    /// "Sesuaikan batas ukuran": each Result at or under this many bytes.
    /// `None` compresses without a limit.
    pub limit: Option<u64>,
    /// The exact quality from Advanced options; wins over the limit.
    pub quality: Option<u8>,
    /// The longest side from Advanced options, in pixels.
    pub max_dimension: Option<u32>,
}

/// Without a limit or an exact quality: a safe middle for most photos.
const PHOTO_QUALITY: u8 = 75;
const PHOTO_MAX_SIDE: u32 = 2560;

/// Without a limit or an exact quality: a safe middle for most PDFs.
const PDF_QUALITY: u8 = 70;
/// 200 dpi on an A4 page.
const PDF_MAX_SIDE: u32 = 2339;
/// The highest image quality tried when searching for a PDF Size limit.
const PDF_LIMIT_QUALITY: u8 = 90;

impl Compression {
    pub fn photo(&self, format: OutputFormat) -> ImageOptions {
        let (target, max_dimension) = match (self.quality, self.limit) {
            (Some(quality), _) => (Target::Quality(quality), self.max_dimension),
            (None, Some(limit)) => (Target::MaxBytes(limit), self.max_dimension),
            (None, None) => (
                Target::Quality(PHOTO_QUALITY),
                self.max_dimension.or(Some(PHOTO_MAX_SIDE)),
            ),
        };
        ImageOptions {
            format,
            target,
            max_dimension,
        }
    }

    pub fn pdf(&self) -> PdfOptions {
        match (self.quality, self.limit) {
            (Some(quality), _) => PdfOptions {
                quality,
                max_dimension: self.max_dimension,
                max_bytes: None,
            },
            (None, Some(limit)) => PdfOptions {
                quality: PDF_LIMIT_QUALITY,
                max_dimension: self.max_dimension,
                max_bytes: Some(limit),
            },
            (None, None) => PdfOptions {
                quality: PDF_QUALITY,
                max_dimension: self.max_dimension.or(Some(PDF_MAX_SIDE)),
                max_bytes: None,
            },
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn a_limit_searches_for_the_size() {
        let compression = Compression {
            limit: Some(200 * 1024),
            ..Default::default()
        };
        assert_eq!(
            compression.photo(OutputFormat::Same).target,
            Target::MaxBytes(200 * 1024)
        );
        assert_eq!(compression.pdf().max_bytes, Some(200 * 1024));
    }

    #[test]
    fn an_exact_quality_wins_over_the_limit() {
        let compression = Compression {
            limit: Some(200 * 1024),
            quality: Some(40),
            max_dimension: None,
        };
        assert_eq!(
            compression.photo(OutputFormat::Same).target,
            Target::Quality(40)
        );
        let pdf = compression.pdf();
        assert_eq!((pdf.quality, pdf.max_bytes), (40, None));
    }

    #[test]
    fn no_limit_falls_back_to_a_safe_middle() {
        let photo = Compression::default().photo(OutputFormat::Same);
        assert_eq!(photo.target, Target::Quality(PHOTO_QUALITY));
        assert_eq!(photo.max_dimension, Some(PHOTO_MAX_SIDE));
    }
}
