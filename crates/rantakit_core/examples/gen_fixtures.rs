//! Generate synthetic test images in `tests/fixtures/`.
//!
//! Run from the workspace root:
//!     cargo run -p rantakit_core --example gen_fixtures

use std::fs;
use std::path::Path;

use ::image::codecs::jpeg::JpegEncoder;
use ::image::{ExtendedColorType, ImageEncoder, Rgb, RgbImage, Rgba, RgbaImage};

fn main() {
    let dir = Path::new(env!("CARGO_MANIFEST_DIR")).join("tests/fixtures");
    fs::create_dir_all(&dir).unwrap();

    let photo = photo_like(2000, 1500);
    fs::write(dir.join("photo.jpg"), jpeg(&photo, 92)).unwrap();

    transparent(512, 512).save(dir.join("transparent.png")).unwrap();

    // 300x200 landscape, stored with EXIF orientation 6 (rotate 90° clockwise).
    // After applying orientation it must become 200x300, red corner at top-right.
    let rotated = marker(300, 200);
    fs::write(dir.join("rotated_exif6.jpg"), with_orientation(jpeg(&rotated, 90), 6)).unwrap();

    for name in ["photo.jpg", "transparent.png", "rotated_exif6.jpg"] {
        let size = fs::metadata(dir.join(name)).unwrap().len();
        println!("{name}: {} KB", size / 1024);
    }
}

/// Smooth gradients plus fine noise, so it compresses like a real photo.
fn photo_like(width: u32, height: u32) -> RgbImage {
    let mut rng = XorShift(0x2545_F491_4F6C_DD1D);
    RgbImage::from_fn(width, height, |x, y| {
        let fx = x as f32 / width as f32;
        let fy = y as f32 / height as f32;
        let wave = ((fx * 18.0).sin() * (fy * 11.0).cos() + 1.0) * 0.5;
        let mut noise = || (rng.next() % 41) as f32 - 20.0;
        let channel = |base: f32, n: f32| (base * 255.0 + n).clamp(0.0, 255.0) as u8;
        Rgb([
            channel(0.25 + 0.6 * fx * wave, noise()),
            channel(0.35 + 0.5 * fy, noise()),
            channel(0.85 - 0.5 * fx * fy, noise()),
        ])
    })
}

/// Transparent background, opaque blue circle, half-transparent orange ring.
fn transparent(width: u32, height: u32) -> RgbaImage {
    let (cx, cy) = (width as f32 / 2.0, height as f32 / 2.0);
    RgbaImage::from_fn(width, height, |x, y| {
        let d = ((x as f32 - cx).powi(2) + (y as f32 - cy).powi(2)).sqrt();
        match d {
            d if d < 120.0 => Rgba([37, 99, 235, 255]),
            d if d < 180.0 => Rgba([249, 115, 22, 128]),
            _ => Rgba([0, 0, 0, 0]),
        }
    })
}

/// Grey image with a red 40x40 square in the top-left corner.
fn marker(width: u32, height: u32) -> RgbImage {
    RgbImage::from_fn(width, height, |x, y| {
        if x < 40 && y < 40 { Rgb([220, 20, 20]) } else { Rgb([128, 128, 128]) }
    })
}

fn jpeg(img: &RgbImage, quality: u8) -> Vec<u8> {
    let mut buf = Vec::new();
    JpegEncoder::new_with_quality(&mut buf, quality)
        .write_image(img.as_raw(), img.width(), img.height(), ExtendedColorType::Rgb8)
        .unwrap();
    buf
}

/// Insert a minimal EXIF APP1 segment holding only the Orientation tag.
fn with_orientation(jpeg: Vec<u8>, orientation: u8) -> Vec<u8> {
    #[rustfmt::skip]
    let app1 = [
        0xFF, 0xE1, 0x00, 0x22,             // APP1 marker, length 34
        b'E', b'x', b'i', b'f', 0, 0,       // "Exif\0\0"
        b'I', b'I', 0x2A, 0x00,             // TIFF header, little-endian
        0x08, 0x00, 0x00, 0x00,             // offset to first IFD
        0x01, 0x00,                         // 1 entry
        0x12, 0x01, 0x03, 0x00,             // tag 0x0112 Orientation, type SHORT
        0x01, 0x00, 0x00, 0x00,             // count 1
        orientation, 0x00, 0x00, 0x00,      // value
        0x00, 0x00, 0x00, 0x00,             // no next IFD
    ];
    let mut out = Vec::with_capacity(jpeg.len() + app1.len());
    out.extend_from_slice(&jpeg[..2]); // SOI
    out.extend_from_slice(&app1);
    out.extend_from_slice(&jpeg[2..]);
    out
}

struct XorShift(u64);

impl XorShift {
    fn next(&mut self) -> u64 {
        self.0 ^= self.0 << 13;
        self.0 ^= self.0 >> 7;
        self.0 ^= self.0 << 17;
        self.0
    }
}
