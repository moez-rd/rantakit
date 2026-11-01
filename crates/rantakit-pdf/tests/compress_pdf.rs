use std::fs;
use std::path::PathBuf;

use lopdf::{
    Document, EncryptionState, EncryptionVersion, Object, Permissions, Stream, dictionary,
};
use rantakit_pdf::{CancelToken, CompressedPdf, ErrorKind, PdfOptions, Progress, compress_pdf};

const PHOTO: &[u8] = include_bytes!("fixtures/photo.jpg");

/// A one-page PDF that draws `jpeg` (2000x1500) as an image XObject.
fn doc_with_jpeg(jpeg: &[u8], color_space: &str) -> Document {
    let mut doc = Document::with_version("1.5");
    let pages_id = doc.new_object_id();

    let image_id = doc.add_object(Stream::new(
        dictionary! {
            "Type" => "XObject",
            "Subtype" => "Image",
            "Width" => 2000,
            "Height" => 1500,
            "ColorSpace" => color_space,
            "BitsPerComponent" => 8,
            "Filter" => "DCTDecode",
        },
        jpeg.to_vec(),
    ));
    let content_id = doc.add_object(Stream::new(
        dictionary! {},
        b"q 400 0 0 300 0 0 cm /Im0 Do Q".to_vec(),
    ));
    let page_id = doc.add_object(dictionary! {
        "Type" => "Page",
        "Parent" => pages_id,
        "MediaBox" => vec![0.into(), 0.into(), 400.into(), 300.into()],
        "Contents" => content_id,
        "Resources" => dictionary! { "XObject" => dictionary! { "Im0" => image_id } },
    });
    doc.objects.insert(
        pages_id,
        Object::Dictionary(dictionary! {
            "Type" => "Pages",
            "Kids" => vec![page_id.into()],
            "Count" => 1,
        }),
    );
    let catalog_id = doc.add_object(dictionary! { "Type" => "Catalog", "Pages" => pages_id });
    doc.trailer.set("Root", catalog_id);
    doc
}

fn save(mut doc: Document) -> Vec<u8> {
    let mut bytes = Vec::new();
    doc.save_to(&mut bytes).unwrap();
    bytes
}

fn pdf_with_jpeg(jpeg: &[u8], color_space: &str) -> Vec<u8> {
    save(doc_with_jpeg(jpeg, color_space))
}

/// The only image stream in a compressed PDF.
fn only_image(pdf: &[u8]) -> Stream {
    let doc = Document::load_mem(pdf).expect("output should be a readable PDF");
    let mut images = doc.objects.into_values().filter_map(|object| match object {
        Object::Stream(s)
            if matches!(
                s.dict.get(b"Subtype").and_then(Object::as_name),
                Ok(b"Image")
            ) =>
        {
            Some(s)
        }
        _ => None,
    });
    let image = images
        .next()
        .expect("output should still contain the image");
    assert!(
        images.next().is_none(),
        "output should contain exactly one image"
    );
    image
}

fn dimensions(image: &Stream) -> (i64, i64) {
    let get = |key: &[u8]| image.dict.get(key).and_then(Object::as_i64).unwrap();
    (get(b"Width"), get(b"Height"))
}

fn opts(quality: u8, max_dimension: Option<u32>) -> PdfOptions {
    PdfOptions {
        quality,
        max_dimension,
    }
}

/// A fresh, empty folder for one test.
fn scratch(test: &str) -> PathBuf {
    let dir = std::env::temp_dir().join("rantakit-pdf-tests").join(test);
    let _ = fs::remove_dir_all(&dir);
    fs::create_dir_all(&dir).unwrap();
    dir
}

/// Saves `input` as `name`, runs the engine on it, and checks that the
/// Original is untouched and that nothing but a finished Result was added.
fn run(
    test: &str,
    name: &str,
    input: &[u8],
    opts: &PdfOptions,
    progress: &mut dyn FnMut(Progress),
    cancel: &CancelToken,
) -> (rantakit_pdf::Result<CompressedPdf>, Option<Vec<u8>>) {
    let dir = scratch(test);
    let original = dir.join(name);
    fs::write(&original, input).unwrap();
    let output = dir.join("result.pdf");

    let outcome = compress_pdf(&original, &output, opts, progress, cancel);

    assert_eq!(
        fs::read(&original).unwrap(),
        input,
        "the Original must stay untouched"
    );
    let result = fs::read(&output).ok();
    assert_eq!(
        fs::read_dir(&dir).unwrap().count(),
        1 + result.is_some() as usize,
        "nothing but the Result may be left behind"
    );
    (outcome, result)
}

/// A run that must succeed; returns what the engine reported and the Result.
fn compress(test: &str, name: &str, input: &[u8], opts: &PdfOptions) -> (CompressedPdf, Vec<u8>) {
    let (outcome, result) = run(test, name, input, opts, &mut |_| {}, &CancelToken::new());
    let out = outcome.unwrap();
    let bytes = result.expect("a Result should be written");
    assert_eq!(out.size, bytes.len() as u64);
    (out, bytes)
}

/// A run that must fail; returns its error kind.
fn fail(test: &str, input: &[u8]) -> ErrorKind {
    let (outcome, result) = run(
        test,
        "ijazah.pdf",
        input,
        &opts(80, None),
        &mut |_| {},
        &CancelToken::new(),
    );
    assert!(result.is_none(), "a failed file must not leave a Result");
    outcome.unwrap_err()
}

#[test]
fn recompresses_jpeg_images_smaller() {
    let input = pdf_with_jpeg(PHOTO, "DeviceRGB");

    let (out, bytes) = compress("recompresses", "ijazah.pdf", &input, &opts(40, None));

    assert_eq!(out.images, 1);
    assert_eq!(out.images_recompressed, 1);
    assert!(
        bytes.len() < input.len(),
        "expected smaller output, got {} from {} bytes",
        bytes.len(),
        input.len()
    );
    let image = only_image(&bytes);
    assert_eq!(dimensions(&image), (2000, 1500));
    assert!(
        ::image::load_from_memory(&image.content).is_ok(),
        "image should still be a valid JPEG"
    );
}

#[test]
fn downscales_images_to_max_dimension() {
    let input = pdf_with_jpeg(PHOTO, "DeviceRGB");

    let (_, bytes) = compress("downscales", "ijazah.pdf", &input, &opts(80, Some(1000)));

    assert_eq!(dimensions(&only_image(&bytes)), (1000, 750));
}

#[test]
fn leaves_cmyk_images_untouched() {
    let input = pdf_with_jpeg(PHOTO, "DeviceCMYK");

    let (out, bytes) = compress("cmyk", "ijazah.pdf", &input, &opts(40, Some(1000)));

    assert_eq!(out.images, 1);
    assert_eq!(out.images_recompressed, 0);
    let image = only_image(&bytes);
    assert_eq!(image.content, PHOTO);
    assert_eq!(dimensions(&image), (2000, 1500));
}

#[test]
fn kind_comes_from_content_not_extension() {
    let input = pdf_with_jpeg(PHOTO, "DeviceRGB");

    let (out, _) = compress("content_not_extension", "scan.jpg", &input, &opts(40, None));

    assert_eq!(out.images, 1);
}

#[test]
fn input_that_is_not_a_pdf_is_unsupported() {
    assert_eq!(fail("not_a_pdf", PHOTO), ErrorKind::UnsupportedFormat);
}

#[test]
fn broken_pdf_is_damaged() {
    let input = b"%PDF-1.5\nthis file was cut off before its first object";

    assert_eq!(fail("broken_pdf", input), ErrorKind::Damaged);
}

#[test]
fn password_protected_pdf_is_reported() {
    let mut doc = doc_with_jpeg(PHOTO, "DeviceRGB");
    // Encryption needs the trailer's file ID.
    doc.trailer.set(
        "ID",
        Object::Array(vec![
            Object::string_literal(b"0123456789abcdef"),
            Object::string_literal(b"fedcba9876543210"),
        ]),
    );
    let state = EncryptionState::try_from(EncryptionVersion::V2 {
        document: &doc,
        owner_password: "owner",
        user_password: "secret",
        key_length: 128,
        permissions: Permissions::all(),
    })
    .unwrap();
    doc.encrypt(&state).unwrap();

    assert_eq!(fail("password", &save(doc)), ErrorKind::PasswordProtected);
}

#[test]
fn missing_original_is_reported() {
    let dir = scratch("missing_original");

    let outcome = compress_pdf(
        &dir.join("gone.pdf"),
        &dir.join("result.pdf"),
        &opts(80, None),
        &mut |_| {},
        &CancelToken::new(),
    );

    assert_eq!(outcome.unwrap_err(), ErrorKind::OriginalMissing);
}

#[test]
fn progress_goes_up_and_ends_at_one() {
    let input = pdf_with_jpeg(PHOTO, "DeviceRGB");
    let mut seen = Vec::new();

    let (outcome, _) = run(
        "progress",
        "ijazah.pdf",
        &input,
        &opts(40, None),
        &mut |p| seen.push(p),
        &CancelToken::new(),
    );
    outcome.unwrap();

    let fractions: Vec<f32> = seen
        .iter()
        .map(|p| match p {
            Progress::Fraction(f) => *f,
            other => panic!("expected a fraction, got {other:?}"),
        })
        .collect();
    assert!(
        fractions.windows(2).all(|w| w[0] <= w[1]),
        "got {fractions:?}"
    );
    assert_eq!(fractions.last(), Some(&1.0));
}

#[test]
fn cancel_while_working_leaves_nothing() {
    let input = pdf_with_jpeg(PHOTO, "DeviceRGB");
    let cancel = CancelToken::new();
    let mut steps_after_cancel = 0;
    let mut progress = |_| {
        if cancel.is_cancelled() {
            steps_after_cancel += 1;
        }
        // Cancel as soon as the PDF is loaded.
        cancel.cancel();
    };

    let (outcome, result) = run(
        "cancel",
        "ijazah.pdf",
        &input,
        &opts(40, None),
        &mut progress,
        &cancel,
    );

    assert_eq!(outcome.unwrap_err(), ErrorKind::Cancelled);
    assert!(result.is_none());
    assert_eq!(steps_after_cancel, 0, "no step may run after cancelling");
}
