use std::fs;
use std::path::PathBuf;

use rantakit_pdf::PdfOptions;
use serde::{Deserialize, Serialize};
use tauri::State;

use super::output::output_path;
use super::{Finished, record};
use crate::error::Result;
use crate::history::History;

const DEFAULT_QUALITY: u8 = 70;

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PdfRequest {
    pub path: PathBuf,
    /// JPEG quality for images inside the PDF.
    #[serde(default = "default_quality")]
    pub quality: u8,
    #[serde(default)]
    pub max_dimension: Option<u32>,
}

fn default_quality() -> u8 {
    DEFAULT_QUALITY
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PdfResult {
    pub input_path: PathBuf,
    pub output_path: PathBuf,
    /// Always "pdf"; lets the frontend treat image and PDF results alike.
    pub format: &'static str,
    pub original_bytes: u64,
    pub compressed_bytes: u64,
    pub images: usize,
    pub images_recompressed: usize,
}

/// Compress one PDF and save it next to the original as `<name>-rantakit.pdf`.
/// The original is never overwritten. Successful runs are added to the history.
#[tauri::command]
pub async fn compress_pdf(history: State<'_, History>, request: PdfRequest) -> Result<PdfResult> {
    let quality = request.quality;
    let result = tauri::async_runtime::spawn_blocking(move || compress_blocking(request)).await??;

    record(
        &history,
        Finished {
            input_path: result.input_path.clone(),
            output_path: result.output_path.clone(),
            original_bytes: result.original_bytes,
            compressed_bytes: result.compressed_bytes,
            format: result.format,
            width: None,
            height: None,
            // Only meaningful when an image was actually re-encoded.
            quality: (result.images_recompressed > 0).then_some(quality.clamp(1, 100)),
        },
    );

    Ok(result)
}

fn compress_blocking(request: PdfRequest) -> Result<PdfResult> {
    let input = fs::read(&request.path)?;

    let opts = PdfOptions {
        quality: request.quality,
        max_dimension: request.max_dimension,
    };
    let compressed = rantakit_pdf::compress_pdf(&input, &opts)?;

    let output_path = output_path(&request.path, "pdf");
    fs::write(&output_path, &compressed.bytes)?;

    Ok(PdfResult {
        input_path: request.path,
        output_path,
        format: "pdf",
        original_bytes: input.len() as u64,
        compressed_bytes: compressed.bytes.len() as u64,
        images: compressed.images,
        images_recompressed: compressed.images_recompressed,
    })
}
