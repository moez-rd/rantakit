use std::fs;
use std::path::{Path, PathBuf};

use rantakit_core::{CancelToken, ErrorKind, Progress};
use rantakit_image::{ImageFormat, ImageOptions, OutputFormat};
use rantakit_pdf::PdfOptions;

use crate::names::result_path;

/// One run of a Tool on one or more Originals.
#[derive(Debug, Clone)]
pub struct Task {
    pub tool: ToolOptions,
    pub originals: Vec<PathBuf>,
    /// The Results folder chosen in Settings; `None` puts each Result next to
    /// its Original.
    pub results_folder: Option<PathBuf>,
}

/// A Tool and its options for one Task.
#[derive(Debug, Clone)]
pub enum ToolOptions {
    KompresFoto(ImageOptions),
    KompresPdf(PdfOptions),
}

impl ToolOptions {
    /// The English word in the Result name: `ijazah (compressed).pdf`.
    fn suffix(&self) -> &'static str {
        match self {
            Self::KompresFoto(_) | Self::KompresPdf(_) => "compressed",
        }
    }
}

/// How one file of a Task ended: its Result, or why it has none.
pub type FileOutcome = Result<ResultFile, ErrorKind>;

#[derive(Debug, Clone, PartialEq)]
pub struct ResultFile {
    pub path: PathBuf,
    /// Size of the Original in bytes.
    pub original_size: u64,
    /// Size of the Result in bytes.
    pub size: u64,
    pub details: Details,
}

/// What the engine reports about a Result, by kind of file.
#[derive(Debug, Clone, PartialEq)]
pub enum Details {
    Photo {
        format: ImageFormat,
        width: u32,
        height: u32,
        quality: Option<u8>,
    },
    Pdf {
        images: usize,
        images_recompressed: usize,
    },
}

/// What happens while a Task runs. `file` is an index into `Task::originals`.
#[derive(Debug)]
pub enum TaskEvent<'a> {
    Progress {
        file: usize,
        progress: Progress,
    },
    FileDone {
        file: usize,
        outcome: &'a FileOutcome,
    },
}

/// Runs `task` one file at a time. A failed file does not stop the others.
/// Once `cancel` is set, the file being worked on leaves nothing behind and
/// every file after it ends with `Cancelled`; finished Results stay.
pub fn run_task(
    task: &Task,
    on_event: &mut dyn FnMut(TaskEvent),
    cancel: &CancelToken,
) -> Vec<FileOutcome> {
    let mut outcomes = Vec::with_capacity(task.originals.len());

    for (file, original) in task.originals.iter().enumerate() {
        let outcome = if cancel.is_cancelled() {
            Err(ErrorKind::Cancelled)
        } else {
            let mut progress = |progress| on_event(TaskEvent::Progress { file, progress });
            run_file(task, original, &mut progress, cancel)
        };
        on_event(TaskEvent::FileDone {
            file,
            outcome: &outcome,
        });
        outcomes.push(outcome);
    }

    outcomes
}

fn run_file(
    task: &Task,
    original: &Path,
    progress: &mut dyn FnMut(Progress),
    cancel: &CancelToken,
) -> FileOutcome {
    let original_size = fs::metadata(original)
        .map_err(|e| ErrorKind::reading(&e))?
        .len();
    let folder = match &task.results_folder {
        Some(folder) => folder.as_path(),
        None => original.parent().unwrap_or(Path::new("")),
    };
    let suffix = task.tool.suffix();

    match &task.tool {
        ToolOptions::KompresFoto(opts) => {
            let format = match opts.format {
                OutputFormat::To(format) => format,
                OutputFormat::Same => rantakit_image::detect_format(original)?,
            };
            let path = result_path(original, folder, suffix, photo_extension(format));
            let out = rantakit_image::compress_image(original, &path, opts, progress, cancel)?;
            Ok(ResultFile {
                path,
                original_size,
                size: out.size,
                details: Details::Photo {
                    format: out.format,
                    width: out.width,
                    height: out.height,
                    quality: out.quality,
                },
            })
        }
        ToolOptions::KompresPdf(opts) => {
            let path = result_path(original, folder, suffix, "pdf");
            let out = rantakit_pdf::compress_pdf(original, &path, opts, progress, cancel)?;
            Ok(ResultFile {
                path,
                original_size,
                size: out.size,
                details: Details::Pdf {
                    images: out.images,
                    images_recompressed: out.images_recompressed,
                },
            })
        }
    }
}

/// JPG and JPEG are the same format; Results always use `.jpg`.
fn photo_extension(format: ImageFormat) -> &'static str {
    match format {
        ImageFormat::Jpeg => "jpg",
        ImageFormat::Png => "png",
    }
}
