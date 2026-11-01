use std::collections::HashMap;
use std::path::{Path, PathBuf};
use std::sync::Mutex;
use std::sync::atomic::{AtomicU64, Ordering};

use rantakit_tasks::{
    CancelToken, ErrorKind, FileOutcome, History, ImageFormat, ImageOptions, OutputFormat,
    PdfOptions, Progress, Target, Task, TaskEvent, ToolOptions, run_task,
};
use serde::{Deserialize, Serialize};
use tauri::ipc::Channel;
use tauri::{AppHandle, Manager, State};

/// Cancel tokens of the Tasks that are still running, by Task id.
#[derive(Default)]
pub struct RunningTasks {
    next_id: AtomicU64,
    tokens: Mutex<HashMap<u64, CancelToken>>,
}

impl RunningTasks {
    fn add(&self, cancel: CancelToken) -> u64 {
        let id = self.next_id.fetch_add(1, Ordering::Relaxed);
        self.tokens().insert(id, cancel);
        id
    }

    fn remove(&self, id: u64) -> Option<CancelToken> {
        self.tokens().remove(&id)
    }

    fn tokens(&self) -> std::sync::MutexGuard<'_, HashMap<u64, CancelToken>> {
        self.tokens.lock().unwrap_or_else(|e| e.into_inner())
    }
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TaskRequest {
    pub options: OptionsRequest,
    pub paths: Vec<PathBuf>,
    /// The Results folder chosen in Settings; omit to save next to each Original.
    #[serde(default)]
    pub results_folder: Option<PathBuf>,
}

#[derive(Debug, Deserialize)]
#[serde(
    tag = "tool",
    rename_all = "kebab-case",
    rename_all_fields = "camelCase"
)]
pub enum OptionsRequest {
    KompresFoto {
        /// Output format; `None` keeps the Original's format.
        #[serde(default)]
        format: Option<Format>,
        #[serde(default = "default_photo_quality")]
        quality: u8,
        /// When set, aim for this Size limit instead of a fixed quality.
        #[serde(default)]
        max_bytes: Option<u64>,
        #[serde(default)]
        max_dimension: Option<u32>,
    },
    KompresPdf {
        /// JPEG quality for images inside the PDF.
        #[serde(default = "default_pdf_quality")]
        quality: u8,
        #[serde(default)]
        max_dimension: Option<u32>,
    },
}

#[derive(Debug, Clone, Copy, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Format {
    Jpeg,
    Png,
}

fn default_photo_quality() -> u8 {
    80
}

fn default_pdf_quality() -> u8 {
    70
}

impl From<OptionsRequest> for ToolOptions {
    fn from(request: OptionsRequest) -> Self {
        match request {
            OptionsRequest::KompresFoto {
                format,
                quality,
                max_bytes,
                max_dimension,
            } => Self::KompresFoto(ImageOptions {
                format: match format {
                    None => OutputFormat::Same,
                    Some(Format::Jpeg) => OutputFormat::To(ImageFormat::Jpeg),
                    Some(Format::Png) => OutputFormat::To(ImageFormat::Png),
                },
                target: match max_bytes {
                    Some(bytes) => Target::MaxBytes(bytes),
                    None => Target::Quality(quality),
                },
                max_dimension,
            }),
            OptionsRequest::KompresPdf {
                quality,
                max_dimension,
            } => Self::KompresPdf(PdfOptions {
                quality,
                max_dimension,
            }),
        }
    }
}

/// What the frontend hears while a Task runs. `file` is an index into the
/// request's `paths`.
#[derive(Debug, Clone, Serialize)]
#[serde(
    tag = "event",
    rename_all = "camelCase",
    rename_all_fields = "camelCase"
)]
pub enum TaskMessage {
    Progress {
        file: usize,
        fraction: f32,
    },
    FileDone {
        file: usize,
        outcome: Outcome,
    },
    /// Every file has ended; nothing more is sent.
    Finished,
}

#[derive(Debug, Clone, Serialize)]
#[serde(tag = "status", rename_all = "camelCase")]
pub enum Outcome {
    Done { result: ResultMessage },
    Failed { error: ErrorMessage },
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ResultMessage {
    pub input_path: PathBuf,
    pub output_path: PathBuf,
    pub original_bytes: u64,
    pub compressed_bytes: u64,
}

/// An error kind as a code; `best` is set for "size-limit-unreachable".
#[derive(Debug, Clone, Serialize)]
pub struct ErrorMessage {
    pub code: &'static str,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub best: Option<u64>,
}

impl From<&ErrorKind> for ErrorMessage {
    fn from(kind: &ErrorKind) -> Self {
        let best = match kind {
            ErrorKind::SizeLimitUnreachable { best } => Some(*best),
            _ => None,
        };
        Self {
            code: kind.code(),
            best,
        }
    }
}

fn outcome(original: &Path, outcome: &FileOutcome) -> Outcome {
    match outcome {
        Ok(result) => Outcome::Done {
            result: ResultMessage {
                input_path: original.to_path_buf(),
                output_path: result.path.clone(),
                original_bytes: result.original_size,
                compressed_bytes: result.size,
            },
        },
        Err(kind) => Outcome::Failed { error: kind.into() },
    }
}

fn fraction(progress: Progress) -> f32 {
    match progress {
        Progress::Fraction(fraction) => fraction,
        Progress::Page { page, pages } => page as f32 / pages.max(1) as f32,
    }
}

/// Starts a Task in the background and returns its id for `cancel_task`.
/// Progress and each file's outcome arrive on `on_event`, then `Finished`.
#[tauri::command]
pub fn start_task(
    app: AppHandle,
    running: State<'_, RunningTasks>,
    request: TaskRequest,
    on_event: Channel<TaskMessage>,
) -> u64 {
    let task = Task {
        tool: request.options.into(),
        originals: request.paths,
        results_folder: request.results_folder,
    };
    let cancel = CancelToken::new();
    let id = running.add(cancel.clone());

    tauri::async_runtime::spawn_blocking(move || {
        let send = |message| {
            if let Err(err) = on_event.send(message) {
                eprintln!("task {id}: could not reach the frontend: {err}");
            }
        };
        let outcomes = run_task(
            &task,
            &mut |event| match event {
                TaskEvent::Progress { file, progress } => send(TaskMessage::Progress {
                    file,
                    fraction: fraction(progress),
                }),
                TaskEvent::FileDone {
                    file,
                    outcome: done,
                } => send(TaskMessage::FileDone {
                    file,
                    outcome: outcome(&task.originals[file], done),
                }),
            },
            &cancel,
        );

        // The Results are already saved, so a History failure is only logged.
        if let Err(err) = app.state::<History>().record(&task, &outcomes) {
            eprintln!("task {id}: could not record history: {err}");
        }
        app.state::<RunningTasks>().remove(id);
        send(TaskMessage::Finished);
    });

    id
}

/// Stops a running Task. Finished Results stay; the file being worked on
/// leaves nothing behind. Does nothing once the Task has finished.
#[tauri::command]
pub fn cancel_task(running: State<'_, RunningTasks>, id: u64) {
    if let Some(cancel) = running.remove(id) {
        cancel.cancel();
    }
}

#[cfg(test)]
mod tests {
    use serde_json::json;

    use super::*;

    #[test]
    fn frontend_request_becomes_tool_options() {
        let request: TaskRequest = serde_json::from_value(json!({
            "options": { "tool": "kompres-foto", "quality": 60, "maxBytes": 200000 },
            "paths": ["C:/Users/ani/ktp.jpg"],
        }))
        .unwrap();

        assert!(request.results_folder.is_none());
        assert!(matches!(
            request.options.into(),
            ToolOptions::KompresFoto(ImageOptions {
                format: OutputFormat::Same,
                target: Target::MaxBytes(200_000),
                max_dimension: None,
            })
        ));
    }

    #[test]
    fn errors_reach_the_frontend_as_codes() {
        let message = TaskMessage::FileDone {
            file: 1,
            outcome: outcome(
                Path::new("ijazah.pdf"),
                &Err(ErrorKind::SizeLimitUnreachable { best: 1234 }),
            ),
        };

        assert_eq!(
            serde_json::to_value(message).unwrap(),
            json!({
                "event": "fileDone",
                "file": 1,
                "outcome": {
                    "status": "failed",
                    "error": { "code": "size-limit-unreachable", "best": 1234 },
                },
            })
        );
    }
}
