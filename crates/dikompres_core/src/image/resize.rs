use ::image::DynamicImage;
use ::image::imageops::FilterType;

pub(crate) fn fit_within(img: DynamicImage, max: u32) -> DynamicImage {
    let longest = img.width().max(img.height());

    if max == 0 || longest <= max {
        return img;
    }

    img.resize(max, max, FilterType::Lanczos3)
}

pub(crate) fn scale_by(img: &DynamicImage, factor: f32) -> DynamicImage {
    let width = ((img.width() as f32) * factor).round().max(1.0) as u32;
    let height = ((img.height() as f32) * factor).round().max(1.0) as u32;

    img.resize_exact(width, height, FilterType::Lanczos3)
}
