use ::image::codecs::jpeg::JpegEncoder;
use ::image::codecs::png::{CompressionType, FilterType as PngFilter, PngEncoder};
use ::image::{DynamicImage, ExtendedColorType, ImageEncoder, Rgb, RgbImage};

use super::options::ImageFormat;
use crate::error::{Error, Result};

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
        flatten_on_white(img)
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
        .map_err(Error::Encode)?;

    Ok(buf)
}

fn encode_png(img: &DynamicImage) -> Result<Vec<u8>> {
    let mut buf = Vec::new();
    let encoder =
        PngEncoder::new_with_quality(&mut buf, CompressionType::Best, PngFilter::Adaptive);

    img.write_with_encoder(encoder).map_err(Error::Encode)?;

    Ok(buf)
}

fn flatten_on_white(img: &DynamicImage) -> RgbImage {
    let rgba = img.to_rgba8();
    let mut out = RgbImage::new(rgba.width(), rgba.height());

    for (x, y, pixel) in rgba.enumerate_pixels() {
        let [r, g, b, a] = pixel.0;
        let a = a as u16;
        let blend = |c: u8| ((c as u16 * a + 255 * (255 - a)) / 255) as u8;
        out.put_pixel(x, y, Rgb([blend(r), blend(g), blend(b)]));
    }

    out
}
