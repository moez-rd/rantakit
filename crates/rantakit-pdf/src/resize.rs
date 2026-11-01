use ::image::DynamicImage;
use ::image::imageops::FilterType;

/// Same rule as `rantakit-image`, kept here so the PDF engine does not depend on it.
pub(crate) fn fit_within(img: DynamicImage, max: u32) -> DynamicImage {
    let longest = img.width().max(img.height());

    if max == 0 || longest <= max {
        return img;
    }

    img.resize(max, max, FilterType::Lanczos3)
}
