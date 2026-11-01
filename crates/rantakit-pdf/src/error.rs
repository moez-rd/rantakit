#[derive(Debug, thiserror::Error)]
pub enum Error {
    #[error("PDF could not be read: {0}")]
    PdfLoad(#[source] lopdf::Error),

    #[error("PDF could not be saved: {0}")]
    PdfSave(#[source] std::io::Error),

    #[error("encrypted PDFs are not supported")]
    EncryptedPdf,
}

pub type Result<T> = std::result::Result<T, Error>;
