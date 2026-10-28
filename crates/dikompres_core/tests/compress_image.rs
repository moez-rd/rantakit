use dikompres_core::{Error, ImageFormat, ImageOptions, OutputFormat, Target, compress_image};

const PHOTO: &[u8] = include_bytes!("fixtures/photo.jpg");
const TRANSPARENT: &[u8] = include_bytes!("fixtures/transparent.png");
const ROTATED: &[u8] = include_bytes!("fixtures/rotated_exif6.jpg");

fn opts(format: OutputFormat, quality: u8, max_dimension: Option<u32>) -> ImageOptions {
    ImageOptions {
        format,
        target: Target::Quality(quality),
        max_dimension,
    }
}

#[test]
fn jpeg_quality_produces_smaller_decodable_jpeg() {
    let out = compress_image(PHOTO, &opts(OutputFormat::Same, 70, None)).unwrap();

    assert_eq!(out.format, ImageFormat::Jpeg);
    assert!(!out.bytes.is_empty());
    assert!(
        out.bytes.len() < PHOTO.len(),
        "output must be smaller than input"
    );

    let decoded = ::image::load_from_memory(&out.bytes).unwrap();
    assert_eq!(decoded.width(), out.width);
    assert_eq!(decoded.height(), out.height);
}

#[test]
fn max_dimension_limits_longest_side_and_keeps_ratio() {
    let out = compress_image(PHOTO, &opts(OutputFormat::Same, 80, Some(800))).unwrap();

    // original 2000x1500 (4:3) -> 800x600
    assert_eq!((out.width, out.height), (800, 600));
}

#[test]
fn small_image_is_not_upscaled() {
    let out = compress_image(TRANSPARENT, &opts(OutputFormat::Same, 80, Some(4000))).unwrap();

    assert_eq!((out.width, out.height), (512, 512));
}

#[test]
fn exif_orientation_is_applied() {
    let out = compress_image(ROTATED, &opts(OutputFormat::Same, 90, None)).unwrap();

    // stored as 300x200 with orientation 6 -> displayed as 200x300
    assert_eq!((out.width, out.height), (200, 300));

    // the red square moves from top-left to top-right
    let img = ::image::load_from_memory(&out.bytes).unwrap().to_rgb8();
    let [r, g, b] = img.get_pixel(out.width - 5, 5).0;
    assert!(
        r > 180 && g < 80 && b < 80,
        "top-right corner should be red, got {:?}",
        (r, g, b)
    );
}

#[test]
fn transparent_png_to_jpeg_gets_white_background() {
    let out = compress_image(
        TRANSPARENT,
        &opts(OutputFormat::To(ImageFormat::Jpeg), 90, None),
    )
    .unwrap();

    assert_eq!(out.format, ImageFormat::Jpeg);

    let img = ::image::load_from_memory(&out.bytes).unwrap().to_rgb8();
    let [r, g, b] = img.get_pixel(2, 2).0;
    // JPEG is lossy: allow a small tolerance instead of exact 255
    assert!(
        r > 245 && g > 245 && b > 245,
        "corner should be white, got {:?}",
        (r, g, b)
    );
}

#[test]
fn png_stays_png_and_reports_no_quality() {
    let out = compress_image(TRANSPARENT, &opts(OutputFormat::Same, 70, None)).unwrap();

    assert_eq!(out.format, ImageFormat::Png);
    assert_eq!(
        out.quality, None,
        "PNG is lossless and has no quality setting"
    );
}

#[test]
fn quality_is_clamped_and_reported() {
    let high = compress_image(PHOTO, &opts(OutputFormat::Same, 150, Some(400))).unwrap();
    assert_eq!(high.quality, Some(100));

    let zero = compress_image(PHOTO, &opts(OutputFormat::Same, 0, Some(400))).unwrap();
    assert_eq!(zero.quality, Some(1));
}

#[test]
fn non_image_input_is_rejected() {
    let result = compress_image(b"this is not an image", &opts(OutputFormat::Same, 80, None));

    assert!(matches!(result, Err(Error::UnsupportedImageFormat)));
}

fn max_bytes(format: OutputFormat, max: u64) -> ImageOptions {
    ImageOptions {
        format,
        target: Target::MaxBytes(max),
        max_dimension: None,
    }
}

#[test]
fn max_bytes_output_fits_target() {
    let out = compress_image(PHOTO, &max_bytes(OutputFormat::Same, 200_000)).unwrap();

    assert!(out.bytes.len() <= 200_000, "got {} bytes", out.bytes.len());
    assert!(out.quality.is_some());
}

#[test]
fn generous_target_uses_max_quality_and_full_size() {
    let out = compress_image(PHOTO, &max_bytes(OutputFormat::Same, 50_000_000)).unwrap();

    assert_eq!(out.quality, Some(95));
    assert_eq!((out.width, out.height), (2000, 1500));
}

#[test]
fn png_target_forces_downscale() {
    // A noisy photo saved as PNG is ~6.8 MB at full size, so 2 MB requires downscaling.
    let out = compress_image(
        PHOTO,
        &max_bytes(OutputFormat::To(ImageFormat::Png), 2_000_000),
    )
    .unwrap();

    assert_eq!(out.format, ImageFormat::Png);
    assert!(
        out.bytes.len() <= 2_000_000,
        "got {} bytes",
        out.bytes.len()
    );
    assert!(out.width < 2000, "PNG can only shrink by downscaling");
    assert_eq!(out.quality, None);
}

#[test]
fn impossible_target_reports_smallest_size() {
    let result = compress_image(PHOTO, &max_bytes(OutputFormat::Same, 1_000));

    match result {
        Err(Error::TargetUnreachable {
            target_bytes,
            smallest_bytes,
        }) => {
            assert_eq!(target_bytes, 1_000);
            assert!(smallest_bytes > 1_000);
        }
        other => panic!("expected TargetUnreachable, got {other:?}"),
    }
}

#[test]
fn flat_png_below_minimum_is_unreachable() {
    let result = compress_image(TRANSPARENT, &max_bytes(OutputFormat::Same, 3_000));

    assert!(matches!(result, Err(Error::TargetUnreachable { .. })));
}
