use ::image::codecs::jpeg::JpegEncoder;
use ::image::codecs::png::{CompressionType, FilterType as PngFilter, PngEncoder};
use ::image::{DynamicImage, ExtendedColorType, ImageEncoder, Rgb, RgbImage};
use rantakit_core::{ErrorKind, Result};

use crate::options::{ImageFormat, WHITE};

pub(crate) fn clamp_quality(quality: u8) -> u8 {
    quality.clamp(1, 100)
}

pub(crate) fn encode(img: &DynamicImage, format: ImageFormat, quality: u8) -> Result<Vec<u8>> {
    match format {
        ImageFormat::Jpeg => encode_jpeg(img, clamp_quality(quality)),
        ImageFormat::Png => encode_png(img),
    }
}

fn encode_jpeg(img: &DynamicImage, quality: u8) -> Result<Vec<u8>> {
    let rgb = if img.color().has_alpha() {
        flatten_on(img, WHITE)
    } else {
        img.to_rgb8()
    };

    let mut buf = Vec::new();
    JpegEncoder::new_with_quality(&mut buf, quality)
        .write_image(
            rgb.as_raw(),
            rgb.width(),
            rgb.height(),
            ExtendedColorType::Rgb8,
        )
        .map_err(|_| ErrorKind::Damaged)?;

    Ok(buf)
}

fn encode_png(img: &DynamicImage) -> Result<Vec<u8>> {
    let mut buf = Vec::new();
    let encoder =
        PngEncoder::new_with_quality(&mut buf, CompressionType::Best, PngFilter::Adaptive);

    img.write_with_encoder(encoder)
        .map_err(|_| ErrorKind::Damaged)?;

    Ok(buf)
}

/// The image over a solid `background`, without transparency.
pub(crate) fn flatten_on(img: &DynamicImage, background: [u8; 3]) -> RgbImage {
    let rgba = img.to_rgba8();
    let mut out = RgbImage::new(rgba.width(), rgba.height());

    for (x, y, pixel) in rgba.enumerate_pixels() {
        let [r, g, b, a] = pixel.0;
        let a = a as u16;
        let blend = |c: u8, bg: u8| ((c as u16 * a + bg as u16 * (255 - a)) / 255) as u8;
        let [br, bgreen, bb] = background;
        out.put_pixel(x, y, Rgb([blend(r, br), blend(g, bgreen), blend(b, bb)]));
    }

    out
}
