use rantakit_pdf::{Error, PdfOptions, compress_pdf};
use lopdf::{Document, Object, Stream, dictionary};

const PHOTO: &[u8] = include_bytes!("fixtures/photo.jpg");

/// A one-page PDF that draws `jpeg` (2000x1500) as an image XObject.
fn pdf_with_jpeg(jpeg: &[u8], color_space: &str) -> Vec<u8> {
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

    let mut bytes = Vec::new();
    doc.save_to(&mut bytes).unwrap();
    bytes
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

#[test]
fn recompresses_jpeg_images_smaller() {
    let input = pdf_with_jpeg(PHOTO, "DeviceRGB");
    let opts = PdfOptions {
        quality: 40,
        max_dimension: None,
    };

    let out = compress_pdf(&input, &opts).unwrap();

    assert_eq!(out.images, 1);
    assert_eq!(out.images_recompressed, 1);
    assert!(
        out.bytes.len() < input.len(),
        "expected smaller output, got {} from {} bytes",
        out.bytes.len(),
        input.len()
    );
    let image = only_image(&out.bytes);
    assert_eq!(dimensions(&image), (2000, 1500));
    assert!(
        ::image::load_from_memory(&image.content).is_ok(),
        "image should still be a valid JPEG"
    );
}

#[test]
fn downscales_images_to_max_dimension() {
    let input = pdf_with_jpeg(PHOTO, "DeviceRGB");
    let opts = PdfOptions {
        quality: 80,
        max_dimension: Some(1000),
    };

    let out = compress_pdf(&input, &opts).unwrap();

    assert_eq!(dimensions(&only_image(&out.bytes)), (1000, 750));
}

#[test]
fn leaves_cmyk_images_untouched() {
    let input = pdf_with_jpeg(PHOTO, "DeviceCMYK");
    let opts = PdfOptions {
        quality: 40,
        max_dimension: Some(1000),
    };

    let out = compress_pdf(&input, &opts).unwrap();

    assert_eq!(out.images, 1);
    assert_eq!(out.images_recompressed, 0);
    let image = only_image(&out.bytes);
    assert_eq!(image.content, PHOTO);
    assert_eq!(dimensions(&image), (2000, 1500));
}

#[test]
fn rejects_input_that_is_not_a_pdf() {
    let opts = PdfOptions {
        quality: 80,
        max_dimension: None,
    };

    let result = compress_pdf(b"definitely not a pdf", &opts);

    assert!(matches!(result, Err(Error::PdfLoad(_))), "got {result:?}");
}
