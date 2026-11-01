//! The product rules that must behave the same on every platform. The shells
//! only turn requests into calls here; engines only turn one file into one
//! Result.

mod catalogue;
mod history;
mod kinds;
mod names;
mod task;

pub use catalogue::{
    Availability, CATALOGUE, FileMatch, Job, Platform, Tool, ToolId, match_files, match_kinds,
    tools_for, tools_for_files, tools_for_kinds,
};
pub use history::{Entry, History, HistoryError};
pub use kinds::{FileKind, detect_kind};
pub use names::result_path;
pub use task::{Details, FileOutcome, ResultFile, Task, TaskEvent, ToolOptions, run_task};

pub use rantakit_core::{CancelToken, ErrorKind, Progress};
pub use rantakit_image::{ImageFormat, ImageOptions, OutputFormat, Target};
pub use rantakit_pdf::PdfOptions;
