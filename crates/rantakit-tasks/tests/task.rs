use std::fs;
use std::path::{Path, PathBuf};

use ::image::codecs::jpeg::JpegEncoder;
use ::image::{ExtendedColorType, ImageEncoder, Rgb, RgbImage};
use lopdf::{Document, Object, Stream, dictionary};
use rantakit_tasks::{
    Availability, CATALOGUE, CancelToken, Details, ErrorKind, FileOutcome, ImageFormat,
    ImageOptions, OutputFormat, PdfOptions, Platform, Target, Task, TaskEvent, ToolId, ToolOptions,
    detect_kind, run_task, tools_for_files,
};

/// A noisy 600x400 photo, so compressing it really makes it smaller.
fn photo_jpg() -> Vec<u8> {
    let mut seed = 7u32;
    let img = RgbImage::from_fn(600, 400, |x, y| {
        seed = seed.wrapping_mul(1_103_515_245).wrapping_add(12_345);
        let noise = (seed >> 24) as u8 / 4;
        Rgb([(x / 4) as u8 + noise, (y / 3) as u8 + noise, 128 + noise])
    });
    let mut bytes = Vec::new();
    JpegEncoder::new_with_quality(&mut bytes, 95)
        .write_image(img.as_raw(), 600, 400, ExtendedColorType::Rgb8)
        .unwrap();
    bytes
}

/// A one-page PDF that draws `photo_jpg` as an image.
fn scan_pdf() -> Vec<u8> {
    let mut doc = Document::with_version("1.5");
    let pages_id = doc.new_object_id();
    let image_id = doc.add_object(Stream::new(
        dictionary! {
            "Type" => "XObject",
            "Subtype" => "Image",
            "Width" => 600,
            "Height" => 400,
            "ColorSpace" => "DeviceRGB",
            "BitsPerComponent" => 8,
            "Filter" => "DCTDecode",
        },
        photo_jpg(),
    ));
    let content_id = doc.add_object(Stream::new(
        dictionary! {},
        b"q 600 0 0 400 0 0 cm /Im0 Do Q".to_vec(),
    ));
    let page_id = doc.add_object(dictionary! {
        "Type" => "Page",
        "Parent" => pages_id,
        "MediaBox" => vec![0.into(), 0.into(), 600.into(), 400.into()],
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

fn kompres_foto(target: Target) -> ToolOptions {
    ToolOptions::KompresFoto(ImageOptions {
        format: OutputFormat::Same,
        target,
        max_dimension: None,
    })
}

fn kompres_pdf() -> ToolOptions {
    ToolOptions::KompresPdf(PdfOptions {
        quality: 50,
        max_dimension: None,
    })
}

/// An Original each Tool accepts. The match has no catch-all, so a new Tool
/// does not compile until it gets a fixture and is covered by the tests below.
fn original_for(tool: &ToolOptions) -> (&'static str, Vec<u8>) {
    match tool {
        ToolOptions::KompresFoto(_) => ("foto.jpg", photo_jpg()),
        ToolOptions::KompresPdf(_) => ("ijazah.pdf", scan_pdf()),
    }
}

/// Every Tool, with the options that exercise its different paths.
fn every_tool() -> Vec<ToolOptions> {
    vec![
        kompres_foto(Target::Quality(60)),
        kompres_foto(Target::MaxBytes(20_000)),
        ToolOptions::KompresFoto(ImageOptions {
            format: OutputFormat::To(ImageFormat::Png),
            target: Target::Quality(80),
            max_dimension: Some(300),
        }),
        kompres_pdf(),
    ]
}

/// A fresh, empty folder for one test.
fn scratch(test: &str) -> PathBuf {
    let dir = std::env::temp_dir().join("rantakit-tasks-tests").join(test);
    let _ = fs::remove_dir_all(&dir);
    fs::create_dir_all(&dir).unwrap();
    dir
}

fn task(tool: ToolOptions, originals: Vec<PathBuf>) -> Task {
    Task {
        tool,
        originals,
        results_folder: None,
    }
}

fn run(task: &Task) -> Vec<FileOutcome> {
    run_task(task, &mut |_| {}, &CancelToken::new())
}

fn file_names(dir: &Path) -> Vec<String> {
    let mut names: Vec<_> = fs::read_dir(dir)
        .unwrap()
        .map(|e| e.unwrap().file_name().to_string_lossy().into_owned())
        .collect();
    names.sort();
    names
}

#[test]
fn the_original_is_never_modified_moved_or_overwritten() {
    for (n, tool) in every_tool().into_iter().enumerate() {
        let dir = scratch(&format!("original_untouched_{n}"));
        let (name, bytes) = original_for(&tool);
        let original = dir.join(name);
        fs::write(&original, &bytes).unwrap();
        let modified = fs::metadata(&original).unwrap().modified().unwrap();

        // Twice, so the second Result has to find a free name next to the first.
        for _ in 0..2 {
            let outcomes = run(&task(tool.clone(), vec![original.clone()]));
            let result = outcomes[0].as_ref().unwrap();
            assert_ne!(result.path, original);
        }

        assert_eq!(
            fs::read(&original).unwrap(),
            bytes,
            "{tool:?} changed the Original"
        );
        assert_eq!(
            fs::metadata(&original).unwrap().modified().unwrap(),
            modified,
            "{tool:?} touched the Original"
        );
        assert_eq!(file_names(&dir).len(), 3, "the Original and two Results");
    }
}

#[test]
fn results_get_new_names_next_to_the_original() {
    let dir = scratch("names");
    let foto = dir.join("foto.jpeg");
    fs::write(&foto, photo_jpg()).unwrap();
    let ijazah = dir.join("ijazah.pdf");
    fs::write(&ijazah, scan_pdf()).unwrap();

    let photos = task(kompres_foto(Target::Quality(60)), vec![foto]);
    let first = run(&photos).remove(0).unwrap();
    let second = run(&photos).remove(0).unwrap();
    let pdf = run(&task(kompres_pdf(), vec![ijazah])).remove(0).unwrap();

    assert_eq!(first.path, dir.join("foto (compressed).jpg"));
    assert_eq!(second.path, dir.join("foto (compressed) (2).jpg"));
    assert_eq!(pdf.path, dir.join("ijazah (compressed).pdf"));
    assert!(matches!(pdf.details, Details::Pdf { images: 1, .. }));
}

#[test]
fn a_failed_file_does_not_stop_the_others() {
    let dir = scratch("failed_file");
    let good = dir.join("a.jpg");
    let broken = dir.join("b.jpg");
    let missing = dir.join("c.jpg");
    let also_good = dir.join("d.jpg");
    fs::write(&good, photo_jpg()).unwrap();
    fs::write(&broken, b"not a photo").unwrap();
    fs::write(&also_good, photo_jpg()).unwrap();

    let mut done = Vec::new();
    let outcomes = run_task(
        &task(
            kompres_foto(Target::Quality(60)),
            vec![good, broken, missing, also_good],
        ),
        &mut |event| {
            if let TaskEvent::FileDone { file, .. } = event {
                done.push(file);
            }
        },
        &CancelToken::new(),
    );

    assert!(outcomes[0].is_ok());
    assert_eq!(outcomes[1], Err(ErrorKind::UnsupportedFormat));
    assert_eq!(outcomes[2], Err(ErrorKind::OriginalMissing));
    assert!(outcomes[3].is_ok());
    assert_eq!(
        done,
        [0, 1, 2, 3],
        "every file reports how it ended, in order"
    );
}

#[test]
fn results_go_into_the_chosen_folder() {
    let dir = scratch("results_folder");
    let chosen = dir.join("Hasil");
    fs::create_dir_all(&chosen).unwrap();
    let foto = dir.join("foto.jpg");
    fs::write(&foto, photo_jpg()).unwrap();

    let outcomes = run(&Task {
        tool: kompres_foto(Target::Quality(60)),
        originals: vec![foto],
        results_folder: Some(chosen.clone()),
    });

    assert_eq!(
        outcomes[0].as_ref().unwrap().path,
        chosen.join("foto (compressed).jpg")
    );
    assert_eq!(file_names(&dir), ["Hasil", "foto.jpg"]);
}

#[test]
fn a_folder_that_cannot_be_written_to_ends_with_cannot_write() {
    let dir = scratch("cannot_write");
    let foto = dir.join("foto.jpg");
    fs::write(&foto, photo_jpg()).unwrap();

    let outcomes = run(&Task {
        tool: kompres_foto(Target::Quality(60)),
        originals: vec![foto],
        results_folder: Some(dir.join("does not exist")),
    });

    assert_eq!(outcomes[0], Err(ErrorKind::CannotWrite));
    assert_eq!(file_names(&dir), ["foto.jpg"]);
}

#[test]
fn cancel_keeps_finished_results_and_skips_the_rest() {
    let dir = scratch("cancel");
    let originals: Vec<PathBuf> = ["a.jpg", "b.jpg", "c.jpg"]
        .iter()
        .map(|name| {
            let path = dir.join(name);
            fs::write(&path, photo_jpg()).unwrap();
            path
        })
        .collect();
    let cancel = CancelToken::new();

    let outcomes = run_task(
        &task(kompres_foto(Target::MaxBytes(20_000)), originals),
        &mut |event| match event {
            // Cancel while the second file is in its size search.
            TaskEvent::Progress { file: 1, .. } => cancel.cancel(),
            TaskEvent::Progress { file, .. } => assert!(file == 0, "file {file} ran after cancel"),
            TaskEvent::FileDone { .. } => {}
        },
        &cancel,
    );

    assert!(outcomes[0].is_ok());
    assert_eq!(outcomes[1], Err(ErrorKind::Cancelled));
    assert_eq!(outcomes[2], Err(ErrorKind::Cancelled));
    assert_eq!(
        file_names(&dir),
        ["a (compressed).jpg", "a.jpg", "b.jpg", "c.jpg"]
    );
}

#[test]
fn every_tool_that_runs_is_shipped_and_accepts_its_original() {
    let dir = scratch("catalogue_matches_tasks");
    for tool in every_tool() {
        let (name, bytes) = original_for(&tool);
        let path = dir.join(name);
        fs::write(&path, bytes).unwrap();
        let facts = CATALOGUE.iter().find(|t| t.id == tool.id()).unwrap();

        assert_eq!(facts.availability, Availability::Shipped, "{tool:?}");
        assert!(
            facts.accepts.contains(&detect_kind(&path).unwrap()),
            "{tool:?}"
        );
    }
}

#[test]
fn dropped_files_fit_tools_by_content_not_extension() {
    let dir = scratch("tools_for_files");
    let photo_named_pdf = dir.join("ktp.pdf");
    let png = dir.join("pas foto.png");
    let pdf = dir.join("ijazah.pdf");
    let text = dir.join("catatan.txt");
    fs::write(&photo_named_pdf, photo_jpg()).unwrap();
    fs::write(&png, b"\x89PNG\r\n\x1a\n").unwrap();
    fs::write(&pdf, scan_pdf()).unwrap();
    fs::write(&text, b"bukan foto").unwrap();
    let on = Platform::current();

    assert_eq!(
        tools_for_files(&[&photo_named_pdf, &png], on),
        [ToolId::KompresFoto]
    );
    assert_eq!(tools_for_files(&[&pdf], on), [ToolId::KompresPdf]);
    assert!(tools_for_files(&[&photo_named_pdf, &pdf], on).is_empty());
    assert!(tools_for_files(&[&pdf, &text], on).is_empty());
    assert!(tools_for_files(&[dir.join("hilang.jpg")], on).is_empty());
}
