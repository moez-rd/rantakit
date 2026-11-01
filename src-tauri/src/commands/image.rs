use std::fs;
use std::path::PathBuf;

use rantakit_image::{CancelToken, ImageFormat, ImageOptions, OutputFormat, Target};
use serde::{Deserialize, Serialize};
use tauri::State;

use super::output::output_path;
use super::{Finished, record};
use crate::error::Result;
use crate::history::History;

const DEFAULT_QUALITY: u8 = 80;

#[derive(Debug, Clone, Copy, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Format {
    Jpeg,
    Png,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ImageRequest {
    pub path: PathBuf,
    /// Output format; `None` keeps the input format.
    #[serde(default)]
    pub format: Option<Format>,
    #[serde(default = "default_quality")]
    pub quality: u8,
    /// When set, aim for this size instead of a fixed quality.
    #[serde(default)]
    pub max_bytes: Option<u64>,
    #[serde(default)]
    pub max_dimension: Option<u32>,
}

fn default_quality() -> u8 {
    DEFAULT_QUALITY
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ImageResult {
    pub input_path: PathBuf,
    pub output_path: PathBuf,
    /// "jpeg" or "png".
    pub format: &'static str,
    pub original_bytes: u64,
    pub compressed_bytes: u64,
    pub width: u32,
    pub height: u32,
    pub quality: Option<u8>,
}

/// Compress one image and save it next to the original as `<name>-rantakit.<ext>`.
/// The original is never overwritten. Successful runs are added to the history.
#[tauri::command]
pub async fn compress_image(
    history: State<'_, History>,
    request: ImageRequest,
) -> Result<ImageResult> {
    // Decoding and encoding are CPU-bound; keep them off the async runtime.
    let result = tauri::async_runtime::spawn_blocking(move || compress_blocking(request)).await??;

    record(
        &history,
        Finished {
            input_path: result.input_path.clone(),
            output_path: result.output_path.clone(),
            original_bytes: result.original_bytes,
            compressed_bytes: result.compressed_bytes,
            format: result.format,
            width: Some(result.width),
            height: Some(result.height),
            quality: result.quality,
        },
    );

    Ok(result)
}

fn compress_blocking(request: ImageRequest) -> Result<ImageResult> {
    let opts = ImageOptions {
        format: match request.format {
            None => OutputFormat::Same,
            Some(Format::Jpeg) => OutputFormat::To(ImageFormat::Jpeg),
            Some(Format::Png) => OutputFormat::To(ImageFormat::Png),
        },
        target: match request.max_bytes {
            Some(bytes) => Target::MaxBytes(bytes),
            None => Target::Quality(request.quality),
        },
        max_dimension: request.max_dimension,
    };
    // The output name needs the Result's format before the engine runs.
    let output_format = match opts.format {
        OutputFormat::To(f) => f,
        OutputFormat::Same => rantakit_image::detect_format(&request.path)?,
    };
    let (format, ext) = match output_format {
        ImageFormat::Jpeg => ("jpeg", "jpg"),
        ImageFormat::Png => ("png", "png"),
    };
    let output_path = output_path(&request.path, ext);

    // Progress and cancel are not wired to the frontend yet.
    let compressed = rantakit_image::compress_image(
        &request.path,
        &output_path,
        &opts,
        &mut |_| {},
        &CancelToken::new(),
    )?;
    let original_bytes = fs::metadata(&request.path)?.len();

    Ok(ImageResult {
        input_path: request.path,
        output_path,
        format,
        original_bytes,
        compressed_bytes: compressed.size,
        width: compressed.width,
        height: compressed.height,
        quality: compressed.quality,
    })
}
