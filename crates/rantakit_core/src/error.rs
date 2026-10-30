#[derive(Debug, thiserror::Error)]
pub enum Error {
    #[error("unsupported image format")]
    UnsupportedImageFormat,

    #[error("image encoding error: {0}")]
    Encode(#[source] ::image::ImageError),

    #[error("image decoding error: {0}")]
    Decode(#[source] ::image::ImageError),

    #[error(
        "target size unreachable: target {target_bytes} bytes, smallest {smallest_bytes} bytes"
    )]
    TargetUnreachable {
        target_bytes: u64,
        smallest_bytes: u64,
    },

    #[error("PDF could not be read: {0}")]
    PdfLoad(#[source] lopdf::Error),

    #[error("PDF could not be saved: {0}")]
    PdfSave(#[source] std::io::Error),

    #[error("encrypted PDFs are not supported")]
    EncryptedPdf,
}

pub type Result<T> = std::result::Result<T, Error>;
