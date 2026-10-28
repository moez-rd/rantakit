mod encode;
pub mod options;
mod resize;
mod target_size;

use std::io::Cursor;

use ::image::{DynamicImage, ImageDecoder, ImageError, ImageFormat as RawFormat, ImageReader};

use crate::error::{Error, Result};
use options::{Compressed, ImageFormat, ImageOptions, OutputFormat, Target};

pub fn compress_image(input: &[u8], opts: &ImageOptions) -> Result<Compressed> {
    let (img, input_format) = decode(input)?;

    let format = match opts.format {
        OutputFormat::Same => input_format,
        OutputFormat::To(f) => f,
    };

    let img = match opts.max_dimension {
        Some(max) => resize::fit_within(img, max),
        None => img,
    };

    let fitted = match opts.target {
        Target::Quality(q) => target_size::Fitted {
            bytes: encode::encode(&img, format, q)?,
            width: img.width(),
            height: img.height(),
            quality: match format {
                ImageFormat::Jpeg => Some(encode::clamp_quality(q)),
                ImageFormat::Png => None,
            },
        },
        Target::MaxBytes(max) => target_size::compress_to_size(&img, format, max)?,
    };

    Ok(Compressed {
        bytes: fitted.bytes,
        format,
        width: fitted.width,
        height: fitted.height,
        quality: fitted.quality,
    })
}

fn decode(input: &[u8]) -> Result<(DynamicImage, ImageFormat)> {
    let reader = ImageReader::new(Cursor::new(input))
        .with_guessed_format()
        .map_err(|e| Error::Decode(ImageError::IoError(e)))?;

    let format = match reader.format() {
        Some(RawFormat::Jpeg) => ImageFormat::Jpeg,
        Some(RawFormat::Png) => ImageFormat::Png,
        _ => return Err(Error::UnsupportedImageFormat),
    };

    let mut decoder = reader.into_decoder().map_err(Error::Decode)?;
    let orientation = decoder.orientation().map_err(Error::Decode)?;

    let mut img = DynamicImage::from_decoder(decoder).map_err(Error::Decode)?;
    img.apply_orientation(orientation);

    Ok((img, format))
}
