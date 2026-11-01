use std::io::Cursor;
use std::path::Path;

use ::image::ImageReader;
use ::image::codecs::jpeg::JpegEncoder;
use rantakit_core::{ErrorKind, Result, read_original};

use crate::options::ImageFormat;
use crate::{decode, format_of};

/// What the Files step shows about a photo before anything runs.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct PhotoInfo {
    pub format: ImageFormat,
    /// Pixel size as stored, before any EXIF rotation; the longest side is the same either way.
    pub width: u32,
    pub height: u32,
}

/// Format and pixel size from the file's header, without decoding the photo.
pub fn photo_info(path: &Path) -> Result<PhotoInfo> {
    let reader = ImageReader::open(path)
        .map_err(|e| ErrorKind::reading(&e))?
        .with_guessed_format()
        .map_err(|e| ErrorKind::reading(&e))?;
    let format = format_of(reader.format())?;
    let (width, height) = reader.into_dimensions().map_err(|_| ErrorKind::Damaged)?;
    Ok(PhotoInfo {
        format,
        width,
        height,
    })
}

/// A small JPG of the photo at `path`, at most `max_side` pixels on its
/// longest side and turned upright, for file rows and Result previews.
pub fn thumbnail(path: &Path, max_side: u32) -> Result<Vec<u8>> {
    let (img, _) = decode(&read_original(path)?)?;
    let small = img.thumbnail(max_side, max_side).to_rgb8();

    let mut bytes = Cursor::new(Vec::new());
    small
        .write_with_encoder(JpegEncoder::new_with_quality(&mut bytes, 80))
        .map_err(|_| ErrorKind::Damaged)?;
    Ok(bytes.into_inner())
}
