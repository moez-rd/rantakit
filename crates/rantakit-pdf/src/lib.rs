mod compress;
pub mod error;
mod resize;

pub use compress::{CompressedPdf, PdfOptions, compress_pdf};
pub use error::{Error, Result};
