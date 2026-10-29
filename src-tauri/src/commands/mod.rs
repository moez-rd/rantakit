pub mod history;
pub mod image;
mod output;
pub mod pdf;

use std::path::PathBuf;

use crate::history::{Entry, History, new_id, now_ms};

/// A finished compression, as recorded in the history.
struct Finished {
    input_path: PathBuf,
    output_path: PathBuf,
    original_bytes: u64,
    compressed_bytes: u64,
    format: &'static str,
    width: Option<u32>,
    height: Option<u32>,
    quality: Option<u8>,
}

/// Add a finished compression to the history. The file is already saved, so a
/// history failure is logged instead of failing the command.
fn record(history: &History, done: Finished) {
    let created_at = now_ms();
    let entry = Entry {
        id: new_id(created_at),
        created_at,
        input_path: done.input_path,
        output_path: done.output_path,
        original_bytes: done.original_bytes,
        compressed_bytes: done.compressed_bytes,
        format: done.format.into(),
        width: done.width,
        height: done.height,
        quality: done.quality,
    };
    if let Err(err) = history.add(entry) {
        eprintln!("failed to record history: {err}");
    }
}
