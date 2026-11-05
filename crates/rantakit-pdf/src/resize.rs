use std::borrow::Cow;

use ::image::DynamicImage;
use ::image::imageops::FilterType;

/// Same rule as `rantakit-image`, kept here so the PDF engine does not depend on it.
/// Borrows the image when it already fits, so nothing is copied.
pub(crate) fn fit_within(img: &DynamicImage, max: u32) -> Cow<'_, DynamicImage> {
    let longest = img.width().max(img.height());

    if max == 0 || longest <= max {
        return Cow::Borrowed(img);
    }

    Cow::Owned(img.resize(max, max, FilterType::Lanczos3))
}
