use ::image::DynamicImage;

use crate::encode::encode;
use crate::options::ImageFormat;
use crate::resize::scale_by;
use crate::error::{Error, Result};

const MIN_QUALITY: u8 = 10;
const MAX_QUALITY: u8 = 95;
const SCALE_STEP: f32 = 0.85;
const MIN_SIDE: u32 = 320;

pub(crate) struct Fitted {
    pub bytes: Vec<u8>,
    pub width: u32,
    pub height: u32,
    pub quality: Option<u8>,
}

pub(crate) fn compress_to_size(
    img: &DynamicImage,
    format: ImageFormat,
    max_bytes: u64,
) -> Result<Fitted> {
    let mut factor: f32 = 1.0;
    let mut smallest = u64::MAX;

    loop {
        let scaled;
        let current = if factor < 1.0 {
            scaled = scale_by(img, factor);
            &scaled
        } else {
            img
        };

        let found = match format {
            ImageFormat::Jpeg => search_jpeg(current, max_bytes, &mut smallest)?,
            ImageFormat::Png => try_png(current, max_bytes, &mut smallest)?,
        };

        if let Some((bytes, quality)) = found {
            return Ok(Fitted {
                bytes,
                width: current.width(),
                height: current.height(),
                quality,
            });
        }

        let longest = current.width().max(current.height());
        if (longest as f32 * SCALE_STEP) < MIN_SIDE as f32 {
            return Err(Error::TargetUnreachable {
                target_bytes: max_bytes,
                smallest_bytes: smallest,
            });
        }

        factor *= SCALE_STEP;
    }
}

fn search_jpeg(
    img: &DynamicImage,
    max_bytes: u64,
    smallest: &mut u64,
) -> Result<Option<(Vec<u8>, Option<u8>)>> {
    let floor = encode(img, ImageFormat::Jpeg, MIN_QUALITY)?;
    *smallest = (*smallest).min(floor.len() as u64);
    if floor.len() as u64 > max_bytes {
        return Ok(None);
    }

    let mut best = (floor, MIN_QUALITY);
    let (mut lo, mut hi) = (MIN_QUALITY + 1, MAX_QUALITY);

    while lo <= hi {
        let q = lo + (hi - lo) / 2;
        let bytes = encode(img, ImageFormat::Jpeg, q)?;

        if bytes.len() as u64 <= max_bytes {
            best = (bytes, q);
            lo = q + 1;
        } else {
            hi = q - 1;
        }
    }

    Ok(Some((best.0, Some(best.1))))
}

fn try_png(
    img: &DynamicImage,
    max_bytes: u64,
    smallest: &mut u64,
) -> Result<Option<(Vec<u8>, Option<u8>)>> {
    let bytes = encode(img, ImageFormat::Png, 0)?;
    *smallest = (*smallest).min(bytes.len() as u64);

    Ok((bytes.len() as u64 <= max_bytes).then_some((bytes, None)))
}
