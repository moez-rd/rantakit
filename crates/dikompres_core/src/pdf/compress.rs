use ::image::codecs::jpeg::JpegEncoder;
use ::image::{DynamicImage, ExtendedColorType, ImageEncoder, ImageFormat as RawFormat};
use lopdf::{Document, LoadOptions, Object, SaveOptions, Stream};

use crate::error::{Error, Result};
use crate::image::resize::fit_within;

const MAX_DECOMPRESSED_BYTES: usize = 256 * 1024 * 1024;

#[derive(Debug, Clone)]
pub struct PdfOptions {
    pub quality: u8,
    pub max_dimension: Option<u32>,
}

#[derive(Debug, Clone)]
pub struct CompressedPdf {
    pub bytes: Vec<u8>,
    pub images: usize,
    pub images_recompressed: usize,
}

pub fn compress_pdf(input: &[u8], opts: &PdfOptions) -> Result<CompressedPdf> {
    let load = LoadOptions {
        max_decompressed_size: Some(MAX_DECOMPRESSED_BYTES),
        ..Default::default()
    };
    let mut doc = Document::load_mem_with_options(input, load).map_err(Error::PdfLoad)?;

    if doc.was_encrypted() || doc.is_encrypted() {
        return Err(Error::EncryptedPdf);
    }

    let quality = opts.quality.clamp(1, 100);
    let mut images = 0;
    let mut images_recompressed = 0;

    for object in doc.objects.values_mut() {
        let Object::Stream(stream) = object else {
            continue;
        };
        if !is_image(stream) {
            continue;
        }
        images += 1;
        if recompress_jpeg(stream, quality, opts.max_dimension) {
            images_recompressed += 1;
        }
    }

    doc.prune_objects();
    doc.compress();

    let mut bytes = Vec::new();
    let save = SaveOptions::builder()
        .use_object_streams(true)
        .use_xref_streams(true)
        .build();
    doc.save_with_options(&mut bytes, save)
        .map_err(Error::PdfSave)?;

    Ok(CompressedPdf {
        bytes,
        images,
        images_recompressed,
    })
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
