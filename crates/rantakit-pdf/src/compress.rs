use std::path::Path;

use ::image::codecs::jpeg::JpegEncoder;
use ::image::{DynamicImage, ExtendedColorType, ImageEncoder, ImageFormat as RawFormat};
use lopdf::{Document, LoadOptions, Object, ObjectId, SaveOptions, Stream};
use rantakit_core::{
    CancelToken, ErrorKind, Progress, Result, Tracker, read_original, write_result,
};

use crate::resize::fit_within;

const MAX_DECOMPRESSED_BYTES: usize = 256 * 1024 * 1024;

/// Progress once the PDF is loaded, its images are done, and it is repacked.
const LOADED: f32 = 0.1;
const IMAGES_DONE: f32 = 0.8;
const REPACKED: f32 = 0.9;

#[derive(Debug, Clone)]
pub struct PdfOptions {
    pub quality: u8,
    pub max_dimension: Option<u32>,
}

#[derive(Debug, Clone)]
pub struct CompressedPdf {
    /// Size of the Result in bytes.
    pub size: u64,
    pub images: usize,
    pub images_recompressed: usize,
}

/// Compresses the PDF at `input` and writes the Result to `output`, which
/// must not exist yet. Progress is a fraction, because the work goes image by
/// image, not page by page.
pub fn compress_pdf(
    input: &Path,
    output: &Path,
    opts: &PdfOptions,
    progress: &mut dyn FnMut(Progress),
    cancel: &CancelToken,
) -> Result<CompressedPdf> {
    let mut tracker = Tracker::new(progress, cancel);

    let original = read_original(input)?;
    if !is_pdf(&original) {
        return Err(ErrorKind::UnsupportedFormat);
    }
    let load = LoadOptions {
        max_decompressed_size: Some(MAX_DECOMPRESSED_BYTES),
        ..Default::default()
    };
    let mut doc = Document::load_mem_with_options(&original, load).map_err(load_error)?;
    drop(original);

    if doc.was_encrypted() || doc.is_encrypted() {
        return Err(ErrorKind::PasswordProtected);
    }
    tracker.step(LOADED)?;

    let quality = opts.quality.clamp(1, 100);
    let image_ids: Vec<ObjectId> = doc
        .objects
        .iter()
        .filter(|(_, object)| matches!(object, Object::Stream(stream) if is_image(stream)))
        .map(|(id, _)| *id)
        .collect();
    let images = image_ids.len();
    let mut images_recompressed = 0;

    for (done, id) in image_ids.iter().enumerate() {
        tracker.step(LOADED + (IMAGES_DONE - LOADED) * done as f32 / images as f32)?;
        let Some(Object::Stream(stream)) = doc.objects.get_mut(id) else {
            continue;
        };
        if recompress_jpeg(stream, quality, opts.max_dimension) {
            images_recompressed += 1;
        }
    }
    tracker.step(IMAGES_DONE)?;

    doc.prune_objects();
    doc.compress();
    tracker.step(REPACKED)?;

    let save = SaveOptions::builder()
        .use_object_streams(true)
        .use_xref_streams(true)
        .build();
    let size = write_result(output, &mut tracker, |file| {
        doc.save_with_options(file, save)
    })?;

    Ok(CompressedPdf {
        size,
        images,
        images_recompressed,
    })
}

/// How many pages the PDF at `path` has, for the Files step.
pub fn page_count(path: &Path) -> Result<usize> {
    let original = read_original(path)?;
    if !is_pdf(&original) {
        return Err(ErrorKind::UnsupportedFormat);
    }
    let load = LoadOptions {
        max_decompressed_size: Some(MAX_DECOMPRESSED_BYTES),
        ..Default::default()
    };
    let doc = Document::load_mem_with_options(&original, load).map_err(load_error)?;
    Ok(doc.get_pages().len())
}

/// PDF readers accept the `%PDF-` header anywhere in the first 1024 bytes.
fn is_pdf(bytes: &[u8]) -> bool {
    bytes[..bytes.len().min(1024)]
        .windows(5)
        .any(|window| window == b"%PDF-")
}

fn load_error(err: lopdf::Error) -> ErrorKind {
    match err {
        lopdf::Error::Decryption(_) | lopdf::Error::InvalidPassword => ErrorKind::PasswordProtected,
        _ => ErrorKind::Damaged,
    }
}

fn is_image(stream: &Stream) -> bool {
    matches!(
        stream.dict.get(b"Subtype").and_then(Object::as_name),
        Ok(b"Image")
    )
}

fn recompress_jpeg(stream: &mut Stream, quality: u8, max_dimension: Option<u32>) -> bool {
    match stream.filters() {
        Ok(filters) if filters == [b"DCTDecode".as_slice()] => {}
        _ => return false,
    }

    let gray = match stream.dict.get(b"ColorSpace").and_then(Object::as_name) {
        Ok(b"DeviceRGB") => false,
        Ok(b"DeviceGray") => true,
        _ => return false,
    };
    if stream.dict.has(b"Decode") {
        return false;
    }

    let Ok(img) = ::image::load_from_memory_with_format(&stream.content, RawFormat::Jpeg) else {
        return false;
    };

    let masked = stream.dict.has(b"SMask") || stream.dict.has(b"Mask");
    let img = match max_dimension {
        Some(max) if !masked => fit_within(img, max),
        _ => img,
    };

    let Some(bytes) = encode_jpeg(&img, quality, gray) else {
        return false;
    };
    if bytes.len() >= stream.content.len() {
        return false;
    }

    stream.dict.set("Width", img.width() as i64);
    stream.dict.set("Height", img.height() as i64);
    stream.dict.set("BitsPerComponent", 8);
    stream.dict.remove(b"DecodeParms");
    stream.set_content(bytes);
    true
}

fn encode_jpeg(img: &DynamicImage, quality: u8, gray: bool) -> Option<Vec<u8>> {
    let (raw, color) = if gray {
        (img.to_luma8().into_raw(), ExtendedColorType::L8)
    } else {
        (img.to_rgb8().into_raw(), ExtendedColorType::Rgb8)
    };

    let mut buf = Vec::new();
    JpegEncoder::new_with_quality(&mut buf, quality)
        .write_image(&raw, img.width(), img.height(), color)
        .ok()?;
    Some(buf)
}
