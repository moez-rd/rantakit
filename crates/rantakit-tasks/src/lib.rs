//! The product rules that must behave the same on every platform. The shells
//! only turn requests into calls here; engines only turn one file into one
//! Result.

mod catalogue;
mod compression;
mod history;
mod info;
mod kinds;
mod limits;
mod names;
mod presets;
mod store;
mod task;

pub use catalogue::{
    Availability, CATALOGUE, FileMatch, Job, Platform, Tool, ToolId, match_files, match_kinds,
    tools_for, tools_for_files, tools_for_kinds,
};
pub use compression::{Compression, Level, dpi_to_side};
pub use history::{Entry, EntryFile, History, HistoryError};
pub use info::{FileInfo, file_info};
pub use kinds::{FileKind, detect_kind};
pub use limits::{RECENT_LIMITS, RecentLimits};
pub use names::result_path;
pub use presets::{Preset, Presets};
pub use store::{JsonFile, StoreError};
pub use task::{
    Details, FileOutcome, PhotoSize, ResultFile, Task, TaskEvent, ToolOptions, run_task,
};

pub use rantakit_core::{CancelToken, ErrorKind, Progress};
pub use rantakit_image::{ImageFormat, ImageOptions, OutputFormat, Target, WHITE, thumbnail};
pub use rantakit_pdf::PdfOptions;
