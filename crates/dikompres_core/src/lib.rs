pub mod error;
pub mod image;
pub mod pdf;

pub use self::image::compress_image;
pub use self::image::options::{Compressed, ImageFormat, ImageOptions, OutputFormat, Target};
pub use self::pdf::{CompressedPdf, PdfOptions, compress_pdf};
pub use error::{Error, Result};
